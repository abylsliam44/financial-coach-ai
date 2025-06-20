import React, { useState, useEffect } from 'react';
import { useOnboarding } from '../../context/OnboardingContext';

export const Step3Expenses: React.FC = () => {
  const { state, dispatch } = useOnboarding();
  const [monthly_expenses, setMonthlyExpenses] = useState(state.monthly_expenses?.toString() || '');
  const [spending_categories, setSpendingCategories] = useState<string[]>(state.spending_categories);

  // Обновляем состояние при изменении данных
  useEffect(() => {
    dispatch({
      type: 'UPDATE_STEP_3',
      payload: {
        monthly_expenses: monthly_expenses ? parseInt(monthly_expenses) : null,
        spending_categories,
      },
    });
  }, [monthly_expenses, spending_categories, dispatch]);

  const categoryOptions = [
    { id: 'cafe', label: 'Кафе/еда вне дома', icon: '🍕' },
    { id: 'subscriptions', label: 'Подписки', icon: '📱' },
    { id: 'transport', label: 'Транспорт', icon: '🚗' },
    { id: 'clothing', label: 'Одежда', icon: '👕' },
    { id: 'rent', label: 'Аренда', icon: '🏠' },
    { id: 'travel', label: 'Путешествия', icon: '✈️' },
    { id: 'entertainment', label: 'Развлечения', icon: '🎬' },
    { id: 'health', label: 'Здоровье', icon: '💊' },
    { id: 'education', label: 'Образование', icon: '📚' },
    { id: 'other', label: 'Другое', icon: '📦' },
  ];

  const toggleCategory = (categoryId: string) => {
    setSpendingCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Ежемесячные расходы */}
      <div>
        <label htmlFor="expenses" className="block text-sm font-medium text-gray-700 mb-2">
          Ежемесячные расходы (в тенге)
        </label>
        <input
          type="number"
          id="expenses"
          value={monthly_expenses}
          onChange={(e) => setMonthlyExpenses(e.target.value)}
          min="0"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          placeholder="Введите сумму"
        />
      </div>

      {/* Категории трат */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Категории частых трат (выберите несколько)
        </label>
        <div className="grid grid-cols-2 gap-3">
          {categoryOptions.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleCategory(category.id)}
              className={`p-4 border rounded-xl text-left transition-all ${
                spending_categories.includes(category.id)
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{category.icon}</span>
                <span className="font-medium">{category.label}</span>
              </div>
            </button>
          ))}
        </div>
        {spending_categories.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            Выбрано: {spending_categories.length} категорий
          </p>
        )}
      </div>
    </div>
  );
}; 