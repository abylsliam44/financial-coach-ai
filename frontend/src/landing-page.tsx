"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import {
  Sparkles,
  CheckCircle,
  UserPlus,
  PenTool,
  TrendingUp,
  BarChart3,
  Target,
  Zap,
  Star,
  Menu,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "./api";

// Моковые данные для отзывов
const reviews = [
  {
    name: "Аружан",
    role: "Студентка",
    text: "Теперь я точно знаю, на чём экономить. ИИ показал мне траты, о которых я даже не задумывалась!",
    initial: "А",
  },
  {
    name: "Ернар",
    role: "UX-дизайнер",
    text: "Каждое утро — новый челлендж! Геймификация действительно мотивирует экономить.",
    initial: "Е",
  },
  {
    name: "Мадина",
    role: "Маркетолог",
    text: "За месяц сэкономила 50,000 тенге! Советы ИИ реально работают.",
    initial: "М",
  },
];


// Градиентный фон
function GradientBg() {
  return (
    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white via-emerald-50 to-white" />
  );
}

export default function LandingPage() {
  // Ссылки для плавной прокрутки
  const howRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState({ users: 1000, goals: 85, save: 30 });
  const [animate, setAnimate] = useState(false);

  // Пример запроса к бэкенду (замени на свой endpoint)
  useEffect(() => {
    api.get("/stats")
      .then((response) => {
        const data = response.data;
        if (data?.users && data?.goals && data?.save) setStats(data);
      })
      .catch(() => {});
  }, []);

  // Анимация появления
  useEffect(() => {
    setTimeout(() => setAnimate(true), 200);
  }, []);

  // Плавная прокрутка
  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    setMenuOpen(false);
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-white overflow-x-hidden">
      <GradientBg />
      {/* Хедер */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="container mx-auto flex items-center justify-between py-4 px-4 md:px-8">
          {/* Логотип */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
            <span className="bg-emerald-500 rounded-xl p-2"><Sparkles className="text-white w-6 h-6" /></span>
            <span className="font-bold text-lg md:text-xl text-gray-900">BaiAI</span>
          </div>
          {/* Навигация */}
          <nav className="hidden md:flex gap-8 text-gray-700 font-medium">
            <button onClick={() => scrollTo(howRef)} className="hover:text-emerald-600 transition-colors">Как работает</button>
            <button onClick={() => scrollTo(reviewsRef)} className="hover:text-emerald-600 transition-colors">Отзывы</button>
            <button onClick={() => scrollTo(demoRef)} className="hover:text-emerald-600 transition-colors">Демо</button>
          </nav>
          <div className="hidden md:block">
            <Link to="/auth/login">
              <Button className="rounded-full px-6 py-2 font-bold bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 transition-all duration-300">Войти</Button>
            </Link>
          </div>
          {/* Мобильное меню */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" onClick={() => setMenuOpen(!menuOpen)} className="rounded-full">
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
        {/* Мобильное меню дропдаун */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-b border-gray-100 px-4 py-2 animate-fade-in-down">
            <nav className="flex flex-col gap-4">
              <button onClick={() => scrollTo(howRef)} className="text-left py-2 px-2 rounded-xl hover:bg-emerald-50 transition-all">Как работает</button>
              <button onClick={() => scrollTo(reviewsRef)} className="text-left py-2 px-2 rounded-xl hover:bg-emerald-50 transition-all">Отзывы</button>
              <button onClick={() => scrollTo(demoRef)} className="text-left py-2 px-2 rounded-xl hover:bg-emerald-50 transition-all">Демо</button>
              <Link to="/auth/login">
                <Button className="rounded-full w-full mt-2 font-bold bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 transition-all duration-300">Войти</Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* HERO секция */}
      <section className={`relative flex flex-col-reverse md:flex-row items-center justify-between container mx-auto py-12 md:py-24 px-4 md:px-8 transition-all duration-1000 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
            Твои финансы — <span className="text-emerald-600">под контролем ИИ</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-xl">ИИ-ассистент нового поколения для управления личными финансами (BaiAI)</p>
          <ul className="flex flex-col gap-2 mt-2">
            <li className="flex items-center gap-2 text-base text-gray-700"><CheckCircle className="text-emerald-500 w-5 h-5" /> Умные советы на основе твоих трат</li>
            <li className="flex items-center gap-2 text-base text-gray-700"><CheckCircle className="text-emerald-500 w-5 h-5" /> Индивидуальные цели и челленджи</li>
            <li className="flex items-center gap-2 text-base text-gray-700"><CheckCircle className="text-emerald-500 w-5 h-5" /> Геймификация: XP и стрики</li>
          </ul>
          <div className="flex gap-4 mt-6">
            <Link to="/auth/register">
              <Button className="rounded-full px-8 py-3 text-lg font-bold bg-gray-900 text-white hover:scale-105 transition-all duration-300 shadow-lg">Зарегистрироваться</Button>
            </Link>
            <Button variant="outline" className="rounded-full px-8 py-3 text-lg font-bold border-2 border-emerald-500 text-emerald-600 bg-white hover:bg-emerald-50 hover:scale-105 transition-all duration-300">Как это работает</Button>
          </div>
        </div>
        {/* Статистика */}
        <div className="w-full md:w-1/2 flex justify-center md:justify-end mb-8 md:mb-0">
          <Card className="rounded-2xl shadow-xl bg-white/90 backdrop-blur p-6 flex flex-row gap-6 items-center min-w-[420px] md:min-w-[540px] max-w-[700px]">
            <CardContent className="flex flex-col gap-2 items-center">
              <span className="bg-emerald-100 rounded-xl p-2 mb-1"><Sparkles className="text-emerald-500 w-6 h-6" /></span>
              <span className="text-2xl font-bold text-gray-900">{stats.users}+</span>
              <span className="text-gray-500 text-sm">Пользователей</span>
            </CardContent>
            <CardContent className="flex flex-col gap-2 items-center">
              <span className="bg-emerald-100 rounded-xl p-2 mb-1"><Target className="text-emerald-500 w-6 h-6" /></span>
              <span className="text-2xl font-bold text-gray-900">{stats.goals}%</span>
              <span className="text-gray-500 text-sm">Достигают целей</span>
            </CardContent>
            <CardContent className="flex flex-col gap-2 items-center">
              <span className="bg-emerald-100 rounded-xl p-2 mb-1"><TrendingUp className="text-emerald-500 w-6 h-6" /></span>
              <span className="text-2xl font-bold text-gray-900">{stats.save}%</span>
              <span className="text-gray-500 text-sm">Экономят больше</span>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Как это работает */}
      <section ref={howRef} className="relative w-full bg-gray-50 py-16 px-4 md:px-0 transition-all duration-1000" id="how">
        <div className="container mx-auto flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Как это работает</h2>
          <p className="text-lg text-gray-600 mb-10">Всего три простых шага до полного контроля над финансами</p>
          <div className="flex flex-col md:flex-row gap-8 w-full justify-center">
            <Card className="flex-1 rounded-xl p-6 flex flex-col items-center gap-4 bg-white shadow-md hover:scale-105 transition-all duration-500">
              <UserPlus className="w-10 h-10 text-emerald-500 mb-2" />
              <h3 className="font-bold text-xl mb-1">1. Зарегистрируйся</h3>
              <p className="text-gray-600 text-center">Создай аккаунт за 30 секунд и настрой свой профиль</p>
            </Card>
            <Card className="flex-1 rounded-xl p-6 flex flex-col items-center gap-4 bg-white shadow-md hover:scale-105 transition-all duration-500">
              <PenTool className="w-10 h-10 text-emerald-500 mb-2" />
              <h3 className="font-bold text-xl mb-1">2. Введи свои траты</h3>
              <p className="text-gray-600 text-center">Добавь расходы или подключи банковскую карту для автоматического учёта</p>
            </Card>
            <Card className="flex-1 rounded-xl p-6 flex flex-col items-center gap-4 bg-white shadow-md hover:scale-105 transition-all duration-500">
              <TrendingUp className="w-10 h-10 text-emerald-500 mb-2" />
              <h3 className="font-bold text-xl mb-1">3. Получи советы и достигай целей</h3>
              <p className="text-gray-600 text-center">ИИ анализирует твои привычки и предлагает персональные рекомендации</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Демо интерфейса */}
      <section ref={demoRef} className="container mx-auto py-20 px-4 md:px-8 flex flex-col md:flex-row items-center gap-12 transition-all duration-1000">
        {/* Мокап приложения */}
        <div className="w-full md:w-1/2 flex justify-center">
          <Card className="bg-gradient-to-br from-emerald-500 via-emerald-400 to-emerald-600 text-white rounded-2xl shadow-2xl p-8 min-w-[320px] max-w-[400px] relative overflow-hidden border-0">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-lg text-white/90">Твой баланс</span>
              <span className="flex items-center gap-1 text-yellow-300 font-bold drop-shadow"><Zap className="w-5 h-5" /> 1,250 XP</span>
            </div>
            <div className="text-3xl font-extrabold mb-2 text-white drop-shadow">₸ 125,000</div>
            <div className="mb-4">
              <div className="text-xs text-white/80 mb-1">Цель месяца</div>
              <div className="w-full h-3 bg-white/30 rounded-full overflow-hidden">
                <div className="h-3 bg-yellow-300 rounded-full transition-all duration-1000" style={{ width: "75%" }} />
              </div>
              <div className="text-xs text-white/80 mt-1">75%</div>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex items-center gap-2"><span className="bg-white/80 w-3 h-3 rounded-full" /> Еда <span className="ml-auto text-white/90">₸ 15,000</span></div>
              <div className="flex items-center gap-2"><span className="bg-yellow-200 w-3 h-3 rounded-full" /> Транспорт <span className="ml-auto text-white/90">₸ 8,500</span></div>
              <div className="flex items-center gap-2"><span className="bg-yellow-400 w-3 h-3 rounded-full" /> Развлечения <span className="ml-auto text-white/90">₸ 12,000</span></div>
            </div>
          </Card>
        </div>
        {/* Фичи справа */}
        <div className="w-full md:w-1/2 flex flex-col gap-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Интерфейс приложения</h2>
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <BarChart3 className="w-8 h-8 text-emerald-500" />
              <div>
                <div className="font-bold text-lg text-gray-900">Умная аналитика</div>
                <div className="text-gray-600">Детальные графики и отчёты помогают понять, куда уходят деньги</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Target className="w-8 h-8 text-emerald-500" />
              <div>
                <div className="font-bold text-lg text-gray-900">Персональные цели</div>
                <div className="text-gray-600">Ставь финансовые цели и отслеживай прогресс в реальном времени</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Zap className="w-8 h-8 text-emerald-500" />
              <div>
                <div className="font-bold text-lg text-gray-900">Геймификация</div>
                <div className="text-gray-600">Зарабатывай XP и поддерживай мотивацию с помощью челленджей</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Отзывы */}
      <section ref={reviewsRef} className="w-full bg-gray-50 py-16 px-4 md:px-0 transition-all duration-1000">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Что говорят пользователи</h2>
          <p className="text-lg text-gray-600 mb-10">Реальные отзывы от людей, которые изменили свои финансовые привычки</p>
          <div className="flex flex-col md:flex-row gap-8">
            {reviews.map((r, i) => (
              <Card key={i} className="flex-1 rounded-xl p-6 bg-white shadow-md hover:scale-105 transition-all duration-500">
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 text-emerald-400 fill-emerald-400" />)}
                </div>
                <div className="text-gray-800 mb-4">"{r.text}"</div>
                <div className="flex items-center gap-3 mt-4">
                  <span className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-lg">{r.initial}</span>
                  <div>
                    <div className="font-bold text-gray-900">{r.name}</div>
                    <div className="text-gray-500 text-sm">{r.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Финальный CTA */}
      <section className="w-full py-16 px-4 md:px-0">
        <div className="container mx-auto rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 p-10 flex flex-col items-center text-center shadow-xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Попробуй прямо сейчас</h2>
          <p className="text-lg text-white/90 mb-8">Присоединяйся к тысячам пользователей, которые уже взяли свои финансы под контроль</p>
          <Link to="/auth/register" className="rounded-full px-10 py-4 text-lg font-bold bg-gray-900 text-white hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-lg">
            Начать экономить <TrendingUp className="w-5 h-5" />
          </Link>
          <div className="text-white/80 mt-4">Бесплатно • Без обязательств • Результат за 7 дней</div>
        </div>
      </section>

      {/* Футер */}
      <footer className="w-full bg-gray-900 text-white py-10 px-4 md:px-0 mt-auto">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500 rounded-xl p-2"><Sparkles className="text-white w-6 h-6" /></span>
              <span className="font-bold text-lg md:text-xl">BaiAI</span>
            </div>
            <div className="text-white/80 max-w-xs">ИИ-ассистент нового поколения для управления личными финансами (BaiAI)</div>
            <span className="mt-2 inline-block bg-emerald-100 text-emerald-700 rounded-full px-4 py-1 text-xs font-semibold">Поддерживается BaiAI</span>
          </div>
          <div className="flex flex-col md:flex-row gap-8">
            <div>
              <div className="font-bold mb-2">Продукт</div>
              <ul className="space-y-1 text-white/80">
                <li>Возможности</li>
                <li>Цены</li>
                <li>Безопасность</li>
              </ul>
            </div>
            <div>
              <div className="font-bold mb-2">Поддержка</div>
              <ul className="space-y-1 text-white/80">
                <li>Помощь</li>
                <li>Контакты</li>
                <li>Блог</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="container mx-auto mt-8 text-center text-white/60 text-sm">
          © 2025 BaiAI. Все права защищены.<br />
          Разработчик продукта — Абылай Сләмжанов.
        </div>
      </footer>
    </div>
  );
} 