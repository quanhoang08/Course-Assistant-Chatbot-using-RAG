import React, { useState } from 'react';
import api from '../../services/api';
import ShareModal from './ShareModal';
import scorecardGif from '../../assets/scorecard.gif';

// ─── Modal Tùy chỉnh bài kiểm tra (NotebookLM style) ────────────────────────
const CustomizeQuizModal = ({ onClose, onGenerate }) => {
    const [questionCount, setQuestionCount] = useState('standard');
    const [difficulty, setDifficulty] = useState('medium');
    const [topic, setTopic] = useState('');

    const countOptions = [
        { key: 'less',     label: 'Ít hơn',               num: 3 },
        { key: 'standard', label: 'Tiêu chuẩn (Mặc định)', num: 5 },
        { key: 'more',     label: 'Nhiều hơn',             num: 10 },
    ];
    const diffOptions = [
        { key: 'easy',   label: 'Dễ' },
        { key: 'medium', label: 'Trung bình (Mặc định)' },
        { key: 'hard',   label: 'Khó' },
    ];

    const handleGenerate = () => {
        const selected = countOptions.find(o => o.key === questionCount);
        onGenerate({
            num_questions: selected.num,
            difficulty,
            topic: topic.trim(),
        });
        onClose();
    };

    const chipBase = {
        padding: '9px 16px',
        border: '1.5px solid #e5e7eb',
        borderRadius: '24px',
        backgroundColor: 'white',
        color: '#374151',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '400',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
    };
    const chipActive = {
        ...chipBase,
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
        color: '#1d4ed8',
        fontWeight: '600',
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 2000,
        }}>
            <div style={{
                backgroundColor: 'white', width: '540px', borderRadius: '18px',
                padding: '28px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
                display: 'flex', flexDirection: 'column', gap: '22px',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                            width: '34px', height: '34px', backgroundColor: '#eff6ff',
                            borderRadius: '8px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '18px',
                        }}>📝</span>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                            Tùy chỉnh bài kiểm tra
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af', lineHeight: 1 }}
                    >✕</button>
                </div>

                {/* Số lượng & Độ khó side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Số lượng câu hỏi */}
                    <div>
                        <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                            Số lượng câu hỏi
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {countOptions.map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => setQuestionCount(opt.key)}
                                    style={questionCount === opt.key ? chipActive : chipBase}
                                >
                                    {questionCount === opt.key
                                        ? <span style={{ fontSize: '12px' }}>✓</span>
                                        : <span style={{ width: '14px' }} />
                                    }
                                    {opt.label}
                                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#9ca3af', fontWeight: '400' }}>
                                        {opt.num} câu
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Độ khó */}
                    <div>
                        <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                            Độ khó
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {diffOptions.map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => setDifficulty(opt.key)}
                                    style={difficulty === opt.key ? chipActive : chipBase}
                                >
                                    {difficulty === opt.key
                                        ? <span style={{ fontSize: '12px' }}>✓</span>
                                        : <span style={{ width: '14px' }} />
                                    }
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chủ đề */}
                <div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                        Chủ đề nên là gì?
                    </p>
                    <textarea
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        rows={5}
                        placeholder={
                            'Những điều nên thử\n' +
                            '• Tập trung hoàn toàn vào các khái niệm chính của chương\n' +
                            '• Bài kiểm tra phải được giới hạn trong một nguồn cụ thể\n' +
                            '• Ôn tập phần lý thuyết để chuẩn bị cho kỳ thi\n\n' +
                            'Để trống để AI tổng hợp từ toàn bộ tài liệu.'
                        }
                        style={{
                            width: '100%', padding: '12px 14px', border: '1.5px solid #3b82f6',
                            borderRadius: '10px', fontSize: '13px', resize: 'none', outline: 'none',
                            color: '#374151', lineHeight: '1.6', boxSizing: 'border-box',
                            fontFamily: 'inherit', backgroundColor: '#fafcff',
                        }}
                    />
                </div>

                {/* Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleGenerate}
                        style={{
                            padding: '11px 36px', backgroundColor: '#3b82f6', color: 'white',
                            border: 'none', borderRadius: '24px', fontSize: '15px',
                            fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,0.35)',
                            transition: 'all 0.15s',
                        }}
                    >
                        Tạo
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── QuizPanel chính ──────────────────────────────────────────────────────────
const QuizPanel = ({ courseId, isVisible, onClose }) => {
    const [quizData, setQuizData]       = useState(null);
    const [loading, setLoading]         = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [submitResult, setSubmitResult] = useState(null);   // { score, total_questions, percentage, saved }
    const [submitting, setSubmitting]   = useState(false);

    // Vai trò người dùng
    const userRole = localStorage.getItem('role'); // 'teacher' hoặc 'student'

    // Hiển thị modal tùy chỉnh
    const [showCustomizeModal, setShowCustomizeModal] = useState(false);

    // Menu dropdown
    const [showMenu, setShowMenu]       = useState(false);
    const [isRenaming, setIsRenaming]   = useState(false);
    const [renameText, setRenameText]   = useState('');
    const [showShareModal, setShowShareModal] = useState(false);

    // ── Tạo quiz với tùy chỉnh từ modal ──────────────────────────────────────
    const generateQuiz = async ({ num_questions, difficulty, topic }) => {
        const finalTopic = topic || 'Tổng hợp kiến thức quan trọng nhất từ toàn bộ tài liệu';
        setLoading(true);
        try {
            const res = await api.post('quiz/generate/', {
                course_id: courseId,
                topic: finalTopic,
                num_questions,
                difficulty,
            });
            if (res.data.quiz_id) {
                await fetchQuizDetail(res.data.quiz_id);
            }
        } catch (error) {
            console.error('Lỗi sinh quiz:', error);
            const errorMsg = error.response?.data?.error || 'Lỗi khi tạo quiz, vui lòng thử lại.';
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuizDetail = async (quizId) => {
        try {
            const res = await api.get(`quiz/${quizId}/`);
            setQuizData(res.data);
            setCurrentIndex(0);
            setSelectedAnswers({});
            setSubmitResult(null);
            setRenameText(res.data.title);
        } catch (error) {
            console.error(error);
        }
    };

    // ── Nộp bài ──────────────────────────────────────────────────────────────────
    const handleSubmitQuiz = async () => {
        if (!window.confirm('Bạn có chắc muốn nộp bài không?')) return;
        const answers = Object.entries(selectedAnswers).map(([question_id, choice_id]) => ({
            question_id: Number(question_id),
            choice_id: Number(choice_id),
        }));
        setSubmitting(true);
        try {
            const res = await api.post(`quiz/${quizData.id}/submit/`, { answers });
            setSubmitResult(res.data);
        } catch (e) {
            alert('Nộp bài thất bại, vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSelectOption = (questionId, choiceId) => {
        setSelectedAnswers(prev => ({ ...prev, [questionId]: choiceId }));
    };

    const handleSaveRename = async () => {
        if (!renameText.trim() || !quizData) return;
        try {
            await api.put(`quiz/${quizData.id}/manage/`, { title: renameText });
            setQuizData(prev => ({ ...prev, title: renameText }));
            setIsRenaming(false);
        } catch (e) {
            alert('Đổi tên thất bại');
        }
    };

    const handleDeleteQuiz = async () => {
        if (!window.confirm('Bạn có chắc muốn xóa bài trắc nghiệm này?')) return;
        try {
            await api.delete(`quiz/${quizData.id}/manage/`);
            setQuizData(null);
            setShowMenu(false);
        } catch (e) {
            alert('Xóa thất bại');
        }
    };

    const containerStyle = { ...styles.container, display: isVisible ? 'flex' : 'none' };

    return (
        <div style={containerStyle}>
            {/* ── Header ── */}
            <div style={styles.header}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    {isRenaming ? (
                        <input
                            value={renameText}
                            onChange={e => setRenameText(e.target.value)}
                            onBlur={handleSaveRename}
                            onKeyDown={e => e.key === 'Enter' && handleSaveRename()}
                            style={styles.renameInput}
                            autoFocus
                        />
                    ) : (
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {quizData ? quizData.title : 'Trắc nghiệm'}
                        </h3>
                    )}
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#9ca3af' }}>
                        Dựa trên tài liệu môn học
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {/* Dropdown menu (chỉ khi đã có quiz) */}
                    {quizData && !loading && (
                        <div style={{ position: 'relative' }}>
                            <button style={styles.iconBtn} onClick={() => setShowMenu(!showMenu)}>⠇</button>
                            {showMenu && (
                                <div style={styles.dropdownMenu}>
                                    <button style={styles.dropdownItem} onClick={() => { setShowCustomizeModal(true); setShowMenu(false); }}>
                                        ✨ Tạo quiz mới
                                    </button>
                                    <button style={styles.dropdownItem} onClick={() => { setIsRenaming(true); setShowMenu(false); }}>
                                        ✎ Đổi tên
                                    </button>
                                    <button style={styles.dropdownItem} onClick={() => { setShowShareModal(true); setShowMenu(false); }}>
                                        🔗 Chia sẻ
                                    </button>
                                    <button style={{ ...styles.dropdownItem, color: '#ef4444' }} onClick={handleDeleteQuiz}>
                                        🗑 Xóa
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    <button style={{ ...styles.iconBtn, marginLeft: '2px' }} onClick={onClose}>✕</button>
                </div>
            </div>

            {/* ── Content ── */}
            {loading ? (
                <div style={styles.loadingContainer}>
                    <div className="spinner" />
                    <p style={{ marginTop: '14px', color: '#6b7280', fontSize: '14px' }}>
                        Đang nhờ AI soạn câu hỏi...
                    </p>
                </div>
            ) : !quizData ? (
                /* Empty state — nút mở modal tùy chỉnh */
                <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}><img src={scorecardGif} alt="Empty Quiz" style={{ width: '80px', height: '80px', objectFit: 'contain' }} /></div>
                    <h4 style={{ margin: '0 0 6px 0', color: '#111827', fontSize: '15px' }}>
                        Chưa có bài kiểm tra
                    </h4>
                    <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '13px', lineHeight: '1.6' }}>
                        AI sẽ tự động tạo câu hỏi<br />dựa trên tài liệu của môn học.
                    </p>
                    <button style={styles.createBtn} onClick={() => setShowCustomizeModal(true)}>
                        ✨ Tạo bài kiểm tra
                    </button>
                </div>
            ) : (
                /* Quiz content */
                <div style={styles.quizContent}>
                    {/* Nếu đã nộp bài → hiện màn hình kết quả */}
                    {submitResult ? (
                        <div style={styles.resultScreen}>
                            <div style={styles.resultIcon}>
                                {submitResult.percentage >= 80 ? '🏆' : submitResult.percentage >= 50 ? '📝' : '💪'}
                            </div>
                            <h3 style={{ margin: '0 0 6px', fontSize: '20px', color: '#111827', fontWeight: '800' }}>
                                Kết quả bài làm
                            </h3>
                            <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '13px' }}>
                                {submitResult.saved ? 'Điểm đã được ghi nhận vào hệ thống.' : 'Làm chơi — chưa lưu vào hệ thống.'}
                            </p>

                            <div style={styles.scoreCircle}>
                                <span style={{ fontSize: '32px', fontWeight: '800', color: '#3b82f6' }}>
                                    {submitResult.score}
                                </span>
                                <span style={{ fontSize: '14px', color: '#9ca3af', marginTop: '2px' }}>
                                    / {submitResult.total_questions}
                                </span>
                            </div>

                            <div style={{
                                margin: '16px 0 24px',
                                padding: '10px 24px',
                                backgroundColor: submitResult.percentage >= 80 ? '#f0fdf4' : submitResult.percentage >= 50 ? '#fffbeb' : '#fef2f2',
                                borderRadius: '24px',
                                fontSize: '22px',
                                fontWeight: '700',
                                color: submitResult.percentage >= 80 ? '#15803d' : submitResult.percentage >= 50 ? '#b45309' : '#b91c1c',
                            }}>
                                {submitResult.percentage}%
                            </div>

                            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 24px' }}>
                                {submitResult.percentage >= 80 ? 'Xuất sắc! Bạn đã nắm vững kiến thức.' :
                                 submitResult.percentage >= 50 ? 'Khá tốt! Hãy ôn lại những câu chưa đúng.' :
                                 'Cần cố gắng thêm! Đọc lại tài liệu và thử lại nhé.'}
                            </p>

                            <button
                                style={styles.createBtn}
                                onClick={() => { setSubmitResult(null); setSelectedAnswers({}); setCurrentIndex(0); }}
                            >
                                🔄 Làm lại
                            </button>
                        </div>
                    ) : (
                    <>
                    {/* Progress */}
                    <div style={styles.progress}>
                        <span style={styles.pageText}>
                            {currentIndex + 1} / {quizData.questions.length}
                        </span>
                        <div style={styles.progressBar}>
                            <div style={{
                                ...styles.progressFill,
                                width: `${((currentIndex + 1) / quizData.questions.length) * 100}%`
                            }} />
                        </div>
                    </div>

                    {/* Question */}
                    <div style={styles.questionBlock}>
                        <p style={styles.questionText}>
                            {quizData.questions[currentIndex].content}
                        </p>

                        <div style={styles.optionsList}>
                            {quizData.questions[currentIndex].choices.map((choice, i) => {
                                const qId = quizData.questions[currentIndex].id;
                                const isSelected = selectedAnswers[qId] === choice.id;
                                const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

                                let bgColor = '#f9fafb';
                                let borderColor = '#e5e7eb';
                                let contentColor = '#202124';
                                let labelColor = '#6b7280';

                                if (isSelected) {
                                    if (choice.is_correct) {
                                        bgColor = '#f0fdf4';
                                        borderColor = '#22c55e';
                                        contentColor = '#15803d';
                                        labelColor = '#15803d';
                                    } else {
                                        bgColor = '#fef2f2';
                                        borderColor = '#ef4444';
                                        contentColor = '#b91c1c';
                                        labelColor = '#b91c1c';
                                    }
                                }

                                return (
                                    <div key={choice.id}>
                                        <button
                                            style={{
                                                ...styles.optionBtn,
                                                backgroundColor: bgColor,
                                                borderColor,
                                                color: contentColor,
                                            }}
                                            onClick={() => handleSelectOption(qId, choice.id)}
                                        >
                                            <span style={{
                                                width: '24px', height: '24px', borderRadius: '50%',
                                                border: `1.5px solid ${labelColor}`, color: labelColor,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '12px', fontWeight: '700', flexShrink: 0,
                                            }}>
                                                {labels[i]}
                                            </span>
                                            <span style={{ flex: 1, textAlign: 'left', fontSize: '14px' }}>
                                                {choice.content}
                                            </span>
                                        </button>

                                        {isSelected && (
                                            <div style={{
                                                marginTop: '6px', marginLeft: '40px', fontSize: '13px',
                                                color: '#4b5563', lineHeight: '1.5',
                                                padding: '8px 12px', backgroundColor: isSelected && choice.is_correct ? '#f0fdf4' : '#fef2f2',
                                                borderRadius: '8px',
                                            }}>
                                                <span style={{
                                                    fontWeight: '700',
                                                    color: choice.is_correct ? '#15803d' : '#b91c1c',
                                                    marginRight: '6px',
                                                }}>
                                                    {choice.is_correct ? '✓ Chính xác!' : '✕ Chưa đúng lắm!'}
                                                </span>
                                                {choice.explanation}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Nav + Nộp bài */}
                    <div style={styles.navButtons}>
                        <button
                            disabled={currentIndex === 0}
                            style={{ ...styles.navBtn, opacity: currentIndex === 0 ? 0.4 : 1 }}
                            onClick={() => setCurrentIndex(prev => prev - 1)}
                        >← Trở lại</button>

                        {/* Nút Nộp bài — chỉ hiện ở câu cuối và chỉ với sinh viên */}
                        {currentIndex === quizData.questions.length - 1 && userRole !== 'teacher' ? (
                            <button
                                disabled={submitting}
                                onClick={handleSubmitQuiz}
                                style={{
                                    ...styles.navBtn,
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    fontWeight: '700',
                                    opacity: submitting ? 0.6 : 1,
                                    boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
                                }}
                            >
                                {submitting ? '⏳ Đang nộp...' : '✅ Nộp bài'}
                            </button>
                        ) : (
                            <button
                                disabled={currentIndex === quizData.questions.length - 1}
                                style={{ ...styles.navBtn, opacity: currentIndex === quizData.questions.length - 1 ? 0.4 : 1 }}
                                onClick={() => setCurrentIndex(prev => prev + 1)}
                            >Tiếp theo →</button>
                        )}
                    </div>
                    </>
                    )}
                </div>
            )}

            {/* ── Modals ── */}
            {showCustomizeModal && (
                <CustomizeQuizModal
                    onClose={() => setShowCustomizeModal(false)}
                    onGenerate={generateQuiz}
                />
            )}

            {showShareModal && quizData && (
                <ShareModal
                    quizId={quizData.id}
                    quizTitle={quizData.title}
                    isPublic={quizData.is_public}
                    initialSharedEmails={quizData.shared_users}
                    onClose={() => setShowShareModal(false)}
                    onShareUpdated={(isPublic, emails) => {
                        setQuizData(prev => ({ ...prev, is_public: isPublic, shared_users: emails }));
                    }}
                />
            )}

            <style>{`
                .spinner {
                    width: 40px; height: 40px; border: 4px solid #e5e7eb;
                    border-top: 4px solid #3b82f6; border-radius: 50%;
                    animation: spin 0.9s linear infinite;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

const styles = {
    container: {
        width: '390px', borderLeft: '1px solid #e5e7eb', backgroundColor: '#ffffff',
        flexDirection: 'column', height: '100%', boxShadow: '-4px 0 20px rgba(0,0,0,0.04)',
    },
    header: {
        padding: '14px 18px', borderBottom: '1px solid #f3f4f6',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', backgroundColor: '#fafafa',
    },
    iconBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '18px', color: '#9ca3af', padding: '4px 6px', borderRadius: '6px',
    },
    dropdownMenu: {
        position: 'absolute', right: 0, top: '28px', backgroundColor: 'white',
        border: '1px solid #e5e7eb', borderRadius: '10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)', padding: '4px',
        zIndex: 100, minWidth: '150px', display: 'flex', flexDirection: 'column',
    },
    dropdownItem: {
        background: 'none', border: 'none', padding: '9px 14px', textAlign: 'left',
        cursor: 'pointer', fontSize: '13px', borderRadius: '6px',
        display: 'block', width: '100%', color: '#374151',
    },
    renameInput: {
        fontSize: '16px', fontWeight: 'bold', width: '100%',
        border: '1px solid #3b82f6', borderRadius: '6px',
        padding: '2px 6px', outline: 'none',
    },
    emptyState: {
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 30px', textAlign: 'center',
    },
    emptyIcon: {
        fontSize: '48px', marginBottom: '16px',
        filter: 'grayscale(0.2)',
    },
    createBtn: {
        padding: '12px 28px', backgroundColor: '#3b82f6', color: 'white',
        border: 'none', borderRadius: '24px', fontWeight: '700',
        cursor: 'pointer', fontSize: '14px',
        boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
        transition: 'all 0.15s',
    },
    loadingContainer: {
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
    },
    quizContent: {
        display: 'flex', flexDirection: 'column', flex: 1,
        padding: '20px', overflowY: 'auto', gap: '0',
    },
    progress: {
        marginBottom: '18px',
    },
    pageText: {
        fontSize: '12px', color: '#9ca3af', fontWeight: '500', display: 'block', marginBottom: '6px',
    },
    progressBar: {
        width: '100%', height: '3px', backgroundColor: '#f3f4f6', borderRadius: '99px', overflow: 'hidden',
    },
    progressFill: {
        height: '100%', backgroundColor: '#3b82f6', borderRadius: '99px', transition: 'width 0.3s ease',
    },
    questionBlock: { flex: 1 },
    questionText: {
        fontSize: '15px', lineHeight: '1.65', color: '#111827',
        fontWeight: '600', marginBottom: '20px',
    },
    optionsList: {
        display: 'flex', flexDirection: 'column', gap: '10px',
    },
    optionBtn: {
        padding: '14px 16px', borderRadius: '12px', border: '1.5px solid',
        transition: 'all 0.15s', display: 'flex', alignItems: 'center',
        gap: '12px', cursor: 'pointer', width: '100%', textAlign: 'left',
        backgroundColor: '#f9fafb',
    },
    navButtons: {
        display: 'flex', justifyContent: 'space-between', marginTop: '28px', paddingTop: '16px',
        borderTop: '1px solid #f3f4f6',
    },
    navBtn: {
        padding: '8px 18px', border: 'none', borderRadius: '20px',
        backgroundColor: '#f3f4f6', cursor: 'pointer',
        fontWeight: '500', color: '#374151', fontSize: '13px',
    },
    resultScreen: {
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '30px 20px', textAlign: 'center',
    },
    resultIcon: {
        fontSize: '52px', marginBottom: '12px',
    },
    scoreCircle: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', width: '100px', height: '100px',
        borderRadius: '50%', border: '4px solid #3b82f6',
        backgroundColor: '#eff6ff', margin: '0 auto 8px',
    },
};

export default QuizPanel;
