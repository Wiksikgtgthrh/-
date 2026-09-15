import React, { useMemo, useState } from 'react';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { apiService, type Product } from '../services/api';
import { AnimatedButton } from './ui/AnimatedButton';
import { useToast } from '../contexts/ToastContext';

interface OnSiteOrderTabProps {
  products: Product[];
  categories: { id: string; name: string }[];
  onCreated: () => void;
}

interface CartLine {
  product: Product;
  quantity: number;
}

export const OnSiteOrderTab: React.FC<OnSiteOrderTabProps> = ({ products, categories, onCreated }) => {
  const { showSuccess, showError } = useToast();
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr'>('cash');
  const [submitting, setSubmitting] = useState(false);

  const availableProducts = useMemo(
    () =>
      products.filter((p) => {
        if (!p.is_active) return false;
        if (activeCategory !== 'all' && String(p.category_id) !== activeCategory) return false;
        if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
        return true;
      }),
    [products, activeCategory, search],
  );

  const cartLines = Object.values(cart);
  const total = cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const itemsCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev[product.id];
      return {
        ...prev,
        [product.id]: { product, quantity: existing ? existing.quantity + 1 : 1 },
      };
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const line = prev[productId];
      if (!line) return prev;
      const next = line.quantity + delta;
      if (next <= 0) {
        const rest = { ...prev };
        delete rest[productId];
        return rest;
      }
      return { ...prev, [productId]: { ...line, quantity: next } };
    });
  };

  const removeLine = (productId: string) => {
    setCart((prev) => {
      const rest = { ...prev };
      delete rest[productId];
      return rest;
    });
  };

  const resetForm = () => {
    setCart({});
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setPaymentMethod('cash');
  };

  const submit = async () => {
    if (cartLines.length === 0) {
      showError('Добавьте хотя бы одно блюдо');
      return;
    }
    setSubmitting(true);
    try {
      await apiService.createOnSiteOrder({
        items: cartLines.map((line) => ({
          product_id: Number(line.product.id),
          quantity: line.quantity,
        })),
        order_type: 'in_house',
        delivery_address: '',
        delivery_fee: 0,
        customer_name: customerName.trim() || 'Гость',
         customer_phone: customerPhone.trim(),
         customer_email: customerEmail.trim(),
        payment_method: paymentMethod,
      });
      showSuccess('Заказ в заведении создан');
      resetForm();
      onCreated();
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Не удалось создать заказ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Новый заказ в заведении</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Меню */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-2 mb-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск блюда…"
              className="flex-1 min-w-[180px] border rounded px-3 py-2"
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                activeCategory === 'all' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Все
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(String(cat.id))}
                className={`px-3 py-1 rounded-full text-sm ${
                  activeCategory === String(cat.id) ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto pr-1">
            {availableProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addToCart(product)}
                className="text-left border rounded-lg p-3 hover:border-red-500 hover:shadow transition-all"
              >
                <div className="font-medium text-sm line-clamp-2">{product.name}</div>
                {product.weight && <div className="text-xs text-gray-400">{product.weight}</div>}
                <div className="text-red-600 font-semibold mt-1">{product.price.toLocaleString('ru-RU')}₽</div>
              </button>
            ))}
            {availableProducts.length === 0 && (
              <p className="text-gray-500 col-span-full">Нет доступных блюд.</p>
            )}
          </div>
        </div>

        {/* Корзина */}
        <div className="border rounded-lg p-4 bg-gray-50 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={20} className="text-red-600" />
            <h4 className="font-semibold">Заказ ({itemsCount})</h4>
          </div>

          <div className="flex-1 space-y-2 max-h-[35vh] overflow-y-auto mb-3">
            {cartLines.length === 0 ? (
              <p className="text-gray-500 text-sm">Нажимайте на блюда, чтобы добавить их в заказ.</p>
            ) : (
              cartLines.map((line) => (
                <div key={line.product.id} className="bg-white rounded-lg p-2 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{line.product.name}</div>
                    <div className="text-xs text-gray-500">
                      {line.product.price.toLocaleString('ru-RU')}₽ × {line.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => changeQty(line.product.id, -1)}
                      className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(line.product.id, 1)}
                      className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLine(line.product.id)}
                      className="p-1 rounded text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Имя гостя (необязательно)"
            className="border rounded px-3 py-2 mb-2 text-sm"
          />
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Телефон гостя (необязательно)"
            inputMode="tel"
            className="border rounded px-3 py-2 mb-2 text-sm"
          />
          <input
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="Email гостя *"
            type="email"
            required
            className="border rounded px-3 py-2 mb-2 text-sm"
          />
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'qr')}
            className="border rounded px-3 py-2 mb-3 text-sm bg-white"
          >
            <option value="cash">Наличные</option>
            <option value="card">Карта</option>
            <option value="qr">QR / СБП</option>
          </select>

          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600">Итого</span>
            <span className="text-xl font-bold text-green-600">{total.toLocaleString('ru-RU')}₽</span>
          </div>

          <AnimatedButton
            type="button"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={cartLines.length === 0}
            icon={<ShoppingBag size={18} />}
            onClick={submit}
          >
            Создать заказ
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};
