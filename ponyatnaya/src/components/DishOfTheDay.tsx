import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, ChefHat } from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface DishOfTheDayData {
  id: string;
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
  };
  old_price?: number;
  sale_price?: number;
  active_until?: string;
}

export const DishOfTheDay: React.FC = () => {
  const { showError } = useToast();
  const [dish, setDish] = useState<DishOfTheDayData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDishOfTheDay();
  }, []);

  const loadDishOfTheDay = async () => {
    try {
      const data = await apiService.getDishOfTheDay();
      setDish(data);
    } catch (err) {
      showError('Ошибка загрузки блюда дня');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="container mx-auto px-4 text-center">Загрузка...</div>
      </section>
    );
  }

  if (!dish) {
    return null;
  }

  const product = dish.product;
  const currentPrice = dish.sale_price || product.price;
  const oldPrice = dish.old_price;

  return (
    <section className="py-16 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          {/* Заголовок */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full mb-4">
              <Sparkles size={18} />
              <span className="font-medium">Специальное предложение</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Блюдо дня</h2>
            <p className="text-gray-600 mt-2">Каждый день новое вкусное блюдо по особой цене</p>
          </div>

          {/* Карточка блюда */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Изображение */}
              <div className="relative h-64 md:h-auto p-4 bg-gray-50">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-xl border-2 border-amber-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-xl border-2 border-amber-300">
                    <span className="text-gray-500 text-lg">{product.name}</span>
                  </div>
                )}
                {oldPrice && oldPrice > currentPrice && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    -{Math.round(((oldPrice - currentPrice) / oldPrice) * 100)}%
                  </div>
                )}
              </div>

              {/* Информация */}
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                  <ChefHat size={16} />
                  <span>Шеф-повар рекомендует</span>
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                  {product.name}
                </h3>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  {product.description || 'Описание блюда'}
                </p>

                {/* Цены */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl font-bold text-red-600">
                    {currentPrice} ₽
                  </span>
                  {oldPrice && (
                    <span className="text-xl text-gray-400 line-through">
                      {oldPrice} ₽
                    </span>
                  )}
                </div>

                {/* Таймер или доп инфо */}
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg mb-6">
                  <Clock size={18} />
                  <span className="text-sm font-medium">
                    {dish.active_until 
                      ? `Акция до ${new Date(dish.active_until).toLocaleDateString('ru-RU')}`
                      : 'Только сегодня! Акция действует до закрытия'
                    }
                  </span>
                </div>

                {/* Кнопка */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-3 rounded-lg transition-colors"
                >
                  Заказать блюдо дня
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
