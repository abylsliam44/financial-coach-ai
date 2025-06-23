import { useEffect, useState } from "react";
import { Plus, Trash2, CreditCard, Wallet, Banknote, Edit } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import api from "../../api";

const ICONS = [
  { value: "💳", label: "Карта", icon: <CreditCard className="inline w-5 h-5 mr-1" /> },
  { value: "👛", label: "Кошелек", icon: <Wallet className="inline w-5 h-5 mr-1" /> },
  { value: "🏦", label: "Депозит", icon: <Banknote className="inline w-5 h-5 mr-1" /> },
];

export interface Account {
  id: string;
  name: string;
  balance: number;
  icon: string;
}

function AccountsInner() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [icon, setIcon] = useState(ICONS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBalance, setEditBalance] = useState("");
  const [editIcon, setEditIcon] = useState(ICONS[0].value);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      const res = await api.get("/accounts");
      setAccounts(res.data);
    } catch (err: any) {
      setFatalError("Ошибка загрузки счетов: " + (err?.response?.data?.detail || err.message || "Unknown error"));
    }
  };

  useEffect(() => {
    try {
      fetchAccounts();
    } catch (err: any) {
      setFatalError("Ошибка инициализации: " + (err?.message || "Unknown error"));
    }
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/accounts", { name, balance: parseFloat(balance), icon });
      setShowModal(false);
      setName("");
      setBalance("");
      setIcon(ICONS[0].value);
      fetchAccounts();
    } catch (err: any) {
      setError("Ошибка при добавлении счета");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Удалить этот счет?")) return;
    await api.delete(`/accounts/${id}`);
    fetchAccounts();
  };

  const openEdit = (acc: Account) => {
    setEditId(acc.id);
    setEditName(acc.name);
    setEditBalance(acc.balance.toString());
    setEditIcon(acc.icon);
    setShowModal(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.patch(`/accounts/${editId}`, {
        name: editName,
        balance: parseFloat(editBalance),
        icon: editIcon,
      });
      setEditId(null);
      fetchAccounts();
    } catch {
      setError("Ошибка при обновлении счета");
    } finally {
      setLoading(false);
    }
  };

  // Аналитика
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const avgBalance = accounts.length > 0 ? totalBalance / accounts.length : 0;

  if (fatalError) {
    return <div className="text-red-500 p-8 text-center">{fatalError}</div>;
  }

  return (
    <div>
      {/* Аналитическая панель */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-4 flex flex-col items-start">
          <div className="text-xs text-gray-500 mb-1">Общий баланс</div>
          <div className="text-2xl font-bold text-gray-900">₸{totalBalance.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex flex-col items-start">
          <div className="text-xs text-gray-500 mb-1">Количество счетов</div>
          <div className="text-2xl font-bold text-gray-900">{accounts.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex flex-col items-start">
          <div className="text-xs text-gray-500 mb-1">Средний баланс</div>
          <div className="text-2xl font-bold text-gray-900">₸{avgBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Счета</h2>
        <Button onClick={() => setShowModal(true)} variant="outline">
          <Plus className="w-4 h-4 mr-1" /> Добавить
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const percent = totalBalance > 0 ? (acc.balance / totalBalance) * 100 : 0;
          return (
            <Card key={acc.id} className="p-5 flex flex-col gap-2 bg-white rounded-xl shadow group transition hover:shadow-md">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">{acc.icon}</span>
                <div>
                  <div className="font-semibold text-gray-900 text-lg">{acc.name}</div>
                  <div className="text-gray-500 text-sm">₸{acc.balance.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Доля:</span>
                <span className="font-semibold text-gray-700">{percent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${percent}%` }}></div>
              </div>
              <div className="flex gap-2 mt-2 self-end">
                <Button variant="ghost" onClick={() => openEdit(acc)} className="text-gray-400 hover:text-emerald-500"><Edit className="w-5 h-5" /></Button>
                <Button variant="ghost" onClick={() => handleDelete(acc.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></Button>
              </div>
            </Card>
          );
        })}
        {accounts.length === 0 && <div className="text-gray-500 col-span-full">Нет счетов</div>}
      </div>

      {/* Модальное окно добавления счета */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowModal(false)}>&times;</button>
            <h3 className="text-lg font-bold mb-4">Добавить счет</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Название</label>
                <input className="w-full border rounded px-3 py-2" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Начальный баланс</label>
                <input className="w-full border rounded px-3 py-2" type="number" min="0" value={balance} onChange={e => setBalance(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Тип/иконка</label>
                <select className="w-full border rounded px-3 py-2" value={icon} onChange={e => setIcon(e.target.value)}>
                  {ICONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.value} {opt.label}</option>
                  ))}
                </select>
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Добавление..." : "Добавить"}</Button>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования счета */}
      {editId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setEditId(null)}>&times;</button>
            <h3 className="text-lg font-bold mb-4">Редактировать счет</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Название</label>
                <input className="w-full border rounded px-3 py-2" value={editName} onChange={e => setEditName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Баланс</label>
                <input className="w-full border rounded px-3 py-2" type="number" min="0" value={editBalance} onChange={e => setEditBalance(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Тип/иконка</label>
                <select className="w-full border rounded px-3 py-2" value={editIcon} onChange={e => setEditIcon(e.target.value)}>
                  {ICONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.value} {opt.label}</option>
                  ))}
                </select>
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Сохраняем..." : "Сохранить"}</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Accounts() {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return <div className="text-red-500 p-8 text-center">Ошибка рендера: {error.message}</div>;
  }

  try {
    return <AccountsInner />;
  } catch (err: any) {
    setError(err);
    return <div className="text-red-500 p-8 text-center">Ошибка рендера: {err.message}</div>;
  }
} 