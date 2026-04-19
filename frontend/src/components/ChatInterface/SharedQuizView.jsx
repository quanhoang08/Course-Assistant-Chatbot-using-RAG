import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const SharedQuizView = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [quizData, setQuizData] = useState(null);
    const [error, setError] = useState('');
    const [errorType, setErrorType] = useState(''); // 'auth' | 'forbidden' | 'notfound' | 'server'
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [submitResult, setSubmitResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Countdown redirect về login (chỉ dùng khi errorType === 'auth')
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        const fetchSharedQuiz = async () => {
            try {
                const res = await api.get(`quiz/${quizId}/`);
                setQuizData(res.data);
            } catch (err) {
                if (err.response?.status === 401) {
                    setErrorType('auth');
                    setError('Bài quiz này yêu cầu đăng nhập trước khi xem.');
                } else if (err.response?.status === 403) {
                    setErrorType('forbidden');
                    setError('Bạn không có quyền xem bài tập này hoặc quyền truy cập đã bị thu hồi.');
                } else if (err.response?.status === 404) {
                    setErrorType('notfound');
                    setError('Không tìm thấy bài Quiz này (có thể đã bị xóa).');
                } else {
                    setErrorType('server');
                    setError('Lỗi kết nối máy chủ, vui lòng thử lại sau.');
                }
            }
        };
        fetchSharedQuiz();
    }, [quizId]);

    // Countdown tự động redirect về /login nếu lỗi 401
    useEffect(() => {
        if (errorType !== 'auth') return;

        if (countdown <= 0) {
            navigate(`/login?redirect=/shared-quiz/${quizId}`);
            return;
        }

        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [errorType, countdown, navigate, quizId]);

    const handleSelectOption = (questionId, choiceId) => {
        setSelectedAnswers(prev => ({ ...prev, [questionId]: choiceId }));
    };

    // ── Nộp bài ──────────────────────────────────────────────────────────────
    const handleSubmitQuiz = async () => {
        if (!window.confirm('Bạn có chắc muốn nộp bài không?')) return;
        const answers = Object.entries(selectedAnswers).map(([question_id, choice_id]) => ({
            question_id: Number(question_id),
            choice_id: Number(choice_id),
        }));
        setSubmitting(true);
        try {
            const res = await api.post(`quiz/${quizId}/submit/`, { answers });
            setSubmitResult(res.data);
        } catch (e) {
            alert('Nộp bài thất bại, vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Màn hình lỗi ─────────────────────────────────────────────────────────
    if (error) {
        return (
            <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
                <div style={styles.errorBox}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                        {errorType === 'auth' ? '🔒' : errorType === 'notfound' ? '🔍' : '🚫'}
                    </div>
                    <h2 style={{ color: '#c5221f', margin: '0 0 10px 0', fontSize: '20px' }}>
                        {errorType === 'auth' ? 'Yêu cầu đăng nhập' :
                            errorType === 'notfound' ? 'Không tìm thấy' : 'Từ chối truy cập'}
                    </h2>
                    <p style={{ color: '#3c4043', margin: '0 0 20px 0', lineHeight: '1.6' }}>{error}</p>

                    {/* Nút điều hướng */}
                    {errorType === 'auth' && (
                        <>
                            <button
                                onClick={() => navigate(`/login?redirect=/shared-quiz/${quizId}`)}
                                style={styles.loginBtn}
                            >
                                Đăng nhập ngay
                            </button>
                            <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#9ca3af' }}>
                                Tự động chuyển hướng sau <strong>{countdown}</strong> giây...
                            </p>
                        </>
                    )}
                    {(errorType === 'forbidden' || errorType === 'notfound' || errorType === 'server') && (
                        <button
                            onClick={() => navigate('/')}
                            style={{ ...styles.loginBtn, backgroundColor: '#6b7280' }}
                        >
                            Về trang chủ
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ── Loading ───────────────────────────────────────────────────────────────
    if (!quizData) {
        return (
            <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
                <div className="spinner" style={{
                    width: 40, height: 40, border: '4px solid #f3f3f3',
                    borderTop: '4px solid #3b82f6', borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const isLastQuestion = currentIndex === quizData.questions.length - 1;
    const isLoggedIn = !!localStorage.getItem('access_token');

    return (
        <div style={styles.container}>
            <div style={styles.quizWrapper}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '22px', color: '#1f2937' }}>{quizData.title}</h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                            Bài Trắc nghiệm • Dựa trên tài liệu môn học
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div style={styles.content}>
                    {/* ── Màn hình kết quả ── */}
                    {submitResult ? (
                        <div style={styles.resultScreen}>
                            <div style={{ fontSize: '56px', marginBottom: '12px' }}>
                                {submitResult.percentage >= 80 ? '🏆' : submitResult.percentage >= 50 ? '📝' : '💪'}
                            </div>
                            <h3 style={{ margin: '0 0 6px', fontSize: '22px', color: '#111827', fontWeight: '800' }}>
                                Kết quả bài làm
                            </h3>
                            <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px' }}>
                                {submitResult.saved
                                    ? '✅ Điểm đã được ghi nhận vào hệ thống.'
                                    : '💡 Bạn chưa đăng nhập — kết quả chỉ hiển thị tạm thời.'}
                            </p>

                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', width: '120px', height: '120px',
                                borderRadius: '50%', border: '5px solid #3b82f6',
                                backgroundColor: '#eff6ff', margin: '0 auto 12px',
                            }}>
                                <span style={{ fontSize: '36px', fontWeight: '800', color: '#3b82f6' }}>
                                    {submitResult.score}
                                </span>
                                <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                                    / {submitResult.total_questions}
                                </span>
                            </div>

                            <div style={{
                                margin: '12px 0 20px',
                                padding: '10px 28px',
                                backgroundColor: submitResult.percentage >= 80 ? '#f0fdf4' : submitResult.percentage >= 50 ? '#fffbeb' : '#fef2f2',
                                borderRadius: '28px',
                                fontSize: '24px', fontWeight: '800',
                                color: submitResult.percentage >= 80 ? '#15803d' : submitResult.percentage >= 50 ? '#b45309' : '#b91c1c',
                            }}>
                                {submitResult.percentage}%
                            </div>

                            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 28px' }}>
                                {submitResult.percentage >= 80 ? 'Xuất sắc! Bạn đã nắm vững kiến thức.' :
                                    submitResult.percentage >= 50 ? 'Khá tốt! Hãy ôn lại những câu chưa đúng.' :
                                        'Cần cố gắng thêm! Đọc lại tài liệu và thử lại nhé.'}
                            </p>

                            <button
                                onClick={() => { setSubmitResult(null); setSelectedAnswers({}); setCurrentIndex(0); }}
                                style={styles.loginBtn}
                            >
                                🔄 Làm lại
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Progress */}
                            <div style={{ marginBottom: '25px' }}>
                                <span style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>
                                    {currentIndex + 1} / {quizData.questions.length}
                                </span>
                                <div style={{ marginTop: '8px', height: '4px', backgroundColor: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', backgroundColor: '#3b82f6', borderRadius: '99px',
                                        width: `${((currentIndex + 1) / quizData.questions.length) * 100}%`,
                                        transition: 'width 0.3s ease',
                                    }} />
                                </div>
                            </div>

                            {/* Question */}
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '17px', lineHeight: '1.6', color: '#202124', fontWeight: '500', marginBottom: '30px' }}>
                                    {quizData.questions[currentIndex].content}
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {quizData.questions[currentIndex].choices.map((choice, i) => {
                                        const qId = quizData.questions[currentIndex].id;
                                        const isSelected = selectedAnswers[qId] === choice.id;
                                        const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

                                        let bgColor = '#f8f9fa';
                                        let borderColor = '#dadce0';
                                        let contentColor = '#202124';

                                        if (isSelected) {
                                            if (choice.is_correct) {
                                                bgColor = '#e6f4ea'; borderColor = '#137333'; contentColor = '#137333';
                                            } else {
                                                bgColor = '#fce8e6'; borderColor = '#c5221f'; contentColor = '#c5221f';
                                            }
                                        }

                                        return (
                                            <div key={choice.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                                <button
                                                    style={{
                                                        padding: '18px 24px', borderRadius: '12px',
                                                        border: `1px solid ${borderColor}`, backgroundColor: bgColor,
                                                        color: contentColor, cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center',
                                                        transition: '0.2s', fontSize: '15px'
                                                    }}
                                                    onClick={() => handleSelectOption(qId, choice.id)}
                                                >
                                                    <span style={{ fontWeight: 'bold', marginRight: '15px', width: '20px' }}>{labels[i]}.</span>
                                                    <span style={{ flex: 1, textAlign: 'left' }}>{choice.content}</span>
                                                </button>

                                                {isSelected && (
                                                    <div style={{ marginTop: '10px', marginLeft: '45px', fontSize: '14px', color: '#3c4043', lineHeight: '1.5' }}>
                                                        <span style={{ fontWeight: 'bold', color: choice.is_correct ? '#137333' : '#c5221f', marginRight: '8px' }}>
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

                            {/* Nav */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '40px' }}>
                                <button
                                    disabled={currentIndex === 0}
                                    style={{
                                        padding: '10px 20px', border: 'none', borderRadius: '25px', fontSize: '14px',
                                        backgroundColor: currentIndex === 0 ? '#f1f3f4' : '#e5e7eb',
                                        color: currentIndex === 0 ? '#9aa0a6' : '#374151',
                                        cursor: currentIndex === 0 ? 'default' : 'pointer'
                                    }}
                                    onClick={() => setCurrentIndex(prev => prev - 1)}
                                >
                                    Trở lại
                                </button>

                                {/* Ở câu cuối: hiện nút Nộp bài */}
                                {isLastQuestion ? (
                                    <button
                                        disabled={submitting}
                                        onClick={handleSubmitQuiz}
                                        style={{
                                            padding: '10px 24px', border: 'none', borderRadius: '25px',
                                            fontSize: '14px', fontWeight: 'bold',
                                            backgroundColor: submitting ? '#93c5fd' : '#3b82f6',
                                            color: '#fff', cursor: submitting ? 'default' : 'pointer',
                                            boxShadow: '0 2px 8px rgba(59,130,246,0.35)',
                                        }}
                                    >
                                        {submitting ? '⏳ Đang nộp...' : '✅ Nộp bài'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentIndex(prev => prev + 1)}
                                        style={{
                                            padding: '10px 20px', border: 'none', borderRadius: '25px',
                                            fontSize: '14px', fontWeight: 'bold',
                                            backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer'
                                        }}
                                    >
                                        Tiếp theo
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        width: '100%', height: '100vh', backgroundColor: '#f3f4f6',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 20px',
        overflowY: 'auto'
    },
    errorBox: {
        backgroundColor: 'white', padding: '40px 36px', border: '1px solid #fca5a5',
        borderRadius: '16px', maxWidth: '480px', width: '100%',
        textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
    },
    loginBtn: {
        padding: '12px 32px', backgroundColor: '#3b82f6', color: 'white',
        border: 'none', borderRadius: '25px', fontWeight: '700',
        fontSize: '15px', cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
        transition: 'all 0.15s',
    },
    quizWrapper: {
        backgroundColor: 'white', width: '100%', maxWidth: '800px',
        minHeight: '80vh', borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
    },
    header: {
        padding: '24px 30px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f8fafc'
    },
    content: {
        flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column'
    },
    resultScreen: {
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '20px',
    },
};

export default SharedQuizView;
