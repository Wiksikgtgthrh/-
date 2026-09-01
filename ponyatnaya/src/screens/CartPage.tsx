import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { CheckoutModal } from '../components/CheckoutModal';
import { apiService } from '../services/api';

const CartPage: React.FC = () => {
  const { items, updateQuantity, removeItem, getTotalPrice } = useCart();
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [deliveryMode, setDeliveryMode] = React.useState<'yandex' | 'local'>('yandex');
  const [deliveryUrl, setDeliveryUrl] = React.useState('https://eda.yandex.ru/r/ponatnaa_plan_restaurant?placeSlug=ponyatnaya_plan');
  React.useEffect(() => {
    apiService.getSiteSettings().then((settings) => {
      setDeliveryMode(settings.delivery_mode ?? 'yandex');
      if (settings.delivery_url) setDeliveryUrl(settings.delivery_url);
    }).catch(() => {});
  }, []);
  const totalPrice = getTotalPrice();

  if (checkoutOpen) {
    return (
      <CheckoutModal
        isOpen
        onClose={() => setCheckoutOpen(false)}
        onBack={() => setCheckoutOpen(false)}
      />
    );
  }

  return (
    <section className="min-h-[70vh] bg-gray-50 py-10 md:py-16">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Корзина</h1>
            <p className="mt-2 text-gray-500">
              {items.length ? `${items.length} ${items.length === 1 ? 'позиция' : 'позиции'}` : 'Ваша корзина пока пуста'}
            </p>
          </div>
          <Link to="/catalog" className="hidden items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 sm:flex">
            <ArrowLeft size={18} /> Вернуться в меню
          </Link>
        </div>

        {deliveryMode === 'yandex' ? (
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
            <ShoppingBag size={64} className="mx-auto mb-5 text-red-300" />
            <h2 className="text-2xl font-semibold text-gray-800">Заказы сейчас принимаются через Яндекс.Еду</h2>
            <p className="mx-auto mt-3 max-w-md text-gray-500">Перейдите на страницу ресторана, чтобы собрать корзину и оплатить заказ.</p>
            <a href={deliveryUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-700">
              Перейти в Яндекс.Еду <ExternalLink size={18} />
            </a>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
            <ShoppingBag size={64} className="mx-auto mb-5 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-800">В корзине пока ничего нет</h2>
            <p className="mx-auto mt-2 max-w-md text-gray-500">Добавьте понравившиеся блюда из меню, и они появятся здесь.</p>
            <Link to="/catalog" className="mt-6 inline-flex rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700">
              Перейти в меню
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {items.map((item) => (
                <motion.article
                  layout
                  key={item.product.id}
                  className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-24">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                    ) : <div className="flex h-full items-center justify-center text-sm text-gray-400">Нет фото</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/product/${item.product.slug}`} className="text-lg font-semibold text-gray-900 hover:text-red-600">
                      {item.product.name}
                    </Link>
                    {item.product.weight && <p className="mt-1 text-sm text-gray-500">{item.product.weight}</p>}
                    <p className="mt-2 font-semibold text-red-600">{item.product.price.toLocaleString('ru-RU')} ₽ за шт.</p>
                  </div>
                  <div className="flex items-center justify-between gap-5 sm:justify-end">
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-2 py-1">
                      <button aria-label={`Уменьшить количество: ${item.product.name}`} onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-red-600">
                        <Minus size={17} />
                      </button>
                      <span className="min-w-6 text-center font-semibold">{item.quantity}</span>
                      <button aria-label={`Увеличить количество: ${item.product.name}`} onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-red-600">
                        <Plus size={17} />
                      </button>
                    </div>
                    <strong className="min-w-24 text-right text-lg text-gray-900">{(item.product.price * item.quantity).toLocaleString('ru-RU')} ₽</strong>
                    <button aria-label={`Удалить ${item.product.name}`} onClick={() => removeItem(item.product.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={19} />
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>

            <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-28">
              <h2 className="text-xl font-semibold text-gray-900">Ваш заказ</h2>
              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-5">
                <span className="text-lg font-medium text-gray-700">Итого</span>
                <span className="text-2xl font-bold text-red-600">{totalPrice.toLocaleString('ru-RU')} ₽</span>
              </div>
              <button onClick={() => setCheckoutOpen(true)} className="mt-6 w-full rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-red-700">
                Оформить заказ
              </button>
              <Link to="/catalog" className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-red-600 sm:hidden">
                <ArrowLeft size={16} /> Вернуться в меню
              </Link>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
};

export default CartPage;
