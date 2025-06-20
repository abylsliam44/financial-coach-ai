import React, { useState, useEffect } from 'react';
import { useOnboarding } from '../../context/OnboardingContext';

export const Step4Goals: React.FC = () => {
  const { state, dispatch } = useOnboarding();
  const [goals, setGoals] = useState<string[]>(state.goals);
  const [customGoal, setCustomGoal] = useState('');

  // Обновляем состояние при изменении данных
  useEffect(() => {
    dispatch({
      type: 'UPDATE_STEP_4',
      payload: { goals },
    });
  }, [goals, dispatch]);

  const goalOptions = [
    { id: 'vacation', label: 'Отпуск', icon: '🏖️', description: 'Накопить на путешествие' },
    { id: 'emergency', label: 'Подушка безопасности', icon: '🛡️', description: 'Резервный фонд' },
    { id: 'debt', label: 'Погашение долгов', icon: '💳', description: 'Закрыть кредиты' },
    { id: 'car', label: 'Машина', icon: '🚙', description: 'Покупка автомобиля' },
    { id: 'habits', label: 'Улучшить привычки', icon: '📈', description: 'Контроль трат' },
    { id: 'investment', label: 'Инвестиции', icon: '📊', description: 'Вложить деньги' },
    { id: 'education', label: 'Образование', icon: '🎓', description: 'Курсы и обучение' },
    { id: 'home', label: 'Покупка жилья', icon: '🏡', description: 'Квартира или дом' },
  ];

  const toggleGoal = (goalId: string) => {
    setGoals(prev => 
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const addCustomGoal = () => {
    if (customGoal.trim() && !goals.includes(customGoal.trim())) {
      setGoals(prev => [...prev, customGoal.trim()]);
      setCustomGoal('');
    }
  };

  const removeGoal = (goalId: string) => {
    setGoals(prev => prev.filter(id => id !== goalId));
  };

  return (
    <div className="space-y-6">
      {/* Финансовые цели */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Финансовые цели (выберите несколько)
        </label>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {goalOptions.map((goal) => (
            <button
              key={goal.id}
              type="button"
              onClick={() => toggleGoal(goal.id)}
              className={`p-4 border rounded-xl text-left transition-all ${
                goals.includes(goal.id)
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-xl">{goal.icon}</span>
                <span className="font-medium">{goal.label}</span>
              </div>
              <div className="text-sm text-gray-600">{goal.description}</div>
            </button>
          ))}
        </div>

        {/* Своя цель */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Добавить свою цель
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="Введите вашу цель"
              onKeyPress={(e) => e.key === 'Enter' && addCustomGoal()}
            />
            <button
              onClick={addCustomGoal}
              disabled={!customGoal.trim()}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Добавить
            </button>
          </div>
        </div>

        {/* Выбранные цели */}
        {goals.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Выбранные цели:</h4>
            <div className="flex flex-wrap gap-2">
              {goals.map((goalId) => {
                const goal = goalOptions.find(g => g.id === goalId);
                return (
                  <div
                    key={goalId}
                    className="flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{goal?.icon || '🎯'}</span>
                    <span>{goal?.label || goalId}</span>
                    <button
                      onClick={() => removeGoal(goalId)}
                      className="text-emerald-600 hover:text-emerald-800"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 