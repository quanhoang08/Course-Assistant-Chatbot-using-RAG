import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MainLayout from './components/layout/MainLayout';
import ChatInterface from './components/ChatInterface/ChatInterface';
import DocumentManager from './components/ChatInterface/DocumentManager';
import CourseMaterials from './components/ChatInterface/CourseMaterials';
import AccountSettings from './pages/AccountSettings';
import SharedQuizView from './components/ChatInterface/SharedQuizView';
import styles from './App.module.css';

/* ===================================================================
   CourseDetailWrapper
   Hiển thị chi tiết một môn học với 3 tab:
   - Trợ giảng AI (ChatInterface)
   - Tài liệu môn học (CourseMaterials)
   - Dữ liệu huấn luyện AI (DocumentManager)
   =================================================================== */
const CourseDetailWrapper = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const [courseTab, setCourseTab] = useState(() => {
    return localStorage.getItem('savedTab') || 'chat';
  });

  useEffect(() => {
    localStorage.setItem('savedTab', courseTab);
  }, [courseTab]);

  const savedCourse = JSON.parse(localStorage.getItem('savedCourse') || '{}');

  // Helper: trả về class phù hợp cho tab button
  const getTabClass = (tabKey) =>
    courseTab === tabKey ? styles.tabBtnActive : styles.tabBtn;

  return (
    <div className={styles.courseWrapper}>
      {/* Nút quay lại */}
      <button
        className={styles.backBtn}
        onClick={() => {
          localStorage.removeItem('savedCourse');
          navigate('/dashboard');
        }}
      >
        <span className={styles.backArrow}>←</span>
        Quay lại danh sách lớp
      </button>

      {/* Tiêu đề tên môn */}
      <h2 className={styles.courseTitle}>
        Môn:{' '}
        <span className={styles.courseName}>
          {savedCourse.name || `ID Môn: ${courseId}`}
        </span>
      </h2>

      {/* Tab navigation */}
      <div className={styles.tabBar}>
        <button className={getTabClass('chat')} onClick={() => setCourseTab('chat')}>
          🤖 Trợ giảng AI
        </button>
        <button className={getTabClass('materials')} onClick={() => setCourseTab('materials')}>
          📖 Tài liệu môn học
        </button>
        <button className={getTabClass('documents')} onClick={() => setCourseTab('documents')}>
          🗃️ Dữ liệu huấn luyện AI
        </button>
      </div>

      {/* Luôn mount ChatInterface (ẩn khi không ở tab chat) để không mất state stream khi đổi tab; 2 tab kia vẫn lazy mount */}
      <div className={styles.contentArea}>
        <div
          className={styles.tabPanel}
          style={{ display: courseTab === 'chat' ? 'flex' : 'none' }}
        >
          <ChatInterface courseId={courseId} />
        </div>
        {courseTab === 'materials' && (
          <div className={styles.tabPanel}>
            <CourseMaterials courseId={courseId} />
          </div>
        )}
        {courseTab === 'documents' && (
          <div className={styles.tabPanel}>
            <DocumentManager courseId={courseId} />
          </div>
        )}
      </div>
    </div>
  );
};

/* ===================================================================
   App — Root Component
   =================================================================== */
function App() {
  const currentUsername = localStorage.getItem('username');

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('access_token');
  });

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('savedTab');
    localStorage.removeItem('savedActiveTab');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('avatar');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('savedCourse');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className={styles.app}>
        <Routes>
          {/* Route công khai — xem quiz được chia sẻ (không cần đăng nhập) */}
          <Route path="/shared-quiz/:quizId" element={<SharedQuizView />} />

          {!isAuthenticated ? (
            <>
              <Route
                path="/login"
                element={<LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />}
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <Route
              path="*"
              element={
                <MainLayout currentUser={currentUsername} onLogout={handleLogout}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />

                    {/* Trang chủ */}
                    <Route
                      path="/home"
                      element={
                        <div className={styles.homePage}>
                          <h1 className={styles.homeTitle}>
                            Chào mừng đến với E-Learning TDTU
                          </h1>
                          <p className={styles.homeSubtitle}>
                            Hệ thống Học tập &amp; Trợ giảng AI dành cho Sinh viên và Giảng viên.
                          </p>
                          <button
                            className={styles.ctaBtn}
                            onClick={() => (window.location.href = '/dashboard')}
                          >
                            Khám phá khóa học ngay ➔
                          </button>
                        </div>
                      }
                    />

                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/course/:courseId" element={<CourseDetailWrapper />} />
                    <Route path="/account" element={<AccountSettings />} />
                    <Route path="*" element={<Navigate to="/home" replace />} />
                  </Routes>
                </MainLayout>
              }
            />
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;