import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

import Sidebar from '../../components/dashboard/Sidebar';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { CardHeader, CardTitle } from '../../components/ui/card-header';
import { User, Mail, Calendar, Edit, Award, TrendingUp, DollarSign, Activity, Zap, Shield } from 'lucide-react';

// Тип для данных профиля
interface ProfileData {
  name: string;
  age: number;
  gender: string;
  monthly_income: number;
  income_source: string;
  income_stability: number;
  monthly_expenses: number;
  spending_categories: string[];
  goals: string[];
  financial_confidence: number;
  spending_impulsiveness: number;
  financial_stress: number;
  saving_frequency: string;
  profile_photo_url: string | null;
  user: {
    email: string;
    username: string;
    created_at: string;
  }
}

const StatCard = ({ icon, title, value, colorClass }: { icon: React.ReactNode, title: string, value: string | number, colorClass: string }) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="flex items-center gap-4 p-4">
      <div className={`p-3 rounded-lg ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const ProfilePage = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const translateAndCapitalize = (word: string, type: 'gender' | 'income' | 'saving_frequency' | 'category') => {
    if (!word) return '';
    const lowerWord = word.toLowerCase();

    if (type === 'gender') {
      if (lowerWord === 'female') return 'Женский';
      if (lowerWord === 'male') return 'Мужской';
    }

    if (type === 'income') {
      const translations: { [key: string]: string } = {
        'work': 'Работа',
        'freelance': 'Фриланс',
        'business': 'Бизнес',
        'parents': 'Помощь от семьи',
        'government': 'Гос. поддержка'
      };
      if (translations[lowerWord]) {
        return translations[lowerWord];
      }
    }

    if (type === 'saving_frequency') {
      const translations: { [key: string]: string } = {
        'never': 'Никогда',
        'rarely': 'Редко',
        'sometimes': 'Иногда',
        'monthly': 'Каждый месяц',
        'weekly': 'Каждую неделю'
      };
      if (translations[lowerWord]) {
        return translations[lowerWord];
      }
    }

    if (type === 'category') {
      const translations: { [key: string]: string } = {
        'cafe': 'Кафе/еда вне дома',
        'subscriptions': 'Подписки',
        'transport': 'Транспорт',
        'clothing': 'Одежда',
        'rent': 'Аренда',
        'travel': 'Путешествия',
        'entertainment': 'Развлечения',
        'health': 'Здоровье',
        'education': 'Образование',
        'other': 'Другое'
      };
      if (translations[lowerWord]) {
        return translations[lowerWord];
      }
    }

    return word.charAt(0).toUpperCase() + word.slice(1);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/user-profile/');
        setProfile(response.data);
      } catch (err) {
        setError('Не удалось загрузить профиль.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка профиля...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center">Профиль не найден.</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* --- Шапка профиля --- */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
              <div className="relative">
                <img
                  src={profile.profile_photo_url || `https://ui-avatars.com/api/?name=${profile.name}&background=10b981&color=fff&size=128`}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-4xl font-bold text-gray-900">{profile.name || 'Пользователь'}</h1>
                <p className="text-gray-600 mt-1">{profile.user?.email}</p>
                <div className="flex items-center gap-4 mt-4 justify-center md:justify-start">
                  <span className="text-sm font-medium text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">Premium</span>
                  <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">Верифицирован</span>
                </div>
              </div>
              <div className="ml-auto">
                <Link to="/profile/edit">
                  <Button variant="outline" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Редактировать
                  </Button>
                </Link>
              </div>
            </div>

            {/* --- Основная информация и статистика --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Левая колонка - Контакты и общая информация */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader><CardTitle>Контактная информация</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-gray-400" /><span>{profile.user?.email}</span></div>
                    <div className="flex items-center gap-3"><User className="w-5 h-5 text-gray-400" /><span>{translateAndCapitalize(profile.gender, 'gender')}, {profile.age} лет</span></div>
                    <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-gray-400" /><span>На проекте с {profile.user?.created_at ? new Date(profile.user.created_at).toLocaleDateString('ru-RU') : 'Недавно'}</span></div>
                  </CardContent>
                </Card>

                {(profile.saving_frequency || profile.income_stability || profile.spending_impulsiveness) && (
                  <Card>
                    <CardHeader><CardTitle>Финансовые привычки</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {profile.saving_frequency && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Частота сбережений:</span>
                          <span className="font-medium">{translateAndCapitalize(profile.saving_frequency, 'saving_frequency')}</span>
                        </div>
                      )}
                      {profile.income_stability && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Стабильность дохода:</span>
                          <span className="font-medium">{profile.income_stability}/5</span>
                        </div>
                      )}
                      {profile.spending_impulsiveness && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Импульсивность:</span>
                          <span className="font-medium">{profile.spending_impulsiveness}/5</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Правая колонка - Финансовая статистика */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader><CardTitle>Финансовый обзор</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard icon={<DollarSign className="w-6 h-6 text-green-600"/>} title="Месячный доход" value={`₸${profile.monthly_income.toLocaleString()}`} colorClass="bg-green-100" />
                    <StatCard icon={<TrendingUp className="w-6 h-6 text-red-600"/>} title="Месячные расходы" value={`₸${profile.monthly_expenses.toLocaleString()}`} colorClass="bg-red-100" />
                    <StatCard icon={<Zap className="w-6 h-6 text-blue-600"/>} title="Источник дохода" value={translateAndCapitalize(profile.income_source, 'income')} colorClass="bg-blue-100" />
                    <StatCard icon={<Shield className="w-6 h-6 text-yellow-600"/>} title="Уверенность" value={`${profile.financial_confidence}/5`} colorClass="bg-yellow-100" />
                    <StatCard icon={<Activity className="w-6 h-6 text-purple-600"/>} title="Стресс" value={`${profile.financial_stress}/5`} colorClass="bg-purple-100" />
                    <StatCard icon={<Award className="w-6 h-6 text-indigo-600"/>} title="Активных целей" value={profile.goals?.length || 0} colorClass="bg-indigo-100" />
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader><CardTitle>Основные категории трат</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {profile.spending_categories?.map(cat => (
                      <span key={cat} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {translateAndCapitalize(cat, 'category')}
                      </span>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage; 