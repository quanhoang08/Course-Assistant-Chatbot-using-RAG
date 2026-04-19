// import React from 'react';
import UploadButton from './UploadButton';
import React, { useState, useEffect } from 'react';
import { getCourseDocuments } from '../../services/chatService';

const DocumentManager = ({ courseId }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDocuments = async () => {
        setLoading(true);
        const data = await getCourseDocuments(courseId);
        setDocuments(data);
        setLoading(false);
    };

    useEffect(() => {
        if (courseId) {
            fetchDocuments();
        }
    }, [courseId]);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Kho tài liệu huấn luyện AI</h3>
                <UploadButton courseId={courseId} onUploadSuccess={fetchDocuments} />
            </div>

            <div style={styles.listContainer}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px' }}>Đang tải dữ liệu...</div>
                ) : documents.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={{ fontSize: '60px', marginBottom: '15px' }}>📂</div>
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#64748b', fontSize: '1.1rem' }}>Chưa có tài liệu huấn luyện</p>
                        <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '5px' }}>
                            Hãy tải lên các tệp PDF bài giảng để trợ lý AI có thể học kiến thức môn này.
                        </p>
                    </div>
                ) : (
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc' }}>
                                    <th style={styles.th}>Tên tài liệu</th>
                                    <th style={styles.th}>Ngày tải lên</th>
                                    <th style={styles.th}>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map((doc) => (
                                    <tr key={doc.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '1.2rem' }}>📄</span>
                                                <span style={{ fontWeight: '500' }}>{doc.name}</span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>{doc.uploadedAt}</td>
                                        <td style={styles.td}>
                                            <span style={styles.badge}>Thêm tài liệu cho AI</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '30px',
        backgroundColor: '#fff',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px',
        paddingBottom: '20px',
        borderBottom: '1px solid #f1f5f9'
    },
    listContainer: {
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
    },

    emptyState: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '80px 20px',
        border: '2px dashed #e2e8f0',
        borderRadius: '16px',
        backgroundColor: '#f8fafc',
        margin: '10px 0'
    },
    tableWrapper: {
        width: '100%',
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left'
    },
    th: {
        padding: '16px 20px',
        color: '#475569',
        fontWeight: '600',
        fontSize: '0.9rem',
        borderBottom: '2px solid #f1f5f9',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    td: {
        padding: '18px 20px',
        color: '#1e293b',
        borderBottom: '1px solid #f1f5f9'
    },
    tr: {
        transition: 'background-color 0.2s',
        cursor: 'default'
    },
    badge: {
        backgroundColor: '#f0fdf4',
        color: '#16a34a',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        border: '1px solid #bbf7d0'
    }
};

export default DocumentManager;