import Sidebar from "../../components/dashboard/Sidebar";
import MainContent from "../../components/dashboard/MainContent";
import AIChat from "../../components/dashboard/AIChat";
import AccountsPage from "./AccountsPage";
import { Routes, Route } from "react-router-dom";
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            <Routes>
              <Route path="/" element={<MainContent />} />
              <Route path="/accounts" element={<AccountsPage />} />
              {/* другие вкладки дашборда */}
            </Routes>
          </div>
          <div className="w-[380px] border-l border-gray-100 bg-white flex flex-col">
            <AIChat />
          </div>
        </div>
      </main>
    </div>
  );
} 