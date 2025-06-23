import React from 'react';
import { useAuth } from '../../AuthContext';
import { LogOut, User } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showUserInfo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = "BaiAI", 
  showUserInfo = true 
}) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-500 rounded-xl p-2">
          <User className="text-white w-5 h-5" />
        </div>
        <h1 className="font-bold text-xl text-gray-900">{title}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {showUserInfo && user && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="font-medium">{user.username}</span>
            <span className="text-gray-400">•</span>
            <span>{user.email}</span>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all duration-200 group"
          title="Выйти из аккаунта"
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Выйти</span>
        </button>
      </div>
    </header>
  );
}; 