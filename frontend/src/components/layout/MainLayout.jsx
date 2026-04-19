import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './MainLayout.module.css';

const MainLayout = ({ children, onLogout, currentUser }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // State điều khiển Sidebar thu/mở
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const getHeaderTitle = () => {
        if (location.pathname.includes('/home')) return 'Trang chủ';
        if (location.pathname.includes('/dashboard')) return 'Môn học của tôi';
        if (location.pathname.includes('/account')) return 'Cài đặt tài khoản';
        if (location.pathname.includes('/course/')) return 'Không gian lớp học';
        return '';
    };

    const userRole = localStorage.getItem('role');
    const rawAvatar = localStorage.getItem('avatar');
    const roleLabel = userRole === 'teacher' ? 'Giáo viên' : 'Sinh viên';

    const getAvatarUrl = (url) => {
        if (!url || url === 'null' || url === 'undefined') return null;
        if (url.startsWith('http')) return url;
        return `http://localhost:8000${url}`;
    };
    const userAvatar = getAvatarUrl(rawAvatar);

    // Helper: xác định class cho menu item
    const getMenuClass = (isActive) => {
        if (isSidebarCollapsed) {
            return isActive ? styles.menuItemCollapsedActive : styles.menuItemCollapsed;
        }
        return isActive ? styles.menuItemActive : styles.menuItem;
    };

    return (
        <div className={styles.container}>
            {/* ===================== SIDEBAR ===================== */}
            <nav className={isSidebarCollapsed ? styles.sidebarCollapsed : styles.sidebar}>
                {/* Logo / Brand */}
                <div className={isSidebarCollapsed ? styles.logoAreaCollapsed : styles.logoArea}>
                    {isSidebarCollapsed ? 'E' : 'E-Learning TDTU'}
                </div>

                <ul className={styles.menuList}>
                    <li
                        className={getMenuClass(location.pathname.includes('/home'))}
                        onClick={() => navigate('/home')}
                        title={isSidebarCollapsed ? 'Trang chủ' : ''}
                    >
                        <span className={styles.menuIcon}>🏠</span>
                        {!isSidebarCollapsed && (
                            <span className={styles.menuLabel}>Trang chủ</span>
                        )}
                    </li>

                    <li
                        className={getMenuClass(
                            location.pathname.includes('/dashboard') ||
                            location.pathname.includes('/course/')
                        )}
                        onClick={() => navigate('/dashboard')}
                        title={isSidebarCollapsed ? 'Môn học của tôi' : ''}
                    >
                        <span className={styles.menuIcon}>📚</span>
                        {!isSidebarCollapsed && (
                            <span className={styles.menuLabel}>Môn học của tôi</span>
                        )}
                    </li>

                    <li
                        className={getMenuClass(location.pathname.includes('/account'))}
                        onClick={() => navigate('/account')}
                        title={isSidebarCollapsed ? 'Cài đặt tài khoản' : ''}
                    >
                        <span className={styles.menuIcon}>⚙️</span>
                        {!isSidebarCollapsed && (
                            <span className={styles.menuLabel}>Cài đặt tài khoản</span>
                        )}
                    </li>
                </ul>

                <div className={isSidebarCollapsed ? styles.logoutWrapperCollapsed : styles.logoutWrapper}>
                    {isSidebarCollapsed ? (
                        <button
                            onClick={onLogout}
                            className={styles.logoutBtnCollapsed}
                            title="Đăng xuất"
                        >
                            🚪
                        </button>
                    ) : (
                        <button onClick={onLogout} className={styles.logoutBtn}>
                            🚪 Đăng xuất
                        </button>
                    )}
                </div>
            </nav>

            {/* ===================== PHẦN PHẢI ===================== */}
            <div className={styles.rightContent}>
                {/* --- Topbar --- */}
                <header className={styles.topbar}>
                    {/* Left: Toggle button + Title */}
                    <div className={styles.topbarLeft}>
                        <button
                            id="sidebar-toggle-btn"
                            className={styles.sidebarToggleBtn}
                            onClick={() => setIsSidebarCollapsed(prev => !prev)}
                            title={isSidebarCollapsed ? 'Mở rộng menu' : 'Thu nhỏ menu'}
                            aria-label="Toggle sidebar"
                        >
                            ☰
                        </button>
                        <div className={styles.topbarTitle}>{getHeaderTitle()}</div>
                    </div>

                    {/* Right: User info */}
                    <div className={styles.userSection}>
                        <span className={styles.userGreeting}>
                            Xin chào, {roleLabel} <strong>{currentUser}</strong>
                        </span>
                        <div className={styles.avatar}>
                            {userAvatar ? (
                                <img
                                    src={userAvatar}
                                    alt="avatar"
                                    className={styles.avatarImg}
                                />
                            ) : (
                                currentUser?.charAt(0).toUpperCase()
                            )}
                        </div>
                    </div>
                </header>

                {/* --- Main content area (Expansive — không giới hạn max-width) --- */}
                <main className={styles.mainArea}>
                    <div className={styles.mainInner}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;