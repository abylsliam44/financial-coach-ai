import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

const AppRoutes = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white text-gray-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          Загрузка приложения...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      {/* Public Routes */}
      <Route path="/auth/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/auth/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      {/* Protected Routes */}
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute requireProfile={true}><DashboardPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute requireProfile={true}><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

// For routes that should only be accessible to unauthenticated users (e.g., login, register)
const GuestRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};


// For routes that require authentication
const ProtectedRoute = ({ children, requireProfile = false }: { children: JSX.Element, requireProfile?: boolean }) => {
  const { isAuthenticated, hasProfile, user } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute Debug:', { 
    path: location.pathname, 
    isAuthenticated, 
    hasProfile, 
    requireProfile,
    user: user?.email 
  });

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="text-center p-8">
          <div className="text-red-500 text-xl mb-4">🔒 Доступ запрещен</div>
          <div className="text-gray-600 mb-4">Вы не авторизованы. Перенаправляем на страницу входа...</div>
          <Navigate to="/auth/login" state={{ from: location }} replace />
        </div>
      </div>
    );
  }

  if (requireProfile && !hasProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="text-center p-8">
          <div className="text-blue-500 text-xl mb-4">📝 Требуется заполнение профиля</div>
          <div className="text-gray-600 mb-4">Для доступа к этой странице нужно завершить онбординг. Перенаправляем...</div>
          <Navigate to="/onboarding" replace />
        </div>
      </div>
    );
  }
  
  // If user is authenticated and on onboarding, but has a profile, redirect to dashboard
  if (location.pathname === '/onboarding' && hasProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="text-center p-8">
          <div className="text-green-500 text-xl mb-4">✅ Профиль уже заполнен</div>
          <div className="text-gray-600 mb-4">Ваш профиль уже настроен. Перенаправляем на дашборд...</div>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  return children;
};


export default App; 