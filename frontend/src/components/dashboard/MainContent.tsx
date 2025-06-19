import { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { CardHeader, CardTitle } from "../ui/card-header";
import { TrendingUp, ArrowDown, ArrowUp, CreditCard, Plus, Loader2 } from "lucide-react";
import api from "../../api";

const CATEGORY_ICONS: Record<string, JSX.Element> = {
  "Зарплата": <TrendingUp className="w-5 h-5 text-emerald-500" />,
  "Фриланс": <TrendingUp className="w-5 h-5 text-emerald-500" />,
  "Инвестиции": <TrendingUp className="w-5 h-5 text-emerald-500" />,
  "Подарки": <Plus className="w-5 h-5 text-emerald-500" />,
  "Продукты": <CreditCard className="w-5 h-5 text-gray-400" />,
  "Транспорт": <CreditCard className="w-5 h-5 text-gray-400" />,
  "Развлечения": <CreditCard className="w-5 h-5 text-gray-400" />,
  "Кафе": <CreditCard className="w-5 h-5 text-gray-400" />,
  "Одежда": <CreditCard className="w-5 h-5 text-gray-400" />,
  "Здоровье": <CreditCard className="w-5 h-5 text-gray-400" />,
  "Образование": <CreditCard className="w-5 h-5 text-gray-400" />,
  "Другое": <CreditCard className="w-5 h-5 text-gray-400" />,
};

function getCategoryIcon(category: string) {
  return CATEGORY_ICONS[category] || <CreditCard className="w-5 h-5 text-gray-400" />;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

export default function MainContent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<any>(null);
  const [balancePrev, setBalancePrev] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "",
    description: "",
    comment: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api.get("/auth/me")
      .then((res) => {
        const user = res.data;
        const uid = user.id || user.user_id;
        setUserId(uid);
        if (!uid) throw new Error("User ID not found");
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfPrevMonth = new Date(startOfMonth.getTime() - 1);
        const startOfPrevMonth = new Date(endOfPrevMonth.getFullYear(), endOfPrevMonth.getMonth(), 1);
        Promise.all([
          api.get(`/users/${uid}/stats?start_date=${startOfMonth.toISOString().slice(0,10)}`),
          api.get(`/users/${uid}/stats?start_date=${startOfPrevMonth.toISOString().slice(0,10)}&end_date=${endOfPrevMonth.toISOString().slice(0,10)}`),
          api.get(`/goals/user/${uid}/overview`),
          api.get(`/transactions/?limit=5`),
        ])
          .then(([stats, statsPrev, goals, txs]) => {
            setBalance(stats.data);
            setBalancePrev(statsPrev.data);
            setGoals(Array.isArray(goals.data) ? goals.data : []);
            setTransactions(Array.isArray(txs.data) ? txs.data.slice(0, 5) : []);
          })
          .catch((e) => setError("Ошибка загрузки данных: " + (e.response?.data?.detail || e.message)))
          .finally(() => setLoading(false));
      })
      .catch(e => {
        setError("Ошибка авторизации: " + (e.response?.data?.detail || e.message));
        setLoading(false);
        setTimeout(() => {
          localStorage.removeItem("token");
          window.location.href = "/auth/login";
        }, 1500);
      });
  }, [showForm]);

  function getDelta(current: number, prev: number) {
    if (prev === 0) return 0;
    return ((current - prev) / prev) * 100;
  }

  function handleFormChange(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleCategorySelect(cat: string) {
    setForm((f) => ({ ...f, category: cat }));
  }

  async function handleFormSubmit(e: any) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    if (!userId) return;
    try {
      await api.post("/transactions/", {
        amount: parseFloat(form.amount),
        type: form.type,
        category: form.category,
        description: form.description,
        date: form.date,
      });
      setShowForm(false);
      setForm({ type: "expense", amount: "", category: "", description: "", comment: "", date: new Date().toISOString().slice(0, 10) });
    } catch (e: any) {
      setFormError(e.response?.data?.detail || e.message);
    } finally {
      setFormLoading(false);
    }
  }

  // --- ДОБАВЛЕНИЕ/РЕДАКТИРОВАНИЕ ФОРМЫ ---
  const EXPENSE_CATEGORIES = [
    { name: "Продукты", icon: "🛒" },
    { name: "Транспорт", icon: "🚗" },
    { name: "Развлечения", icon: "🎬" },
    { name: "Кафе", icon: "☕" },
    { name: "Одежда", icon: "👕" },
    { name: "Здоровье", icon: "��" },
    { name: "Образование", icon: "📚" },
    { name: "Другое", icon: "📦" },
  ];
  const INCOME_CATEGORIES = [
    { name: "Зарплата", icon: "💰" },
    { name: "Фриланс", icon: "💻" },
    { name: "Инвестиции", icon: "📈" },
    { name: "Подарки", icon: "🎁" },
    { name: "Другое", icon: "💵" },
  ];
  const categoriesByType = form.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const isFormValid = form.amount && form.category && form.description;

  // --- UI ---
  return (
    <div className="p-8 flex flex-col gap-8 max-w-screen-xl mx-auto w-full overflow-x-hidden">
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]"><Loader2 className="animate-spin w-8 h-8 text-emerald-500" /></div>
      ) : error ? (
        <div className="text-red-500 text-center font-medium">{error}</div>
      ) : (
        <>
          {/* Баланс */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Общий баланс */}
            <Card className="bg-white shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle>Общий баланс</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2">₸{balance?.net_balance?.toLocaleString() ?? "-"}</div>
                {balancePrev && (
                  <div className="text-xs flex items-center gap-1 font-medium mt-1">
                    {getDelta(balance?.net_balance, balancePrev?.net_balance) > 0 ? (
                      <ArrowUp className="w-4 h-4 text-emerald-500" />
                    ) : getDelta(balance?.net_balance, balancePrev?.net_balance) < 0 ? (
                      <ArrowDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={
                      getDelta(balance?.net_balance, balancePrev?.net_balance) > 0
                        ? "text-emerald-500"
                        : getDelta(balance?.net_balance, balancePrev?.net_balance) < 0
                        ? "text-red-500"
                        : "text-gray-400"
                    }>
                      {getDelta(balance?.net_balance, balancePrev?.net_balance).toFixed(1)}%
                    </span>
                    <span className="text-gray-500">с прошлого месяца</span>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Доходы */}
            <Card className="bg-white shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle>Доходы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-500 mb-2">₸{balance?.total_income?.toLocaleString() ?? "-"}</div>
                {balancePrev && (
                  <div className="text-xs flex items-center gap-1 font-medium mt-1">
                    {getDelta(balance?.total_income, balancePrev?.total_income) > 0 ? (
                      <ArrowUp className="w-4 h-4 text-emerald-500" />
                    ) : getDelta(balance?.total_income, balancePrev?.total_income) < 0 ? (
                      <ArrowDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={
                      getDelta(balance?.total_income, balancePrev?.total_income) > 0
                        ? "text-emerald-500"
                        : getDelta(balance?.total_income, balancePrev?.total_income) < 0
                        ? "text-red-500"
                        : "text-gray-400"
                    }>
                      {getDelta(balance?.total_income, balancePrev?.total_income).toFixed(1)}%
                    </span>
                    <span className="text-gray-500">с прошлого месяца</span>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Расходы */}
            <Card className="bg-white shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle>Расходы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500 mb-2">₸{balance?.total_expenses?.toLocaleString() ?? "-"}</div>
                {balancePrev && (
                  <div className="text-xs flex items-center gap-1 font-medium mt-1">
                    {getDelta(balance?.total_expenses, balancePrev?.total_expenses) > 0 ? (
                      <ArrowUp className="w-4 h-4 text-emerald-500" />
                    ) : getDelta(balance?.total_expenses, balancePrev?.total_expenses) < 0 ? (
                      <ArrowDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={
                      getDelta(balance?.total_expenses, balancePrev?.total_expenses) > 0
                        ? "text-emerald-500"
                        : getDelta(balance?.total_expenses, balancePrev?.total_expenses) < 0
                        ? "text-red-500"
                        : "text-gray-400"
                    }>
                      {getDelta(balance?.total_expenses, balancePrev?.total_expenses).toFixed(1)}%
                    </span>
                    <span className="text-gray-500">с прошлого месяца</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Кнопка добавить транзакцию слева снизу */}
          <button
            onClick={() => setShowForm(true)}
            className="fixed z-40 bottom-8 left-28 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-full shadow-2xl w-20 h-20 flex items-center justify-center text-5xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-300 animate-fadeIn"
            style={{ boxShadow: '0 8px 32px rgba(16,185,129,0.25)' }}
          >
            <span className="text-5xl font-bold">+</span>
          </button>

          {/* Форма добавления транзакции */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity animate-fadeIn">
              <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-8 relative animate-slideIn">
                <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">×</button>
                <div className="flex gap-2 mb-6">
                  <button
                    className={`flex-1 py-2 rounded-xl font-bold text-lg transition-all ${form.type === "expense" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}
                    onClick={() => setForm((f) => ({ ...f, type: "expense", category: "" }))}
                    type="button"
                  >
                    Расход
                  </button>
                  <button
                    className={`flex-1 py-2 rounded-xl font-bold text-lg transition-all ${form.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}
                    onClick={() => setForm((f) => ({ ...f, type: "income", category: "" }))}
                    type="button"
                  >
                    Доход
                  </button>
                </div>
                <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Сумма</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400">₸</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        name="amount"
                        value={form.amount}
                        onChange={handleFormChange}
                        className="pl-8 pr-3 py-2 w-full rounded-xl border border-gray-200 focus:border-emerald-400 outline-none text-lg bg-gray-50"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Название</label>
                    <input
                      type="text"
                      name="description"
                      placeholder="Например: Обед в кафе"
                      value={form.description}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-gray-200 focus:border-emerald-400 outline-none py-2 px-3 bg-gray-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Категория</label>
                    <div className="grid grid-cols-2 gap-2">
                      {categoriesByType.map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          className={`flex items-center gap-2 py-2 px-3 rounded-xl border transition-all font-medium text-base ${form.category === cat.name ? (form.type === "expense" ? "bg-red-100 border-red-400 text-red-700" : "bg-emerald-100 border-emerald-400 text-emerald-700") : "bg-gray-50 border-gray-200 text-gray-700"}`}
                          onClick={() => handleCategorySelect(cat.name)}
                        >
                          <span className="text-xl">{cat.icon}</span> {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Комментарий <span className="text-gray-400">(необязательно)</span></label>
                    <input
                      type="text"
                      name="comment"
                      placeholder="Дополнительная информация"
                      value={form.comment || ""}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-gray-200 focus:border-emerald-400 outline-none py-2 px-3 bg-gray-50"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold bg-white hover:bg-gray-50 transition-all"
                      onClick={() => setShowForm(false)}
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${form.type === "expense" ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"} ${!isFormValid || formLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                      disabled={!isFormValid || formLoading}
                    >
                      {formLoading ? "Добавляем..." : form.type === "expense" ? "Добавить расход" : "Добавить доход"}
                    </button>
                  </div>
                  {formError && <div className="text-red-500 text-center text-sm mt-2">{formError}</div>}
                </form>
              </div>
            </div>
          )}

          {/* Прогресс по целям */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-50 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle>Прогресс по целям</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {goals.length === 0 && <li className="text-gray-400">Нет активных целей</li>}
                  {goals.map((goal: any) => (
                    <li key={goal.goal.id} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">{goal.goal.name}</span>
                        <span className="text-sm text-gray-500">{goal.goal.current_amount} / {goal.goal.target_amount} ₸</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-2 bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((goal.goal.current_amount / goal.goal.target_amount) * 100))}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            {/* Последние транзакции */}
            <Card className="bg-gray-50 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle>Последние транзакции</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-gray-200">
                  {transactions.length === 0 && <li className="text-gray-400 py-2">Нет транзакций</li>}
                  {transactions.map((tx, idx) => (
                    <div key={tx.id || idx} className="flex flex-col gap-1 p-4 border-b last:border-b-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getCategoryIcon(tx.category)}</span>
                        <span className="font-medium text-gray-900">{tx.category}</span>
                        {tx.comment && <span className="ml-2 text-xs text-gray-500 italic">{tx.comment}</span>}
                        <span className={`ml-auto font-bold text-lg ${tx.type === "income" ? "text-emerald-600" : "text-red-500"}`}>₸{tx.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatDate(tx.date)}</span>
                        {idx === 0 && <span className="ml-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">Только что</span>}
                      </div>
                    </div>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
} 