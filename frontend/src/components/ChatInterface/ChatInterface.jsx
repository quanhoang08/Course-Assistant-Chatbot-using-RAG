import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToAIStream, getChatHistory, getCourseSessions, deleteCourseSession } from '../../services/chatService';
import iconChatbot from '../../assets/FlatDesign_chat1.jpg';
import avatarBot from '../../assets/Avatarchatbot.jpg';
import scorecardGif from '../../assets/scorecard.gif';
import ReactMarkdown from 'react-markdown';
import Trash from '../../assets/trash.png';
import QuizPanel from './QuizPanel';

const handleOpenSource = (url, page) => {
    const fullUrl = `${url}#page=${page}`;
    window.open(fullUrl, '_blank');
};

const MessageContent = ({ content, isNewestAI }) => {
    // Với tính năng stream, nội dung truyền vào từ server đã được append dần, 
    // không cần fake typing setInterval nữa để trải nghiệm mượt mà chuẩn xác hơn.
    return <div className="markdown-content"><ReactMarkdown>{content}</ReactMarkdown></div>;
};

/** Bỏ dòng trạng thái stream cũ / lỗi khi load lịch sử */
const stripLegacyAssistantNoise = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text
        .replace(/^\s*\*Đang tra cứu tài liệu môn học[^*]*\*\s*\n?/i, '')
        .replace(/\n\s*\*Đang tra cứu tài liệu môn học[^*]*\*\s*\n?/gi, '\n')
        .trimStart();
};

const AIMessage = ({ content, sources, onOpenSource }) => {
    return (
        <>
            <MessageContent content={content} />
            {sources && sources.length > 0 && (
                <div style={styles.sourceContainer}>
                    <p style={styles.sourceTitle}>Tài liệu trích dẫn:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {sources.map((src, idx) => (
                            <button key={idx} onClick={() => onOpenSource(src.url, src.page)} style={styles.sourceBadge}>
                                📖 {src.file_name} (Trang {src.page})
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

const ChatInterface = ({ courseId }) => {
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const streamInFlightRef = useRef(false);
    const [selectedModel, setSelectedModel] = useState(() => {
        const allowed = ['gemini-2.5-flash', 'gemini-3.1-flash-lite-preview'];
        const stored = localStorage.getItem('defaultAIModel');
        return allowed.includes(stored) ? stored : 'gemini-2.5-flash';
    });
    
    const userAvatar = localStorage.getItem('avatar');
    const username = localStorage.getItem('username') || 'U';

    // [YÊU CẦU 4 - Quiz] Show/Hide pane NotebookLM
    const [showQuizPanel, setShowQuizPanel] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

    const fetchSessions = async () => {
        if (!courseId) return;
        try {
            const data = await getCourseSessions(courseId);
            setSessions(data);
        } catch (error) {
            console.error("Lỗi lấy danh sách session:", error);
        }
    };

    useEffect(() => {
        fetchSessions();
        handleNewChat();
    }, [courseId]);

    const handleNewChat = () => {
        setCurrentSessionId(null);
        setMessages([]);
    };

    const loadSession = async (sessionId) => {
        if (sessionId === currentSessionId) return;
        setCurrentSessionId(sessionId);
        setIsLoading(true);
        try {
            const history = await getChatHistory(courseId, sessionId);
            const formatted = history.map(item => {
                const role = (item.role || 'user').includes('user') ? 'user' : 'assistant';
                let content = item.content || item.answer || '';
                if (role === 'assistant') content = stripLegacyAssistantNoise(content);
                return { role, content, sources: item.sources || [], id: item.id };
            });
            setMessages(formatted);
        } catch (error) {
            console.error("Lỗi load chat:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSession = async (e, sessionId) => {
        e.stopPropagation();

        const isConfirm = window.confirm("Bạn có chắc muốn xóa cuộc hội thoại này?");
        if (!isConfirm) return;

        try {
            await deleteCourseSession(sessionId);

            setSessions(prev => prev.filter(s => s.id !== sessionId));

            if (currentSessionId === sessionId) {
                handleNewChat();
            }
        } catch (error) {
            alert("Không thể xóa lúc này, vui lòng thử lại!");
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || isLoading || streamInFlightRef.current) return;
        const userMsg = inputText.trim();
        setInputText('');

        streamInFlightRef.current = true;

        // Thêm message người dùng
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        // Thêm message AI rỗng để chuẩn bị nhận Stream
        setMessages(prev => [...prev, { role: 'assistant', content: '', isNewest: true, sources: [] }]);

        let newSessionId = currentSessionId;

        await sendMessageToAIStream(
            courseId,
            userMsg,
            currentSessionId,
            selectedModel,
            // onChunk Callback
            (data) => {
                setIsLoading(false);
                if (data.type === 'meta' && data.session_id) {
                    if (!currentSessionId) {
                        newSessionId = data.session_id;
                        setCurrentSessionId(data.session_id);
                        fetchSessions();
                    }
                } else if (data.type === 'chunk') {
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const last = newMsgs[newMsgs.length - 1];
                        if (data.full != null && data.full !== undefined) {
                            last.content = data.full;
                        } else if (data.content != null) {
                            last.content += data.content;
                        }
                        return newMsgs;
                    });
                }
            },
            // onDone Callback
            () => {
                setIsLoading(false);
                streamInFlightRef.current = false;
            },
            // onError Callback
            (err) => {
                console.error(err);
                setIsLoading(false);
                streamInFlightRef.current = false;
                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content += "\n[Lỗi kết nối AI!]";
                    return newMsgs;
                });
            }
        );
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <button style={styles.newChatBtn} onClick={handleNewChat}>
                    + Cuộc hội thoại mới
                </button>
                <div style={styles.sessionList}>
                    <p style={styles.sidebarTitle}>Gần đây</p>
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            className="session-item"
                            style={{
                                ...styles.sessionItem,
                                backgroundColor: currentSessionId === session.id ? '#e2e8f0' : 'transparent',
                                color: currentSessionId === session.id ? '#1e293b' : '#64748b',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                            onClick={() => loadSession(session.id)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                                <span style={{ marginRight: '8px' }}></span>
                                <span style={styles.sessionTitleText}>{session.title}</span>
                            </div>

                            <button
                                className="delete-btn"
                                onClick={(e) => handleDeleteSession(e, session.id)}
                                style={styles.deleteBtn}
                                title="Xóa hội thoại"
                            >
                                <img src={Trash} alt="Trash logo" style={{ width: '60%' }} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div style={styles.mainChat}>
                <div style={styles.chatHeader}>
                    <div style={{ fontWeight: 'bold', color: '#334155' }}>Trợ lý học tập AI</div>
                    <button
                        style={{ ...styles.quizToggleBtn, backgroundColor: showQuizPanel ? '#e2e8f0' : 'white' }}
                        onClick={() => setShowQuizPanel(!showQuizPanel)}
                    >
                        <img src={scorecardGif} alt="quiz" style={{ height: '20px', verticalAlign: 'middle', marginRight: '4px' }} /> Trắc nghiệm {showQuizPanel ? '→' : '←'}
                    </button>
                </div>
                <div style={styles.chatArea}>
                    {messages.length === 0 ? (
                        <div style={styles.emptyState}>
                            <img src={iconChatbot} alt="Bot" style={{ width: '350px', marginBottom: '20px', borderRadius: '15px' }} />
                            <h3 style={{ color: '#1e293b', fontSize: '22px', marginBottom: '8px' }}>Trợ giảng AI sẵn sàng!</h3>
                            <p style={{ fontSize: '15px' }}>Hỏi mình bất cứ điều gì về tài liệu môn học nhé.</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <div key={msg.id ?? `m-${index}-${msg.role}`} style={msg.role === 'user' ? styles.messageRowUser : styles.messageRowAI}>
                                {msg.role !== 'user' && (
                                    <div style={styles.avatarAI}>
                                        <img src={avatarBot} alt="AI" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <div style={msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI}>
                                    {msg.role === 'user' ? (
                                        <p style={styles.messageText}>{msg.content}</p>
                                    ) : (
                                        <AIMessage
                                            content={stripLegacyAssistantNoise(msg.content)}
                                            sources={msg.sources}
                                            onOpenSource={handleOpenSource}
                                        />
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div style={{ ...styles.avatarUser, padding: 0, overflow: 'hidden' }}>
                                        {userAvatar ? (
                                            <img src={userAvatar} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                                {username.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div style={styles.messageRowAI}>
                            <div style={styles.avatarAI}>
                                <img src={avatarBot} alt="AI" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            </div>
                            <div style={styles.bubbleAI}>
                                <div style={styles.typingIndicator}>
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div style={styles.inputArea}>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px' }}>
                        <label style={{ marginRight: '10px', fontWeight: 'bold', color: '#475569' }}>Chọn Model AI: </label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            style={{ padding: '5px', borderRadius: '10px', border: '1px solid #686868', outline: 'none' }}
                        >
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Nhanh)</option>
                            <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash (Suy luận kỹ hơn)</option>
                        </select>
                    </div>

                    <textarea
                        style={styles.textArea}
                        placeholder="Nhập câu hỏi tại đây..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows="1"
                    />
                    <button
                        style={inputText.trim() ? styles.sendBtnActive : styles.sendBtnDisabled}
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                    >
                        ➤
                    </button>
                </div>
            </div>

            <QuizPanel
                courseId={courseId}
                isVisible={showQuizPanel}
                onClose={() => setShowQuizPanel(false)}
            />
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        height: '100%',
        width: '100%',
        backgroundColor: '#fff',
        overflow: 'hidden'
    },
    chatHeader: {
        padding: '12px 20px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc'
    },
    quizToggleBtn: {
        padding: '8px 12px',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#475569',
        transition: '0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
    },
    sidebar: {
        width: '260px',
        backgroundColor: '#f8fafc',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        padding: '15px'
    },
    newChatBtn: {
        padding: '12px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#fff',
        color: '#1e293b',
        fontWeight: '600',
        cursor: 'pointer',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: '0.2s'
    },
    sessionList: {
        flex: 1,
        overflowY: 'auto'
    },
    sidebarTitle: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: '12px',
        letterSpacing: '0.5px'
    },
    sessionItem: {
        padding: '10px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        marginBottom: '4px',
        transition: '0.2s'
    },
    sessionTitleText: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    mainChat: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    },
    chatArea: {
        flex: 1,
        padding: '25px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        backgroundColor: '#ffffff'
    },
    emptyState: {
        margin: 'auto',
        textAlign: 'center',
        color: '#64748b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    },
    messageRowUser: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        gap: '10px'
    },
    messageRowAI: {
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        gap: '10px'
    },
    avatarUser: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        color: '#fff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 'bold',
        fontSize: '14px'
    },
    avatarAI: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    bubbleUser: {
        maxWidth: '75%',
        backgroundColor: '#3b82f6',
        color: '#fff',
        padding: '12px 18px',
        borderRadius: '20px 20px 4px 20px'
    },
    bubbleAI: {
        maxWidth: '75%',
        backgroundColor: '#f1f5f9',
        color: '#1e293b',
        padding: '12px 18px',
        borderRadius: '20px 20px 20px 4px',
        border: '1px solid #e2e8f0'
    },
    messageText: {
        margin: 0,
        fontSize: '15px',
        lineHeight: '1.6'
    },
    inputArea: {
        padding: '20px',
        backgroundColor: '#fff',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        gap: '15px',
        alignItems: 'center'
    },
    textArea: {
        flex: 1,
        padding: '12px 20px',
        borderRadius: '25px',
        border: '1px solid #cbd5e1',
        backgroundColor: '#f8fafc',
        outline: 'none',
        resize: 'none'
    },
    sendBtnActive: {
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        color: '#fff',
        border: 'none',
        cursor: 'pointer'
    },
    sendBtnDisabled: {
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        backgroundColor: '#e2e8f0',
        color: '#94a3b8',
        border: 'none'
    },
    sourceContainer: {
        marginTop: '12px',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '10px',
        borderLeft: '4px solid #3b82f6',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    sourceTitle: {
        margin: '0 0 8px 0',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#475569'
    },
    sourceBadge: {
        padding: '6px 12px',
        backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#3b82f6',
        cursor: 'pointer',
        fontWeight: '600',
        transition: '0.2s'
    },
    typingIndicator: {
        display: 'flex',
        gap: '4px'
    },
    deleteBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        fontSize: '13px',
        transition: '0.2s'
    }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes bounce { 
        0%, 80%, 100% { transform: scale(0); } 
        40% { transform: scale(1); } 
    }

    div[style*="typingIndicator"] span { 
        width: 8px; 
        height: 8px; 
        background-color: #94a3b8; 
        border-radius: 50%; 
        animation: bounce 1.4s infinite ease-in-out both; 
    }
    div[style*="typingIndicator"] span:nth-child(1) { animation-delay: -0.32s; }
    div[style*="typingIndicator"] span:nth-child(2) { animation-delay: -0.16s; }

    .markdown-content p { margin-bottom: 8px; }
    .markdown-content ul { padding-left: 20px; }
    .markdown-content strong { color: #2563eb; }

    .session-item:hover { 
        background-color: #f1f5f9 !important; 
    }
    .sourceBadge:hover { 
        background-color: #3b82f6 !important; 
        color: white !important; 
    }

    .session-item .delete-btn { 
        visibility: hidden; 
        opacity: 0; 
        transition: all 0.2s ease;
    }
    .session-item:hover .delete-btn { 
        visibility: visible; 
        opacity: 0.5; 
    }
    .session-item .delete-btn:hover { 
        opacity: 1; 
        transform: scale(1.1); 
    }
`;
document.head.appendChild(styleSheet);

export default ChatInterface;