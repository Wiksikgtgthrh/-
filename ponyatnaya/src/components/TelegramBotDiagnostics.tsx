import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Users, Shield } from 'lucide-react';
import { apiService, type TelegramBotStatus } from '../services/api';

/** Строка состояния: зелёная галочка / красный крест / жёлтое предупреждение. */
const StatusRow: React.FC<{ ok: boolean | 'warn'; label: string; detail?: string }> = ({ ok, label, detail }) => {
  const Icon = ok === true ? CheckCircle2 : ok === 'warn' ? AlertTriangle : XCircle;
  const color = ok === true ? 'text-green-600' : ok === 'warn' ? 'text-amber-500' : 'text-red-600';
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon size={18} className={`${color} mt-0.5 shrink-0`} />
      <div className="min-w-0">
        <span className="text-sm text-gray-800">{label}</span>
        {detail && <p className="text-xs text-gray-500 break-words">{detail}</p>}
      </div>
    </div>
  );
};

export const TelegramBotDiagnostics: React.FC = () => {
  const [status, setStatus] = useState<TelegramBotStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getTelegramStatus();
      setStatus(data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Не удалось загрузить статус');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-800">Диагностика бота</h3>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Обновить
        </button>
      </div>

      <p className="mb-4 text-xs text-gray-500">
        Сообщения в Telegram идут через внешнего бота (сайт → бот → Telegram через прокси).
      </p>

      {!status ? (
        <p className="text-sm text-gray-500">{loading ? 'Загрузка…' : message || 'Нет данных'}</p>
      ) : (
        <div className="divide-y divide-gray-100">
          <StatusRow
            ok={status.configured}
            label="Настройки связи (BOT_SERVICE_URL, BOT_SERVICE_API_KEY)"
            detail={
              status.configured
                ? undefined
                : 'Не заданы переменные окружения — сайт не знает, где находится бот.'
            }
          />
          {status.configured && (
            <StatusRow
              ok={status.reachable}
              label={status.reachable ? 'Бот доступен и отвечает' : 'Бот недоступен'}
              detail={status.reachable ? undefined : status.error}
            />
          )}
          {status.reachable && (
            <>
              <StatusRow
                ok={status.bot_username ? true : 'warn'}
                label={
                  status.bot_username
                    ? `Бот подключён к Telegram (@${status.bot_username})`
                    : 'Бот запущен, но имя не определено'
                }
              />
              <div className="flex items-center gap-2 py-1.5">
                <Shield size={18} className={status.proxy_enabled ? 'text-green-600' : 'text-amber-500'} />
                <span className="text-sm text-gray-800">
                  Прокси для Telegram: <b>{status.proxy_enabled ? 'включён' : 'выключен'}</b>
                  {!status.proxy_enabled && (
                    <span className="block text-xs text-gray-500">
                      Если сервер бота в РФ, без прокси Telegram может быть недоступен.
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 py-1.5">
                <Users size={18} className={status.subscribers > 0 ? 'text-green-600' : 'text-amber-500'} />
                <span className="text-sm text-gray-800">
                  Подписчиков бота: <b>{status.subscribers}</b>
                  {status.subscribers === 0 && (
                    <span className="block text-xs text-gray-500">
                      Никто ещё не запустил бота. Отправьте боту /start, чтобы стать первым подписчиком.
                    </span>
                  )}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {message && status && (
        <p className="mt-3 text-xs text-gray-500 break-words">{message}</p>
      )}
    </div>
  );
};
