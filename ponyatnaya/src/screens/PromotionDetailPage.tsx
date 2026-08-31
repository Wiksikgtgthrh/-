import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Tag, FileText, FileDown, Gift } from 'lucide-react';
import { apiService, type PromotionCard } from '../services/api';

const PromotionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState<PromotionCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPromotion = async () => {
      if (!id) return;
      try {
        const promotions = await apiService.getPromotions();
        const found = promotions.find((p) => p.id === id);
        if (found) {
          setPromotion(found);
        } else {
          setError('Акция не найдена');
        }
      } catch (e) {
        setError('Не удалось загрузить акцию');
      } finally {
        setLoading(false);
      }
    };
    loadPromotion();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Акция не найдена'}</h1>
          <Link to="/promotions" className="text-red-600 hover:underline">
            Вернуться к акциям
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Hero секция с изображением */}
      <div className="relative h-[40vh] md:h-[50vh] max-h-[500px] bg-gray-900">
        {(promotion.banner_image_url || promotion.image_url) ? (
          <img
            src={promotion.banner_image_url || promotion.image_url}
            alt={promotion.title}
            className="w-full h-full object-cover object-center opacity-90"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800"></div>
        )}
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-8 md:pb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Назад</span>
              </button>
              
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <Tag size={14} />
                  Акция
                </span>
                {promotion.created_at && (
                  <span className="inline-flex items-center gap-1 text-white/80 text-sm">
                    <Calendar size={14} />
                    {formatDate(promotion.created_at)}
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold text-white">
                {promotion.title}
              </h1>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Контент акции */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-6 md:p-10">
              {/* Условия акции */}
              {promotion.conditions && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 text-red-600 mb-3">
                    <Gift size={20} />
                    <h3 className="font-bold text-lg">Условия акции</h3>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-gray-700">
                    {promotion.conditions}
                  </div>
                </div>
              )}

              <div className="prose prose-lg max-w-none">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Описание акции</h2>
                <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {promotion.description}
                </div>
              </div>

              {/* Пользовательское соглашение */}
              {promotion.terms && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-gray-700 mb-3">
                    <FileText size={20} />
                    <h3 className="font-bold text-lg">Пользовательское соглашение</h3>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {promotion.terms}
                  </div>
                </div>
              )}

              {/* Дата окончания акции */}
              {promotion.end_date && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Calendar size={18} />
                    <span className="font-medium">
                      Акция действует до: {formatDate(promotion.end_date)}
                    </span>
                  </div>
                </div>
              )}

              {/* PDF файл с условиями */}
              {promotion.pdf_file_url && (
                <div className="mt-6">
                  <a
                    href={promotion.pdf_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
                  >
                    <FileDown size={18} />
                    {promotion.pdf_link_text || 'Подробнее про акцию'}
                  </a>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200">
                <Link
                  to="/catalog"
                  className="inline-flex items-center justify-center w-full md:w-auto px-8 py-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Перейти в каталог
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default PromotionDetailPage;
