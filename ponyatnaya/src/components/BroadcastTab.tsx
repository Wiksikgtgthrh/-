import React, { useState, useEffect } from 'react';
import { Send, Image, CheckCircle, AlertCircle, Trash2, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import { AnimatedButton } from './ui/AnimatedButton';
import { FileDropzone } from './ui/FileDropzone';
import { TelegramBotDiagnostics } from './TelegramBotDiagnostics';

interface Broadcast {
  id: number;
  title: string;
  text: string;
  has_image: boolean;
  created_at: string;
  sent_at: string | null;
  sent_count: number;
  is_sent: boolean;
}

const TITLE_STYLES = [
  { value: '', label: 'Обычный' },
  { value: 'bold', label: 'Жирный' },
  { value: 'italic', label: 'Курсив' },
  { value: 'underline', label: 'Подчеркнутый' },
  { value: 'strikethrough', label: 'Зачеркнутый' },
  { value: 'code', label: 'Код' },
  { value: 'spoiler', label: 'Спойлер' },
];

export const BroadcastTab: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [titleStyle, setTitleStyle] = useState('bold');
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadBroadcasts();
  }, []);

  // Генерируем превью изображения при выборе файла и освобождаем URL при смене.
  useEffect(() => {
    if (!image) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const loadBroadcasts = async () => {
    try {
      const data = await apiService.getBroadcasts();
      setBroadcasts(data);
    } catch (err) {
      console.error('Failed to load broadcasts:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title && !text && !image) {
      setError('Заполните хотя бы одно поле');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.createBroadcast({
        title,
        title_style: titleStyle,
        text,
        image: image || undefined,
      });

      setSuccess('Рассылка создана!');
      setTitle('');
      setText('');
      setImage(null);
      setImagePreview(null);
      loadBroadcasts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка при создании рассылки';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (broadcastId: number) => {
    if (!confirm('Отправить рассылку всем пользователям в Telegram?')) return;

    setSending(broadcastId);
    setError('');
    setSuccess('');

    try {
      const result = await apiService.sendBroadcast(broadcastId);
      const errNote = result.errors && result.errors.length > 0 ? ` • ${result.errors.join('; ')}` : '';
      setSuccess(`Рассылка отправлена! Успешно: ${result.sent_count}, Ошибок: ${result.failed_count}${errNote}`);
      loadBroadcasts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка при отправке';
      setError(message);
    } finally {
      setSending(null);
    }
  };

  const handleDelete = async (broadcastId: number) => {
    if (!confirm('Удалить рассылку? Это действие нельзя отменить.')) return;

    setError('');
    setSuccess('');

    try {
      await apiService.deleteBroadcast(broadcastId);
      setSuccess('Рассылка удалена');
      loadBroadcasts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка при удалении';
      setError(message);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ru-RU');
  };

  return (
    <div className="space-y-8">
      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 flex items-center gap-2"
          >
            <AlertCircle size={20} />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-green-100 border border-green-300 rounded-lg text-green-700 flex items-center gap-2"
          >
            <CheckCircle size={20} />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Диагностика бота — помогает понять, почему рассылка не доходит */}
      <TelegramBotDiagnostics />

      {/* Create Broadcast Form */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Send size={24} className="text-blue-500" />
          Создать рассылку
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Заголовок
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите заголовок..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={titleStyle}
                onChange={(e) => setTitleStyle(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {TITLE_STYLES.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текст сообщения
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Введите текст сообщения..."
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Изображение
            </label>
            <FileDropzone
              label="Фото для рассылки (необязательно)"
              value={image}
              onChange={setImage}
            />
          </div>

          {/* Telegram-style Preview */}
          {(title || text || imagePreview) && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1">
                <Send size={16} className="text-blue-500" />
                Предпросмотр в Telegram
              </h4>
              {/* Фон чата */}
              <div className="rounded-2xl p-4 bg-[#8ba396] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(0,0,0,0.08),transparent_45%)]">
                {/* Пузырь сообщения */}
                <div className="ml-auto max-w-sm rounded-2xl rounded-br-md bg-white shadow-md overflow-hidden">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Вложение рассылки"
                      className="w-full max-h-56 object-cover"
                    />
                  )}
                  <div className="px-3 py-2">
                    {title && (
                      <div className="text-[15px] leading-snug mb-1 text-gray-900">
                        {titleStyle === 'bold' && <strong>{title}</strong>}
                        {titleStyle === 'italic' && <em>{title}</em>}
                        {titleStyle === 'underline' && <u>{title}</u>}
                        {titleStyle === 'strikethrough' && <s>{title}</s>}
                        {titleStyle === 'code' && <code className="bg-gray-100 px-1 rounded font-mono text-sm">{title}</code>}
                        {titleStyle === 'spoiler' && <span className="bg-gray-800 text-gray-800 hover:text-white px-1 rounded transition-colors">{title}</span>}
                        {!titleStyle && <strong>{title}</strong>}
                      </div>
                    )}
                    {text && (
                      <div className="text-[15px] leading-snug text-gray-800 whitespace-pre-wrap">
                        {text}
                      </div>
                    )}
                    {!title && !text && (
                      <div className="text-[15px] text-gray-400 italic">Сообщение с изображением</div>
                    )}
                    {/* Время и галочки прочтения */}
                    <div className="flex items-center justify-end gap-1 mt-1 text-[11px] text-gray-400">
                      <span>
                        {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <CheckCheck size={14} className="text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Так сообщение увидят подписчики бота. Форматирование заголовка применяется автоматически.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <AnimatedButton
            type="submit"
            variant="info"
            size="lg"
            fullWidth
            loading={loading}
            icon={<Send size={20} />}
          >
            {loading ? 'Создание...' : 'Создать рассылку'}
          </AnimatedButton>
        </form>
      </div>

      {/* Broadcasts List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">История рассылок</h3>

        {broadcasts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Пока нет рассылок</p>
        ) : (
          <div className="space-y-4">
            {broadcasts.map((broadcast) => (
              <motion.div
                key={broadcast.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">
                      {broadcast.title || 'Без заголовка'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {broadcast.text}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Создано: {formatDate(broadcast.created_at)}</span>
                      {broadcast.has_image && (
                        <span className="flex items-center gap-1">
                          <Image size={12} />
                          С фото
                        </span>
                      )}
                    </div>
                    {broadcast.is_sent && (
                      <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle size={14} />
                        Отправлено {broadcast.sent_count} пользователям
                        {broadcast.sent_at && ` • ${formatDate(broadcast.sent_at)}`}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!broadcast.is_sent && (
                      <AnimatedButton
                        variant="success"
                        size="sm"
                        loading={sending === broadcast.id}
                        icon={<Send size={16} />}
                        onClick={() => handleSend(broadcast.id)}
                      >
                        Отправить
                      </AnimatedButton>
                    )}
                    <AnimatedButton
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={16} />}
                      onClick={() => handleDelete(broadcast.id)}
                    >
                      Удалить
                    </AnimatedButton>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
