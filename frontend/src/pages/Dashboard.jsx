import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get('courses/');
                setCourses(response.data);
            } catch (error) {
                console.error("Lỗi lấy danh sách môn học:", error);
                if (error.response?.status === 401) {
                    localStorage.clear();
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, [navigate]);

    return (
        <div style={styles.dashboardContainer}>
            {loading ? (
                <div style={styles.centerState}>
                    <div style={styles.spinner}></div>
                    <p style={{ color: '#64748b', marginTop: '15px' }}>Đang tải dữ liệu lớp học...</p>
                </div>
            ) : courses.length === 0 ? (
                <div style={styles.centerState}>
                    <div style={styles.emptyIcon}>📚</div>
                    <h3 style={{ color: '#1e293b', margin: '10px 0' }}>Chưa có môn học nào</h3>
                    <p style={{ color: '#64748b' }}>Bạn chưa được phân công môn học nào. Vui lòng liên hệ Admin.</p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {courses.map(course => (
                        <div
                            key={course.id}
                            style={styles.card}
                            onClick={() => {
                                localStorage.setItem('savedCourse', JSON.stringify(course));

                                navigate(`/course/${course.id}`);
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                            }}
                        >
                            <div style={styles.cardCover}>
                                <span style={styles.courseCode}>{course.course_code || 'MÃ MÔN'}</span>
                            </div>

                            <div style={styles.cardBody}>
                                <h3 style={styles.courseName}>{course.name}</h3>
                                <p style={styles.courseDesc}>
                                    Nhấn vào để xem tài liệu, slide bài giảng và thảo luận trực tiếp với Trợ giảng AI.
                                </p>
                            </div>

                            <div style={styles.cardFooter}>
                                <span style={styles.enterBtn}>
                                    Vào lớp học <span style={{ fontSize: '18px' }}>→</span>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    dashboardContainer: {
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 150px)',
    },

    header: {
        marginBottom: '30px'
    },
    title: {
        fontSize: '28px',
        fontWeight: '800',
        color: '#0f172a',
        margin: '0 0 8px 0'
    },
    subtitle: {
        fontSize: '15px',
        color: '#64748b',
        margin: 0
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px',
        width: '100%'
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #e2e8f0'
    },
    cardCover: {
        height: '100px',
        background: 'linear-gradient(135deg, #6aa3ff 0%, #446ae8 100%)',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '15px 20px'
    },
    courseCode: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        color: '#fff',
        padding: '5px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 'bold',
        backdropFilter: 'blur(4px)'
    },
    cardBody: {
        padding: '24px 20px',
        flex: 1
    },
    courseName: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 10px 0',
        lineHeight: '1.4'
    },
    courseDesc: {
        fontSize: '14px',
        color: '#64748b',
        lineHeight: '1.6',
        margin: 0
    },
    cardFooter: {
        padding: '16px 20px',
        borderTop: '1px solid #f1f5f9',
        backgroundColor: '#f8fafc',
        display: 'flex',
        justifyContent: 'flex-end'
    },
    enterBtn: {
        color: '#3b82f6',
        fontWeight: '600',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'color 0.2s'
    },

    centerState: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },

    emptyIcon: {
        fontSize: '60px',
        marginBottom: '10px',
        filter: 'grayscale(100%) opacity(0.5)'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;
document.head.appendChild(styleSheet);

export default Dashboard;