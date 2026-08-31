import { useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const POLL_INTERVAL_MS = 15000;

/**
 * Глобальный нотификатор новых заказов. Работает на любой странице сайта,
 * но опрашивает бэкенд ТОЛЬКО если текущий пользователь — сотрудник (админ).
 * Эндпоинт /orders/new_orders/ сам по себе отдаёт 403 не-админам.
 */
export const AdminOrderNotifier: React.FC = () => {
  const { user } = useAuth();
  const { showInfo } = useToast();
  const since = useRef<string>(new Date().toISOString());

  useEffect(() => {
    if (!user?.is_staff) return;

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission();
    }

    let cancelled = false;

    const beep = () => {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
        osc.onended = () => ctx.close();
      } catch {
        /* звук не критичен */
      }
    };

    const poll = async () => {
      try {
        const { count } = await apiService.checkNewOrders(since.current);
        if (cancelled || count <= 0) return;
        since.current = new Date().toISOString();
        showInfo(`Новый заказ! Поступило: ${count}`);
        beep();
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Новый заказ', { body: `Поступило новых заказов: ${count}` });
        }
      } catch {
        /* не-админам приходит 403 — просто игнорируем */
      }
    };

    void poll();
    const interval = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.is_staff, showInfo]);

  return null;
};
