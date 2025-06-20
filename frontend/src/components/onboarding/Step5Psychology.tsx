import React, { useState, useEffect } from 'react';
import { useOnboarding } from '../../context/OnboardingContext';

export const Step5Psychology: React.FC = () => {
  const { state, dispatch } = useOnboarding();
  const [financial_confidence, setFinancialConfidence] = useState(state.financial_confidence);
  const [spending_impulsiveness, setSpendingImpulsiveness] = useState(state.spending_impulsiveness);
  const [financial_stress, setFinancialStress] = useState(state.financial_stress);
  const [saving_frequency, setSavingFrequency] = useState(state.saving_frequency);

  // Обновляем состояние при изменении данных
  useEffect(() => {
    dispatch({
      type: 'UPDATE_STEP_5',
      payload: {
        financial_confidence,
        spending_impulsiveness,
        financial_stress,
        saving_frequency,
      },
    });
  }, [financial_confidence, spending_impulsiveness, financial_stress, saving_frequency, dispatch]);

  const confidenceOptions = [
    { value: 1, label: '1 - Очень низкая', description: 'Не уверен в финансовых решениях' },
    { value: 2, label: '2 - Низкая', description: 'Часто сомневаюсь' },
    { value: 3, label: '3 - Средняя', description: 'Иногда уверен' },
    { value: 4, label: '4 - Высокая', description: 'Часто уверен' },
    { value: 5, label: '5 - Очень высокая', description: 'Всегда уверен' },
  ];

  const impulsivenessOptions = [
    { value: 1, label: '1 - Очень сдержан', description: 'Всегда планирую покупки' },
    { value: 2, label: '2 - Сдержан', description: 'Редко покупаю импульсивно' },
    { value: 3, label: '3 - Средний', description: 'Иногда покупаю спонтанно' },
    { value: 4, label: '4 - Импульсивный', description: 'Часто покупаю без плана' },
    { value: 5, label: '5 - Очень импульсивный', description: 'Постоянно спонтанные покупки' },
  ];

  const stressOptions = [
    { value: 1, label: '1 - Без стресса', description: 'Деньги не беспокоят' },
    { value: 2, label: '2 - Минимальный', description: 'Редко переживаю' },
    { value: 3, label: '3 - Умеренный', description: 'Иногда беспокоюсь' },
    { value: 4, label: '4 - Высокий', description: 'Часто переживаю' },
    { value: 5, label: '5 - Очень высокий', description: 'Постоянно в стрессе' },
  ];

  const frequencyOptions = [
    { value: 'never', label: 'Никогда' },
    { value: 'rarely', label: 'Редко' },
    { value: 'sometimes', label: 'Иногда' },
    { value: 'monthly', label: 'Каждый месяц' },
    { value: 'weekly', label: 'Каждую неделю' },
  ];

  return (
    <div className="space-y-6">
      {/* Финансовая уверенность */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Финансовая уверенность
        </label>
        <div className="space-y-2">
          {confidenceOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start p-3 border rounded-xl cursor-pointer transition-all ${
                financial_confidence === option.value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="confidence"
                value={option.value}
                checked={financial_confidence === option.value}
                onChange={(e) => setFinancialConfidence(parseInt(e.target.value))}
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

      {/* Импульсивность трат */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Импульсивность трат
        </label>
        <div className="space-y-2">
          {impulsivenessOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start p-3 border rounded-xl cursor-pointer transition-all ${
                spending_impulsiveness === option.value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="impulsiveness"
                value={option.value}
                checked={spending_impulsiveness === option.value}
                onChange={(e) => setSpendingImpulsiveness(parseInt(e.target.value))}
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

      {/* Уровень стресса */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Уровень стресса из-за денег
        </label>
        <div className="space-y-2">
          {stressOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start p-3 border rounded-xl cursor-pointer transition-all ${
                financial_stress === option.value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="stress"
                value={option.value}
                checked={financial_stress === option.value}
                onChange={(e) => setFinancialStress(parseInt(e.target.value))}
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

      {/* Частота сбережений */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Как часто откладываете деньги?
        </label>
        <select
          value={saving_frequency}
          onChange={(e) => setSavingFrequency(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
        >
          <option value="">Выберите частоту</option>
          {frequencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}; 