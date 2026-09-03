import React, { useState, useEffect } from 'react';
import { Save, Phone, Clock } from 'lucide-react';
import { AnimatedButton } from './ui/AnimatedButton';
import { apiService } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export const AdminContactSettings: React.FC<{ focus?: 'delivery' }> = ({ focus }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    phone: '',
    hours_weekdays: '',
    hours_weekends: '',
    delivery_mode: 'yandex' as 'yandex' | 'local',
    delivery_url: '',
    delivery_phone: '',
    delivery_contact_url: '',
  });

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const data = await apiService.getSiteSettings();
      setForm({
        phone: data.phone ?? '',
        hours_weekdays: data.hours_weekdays ?? '',
        hours_weekends: data.hours_weekends ?? '',
        delivery_mode: data.delivery_mode ?? 'yandex',
        delivery_url: data.delivery_url ?? '',
        delivery_phone: data.delivery_phone ?? data.phone ?? '',
        delivery_contact_url: data.delivery_contact_url ?? '',
      });
    } catch {
      showError('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.saveSiteSettings(form);
      showSuccess('Настройки сохранены');
    } catch {
      showError('Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-gray-500">Загрузка...</p>;
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Контакты и режим работы</h3>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">

        {!focus && <>
        <div className="bg-gray-50 border rounded-lg p-5 space-y-4">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <Phone size={16} className="text-red-600" />
            Телефон
          </h4>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Номер телефона (отображается в шапке и футере)
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+7 (842) 123-45-67"
              className="w-full border rounded px-3 py-2 text-sm"
              required
            />
          </div>
        </div>

        <div className="bg-gray-50 border rounded-lg p-5 space-y-4">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <Clock size={16} className="text-red-600" />
            Режим работы
          </h4>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Будние дни (Пн — Пт)
            </label>
            <input
              type="text"
              value={form.hours_weekdays}
              onChange={(e) => setForm((p) => ({ ...p, hours_weekdays: e.target.value }))}
              placeholder="8:00–21:00"
              className="w-full border rounded px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Выходные дни (Сб — Вс)
            </label>
            <input
              type="text"
              value={form.hours_weekends}
              onChange={(e) => setForm((p) => ({ ...p, hours_weekends: e.target.value }))}
              placeholder="9:00–21:00"
              className="w-full border rounded px-3 py-2 text-sm"
              required
            />
          </div>
          <p className="text-xs text-gray-400">
            Пример: 8:00–21:00 или 10:00 — 22:00
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          Изменения сразу отобразятся в шапке сайта, футере и странице «О нас».
        </div>
        </>}

        {focus && <div className="bg-gray-50 border rounded-lg p-5 space-y-4">
          <h4 className="font-medium text-gray-700">Доставка</h4>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Режим доставки</label>
            <select value={form.delivery_mode} onChange={(e) => setForm((p) => ({ ...p, delivery_mode: e.target.value as 'yandex' | 'local' }))} className="w-full border rounded px-3 py-2 text-sm">
              <option value="yandex">Яндекс.Еда — перейти на страницу ресторана</option>
              <option value="local">Локальная доставка — открыть контакт</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Ссылка Яндекс.Еды</label>
            <input type="url" value={form.delivery_url} onChange={(e) => setForm((p) => ({ ...p, delivery_url: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Номер телефона для кнопки «Позвонить»</label>
            <input type="tel" value={form.delivery_phone} onChange={(e) => setForm((p) => ({ ...p, delivery_phone: e.target.value }))} placeholder="+7 (842) 123-45-67" className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Ссылка для кнопки «Написать» (Telegram / WhatsApp / VK)</label>
            <input type="url" value={form.delivery_contact_url} onChange={(e) => setForm((p) => ({ ...p, delivery_contact_url: e.target.value }))} placeholder="https://t.me/..." className="w-full border rounded px-3 py-2 text-sm" />
          </div>
        </div>}

        <AnimatedButton
          type="submit"
          loading={saving}
          icon={<Save size={18} />}
        >
          {saving ? 'Сохраняем...' : 'Сохранить'}
        </AnimatedButton>
      </form>
    </div>
  );
};
