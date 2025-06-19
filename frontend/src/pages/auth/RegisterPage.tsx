import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthFormInput } from "../../components/auth/AuthFormInput";
import { useNavigate, Link } from "react-router-dom";

interface RegisterForm {
  email: string;
  username: string;
  password: string;
}

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Ошибка регистрации");
      const result = await res.json();
      localStorage.setItem("token", result.access_token);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <img src="/vite.svg" alt="BaiAI Logo" className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Регистрация в BaiAI</h2>
        <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
          <AuthFormInput
            label="Email"
            type="email"
            autoComplete="email"
            {...register("email", { required: "Введите email" })}
            error={errors.email?.message}
          />
          <AuthFormInput
            label="Имя пользователя"
            type="text"
            autoComplete="username"
            {...register("username", { required: "Введите имя пользователя" })}
            error={errors.username?.message}
          />
          <AuthFormInput
            label="Пароль"
            type="password"
            autoComplete="new-password"
            {...register("password", { required: "Введите пароль", minLength: { value: 8, message: "Минимум 8 символов" } })}
            error={errors.password?.message}
          />
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
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