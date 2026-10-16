import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, ExternalLink } from 'lucide-react';
import { Product, apiService } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useReveal } from '../hooks/useReveal';
import { OptimizedImg } from './OptimizedImg';

interface ProductCardProps {
  product: Product;
  /** Первые карточки в viewport грузим без lazy — они влияют на LCP. */
  priority?: boolean;
}

const DEFAULT_DELIVERY_URL = 'https://eda.yandex.ru/r/ponatnaa_plan_restaurant?placeSlug=ponyatnaya_plan';

/**
 * Карточка товара. Оптимизирована под каталог из 100+ позиций:
 * - без framer-motion (reveal/zoom — на CSS, один общий IntersectionObserver);
 * - настройки доставки берутся из общего кэша apiService (один запрос на страницу,
 *   раньше каждая карточка делала свой — N+1);
 * - изображение — через оптимизатор Next.js (AVIF/WebP, 640px вместо 2 МБ PNG);
 * - width/height заданы — нет скачков макета (CLS).
 */
export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, priority = false }) => {
  const { items, addItem, updateQuantity } = useCart();
  const [deliveryMode, setDeliveryMode] = React.useState<'yandex' | 'local'>('yandex');
  const [deliveryUrl, setDeliveryUrl] = React.useState(DEFAULT_DELIVERY_URL);
  const [imageFailed, setImageFailed] = React.useState(false);
  const revealRef = useReveal<HTMLDivElement>();

  const cartItem = items.find(item => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  React.useEffect(() => {
    let active = true;
    apiService.getSiteSettings().then((settings) => {
      if (!active) return;
      setDeliveryMode(settings.delivery_mode ?? 'yandex');
      if (settings.delivery_url) setDeliveryUrl(settings.delivery_url);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const handleAddToCart = () => addItem(product);
  const handleUpdateQuantity = (newQuantity: number) => updateQuantity(product.id, newQuantity);

  const nutrition = product.nutrition_per_100g;
  const nutritionText =
    nutrition && nutrition.length === 4
      ? `Б: ${nutrition[0]} г, Ж: ${nutrition[1]} г, У: ${nutrition[2]} г, Ккал: ${nutrition[3]} ккал`
      : null;

  return (
    <div
      ref={revealRef}
      className="product-card reveal-on-scroll bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg flex flex-col h-full"
    >
      <Link
        to={`/product/${product.slug}`}
        className="block relative pb-[100%] bg-gray-100 overflow-hidden p-3"
        aria-label={`Подробнее о товаре: ${product.name}`}
      >
        {product.image_url && !imageFailed ? (
          <OptimizedImg
            src={product.image_url}
            optimizeWidth={640}
            alt={product.name}
            width={640}
            height={640}
            sizes="(max-width: 640px) calc(100vw - 56px), (max-width: 1024px) calc(50vw - 56px), (max-width: 1280px) calc(33vw - 56px), calc(25vw - 56px)"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            onFinalError={() => setImageFailed(true)}
            className="product-card-img absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)] object-cover rounded-lg border-2 border-amber-300"
          />
        ) : (
          <div className="absolute inset-3 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-2 border-amber-300">
            Нет фото
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
          <h3 className="font-bold text-lg hover:text-red-600 transition-colors text-left leading-tight">
            <Link to={`/product/${product.slug}`}>
              {product.name}
            </Link>
          </h3>
        </div>
        {product.weight && (
          <p className="text-gray-500 text-sm mb-2">
            <span className="font-medium text-gray-700">Вес / объём:</span> {product.weight}
          </p>
        )}
        {product.composition && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            <span className="font-medium text-gray-700">Состав:</span> {product.composition}
          </p>
        )}
        {(product.allergens || product.additives) && (
          <p className="text-gray-500 text-xs mb-2">
            {product.allergens && <><span className="font-medium">Аллергены:</span> {product.allergens}</>}
            {product.allergens && product.additives && ' · '}
            {product.additives && <><span className="font-medium">Добавки:</span> {product.additives}</>}
          </p>
        )}
        {nutritionText && (
          <p className="text-gray-700 text-sm mb-3 line-clamp-2">{nutritionText}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xl font-bold text-gray-900">
            {product.price.toLocaleString('ru-RU')} ₽
          </span>
          {deliveryMode === 'yandex' ? (
            <a href={deliveryUrl} target="_blank" rel="noopener noreferrer" className="bg-red-600 hover:bg-red-700 active:scale-95 text-white px-4 py-2 rounded-full flex items-center space-x-1 transition-colors">
              <ExternalLink size={18} />
              <span>Заказать</span>
            </a>
          ) : quantity > 0 ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleUpdateQuantity(quantity - 1)}
                aria-label="Уменьшить количество"
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 active:scale-90 flex items-center justify-center transition-transform transition-colors"
              >
                <Minus size={16} />
              </button>
              <span key={quantity} className="qty-pop font-bold w-6 text-center">
                {quantity}
              </span>
              <button
                onClick={() => handleUpdateQuantity(quantity + 1)}
                aria-label="Увеличить количество"
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 active:scale-90 flex items-center justify-center transition-transform transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 text-white px-4 py-2 rounded-full flex items-center space-x-1 transition-transform transition-colors"
            >
              <ShoppingCart size={18} />
              <span>В корзину</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
