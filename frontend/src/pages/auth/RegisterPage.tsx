import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { AuthFormInput } from "../../components/auth/AuthFormInput";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const auth = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password) {
      setError("Пожалуйста, заполните все поля.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await auth.register(email, username, password);
      // Навигация теперь будет обработана в App.tsx на основе isAuthenticated
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Произошла ошибка при регистрации.";
      if (errorMsg.includes("already exists")) {
        setError("Пользователь с таким email уже существует.");
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <img src="/vite.svg" alt="BaiAI Logo" className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Создать аккаунт</h2>
        <form className="w-full" onSubmit={handleSubmit}>
          <AuthFormInput
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AuthFormInput
            label="Имя пользователя"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <AuthFormInput
            label="Пароль"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="text-red-500 text-sm my-4 text-center">{error}</div>}
          <button
            type="submit"
            className="w-full py-3 mt-2 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Регистрируем..." : "Зарегистрироваться"}
          </button>
        </form>
        <div className="mt-4 text-sm text-gray-600">
          Уже есть аккаунт? <Link to="/auth/login" className="text-emerald-600 hover:underline">Войти</Link>
        </div>
      </div>
    </div>
  );
} 