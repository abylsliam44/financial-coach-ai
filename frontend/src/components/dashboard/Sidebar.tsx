import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Home, Target, List, Flame, Trophy, Settings, User as UserIcon, CreditCard } from "lucide-react";
import api from "../../api";

const navItems = [
  { label: "Обзор", icon: Home, path: "/dashboard" },
  { label: "Счета", icon: CreditCard, path: "/dashboard/accounts" },
  { label: "Цели", icon: Target, path: "/goals" },
  { label: "Траты", icon: List, path: "/transactions" },
  { label: "Стрики", icon: Flame, path: "/streaks" },
  { label: "Достижения", icon: Trophy, path: "/achievements" },
  { label: "Профиль", icon: UserIcon, path: "/profile" },
  { label: "Настройки", icon: Settings, path: "/settings" },
];

export default function Sidebar() {
  const [active, setActive] = useState(0);
  const [user, setUser] = useState<{ name: string; email: string }>({ name: "", email: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    api.get("/auth/me")
      .then((response) => {
        const data = response.data;
        setUser({
          name: data.username || data.name || "Пользователь",
          email: data.email || "",
        });
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }, []);

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between min-h-screen">
      <div>
        <div className="flex items-center gap-2 px-6 py-6">
          <span className="bg-emerald-500 rounded-xl p-2"><Home className="text-white w-6 h-6" /></span>
          <span className="font-bold text-lg text-gray-900">BaiAI</span>
        </div>
        <nav className="flex flex-col gap-1 mt-4 px-2">
          {navItems.map((item, i) => (
            <Link to={item.path} key={item.label}>
              <Button
                variant={active === i ? "default" : "ghost"}
                className={`w-full justify-start gap-3 rounded-xl px-4 py-3 text-base font-medium ${active === i ? "bg-emerald-100 text-emerald-600" : "text-gray-700 hover:bg-gray-50"}`}
                onClick={() => setActive(i)}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3 px-6 py-6 border-t border-gray-100">
        <span className="bg-gray-100 rounded-full p-2"><UserIcon className="w-5 h-5 text-emerald-500" /></span>
        <div>
          <div className="font-semibold text-gray-900">{user.name}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
      </div>
    </aside>
  );
} 