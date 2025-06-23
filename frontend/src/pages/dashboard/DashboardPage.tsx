import Sidebar from "../../components/dashboard/Sidebar";
import MainContent from "../../components/dashboard/MainContent";
import AIChat from "../../components/dashboard/AIChat";
import { Header } from "../../components/ui/Header";
import { useEffect } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!token) {
      navigate("/auth/login", { replace: true });
    }
  }, [token, navigate]);
  return (
    <div className="flex h-screen bg-white fade-in overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <MainContent />
        </main>
      </div>
      <AIChat />
    </div>
  );
} 