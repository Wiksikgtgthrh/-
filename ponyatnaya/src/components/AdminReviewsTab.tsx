import React, { useCallback, useEffect, useState } from 'react';
import { Star, Trash2, Eye, EyeOff, Plus, Loader2 } from 'lucide-react';
import { apiService, type ReviewRecord } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export const AdminReviewsTab: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.adminGetReviews();
      setReviews(data);
    } catch {
      showError('Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePublished = async (review: ReviewRecord) => {
    try {
      await apiService.adminUpdateReview(review.id, { is_published: !review.is_published });
      await load();
    } catch {
      showError('Не удалось обновить отзыв');
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Удалить отзыв?')) return;
    try {
      await apiService.adminDeleteReview(id);
      await load();
      showSuccess('Отзыв удалён');
    } catch {
      showError('Не удалось удалить отзыв');
    }
  };

  const addReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || text.trim().length < 3) {
      showError('Укажите имя и текст отзыва');
      return;
    }
    setSubmitting(true);
    try {
      await apiService.adminCreateReview({
        author: author.trim(),
        rating,
        text: text.trim(),
        is_published: true,
      });
      setAuthor('');
      setText('');
      setRating(5);
      await load();
      showSuccess('Отзыв добавлен');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не удалось добавить отзыв');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Отзывы</h3>

      <form onSubmit={addReview} className="bg-gray-50 border rounded-lg p-4 mb-6 space-y-3">
        <h4 className="font-medium">Добавить отзыв (опубликуется сразу)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Имя автора"
            className="border rounded px-3 py-2"
            maxLength={255}
          />
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onClick={() => setRating(s)} className="p-1" aria-label={`Оценка ${s}`}>
                <Star size={22} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Текст отзыва"
          rows={3}
          maxLength={2000}
          className="w-full border rounded px-3 py-2 resize-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Добавить
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500">Загрузка…</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500">Отзывов пока нет.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`border rounded-lg p-4 ${review.is_published ? 'bg-white' : 'bg-yellow-50 border-yellow-200'}`}
            >
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{review.author}</span>
                    <span className="flex items-center text-yellow-400">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={14} className="fill-yellow-400" />
                      ))}
                    </span>
                    {!review.is_published && (
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                        На модерации
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">{review.text}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => togglePublished(review)}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded border hover:bg-gray-50"
                  >
                    {review.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                    {review.is_published ? 'Скрыть' : 'Опубликовать'}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(review.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    aria-label="Удалить"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
