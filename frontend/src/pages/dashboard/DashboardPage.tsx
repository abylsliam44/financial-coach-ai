import Sidebar from "../../components/dashboard/Sidebar";
import MainContent from "../../components/dashboard/MainContent";
import AIChat from "../../components/dashboard/AIChat";

export default function DashboardPage() {
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