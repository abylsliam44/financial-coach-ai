# Онбординг для Financial Coach AI

## 🎯 Описание

Полноценная система онбординга для сбора ключевой информации о пользователе после регистрации/логина. Онбординг состоит из 6 шагов и запускается автоматически для новых пользователей.

## 🚀 Запуск

### Backend

1. **Установка зависимостей:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. **Настройка базы данных:**
```bash
# Создание миграции (если нужно)
alembic revision --autogenerate -m "add_onboarding_fields_to_user_profile"

# Применение миграций
alembic upgrade head
```

3. **Запуск сервера:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

1. **Установка зависимостей:**
```bash
cd frontend
npm install
```

2. **Запуск в режиме разработки:**
```bash
npm run dev
```

## 📋 Структура онбординга

### Шаг 1: Персональные данные
- Имя (обязательно)
- Возраст (обязательно)
- Пол (обязательно)

### Шаг 2: Доход
- Ежемесячный доход (обязательно)
- Источник дохода (обязательно)
- Стабильность дохода 1-5 (обязательно)

### Шаг 3: Расходы
- Ежемесячные расходы (обязательно)
- Категории трат (мультивыбор, обязательно)

### Шаг 4: Финансовые цели
- Выбор целей из списка (мультивыбор, обязательно)
- Возможность добавить свою цель

### Шаг 5: Финансовая психология
- Финансовая уверенность 1-5 (обязательно)
- Импульсивность трат 1-5 (обязательно)
- Уровень стресса 1-5 (обязательно)
- Частота сбережений (обязательно)

### Шаг 6: Привычки
- Ведение учета трат (Да/Нет)
- Опыт с финансовыми приложениями (обязательно)
- Желание получать мотивацию (checkbox)

## 🔧 API Endpoints

### GET /api/onboarding/status
Проверяет наличие профиля у пользователя
```json
{
  "has_profile": true|false
}
```

### POST /api/onboarding/
Создает профиль пользователя
```json
{
  "name": "string",
  "age": 25,
  "gender": "male|female|other",
  "monthly_income": 50000,
  "income_source": "work|freelance|business|parents|government",
  "income_stability": 1-5,
  "monthly_expenses": 30000,
  "spending_categories": ["cafe", "transport"],
  "goals": ["vacation", "emergency"],
  "financial_confidence": 1-5,
  "spending_impulsiveness": 1-5,
  "financial_stress": 1-5,
  "saving_frequency": "never|rarely|sometimes|monthly|weekly",
  "tracks_expenses": true|false,
  "used_financial_apps": "yes|sometimes|no",
  "wants_motivation": true|false
}
```

## 🎨 UI/UX Особенности

- **Прогресс-бар** с процентами выполнения
- **Адаптивный дизайн** для мобильных устройств
- **Плавные переходы** между шагами
- **Валидация** на каждом шаге
- **Мотивационные подписи** к каждому вопросу
- **Иконки и эмодзи** для лучшего восприятия

## 🔄 Логика перенаправления

1. **После логина/регистрации:**
   - Проверяется наличие профиля через `/api/onboarding/status`
   - Если `has_profile = false` → редирект на `/onboarding`
   - Если `has_profile = true` → редирект на `/dashboard`

2. **После завершения онбординга:**
   - Данные отправляются на `/api/onboarding/`
   - При успехе → редирект на `/dashboard`

3. **Защита роутов:**
   - `/onboarding` недоступен для пользователей с профилем
   - `/dashboard` недоступен для пользователей без профиля

## 📁 Структура файлов

```
frontend/src/
├── context/
│   └── OnboardingContext.tsx          # Контекст для управления состоянием
├── components/onboarding/
│   ├── StepCardWrapper.tsx            # Обертка для всех шагов
│   ├── Step1Personal.tsx              # Шаг 1: Персональные данные
│   ├── Step2Income.tsx                # Шаг 2: Доход
│   ├── Step3Expenses.tsx              # Шаг 3: Расходы
│   ├── Step4Goals.tsx                 # Шаг 4: Цели
│   ├── Step5Psychology.tsx            # Шаг 5: Психология
│   └── Step6Habits.tsx                # Шаг 6: Привычки
└── pages/onboarding/
    └── OnboardingPage.tsx             # Главная страница онбординга

backend/
├── routes/
│   └── onboarding.py                  # API роуты онбординга
├── models.py                          # Обновленная модель UserProfile
└── alembic/versions/
    └── add_onboarding_fields_to_user_profile.py  # Миграция
```

## 🎯 Особенности реализации

- **useReducer** для управления сложным состоянием
- **useEffect** для автоматического обновления данных
- **Валидация** на уровне компонентов и API
- **Обработка ошибок** с fallback значениями
- **Типизация** TypeScript для всех компонентов
- **Responsive дизайн** с Tailwind CSS

## 🚀 Готово к использованию!

Онбординг полностью интегрирован в приложение и готов к использованию. Все данные сохраняются в базе данных и используются для персонализации AI-ассистента. 