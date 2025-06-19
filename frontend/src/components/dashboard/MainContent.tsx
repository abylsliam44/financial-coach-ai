import { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { CardHeader, CardTitle } from "../ui/card-header";
import { TrendingUp, ArrowDown, ArrowUp, CreditCard } from "lucide-react";

interface Balance {
  total_balance: number;
  total_income: number;
  total_expense: number;
}

interface Goal {
  id: string;
  title: string;
  progress: number;
  target: number;
}

interface Transaction {
  id: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  description: string;
}

export default function MainContent() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((user) => {
        const uid = user.id || user.user_id;
        if (!uid) throw new Error("User ID not found");
        Promise.all([
          fetch(`/users/${uid}/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
          fetch(`/goals/user/${uid}/overview`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
          fetch(`/transactions/`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
        ]).then(([stats, goals, txs]) => {
          setBalance({
            total_balance: stats.balance ?? 0,
            total_income: stats.income ?? 0,
            total_expense: stats.expense ?? 0,
          });
          setGoals(Array.isArray(goals) ? goals : []);
          setTransactions(Array.isArray(txs) ? txs.slice(0, 5) : []);
        });
      });
  }, []);

  return (
    <div className="p-8 flex flex-col gap-8">
      {/* Баланс и цели */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle>Общий баланс</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-2">₸{balance?.total_balance?.toLocaleString() ?? "-"}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> +12% с прошлого месяца
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle>Доходы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500 mb-2">₸{balance?.total_income?.toLocaleString() ?? "-"}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <ArrowUp className="w-4 h-4 text-emerald-500" /> +5% с прошлого месяца
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle>Расходы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500 mb-2">₸{balance?.total_expense?.toLocaleString() ?? "-"}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <ArrowDown className="w-4 h-4 text-red-500" /> +8% с прошлого месяца
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Прогресс по целям */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-50 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle>Прогресс по целям</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {goals.length === 0 && <li className="text-gray-400">Нет активных целей</li>}
              {goals.map(goal => (
                <li key={goal.id} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{goal.title}</span>
                    <span className="text-sm text-gray-500">{goal.progress} / {goal.target} ₸</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-2 bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((goal.progress / goal.target) * 100))}%` }} />
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
              {transactions.map(tx => (
                <li key={tx.id} className="flex items-center gap-3 py-2">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{tx.description}</div>
                    <div className="text-xs text-gray-500">{tx.category}</div>
                  </div>
                  <div className={`font-bold ${tx.type === "income" ? "text-emerald-500" : "text-red-500"}`}>{tx.type === "income" ? "+" : "-"}₸{tx.amount.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 ml-2">{tx.date}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 