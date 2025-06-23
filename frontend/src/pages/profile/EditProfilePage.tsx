import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

import Sidebar from '../../components/dashboard/Sidebar';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { CardHeader, CardTitle } from '../../components/ui/card-header';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Camera, Loader2 } from 'lucide-react';

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarPreview(URL.createObjectURL(file));

      const formData = new FormData();
      formData.append('file', file);
      
      api.post('/user-profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).catch(() => setError('Ошибка загрузки аватара.'));
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img
                      src={avatarPreview || `https://ui-avatars.com/api/?name=${profile?.name}&background=10b981&color=fff&size=128`}
                      alt="Avatar Preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      className="hidden"
                      accept="image/png, image/jpeg"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="name">Полное имя</Label>
                    <Input id="name" name="name" value={profile?.name || ''} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Возраст</Label>
                    <Input id="age" name="age" type="number" value={profile?.age || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <Label htmlFor="gender">Пол</Label>
                    <Input id="gender" name="gender" value={profile?.gender || ''} onChange={handleInputChange} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="monthly_income">Месячный доход, ₸</Label>
                  <Input id="monthly_income" name="monthly_income" type="number" value={profile?.monthly_income || ''} onChange={handleInputChange} />
                </div>
                
                <div>
                  <Label htmlFor="income_source">Источник дохода</Label>
                  <Input id="income_source" name="income_source" value={profile?.income_source || ''} onChange={handleInputChange} />
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <Button type="button" variant="ghost" onClick={() => navigate('/profile')}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Сохранить
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default EditProfilePage; 