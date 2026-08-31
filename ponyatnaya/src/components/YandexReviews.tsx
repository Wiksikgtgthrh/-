import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiService, type ReviewRecord } from '../services/api';

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState<number | null>(null);

  // Форма отзыва
  const [showForm, setShowForm] = useState(false);
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await apiService.getReviews();
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  const visibleReviews = useMemo(
    () => (starFilter !== null ? reviews.filter((r) => r.rating === starFilter) : reviews),
    [reviews, starFilter],
  );

  const formatDate = (dateString?: string | null) => {
    if (!dateString) {
      return '';
    }
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!author.trim() || text.trim().length < 3) {
      setFormError('Укажите имя и текст отзыва.');
      return;
    }
    setSubmitting(true);
    try {
      await apiService.createReview({ author: author.trim(), rating, text: text.trim() });
      setFormSuccess('Спасибо! Ваш отзыв отправлен и появится после модерации.');
      setAuthor('');
      setText('');
      setRating(5);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось отправить отзыв.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <span className="text-gray-600 text-sm">
          {visibleReviews.length} отзывов
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {/* Группа фильтров по звёздам */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setStarFilter(null)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                starFilter === null
                  ? 'bg-gray-800 border-gray-800 text-white'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Все
            </button>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setStarFilter(starFilter === star ? null : star)}
                className={`flex items-center gap-0.5 text-sm px-2.5 py-1.5 rounded-full border transition-colors ${
                  starFilter === star
                    ? 'bg-yellow-400 border-yellow-400 text-white'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                aria-pressed={starFilter === star}
                aria-label={`Фильтр: ${star} звезд`}
              >
                <Star
                  size={13}
                  className={starFilter === star ? 'fill-white text-white' : 'fill-yellow-400 text-yellow-400'}
                />
                <span>{star}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setShowForm((visible) => !visible);
              setFormError('');
              setFormSuccess('');
            }}
            className="text-sm px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Оставить отзыв
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          {formSuccess && (
            <div role="status" className="p-3 bg-green-100 border border-green-300 rounded-lg text-green-700 flex items-center gap-2 text-sm">
              <CheckCircle size={18} className="shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}
          {formError && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 flex items-center gap-2 text-sm">
              <AlertCircle size={18} />
              {formError}
            </div>
          )}
          <div>
            <label htmlFor="review-author" className="mb-1 block text-sm font-medium text-gray-700">Ваше имя</label>
            <input
              id="review-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Как к вам обращаться"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              maxLength={255}
              required
            />
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                aria-label={`Оценка ${star}`}
                className="p-1"
              >
                <Star
                  size={24}
                  className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                />
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="review-text" className="mb-1 block text-sm font-medium text-gray-700">Отзыв</label>
            <textarea
              id="review-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Поделитесь впечатлениями..."
              rows={4}
              minLength={3}
              maxLength={2000}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Отправить отзыв
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      ) : visibleReviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{starFilter !== null ? `Нет отзывов с оценкой ${starFilter} ★` : 'Пока нет отзывов. Станьте первым!'}</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {visibleReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-50 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {review.avatar_url ? (
                    <img src={review.avatar_url} alt={review.author} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-red-600 font-semibold">
                      {review.author.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-gray-800 truncate">{review.author}</h4>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(review.date)}</span>
                  </div>
                  <div className="flex items-center gap-1 my-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm mt-2 leading-relaxed whitespace-pre-wrap">{review.text}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
