import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../AuthContext';

import Sidebar from '../../components/dashboard/Sidebar';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { CardHeader, CardTitle } from '../../components/ui/card-header';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Camera, Loader2, Trash2 } from 'lucide-react';

// Тип для данных профиля, которые можно редактировать
interface EditableProfileData {
  name: string;
  age: number | string;
  gender: string;
  monthly_income: number | string;
  income_source: string;
  // ... добавь другие поля при необходимости
}

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { updateProfileStatus } = useAuth();
  const [profile, setProfile] = useState<EditableProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/user-profile/');
        setProfile(data);
        setAvatarPreview(data.profile_photo_url);
      } catch (err) {
        setError('Не удалось загрузить данные для редактирования.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      try {
        const { data } = await api.post('/user-profile/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (data.profile_photo_url) {
          setAvatarPreview(data.profile_photo_url + '?t=' + Date.now());
        }
      } catch {
        setError('Ошибка загрузки аватара.');
      }
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await api.delete('/user-profile/photo');
      setAvatarPreview(null);
    } catch {
      setError('Ошибка при удалении фото.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSaving(true);
    setError('');
    try {
      // Преобразуем числовые поля обратно в числа
      const dataToSend = {
        ...profile,
        age: Number(profile.age),
        monthly_income: Number(profile.monthly_income),
      };
      await api.patch('/user-profile/', dataToSend);
      updateProfileStatus(true);
      navigate('/profile');
    } catch (err) {
      setError('Не удалось сохранить изменения.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Загрузка...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Редактирование профиля</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex items-center gap-8 mb-6">
                  <div className="relative group">
                    <img
                      src={avatarPreview ? avatarPreview : `https://ui-avatars.com/api/?name=${profile?.name}&background=10b981&color=fff&size=128`}
                      alt="Avatar Preview"
                      className="w-28 h-28 rounded-full object-cover border-4 border-emerald-200 shadow-lg transition-transform group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-emerald-100 border border-emerald-200 transition"
                      title="Изменить фото"
                    >
                      <Camera className="w-5 h-5 text-emerald-600" />
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleDeleteAvatar}
                        className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-red-100 border border-red-200 transition"
                        title="Удалить фото"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      className="hidden"
                      accept="image/png, image/jpeg"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="name" className="text-base font-semibold text-gray-700">Полное имя</Label>
                    <Input id="name" name="name" value={profile?.name || ''} onChange={handleInputChange} className="mt-2 text-lg px-4 py-2 !bg-white !text-gray-900 placeholder-gray-400 border border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 shadow-sm transition" placeholder="Введите ваше имя" />
                  </div>
                </div>
                <hr className="my-4 border-emerald-100" />
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="age" className="text-base font-semibold text-gray-700">Возраст</Label>
                    <Input id="age" name="age" type="number" value={profile?.age || ''} onChange={handleInputChange} className="mt-2 px-4 py-2 !bg-white !text-gray-900 placeholder-gray-400 border border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 shadow-sm transition" placeholder="19" min={1} max={120} />
                  </div>
                  <div>
                    <Label htmlFor="gender" className="text-base font-semibold text-gray-700">Пол</Label>
                    <Input id="gender" name="gender" value={profile?.gender || ''} onChange={handleInputChange} className="mt-2 px-4 py-2 !bg-white !text-gray-900 placeholder-gray-400 border border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 shadow-sm transition" placeholder="Женский / Мужской" />
                  </div>
                </div>
                <hr className="my-4 border-emerald-100" />
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="monthly_income" className="text-base font-semibold text-gray-700">Месячный доход, ₸</Label>
                    <Input id="monthly_income" name="monthly_income" type="number" value={profile?.monthly_income || ''} onChange={handleInputChange} className="mt-2 px-4 py-2 !bg-white !text-gray-900 placeholder-gray-400 border border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 shadow-sm transition" placeholder="100000" min={0} />
                  </div>
                  <div>
                    <Label htmlFor="income_source" className="text-base font-semibold text-gray-700">Источник дохода</Label>
                    <Input id="income_source" name="income_source" value={profile?.income_source || ''} onChange={handleInputChange} className="mt-2 px-4 py-2 !bg-white !text-gray-900 placeholder-gray-400 border border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 shadow-sm transition" placeholder="Работа, Фриланс..." />
                  </div>
                </div>
                <div className="flex justify-end gap-4 mt-10">
                  <Button type="button" variant="ghost" onClick={() => navigate('/profile')} className="px-6 py-3 text-base">Отмена</Button>
                  <Button type="submit" disabled={saving} className="px-8 py-3 text-base font-semibold">
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Сохранить
                  </Button>
                </div>
                <div className="text-xs text-gray-400 text-center mt-2">Все изменения сохраняются только после нажатия кнопки "Сохранить"</div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default EditProfilePage; 