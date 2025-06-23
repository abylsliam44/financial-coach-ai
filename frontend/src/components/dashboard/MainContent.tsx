import { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { CardHeader, CardTitle } from "../ui/card-header";
import { TrendingUp, ArrowDown, ArrowUp, CreditCard, Plus, Loader2 } from "lucide-react";
import api from "../../api";
import TransactionModal from "./TransactionModal";
import { useAuth } from "../../AuthContext";

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
  const [balance, setBalance] = useState<any>(null);
  const [balancePrev, setBalancePrev] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const { user } = useAuth();
  
  // State for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const fetchData = () => {
    if (!user?.id) {
      setLoading(false); // No user yet, stop loading
      return;
    }

    setLoading(true);
    setError("");
    const uid = user.id;

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
  };

  useEffect(() => {
    fetchData();
  }, [user]); // Re-run when user object is available

  const handleOpenModal = (tx: any = null) => {
    setSelectedTx(tx);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTx(null);
  };

  const handleSave = () => {
    handleCloseModal();
    fetchData(); // Refresh data after saving
  };

  function getDelta(current: number, prev: number) {
    if (prev === 0) return 0;
    return ((current - prev) / prev) * 100;
  }

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
                <div className="text-3xl font-bold text-gray-900 mb-2">₸{balance?.net_balance?.toLocaleString() ?? "0"}</div>
                {balancePrev && balance?.net_balance != null && balancePrev?.net_balance != null && (
                  <div className="text-xs flex items-center gap-1 font-medium mt-1">
                    {getDelta(balance.net_balance, balancePrev.net_balance) > 0 ? (
                      <ArrowUp className="w-4 h-4 text-emerald-500" />
                    ) : getDelta(balance.net_balance, balancePrev.net_balance) < 0 ? (
                      <ArrowDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={
                      getDelta(balance.net_balance, balancePrev.net_balance) > 0
                        ? "text-emerald-500"
                        : getDelta(balance.net_balance, balancePrev.net_balance) < 0
                        ? "text-red-500"
                        : "text-gray-400"
                    }>
                      {getDelta(balance.net_balance, balancePrev.net_balance).toFixed(1)}%
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
                <div className="text-3xl font-bold text-emerald-500 mb-2">₸{balance?.total_income?.toLocaleString() ?? "0"}</div>
                {balancePrev && balance?.total_income != null && balancePrev?.total_income != null && (
                  <div className="text-xs flex items-center gap-1 font-medium mt-1">
                    {getDelta(balance.total_income, balancePrev.total_income) > 0 ? (
                      <ArrowUp className="w-4 h-4 text-emerald-500" />
                    ) : getDelta(balance.total_income, balancePrev.total_income) < 0 ? (
                      <ArrowDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={
                      getDelta(balance.total_income, balancePrev.total_income) > 0
                        ? "text-emerald-500"
                        : getDelta(balance.total_income, balancePrev.total_income) < 0
                        ? "text-red-500"
                        : "text-gray-400"
                    }>
                      {getDelta(balance.total_income, balancePrev.total_income).toFixed(1)}%
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
                <div className="text-3xl font-bold text-red-500 mb-2">₸{balance?.total_expenses?.toLocaleString() ?? "0"}</div>
                {balancePrev && balance?.total_expenses != null && balancePrev?.total_expenses != null && (
                  <div className="text-xs flex items-center gap-1 font-medium mt-1">
                    {getDelta(balance.total_expenses, balancePrev.total_expenses) > 0 ? (
                      <ArrowUp className="w-4 h-4 text-emerald-500" />
                    ) : getDelta(balance.total_expenses, balancePrev.total_expenses) < 0 ? (
                      <ArrowDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={
                      getDelta(balance.total_expenses, balancePrev.total_expenses) > 0
                        ? "text-emerald-500"
                        : getDelta(balance.total_expenses, balancePrev.total_expenses) < 0
                        ? "text-red-500"
                        : "text-gray-400"
                    }>
                      {getDelta(balance.total_expenses, balancePrev.total_expenses).toFixed(1)}%
                    </span>
                    <span className="text-gray-500">с прошлого месяца</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Прогресс по целям и Последние транзакции */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card className="bg-white shadow-sm rounded-xl">
                <CardHeader>
                  <CardTitle>Прогресс по целям</CardTitle>
                </CardHeader>
                <CardContent>
                  {goals && goals.length > 0 ? (
                    <ul className="space-y-4">
                      {goals.map((goal) => (
                        <li key={goal.id}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-gray-800">{goal.name}</span>
                            <span className="text-sm font-medium text-emerald-600">
                              {((goal.current_amount / goal.target_amount) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-emerald-500 h-2 rounded-full"
                              style={{ width: `${(goal.current_amount / goal.target_amount) * 100}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 text-right mt-1">
                            ₸{goal.current_amount.toLocaleString()} / ₸{goal.target_amount.toLocaleString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center text-gray-500 py-4">Нет активных целей</div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2">
              <Card className="bg-white shadow-sm rounded-xl">
                <CardHeader>
                  <CardTitle>Последние транзакции</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions && transactions.length > 0 ? (
                    <ul className="space-y-1">
                      {transactions.map((tx) => (
                        <li key={tx.id} onClick={() => handleOpenModal(tx)} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(tx.category)}
                            <div>
                              <p className="font-semibold text-gray-800">{tx.description}</p>
                              <p className="text-xs text-gray-500">{formatDate(tx.date)}</p>
                            </div>
                          </div>
                          <div className={`font-bold ${tx.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                            {tx.type === "income" ? "+" : "-"}₸{tx.amount.toLocaleString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center text-gray-500 py-4">Нет транзакций</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Кнопка добавить транзакцию слева снизу */}
      <button
        onClick={() => handleOpenModal()}
        className="fixed bottom-8 left-8 bg-emerald-500 text-white rounded-full p-4 shadow-lg hover:bg-emerald-600 transition-transform transform hover:scale-110 z-40"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Модальное окно */}
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        transaction={selectedTx}
      />
    </div>
  );
} 