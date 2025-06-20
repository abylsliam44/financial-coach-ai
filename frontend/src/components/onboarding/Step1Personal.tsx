import React, { useState, useEffect } from 'react';
import { useOnboarding } from '../../context/OnboardingContext';

export const Step1Personal: React.FC = () => {
  const { state, dispatch } = useOnboarding();
  const [name, setName] = useState(state.name);
  const [age, setAge] = useState(state.age?.toString() || '');
  const [gender, setGender] = useState(state.gender);

  // Обновляем состояние при изменении данных
  useEffect(() => {
    dispatch({
      type: 'UPDATE_STEP_1',
      payload: {
        name: name.trim(),
        age: age ? parseInt(age) : null,
        gender,
      },
    });
  }, [name, age, gender, dispatch]);

  return (
    <div className="space-y-6">
      {/* Имя */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Ваше имя
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          placeholder="Введите ваше имя"
        />
      </div>

      {/* Возраст */}
      <div>
        <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
          Возраст
        </label>
        <input
          type="number"
          id="age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          min="1"
          max="120"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          placeholder="Введите ваш возраст"
        />
      </div>

      {/* Пол */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Пол
        </label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
        >
          <option value="">Выберите пол</option>
          <option value="male">Мужской</option>
          <option value="female">Женский</option>
          <option value="other">Предпочитаю не указывать</option>
        </select>
      </div>
    </div>
  );
}; 