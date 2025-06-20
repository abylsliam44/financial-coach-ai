import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import LandingPage from "./landing-page";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import OnboardingPage from "./pages/onboarding/OnboardingPage";
import { AuthProvider, useAuth } from "./AuthContext";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, hasProfile } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (hasProfile === false) {
    // Если мы уже на странице онбординга, то всё в порядке
    if (location.pathname === "/onboarding") {
      return children;
    }
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function OnboardingRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, hasProfile } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (hasProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка приложения...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
} 