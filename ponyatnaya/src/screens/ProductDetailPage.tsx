import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService, type Product } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { ShoppingCart, Minus, Plus, ExternalLink } from 'lucide-react';

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { items, addItem, updateQuantity } = useCart();
  const [deliveryMode, setDeliveryMode] = useState<'yandex' | 'local'>('yandex');
  const [deliveryUrl, setDeliveryUrl] = useState('https://eda.yandex.ru/r/ponatnaa_plan_restaurant?placeSlug=ponyatnaya_plan');

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    apiService.getProduct(slug).then((data) => {
      setProduct((data as Product) ?? null);
      setLoading(false);
    });
    apiService.getSiteSettings().then((s) => {
      setDeliveryMode(s.delivery_mode ?? 'yandex');
      if (s.delivery_url) setDeliveryUrl(s.delivery_url);
    }).catch(() => {});
  }, [slug]);

  if (loading) return <div className="text-center py-20">Загрузка...</div>;
  if (!product) return <div className="text-center py-20">Товар не найден</div>;

  const nutrition = product.nutrition_per_100g as number[] | undefined;
  const nutritionText =
    nutrition && nutrition.length === 4
      ? `Б: ${nutrition[0]} г, Ж: ${nutrition[1]} г, У: ${nutrition[2]} г, Ккал: ${nutrition[3]} ккал`
      : null;

  const cartItem = items.find((item) => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  return (
    <div className="py-12 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <img src={product.image_url} alt={product.name} className="w-full h-auto" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            {product.weight && <p className="text-gray-500 mb-2">Вес / объём: {product.weight}</p>}
            {product.composition && <p className="text-gray-700 mb-4"><span className="font-medium">Состав:</span> {product.composition}</p>}
            {nutritionText && <p className="text-gray-700 mb-6">{nutritionText}</p>}
            <div className="text-2xl font-bold text-gray-900 mb-6">
              {product.price.toLocaleString('ru-RU')} ₽
            </div>

            {deliveryMode === 'yandex' ? (
              <motion.a
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                href={deliveryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-red-700 transition-colors"
              >
                <ExternalLink size={20} /> Заказать в Яндекс.Еде
              </motion.a>
            ) : quantity > 0 ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  aria-label="Уменьшить количество"
                >
                  <Minus size={18} />
                </button>
                <motion.span key={quantity} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="font-bold w-8 text-center text-lg">
                  {quantity}
                </motion.span>
                <button
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  aria-label="Увеличить количество"
                >
                  <Plus size={18} />
                </button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => addItem(product)}
                className="bg-red-600 text-white px-8 py-3 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition-colors font-semibold"
              >
                <ShoppingCart size={20} />
                <span>В корзину</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
