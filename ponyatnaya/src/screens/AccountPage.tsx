import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function AccountPage() {
  const { user, loading, refreshUser, signOut } = useAuth();
  const { showSuccess, showError } = useToast();
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersErr, setOrdersErr] = useState('');
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof apiService.getMyOrders>>>([]);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdErr, setPwdErr] = useState('');
  
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      new: 'Новый',
      awaiting_payment: 'Ожидает оплаты',
      paid: 'Оплачен',
      confirmed: 'Подтверждён',
      preparing: 'Готовится',
      delivering: 'Доставляется',
      completed: 'Завершён',
      cancelled: 'Отменён',
    };
    return labels[status] || status;
  };

  useEffect(() => {
    if (user?.name !== undefined) setFirstName(user.name || '');
    if (typeof user?.phone === 'string') setPhone(user.phone || '');
    setEmail(user?.email || '');
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setOrdersLoading(true);
      setOrdersErr('');
      try {
        const rows = await apiService.getMyOrders();
        if (!cancelled) setOrders(rows);
      } catch (e) {
        if (!cancelled) setOrdersErr(e instanceof Error ? e.message : 'Не удалось загрузить заказы');
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-gray-600">Загрузка…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');
    try {
      await apiService.updateProfile(firstName.trim());
      await apiService.updateProfilePhone(phone.trim());
      await apiService.updateProfileEmail(email.trim());
      await refreshUser();
      setProfileMsg('Профиль сохранён.');
    } catch (e) {
      setProfileMsg(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSendVerification = async () => {
    if (!email.trim()) {
      showError('Сначала укажите и сохраните email.');
      return;
    }
    setEmailSending(true);
    try {
      const result = await apiService.sendEmailVerification();
      showSuccess(result.detail);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Не удалось отправить письмо');
    } finally {
      setEmailSending(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdErr('');
    try {
      await apiService.changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      await signOut();
      showSuccess('Пароль изменён. Войдите снова с новым паролем.');
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Настройки аккаунта</h1>

      <section className="mb-10 p-6 bg-white rounded-lg shadow border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Профиль</h2>
        <form onSubmit={handleProfile} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              Имя
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Телефон
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (___) ___-__-__"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Электронная почта
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className={`text-sm ${user.email_verified ? 'text-green-700' : 'text-amber-700'}`}>
                {user.email_verified ? 'Почта подтверждена' : 'Подтвердите почту'}
              </span>
              {!user.email_verified && email && (
                <button type="button" onClick={handleSendVerification} disabled={emailSending} className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50">
                  {emailSending ? 'Отправка…' : 'Отправить письмо'}
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">Подтверждение почты не мешает оформлять заказы.</p>
          </div>
          {profileMsg && <p className="text-sm text-gray-600">{profileMsg}</p>}
          <button
            type="submit"
            disabled={profileLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {profileLoading ? 'Сохранение…' : 'Сохранить'}
          </button>
        </form>
      </section>

      <section className="mb-10 p-6 bg-white rounded-lg shadow border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">История заказов</h2>
        {ordersLoading ? <p className="text-gray-600 text-sm">Загрузка…</p> : null}
        {ordersErr ? <p className="text-sm text-red-600">{ordersErr}</p> : null}
        {!ordersLoading && !ordersErr && !orders.length ? (
          <p className="text-sm text-gray-600">Заказов пока нет.</p>
        ) : null}
        {!ordersLoading && !ordersErr && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((o) => {
              const canCancel = o.status !== 'completed' && o.status !== 'cancelled';
              return (
                <div key={o.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-medium">Заказ #{o.id}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(o.created_at).toLocaleString('ru-RU')}
                      </p>
                      <p className="text-sm text-gray-700">
                        Статус: <span className="font-medium">{getStatusLabel(o.status)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-700">{o.total_amount || o.total_price}₽</p>
                      <button
                        type="button"
                        disabled={!canCancel}
                        onClick={async () => {
                          if (!window.confirm('Отменить заказ?')) return;
                          try {
                          const updated = await apiService.cancelMyOrder(o.id);
                             setOrders((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                             showSuccess('Заказ отменён');
                            } catch (e) {
                            showError(e instanceof Error ? e.message : 'Не удалось отменить заказ');
                          }
                        }}
                        className="mt-2 px-3 py-1 rounded-md text-sm bg-red-600 text-white disabled:opacity-50"
                      >
                        Отменить
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="mb-10 p-6 bg-white rounded-lg shadow border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Смена пароля</h2>
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Текущий пароль</label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowOld(!showOld)}
              >
                {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль (мин. 8 символов)</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {pwdErr && <p className="text-sm text-red-600">{pwdErr}</p>}
          <button
            type="submit"
            disabled={pwdLoading}
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 disabled:opacity-50"
          >
            {pwdLoading ? 'Смена…' : 'Сменить пароль'}
          </button>
        </form>
      </section>

      {user.is_staff && (
        <section className="p-6 bg-amber-50 rounded-lg border border-amber-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Администрирование</h2>
          <p className="text-sm text-gray-700">
            Панель управления доступна по кнопке «Админка» в шапке сайта.
          </p>
        </section>
      )}

      <p className="text-sm text-gray-500">
        <Link to="/" className="text-red-600 hover:underline">
          ← На главную
        </Link>
      </p>
    </div>
  );
}
