import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { AuthFormInput } from "../../components/auth/AuthFormInput";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const auth = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Пожалуйста, заполните все поля.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await auth.login(email, password);
      // Навигация теперь будет обработана в App.tsx на основе isAuthenticated
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Произошла ошибка при входе.";
       if (errorMsg.includes("User not found") || errorMsg.includes("Incorrect password")) {
          setError("Неверный email или пароль.");
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
         <h2 className="text-2xl font-bold mb-6 text-gray-900">Вход в BaiAI</h2>
         
         <form className="w-full" onSubmit={handleSubmit}>
           <AuthFormInput
             label="Email"
             type="email"
             autoComplete="email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
           />
           <AuthFormInput
             label="Пароль"
             type="password"
             autoComplete="current-password"
             value={password}
             onChange={(e) => setPassword(e.target.value)}
           />
           {error && <div className="text-red-500 text-sm my-4 text-center">{error}</div>}
           <button
             type="submit"
             className="w-full py-3 mt-2 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all disabled:opacity-60"
             disabled={loading}
           >
             {loading ? "Входим..." : "Войти"}
           </button>
         </form>
         <div className="mt-4 text-sm text-gray-600">
           Нет аккаунта? <Link to="/auth/register" className="text-emerald-600 hover:underline">Зарегистрироваться</Link>
         </div>
       </div>
     </div>
  );
} 