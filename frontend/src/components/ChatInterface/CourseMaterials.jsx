import React, { useState, useEffect } from 'react';
import { getCourseMaterials } from '../../services/courseService';
import api from '../../services/api';
import PDF_logo from '../../assets/pdf-file.png';
// import Doc_Logo from '../../assets/doc.png';
const CourseMaterials = ({ courseId }) => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);

    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const userRole = localStorage.getItem('role') || 'student';
    const isTeacher = userRole === 'teacher';

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const response = await api.get(`courses/${courseId}/documents/`);
            setMaterials(response.data);
        } catch (error) {
            console.error("Lỗi lấy tài liệu:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (courseId) fetchMaterials();
    }, [courseId]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Vui lòng chọn file trước khi tải lên!");
            return;
        }

        setUploading(true);
        const formData = new FormData();

        formData.append('file', file);
        formData.append('course_id', courseId);

        try {
            await api.post('courses/upload-document/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert("Tải tài liệu lên thành công!");
            setFile(null);

            fetchMaterials();
        } catch (error) {
            console.error("Lỗi upload:", error.response?.data || error.message);
            alert("Có lỗi xảy ra khi tải file lên!");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f8fafc', width: '100%', height: '100%', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>Tài liệu & Bài tập môn học</h3>

            {isTeacher && (
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e0f2fe', borderRadius: '8px', border: '1px dashed #0284c7' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>Đăng tài liệu mới (Dành cho Giáo viên)</h4>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            style={{ flex: 1, padding: '5px' }}
                        />
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            style={{
                                padding: '8px 20px',
                                backgroundColor: uploading ? '#94a3b8' : '#0284c7',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: uploading ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {uploading ? 'Đang tải...' : '⬆ Tải lên'}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải tài liệu...</div>
            ) : materials.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    <p style={{ margin: 0, color: '#64748b' }}>Chưa có tài liệu nào được đăng cho môn này.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {materials.map((doc) => (
                        <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div>
                                <h4 style={{ margin: '0 0 5px 0', color: '#334155' }}><img src={PDF_logo} alt="PDF logo" style={{ width: '2%' }} /> {doc.name || doc.file}</h4>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Đăng ngày: {doc.uploadedAt}</span>
                            </div>
                            <a
                                href={doc.url}
                                download
                                target="_blank"
                                rel="noreferrer"
                                style={{ padding: '8px 16px', backgroundColor: '#10b981', color: '#fff', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold', fontSize: '14px' }}
                            >
                                ⬇ Tải xuống
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CourseMaterials;