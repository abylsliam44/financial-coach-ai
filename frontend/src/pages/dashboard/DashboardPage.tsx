import Sidebar from "../../components/dashboard/Sidebar";
import MainContent from "../../components/dashboard/MainContent";
import AIChat from "../../components/dashboard/AIChat";
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
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 flex flex-col bg-gray-50">
        <MainContent />
      </main>
      <AIChat />
    </div>
  );
} 