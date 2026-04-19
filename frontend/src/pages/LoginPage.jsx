import React, { useState } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import anhNen from '../assets/ChatbotART.jpg'
import logo from "../assets/google.png"

const clientId = "830912600912-f0q4ujpc0nsl1p95hdbf07spleik6m0c.apps.googleusercontent.com";

const LoginForm = ({ onLoginSuccess }) => {
    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                console.log("Access Token Google:", tokenResponse.access_token);

                const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const realGoogleName = userInfo.data.name;

                const avatarUrl = userInfo.data.picture;

                const res = await axios.post('http://localhost:8000/api/auth/google/', {
                    access_token: tokenResponse.access_token
                });

                localStorage.setItem('access_token', res.data.access);
                if (res.data.refresh) {
                    localStorage.setItem('refresh_token', res.data.refresh);
                }

                const role = res.data.is_teacher ? 'teacher' : 'student';
                localStorage.setItem('role', role);

                localStorage.setItem('username', realGoogleName);

                if (avatarUrl) {
                    localStorage.setItem('avatar', avatarUrl);
                }

                if (onLoginSuccess) {
                    onLoginSuccess();
                }
            } catch (error) {
                console.error("Lỗi khi kết nối:", error.response?.data || error.message);
                alert("Đăng nhập thất bại. Kiểm tra lại Console F12.");
            }
        },
        onError: () => console.log('Đăng nhập Google thất bại!'),
    });

    const [isHovered, setIsHovered] = useState(false);

    const buttonStyle = {
        ...styles.customButton,
        backgroundColor: isHovered ? '#FFE5B4' : '#FFF8E7',
        boxShadow: isHovered ? '0 4px 8px rgba(0,0,0,0.15)' : 'none',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
    };

    return (
        <div style={styles.buttonWrapper}>
            <button onClick={() => login()}
                style={buttonStyle}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}>
                <h1 style={styles.h1}> Đăng nhập với Google</h1>
                <img src={logo} alt="Google Logo" style={styles.logo} />
            </button>
        </div>
    );
};

const Login = ({ onLoginSuccess }) => {
    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div style={styles.container}>
                <div style={styles.loginWrapper}>
                    <div style={styles.imageSide}>
                        <img
                            src={anhNen}
                            alt="ảnh nền 1"
                            style={styles.image}
                        />
                    </div>

                    <div style={styles.card}>
                        <h2 style={styles.Title}>E-Learning System TDTU</h2>
                        <p style={styles.fontSize}> Đăng nhập để vào lớp học và hỏi đáp cùng AI</p>
                        <LoginForm onLoginSuccess={onLoginSuccess} />
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#FFFDF9'
    },

    imageSide: {
        flex: '0 0 60%',
        overflow: 'hidden'
    },

    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },

    loginWrapper: {
        display: 'flex',
        backgroundColor: '#fff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
        maxWidth: '2000px',
        maxHeight: '1000px'
    },

    card: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '30px',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        textAlign: 'center',
        width: '350px',
    },

    customButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        padding: '6px 15px',
        fontSize: '8px',
        fontWeight: '500',
        color: '#4A3F35',
        backgroundColor: '#FFF8E7',
        border: '1px solid #D68C45',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        width: 'fit-content',
        height: 'auto',
    },

    Title: {
        fontSize: '45px',
        fontWeight: 1000,
        color: '#333',
        marginBottom: '15px'
    },

    fontSize: {
        fontSize: '25px',
        fontWeight: 500,
        color: '#666',
        marginBottom: '23px'
    },

    logo: {
        height: '30%'
    },

    h1: {
        fontWeight: '900',
        fontSize: '1.5rem'
    }
};

export default Login;