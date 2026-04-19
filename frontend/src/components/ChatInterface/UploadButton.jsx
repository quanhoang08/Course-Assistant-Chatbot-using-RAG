import React, { useState } from 'react';
import { uploadCourseFile } from '../../services/chatService';
import iconUpload from '../../assets/dowload.png';
const UploadButton = ({ courseId, onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            await uploadCourseFile(courseId, file);
            alert("Tải tài liệu lên thành công! AI đang học kiến thức mới...");
            if (onUploadSuccess) {
                onUploadSuccess();
            }
        } catch (error) {
            alert("Lỗi: Không thể tải tài liệu lên.");
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    return (
        <div style={{ marginLeft: 'auto' }}>
            <input
                type="file"
                id="file-upload"
                hidden
                onChange={handleFileChange}
                accept=".pdf"
            />
            <label 
                htmlFor="file-upload" 
                style={{
                    padding: '8px 16px',
                    backgroundColor: uploading ? '#cbd5e1' : '#3795b4',
                    color: 'white',
                    borderRadius: '8px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '600',
                    transition: '0.3s'
                }}
            >
                <img 
                    src={iconUpload} 
                    alt="icon" 
                    style={{ width: '20px', height: '20px', marginRight: '8px' }} 
                />
                {uploading ? 'Đang xử lý...' : 'Tải tài liệu học tập'}
            </label>
        </div>
    );
};

export default UploadButton;