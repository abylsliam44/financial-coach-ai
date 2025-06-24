import { useEffect, useState } from "react";
import { Loader2, Edit, Trash2, X } from "lucide-react";
import api from "../../api";

interface Transaction {
  id?: string;
  type: 'income' | 'expense';
  amount: string;
  category: string;
  description: string;
  date: string;
  account_id?: string;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  icon: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  transaction: Transaction | null;
}

const CATEGORIES_ICONS: { [key: string]: string } = {
  "Продукты": "🛒", "Транспорт": "🚗", "Развлечения": "🎬", "Кафе": "☕", "Одежда": "👕", "Здоровье": "💊", "Образование": "📚", "Другое": "📦",
  "Зарплата": "💰", "Фриланс": "💻", "Инвестиции": "📈", "Подарки": "🎁"
};

const EXPENSE_CATEGORIES = Object.keys(CATEGORIES_ICONS).filter(k => !["Зарплата", "Фриланс", "Инвестиции", "Подарки"].includes(k)).map(name => ({ name, icon: CATEGORIES_ICONS[name] }));
const INCOME_CATEGORIES = ["Зарплата", "Фриланс", "Инвестиции", "Подарки", "Другое"].map(name => ({ name, icon: CATEGORIES_ICONS[name] || "💵" }));

const LOCAL_STORAGE_CATEGORIES_KEY = "bai-user-categories";

function getUserCategories(type: 'income' | 'expense'): Array<{ name: string; icon: string }> {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return (parsed[type] as Array<{ name: string; icon: string }>) || [];
  } catch {
    return [];
  }
}

function saveUserCategory(type: 'income' | 'expense', name: string, icon: string) {
  const data = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
  let parsed: { income: Array<{ name: string; icon: string }>; expense: Array<{ name: string; icon: string }> } = { income: [], expense: [] };
  if (data) {
    try { parsed = JSON.parse(data); } catch {}
  }
  if (!parsed[type].some((c: { name: string; icon: string }) => c.name === name)) {
    parsed[type].push({ name, icon });
    localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(parsed));
  }
}

export default function TransactionModal({ isOpen, onClose, onSave, transaction }: TransactionModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [form, setForm] = useState<Transaction>({
    type: "expense",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    account_id: "",
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [userCategories, setUserCategories] = useState<Array<{ name: string; icon: string }>>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("💡");

  useEffect(() => {
    if (isOpen) {
      api.get("/accounts").then(res => setAccounts(res.data));
      if (transaction) {
        setForm({
          ...transaction,
          amount: String(transaction.amount),
          date: new Date(transaction.date).toISOString().slice(0, 10),
          account_id: transaction.account_id || "",
        });
        setMode('view');
      } else {
        setForm({
          type: "expense",
          amount: "",
          category: "",
          description: "",
          date: new Date().toISOString().slice(0, 10),
          account_id: accounts[0]?.id || "",
        });
        setMode('edit');
      }
      setFormError("");
    }
    // eslint-disable-next-line
  }, [transaction, isOpen]);

  useEffect(() => {
    setUserCategories(getUserCategories(form.type));
  }, [form.type]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCategorySelect = (category: string) => {
    setForm({ ...form, category });
  };
  
  const handleDelete = async () => {
    if (!transaction?.id) return;
    if (!window.confirm("Вы уверены, что хотите удалить эту транзакцию?")) return;
    setFormLoading(true);
    setFormError("");
    try {
      await api.delete(`/transactions/${transaction.id}`);
      onSave();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Не удалось удалить транзакцию");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const dataToSend = {
      ...form,
      amount: parseFloat(form.amount),
      date: new Date(form.date).toISOString(),
    };

    try {
      if (transaction?.id) {
        await api.patch(`/transactions/${transaction.id}`, dataToSend);
      } else {
        await api.post("/transactions/", dataToSend);
      }
      onSave();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Произошла ошибка");
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    saveUserCategory(form.type, newCategoryName, newCategoryIcon);
    setUserCategories((prev: Array<{ name: string; icon: string }>) => [...prev, { name: newCategoryName, icon: newCategoryIcon }]);
    setShowAddCategory(false);
    setNewCategoryName("");
    setNewCategoryIcon("💡");
  };

  if (!isOpen) return null;

  const renderViewMode = () => (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-bold text-gray-900">Детали транзакции</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>
        <div className="flex justify-between items-center mb-2">
          <div>
            <p className="text-sm text-gray-500 mb-1">Сумма</p>
            <p className={`text-3xl font-bold ${form.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>{form.type === 'income' ? '+' : '-'}₸{Number(form.amount).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Категория</p>
            <div className="flex items-center gap-2 font-semibold text-gray-800 text-lg">
              <span className="text-xl">{CATEGORIES_ICONS[form.category] || ''}</span>
              <span>{form.category}</span>
            </div>
          </div>
        </div>
        <div className="mb-2">
          <p className="text-sm text-gray-500 mb-1">Описание</p>
          <p className="font-medium text-gray-900 text-base">{form.description}</p>
        </div>
        <div className="mb-2">
          <p className="text-sm text-gray-500 mb-1">Дата</p>
          <p className="font-medium text-gray-900 text-base">{new Date(form.date).toLocaleDateString('ru-RU')}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-6">
        <button onClick={onClose} className="w-full py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition">Закрыть</button>
        <button onClick={() => setMode('edit')} className="w-full py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition flex items-center justify-center gap-2">
          <Edit size={16} /> Редактировать
        </button>
      </div>
      <button onClick={handleDelete} disabled={formLoading} className="w-full mt-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 font-semibold flex items-center justify-center gap-2 transition">
        {formLoading ? <Loader2 className="animate-spin"/> : <><Trash2 size={16}/> Удалить</>}
      </button>
    </>
  );

  const renderEditMode = () => {
      const baseCategories = form.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
      const categoriesByType = [...baseCategories, ...userCategories];
      const isFormValid = form.amount && form.category && form.description && form.account_id;
      const isEditMode = !!transaction?.id;

      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
            <button type="button" onClick={() => setForm(f => ({
              ...f,
              type: 'expense',
              category: '',
              account_id: accounts[0]?.id || ''
            }))} className={`px-4 py-2 rounded-md font-semibold transition-colors ${form.type === 'expense' ? 'bg-white text-red-500 shadow' : 'text-gray-600'}`}>Расход</button>
            <button type="button" onClick={() => setForm(f => ({
              ...f,
              type: 'income',
              category: '',
              account_id: accounts[0]?.id || ''
            }))} className={`px-4 py-2 rounded-md font-semibold transition-colors ${form.type === 'income' ? 'bg-white text-emerald-500 shadow' : 'text-gray-600'}`}>Доход</button>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Сумма</label>
            <input type="number" name="amount" value={form.amount} onChange={handleFormChange} className="w-full mt-1 p-2 border rounded-lg" placeholder="0" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Название</label>
            <input type="text" name="description" value={form.description} onChange={handleFormChange} className="w-full mt-1 p-2 border rounded-lg" placeholder="Например: Обед в кафе" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Категория</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
              {categoriesByType.map(({ name, icon }) => (
                <button key={name} type="button" onClick={() => handleCategorySelect(name)} className={`p-2 border rounded-lg flex flex-col items-center justify-center transition-colors ${form.category === name ? 'bg-emerald-100 text-emerald-600 border-emerald-300' : 'bg-gray-50'}`}>
                  <span>{icon}</span>
                  <span className="text-xs mt-1 text-center">{name}</span>
                </button>
              ))}
            </div>
            <button type="button" className="mt-2 text-emerald-600 hover:underline text-xs" onClick={() => setShowAddCategory(v => !v)}>+ Создать категорию</button>
            {showAddCategory && (
              <div className="flex items-center gap-2 mt-2">
                <input type="text" className="border rounded px-2 py-1 text-sm" placeholder="Название" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                <input type="text" className="border rounded px-2 py-1 text-sm w-12 text-center" maxLength={2} value={newCategoryIcon} onChange={e => setNewCategoryIcon(e.target.value)} />
                <button type="button" className="bg-emerald-500 text-white rounded px-3 py-1 text-sm" onClick={handleAddCategory}>Добавить</button>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Счет</label>
            <select name="account_id" value={form.account_id} onChange={handleFormChange} className="w-full mt-1 p-2 border rounded-lg">
              <option value="">Выберите счет</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.icon} {acc.name} ({acc.balance.toLocaleString()} ₸)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Дата</label>
            <input type="date" name="date" value={form.date} onChange={handleFormChange} className="w-full mt-1 p-2 border rounded-lg" />
          </div>
          {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}
          <div className="flex items-center gap-4 pt-4">
            <button type="button" onClick={mode === 'edit' && isEditMode ? () => setMode('view') : onClose} className="w-full py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold">Отмена</button>
            <button type="submit" disabled={!isFormValid || formLoading} className="w-full py-3 rounded-lg bg-emerald-500 text-white font-semibold disabled:bg-emerald-300 flex justify-center items-center">
              {formLoading ? <Loader2 className="animate-spin" /> : 'Сохранить'}
            </button>
          </div>
        </form>
      );
  };

  const title = mode === 'view' ? 'Детали транзакции' : (transaction ? 'Редактировать транзакцию' : 'Добавить транзакцию');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><X size={20}/></button>
        </div>
        {mode === 'view' ? renderViewMode() : renderEditMode()}
      </div>
    </div>
  );
} 