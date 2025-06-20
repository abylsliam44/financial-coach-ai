import React, { useState, useEffect } from 'react';
import { useOnboarding } from '../../context/OnboardingContext';

export const Step6Habits: React.FC = () => {
  const { state, dispatch } = useOnboarding();
  const [tracks_expenses, setTracksExpenses] = useState(state.tracks_expenses);
  const [used_financial_apps, setUsedFinancialApps] = useState(state.used_financial_apps);
  const [wants_motivation, setWantsMotivation] = useState(state.wants_motivation);

  // Обновляем состояние при изменении данных
  useEffect(() => {
    dispatch({
      type: 'UPDATE_STEP_6',
      payload: {
        tracks_expenses,
        used_financial_apps,
        wants_motivation,
      },
    });
  }, [tracks_expenses, used_financial_apps, wants_motivation, dispatch]);

  const appOptions = [
    { value: 'yes', label: 'Да, активно использовал' },
    { value: 'sometimes', label: 'Немного пользовался' },
    { value: 'no', label: 'Нет, не пользовался' },
  ];

  return (
    <div className="space-y-6">
      {/* Учет трат */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ведете ли вы учет трат?
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="tracks_expenses"
              value="true"
              checked={tracks_expenses === true}
              onChange={() => setTracksExpenses(true)}
              className="text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-gray-700">Да</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="tracks_expenses"
              value="false"
              checked={tracks_expenses === false}
              onChange={() => setTracksExpenses(false)}
              className="text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-gray-700">Нет</span>
          </label>
        </div>
      </div>

      {/* Использование финансовых приложений */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Пользовались ли вы финансовыми приложениями?
        </label>
        <div className="space-y-2">
          {appOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start p-3 border rounded-xl cursor-pointer transition-all ${
                used_financial_apps === option.value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="used_financial_apps"
                value={option.value}
                checked={used_financial_apps === option.value}
                onChange={(e) => setUsedFinancialApps(e.target.value)}
                className="mt-1 mr-3 text-emerald-500 focus:ring-emerald-500"
              />
              <div className="font-medium text-gray-900">{option.label}</div>
            </label>
          ))}
        </div>
      </div>

      {/* Мотивация */}
      <div>
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={wants_motivation}
            onChange={(e) => setWantsMotivation(e.target.checked)}
            className="mt-1 text-emerald-500 focus:ring-emerald-500 rounded"
          />
          <div>
            <div className="font-medium text-gray-900">
              Хочу получать мотивацию и советы
            </div>
            <div className="text-sm text-gray-600">
              Мы будем отправлять вам полезные советы по управлению финансами и мотивирующие сообщения
            </div>
          </div>
        </label>
      </div>

      {/* Краткое резюме */}
      <div className="bg-gray-50 rounded-xl p-4 mt-6">
        <h4 className="font-medium text-gray-900 mb-2">Краткое резюме:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Учет трат: {tracks_expenses ? 'Да' : 'Нет'}</p>
          <p>• Опыт с приложениями: {appOptions.find(o => o.value === used_financial_apps)?.label || 'Не выбрано'}</p>
          <p>• Мотивация: {wants_motivation ? 'Да' : 'Нет'}</p>
        </div>
      </div>
    </div>
  );
}; 