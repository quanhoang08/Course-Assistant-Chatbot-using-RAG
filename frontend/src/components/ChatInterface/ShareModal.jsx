import React, { useState } from 'react';
import api from '../../services/api';

const ShareModal = ({ quizId, quizTitle, initialSharedEmails, isPublic, onClose, onShareUpdated }) => {
    const [publicAccess, setPublicAccess] = useState(isPublic);
    const [emails, setEmails] = useState(initialSharedEmails || []);
    const [newEmail, setNewEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const currentUserEmail = localStorage.getItem('username') || "Chủ sở hữu";

    const handleSave = async () => {
        try {
            await api.post(`quiz/${quizId}/share/`, {
                is_public: publicAccess,
                emails: emails
            });
            // Update parent component state to avoid F5 reload mapping
            if (onShareUpdated) onShareUpdated(publicAccess, emails);
            onClose();
        } catch (e) {
            alert('Lỗi cập nhật chia sẻ');
        }
    };

    const handleAddEmail = async (e) => {
        if (e.key === 'Enter' && newEmail.trim()) {
            const inputEmail = newEmail.trim().toLowerCase();
            // Yêu cầu @gmail.com hoặc @student.tdtu.edu.vn
            const isValidDomain = inputEmail.endsWith('@gmail.com') || inputEmail.endsWith('@student.tdtu.edu.vn');
            if (!isValidDomain) {
                setEmailError('Hỗ trợ @gmail.com hoặc @student.tdtu.edu.vn!');
                return;
            }
            if (emails.includes(inputEmail)) {
                setEmailError('Email này đã nằm trong danh sách.');
                return;
            }
            
            // Điền trực tiếp, bỏ qua việc kiểm tra user có trong DB hay không
            setEmails([...emails, inputEmail]);
            setNewEmail('');
            setEmailError('');
        }
    };

    const handleRemoveEmail = (target) => {
        setEmails(emails.filter(em => em !== target));
    };

    const handleCopyLink = () => {
        let origin = window.location.origin;
        if (origin.includes('localhost')) {
            alert('LƯU Ý: Bạn đang truy cập bằng localhost. Để người khác truy cập được qua Wifi/Mạng LAN, hãy thay chữ "localhost" trong link bằng địa chỉ IP của máy bạn (vd: 192.168.x.x) trước khi gửi cho họ nhé!');
        }
        const link = `${origin}/shared-quiz/${quizId}`;
        navigator.clipboard.writeText(link);
        alert('Đã sao chép liên kết vào khay nhớ tạm!');
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>Chia sẻ "{quizTitle}"</h3>
                    <button style={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div style={styles.content}>
                    <div style={styles.infoBox}>
                        <span style={{ fontSize: '14px', color: '#4b5563' }}>
                            Chỉ những người được cấp quyền mới có thể xem Server Trắc nghiệm đã chia sẻ.
                        </span>
                    </div>

                    <div>
                        <input
                            style={{...styles.inputAdd, borderColor: emailError ? '#ef4444' : '#d1d5db'}}
                            placeholder="Nhập email @gmail.com hoặc @student.tdtu.edu.vn rồi ấn Enter..."
                            value={newEmail}
                            onChange={e => {setNewEmail(e.target.value); setEmailError('');}}
                            onKeyDown={handleAddEmail}
                        />
                        {emailError && <div style={{color: '#ef4444', fontSize: '12px', marginTop: '4px'}}>{emailError}</div>}
                    </div>

                    <div style={styles.accessList}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#374151' }}>Người có quyền truy cập</h4>
                        
                        <div style={styles.userRow}>
                            <div style={{...styles.avatar, backgroundColor: '#10b981'}}>
                                {currentUserEmail.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{currentUserEmail}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>Chủ sở hữu</div>
                            </div>
                        </div>

                        {emails.map((em, idx) => (
                            <div key={idx} style={styles.userRow}>
                                <div style={{...styles.avatar, backgroundColor: '#6366f1'}}>
                                    {em.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px' }}>{em}</div>
                                </div>
                                <button style={styles.removeUserBtn} onClick={() => handleRemoveEmail(em)}>Xóa</button>
                            </div>
                        ))}
                    </div>

                    <div style={styles.generalAccess}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#374151' }}>Quyền truy cập chung</h4>
                        <select 
                            style={styles.selectAccess} 
                            value={publicAccess ? 'public' : 'restricted'}
                            onChange={(e) => setPublicAccess(e.target.value === 'public')}
                        >
                            <option value="restricted">🔒 Bị hạn chế (Chỉ những người được cấp quyền phía trên)</option>
                            <option value="public">🌐 Bất kỳ ai có liên kết (Không cần đăng nhập)</option>
                        </select>
                    </div>
                </div>

                <div style={styles.footer}>
                    <button style={styles.saveBtn} onClick={handleSave}>Lưu thiết lập</button>
                    <button style={styles.copyBtn} onClick={handleCopyLink}>
                        🔗 Sao chép liên kết
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000
    },
    modal: {
        backgroundColor: 'white', width: '480px', borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden'
    },
    header: {
        padding: '20px', borderBottom: '1px solid #e5e7eb',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    closeBtn: {
        border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', color: '#6b7280'
    },
    content: {
        padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px'
    },
    infoBox: {
        backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb'
    },
    inputAdd: {
        width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none'
    },
    userRow: {
        display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0'
    },
    avatar: {
        width: '32px', height: '32px', borderRadius: '50%', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
    },
    removeUserBtn: {
        border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px'
    },
    generalAccess: {
        marginTop: '10px'
    },
    selectAccess: {
        width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none'
    },
    footer: {
        padding: '15px 20px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb',
        display: 'flex', justifyContent: 'space-between'
    },
    saveBtn: {
        padding: '8px 24px', backgroundColor: '#3b82f6', color: 'white',
        border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer'
    },
    copyBtn: {
        padding: '8px 16px', backgroundColor: 'transparent', color: '#3b82f6',
        border: '1px solid #3b82f6', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer'
    }
};

export default ShareModal;
