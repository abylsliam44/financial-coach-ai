import React, { useState, useEffect } from 'react';
import { useOnboarding } from '../../context/OnboardingContext';

export const Step2Income: React.FC = () => {
  const { state, dispatch } = useOnboarding();
  const [monthly_income, setMonthlyIncome] = useState(state.monthly_income?.toString() || '');
  const [income_source, setIncomeSource] = useState(state.income_source);
  const [income_stability, setIncomeStability] = useState(state.income_stability);

  // Обновляем состояние при изменении данных
  useEffect(() => {
    dispatch({
      type: 'UPDATE_STEP_2',
      payload: {
        monthly_income: monthly_income ? parseInt(monthly_income) : null,
        income_source,
        income_stability,
      },
    });
  }, [monthly_income, income_source, income_stability, dispatch]);

  const stabilityOptions = [
    { value: 1, label: '1 - Очень нестабильный', description: 'Доход сильно колеблется' },
    { value: 2, label: '2 - Нестабильный', description: 'Частые изменения' },
    { value: 3, label: '3 - Средний', description: 'Умеренная стабильность' },
    { value: 4, label: '4 - Стабильный', description: 'Редкие изменения' },
    { value: 5, label: '5 - Очень стабильный', description: 'Постоянный доход' },
  ];

  return (
    <div className="space-y-6">
      {/* Ежемесячный доход */}
      <div>
        <label htmlFor="income" className="block text-sm font-medium text-gray-700 mb-2">
          Ежемесячный доход (в тенге)
        </label>
        <input
          type="number"
          id="income"
          value={monthly_income}
          onChange={(e) => setMonthlyIncome(e.target.value)}
          min="0"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          placeholder="Введите сумму"
        />
      </div>

      {/* Источник дохода */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Источник дохода
        </label>
        <select
          value={income_source}
          onChange={(e) => setIncomeSource(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
        >
          <option value="">Выберите источник дохода</option>
          <option value="work">Работа</option>
          <option value="freelance">Фриланс</option>
          <option value="business">Бизнес</option>
          <option value="parents">Родители</option>
          <option value="government">Гос. помощь</option>
        </select>
      </div>

      {/* Стабильность дохода */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Стабильность дохода
        </label>
        <div className="space-y-2">
          {stabilityOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start p-3 border rounded-xl cursor-pointer transition-all ${
                income_stability === option.value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="stability"
                value={option.value}
                checked={income_stability === option.value}
                onChange={(e) => setIncomeStability(parseInt(e.target.value))}
                className="mt-1 mr-3 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}; 