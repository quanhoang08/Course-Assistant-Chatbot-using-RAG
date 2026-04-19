import React, { useState } from 'react';
import { deleteAllChatHistory } from '../services/chatService';
import chat2Img from '../assets/FlatDesign_chat2.jpg';
const AccountSettings = () => {
    const username = localStorage.getItem('username') || 'Người dùng';
    const avatar = localStorage.getItem('avatar');
    const role = localStorage.getItem('role');
    const roleDisplay = role === 'teacher' ? 'Giáo viên' : 'Sinh viên';
    const [isDeleting, setIsDeleting] = useState(false);
    
    // States cho thông tin bổ sung
    const [mssv, setMssv] = useState(() => localStorage.getItem('student_mssv') || '');
    const [lop, setLop] = useState(() => localStorage.getItem('student_class') || '');
    const [khoa, setKhoa] = useState(() => localStorage.getItem('student_khoa') || '');

    const [defaultModel, setDefaultModel] = useState(() => {
        const allowed = ['gemini-2.5-flash', 'gemini-3.1-flash-lite-preview'];
        const stored = localStorage.getItem('defaultAIModel');
        return allowed.includes(stored) ? stored : 'gemini-2.5-flash';
    });
    const [notifications, setNotifications] = useState(true);
    const handleChangeModel = (e) => {
        const newModel = e.target.value;
        setDefaultModel(newModel);
        localStorage.setItem('defaultAIModel', newModel);
    };

    const handleDeleteAllChat = async () => {
        const isConfirm = window.confirm("CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn TOÀN BỘ lịch sử chat AI của bạn ở TẤT CẢ các môn học. Bạn có chắc chắn không?");
        if (!isConfirm) return;

        setIsDeleting(true);
        try {
            await deleteAllChatHistory();
            alert("Đã xóa toàn bộ lịch sử trò chuyện");
        } catch (error) {
            alert("Có lỗi xảy ra khi xóa dữ liệu. Vui lòng kiểm tra lại kết nối!");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSaveProfile = () => {
        localStorage.setItem('student_mssv', mssv);
        localStorage.setItem('student_class', lop);
        localStorage.setItem('student_khoa', khoa);
        alert('Đã lưu thông tin bổ sung thành công!');
    };

    return (
        <div style={{ padding: '30px 40px', maxWidth: '100%', margin: '0 auto', height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
            <h2 style={{ color: '#1e293b', paddingBottom: '10px' }}>
                Cài đặt tài khoản
            </h2>

            <div style={cardStyle}>
                <h3 style={sectionTitleStyle}>Hồ sơ của tôi</h3>

                {/* Phần nội dung Profile (trái) và Ảnh minh họa (phải) */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: '20px', gap: '40px' }}>
                    
                    {/* KHỐI BÊN TRÁI: AVATAR VÀ FORM SINH VIÊN */}
                    <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        
                        {/* Avatar & Role */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#cbd5e1', overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                                {avatar ? (
                                    <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', color: '#fff' }}>
                                        {username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '24px' }}>{username}</h2>
                                <span style={{
                                    backgroundColor: role === 'teacher' ? '#dbeafe' : '#fef3c7',
                                    color: role === 'teacher' ? '#1e40af' : '#92400e',
                                    padding: '6px 16px',
                                    borderRadius: '20px',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}>
                                    {roleDisplay}
                                </span>
                            </div>
                        </div>

                        {/* Form thông tin bổ sung (nếu là SV) */}
                        {role !== 'teacher' && (
                            <div>
                                <h4 style={{ color: '#334155', fontSize: '18px', margin: '0 0 20px 0' }}>Thông tin sinh viên bổ sung</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                    
                                    <div style={settingRowStyleCol}>
                                        <div style={settingLabelStyle}>Mã số sinh viên (MSSV)</div>
                                        <input 
                                            type="text" 
                                            value={mssv} 
                                            onChange={(e) => setMssv(e.target.value)} 
                                            placeholder="VD: 52100001"
                                            style={inputStyleFull}
                                        />
                                        <div style={settingDescStyle}>Được dùng để định danh khi nộp bài.</div>
                                    </div>

                                    <div style={settingRowStyleCol}>
                                        <div style={settingLabelStyle}>Lớp sinh hoạt</div>
                                        <input 
                                            type="text" 
                                            value={lop} 
                                            onChange={(e) => setLop(e.target.value)} 
                                            placeholder="VD: 20H1323"
                                            style={inputStyleFull}
                                        />
                                    </div>

                                    <div style={settingRowStyleCol}>
                                        <div style={settingLabelStyle}>Khoa / Viện</div>
                                        <input 
                                            type="text" 
                                            value={khoa} 
                                            onChange={(e) => setKhoa(e.target.value)} 
                                            placeholder="VD: Khoa CNTT"
                                            style={inputStyleFull}
                                        />
                                        <div style={settingDescStyle}>Khoa chuyên ngành của bạn tại TDTU.</div>
                                    </div>

                                    <div style={{ marginTop: '10px' }}>
                                        <button onClick={handleSaveProfile} style={primaryButtonStyle}>
                                            💾 Lưu thay đổi
                                        </button>
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>

                    {/* KHỐI BÊN PHẢI: ILLUSTRATION TO & RÕ RÀNG HƠN */}
                    <div style={{ flex: '1 1 50%', display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: '400px' }}>
                        <img 
                            src={chat2Img} 
                            alt="Illustration Banner" 
                            style={{ width: '100%', maxWidth: '600px', height: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} 
                        />
                    </div>
                </div>
            </div>

            <div style={cardStyle}>
                <h3 style={sectionTitleStyle}>Cài đặt Trợ lý AI</h3>

                <div style={settingRowStyle}>
                    <div>
                        <div style={settingLabelStyle}>Model AI mặc định</div>
                        <div style={settingDescStyle}>Chọn mô hình AI sẽ tự động kích hoạt khi bạn mở khung chat.</div>
                    </div>
                    <select
                        value={defaultModel}
                        onChange={handleChangeModel}
                        style={selectStyle}
                    >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Nhanh)</option>
                        <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash (Suy luận kỹ hơn)</option>
                    </select>
                </div>

                <div style={{ ...settingRowStyle, borderBottom: 'none' }}>
                    <div>
                        <div style={settingLabelStyle}>Xóa lịch sử trò chuyện</div>
                        <div style={settingDescStyle}>Xóa toàn bộ các phiên chat của bạn trên hệ thống.</div>
                    </div>
                    <button
                        style={{
                            ...dangerButtonStyle,
                            opacity: isDeleting ? 0.6 : 1,
                            cursor: isDeleting ? 'not-allowed' : 'pointer'
                        }}
                        onClick={handleDeleteAllChat}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Đang dọn dẹp...' : 'Xóa dữ liệu'}
                    </button>
                </div>
            </div>

        </div>
    );
};

const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '40px',
    marginBottom: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '150px'
};

const sectionTitleStyle = {
    margin: '0',
    color: '#334155',
    fontSize: '20px',
    fontWeight: 'bold'
};

const settingRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 0',
};

const settingRowStyleCol = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px'
};

const settingLabelStyle = { fontWeight: 'bold', color: '#1e293b', marginBottom: '4px', fontSize: '15px' };
const settingDescStyle = { fontSize: '13px', color: '#64748b', marginTop: '2px' };

const inputStyle = {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    outline: 'none',
    backgroundColor: '#fff',
    fontSize: '14px',
    transition: '0.2s',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
};

const inputStyleFull = {
    ...inputStyle,
    width: '100%',
    maxWidth: '400px'
};

const primaryButtonStyle = {
    padding: '10px 24px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    transition: 'background-color 0.2s',
    boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)'
};

const selectStyle = {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    outline: 'none',
    backgroundColor: '#f8fafc',
    fontSize: '14px',
    marginLeft: '30px'
};

const dangerButtonStyle = {
    padding: '10px 20px',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px'
};

export default AccountSettings;