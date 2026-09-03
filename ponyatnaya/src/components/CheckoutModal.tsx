import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowLeft, MapPin, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onBack }) => {
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [personalDataConsent, setPersonalDataConsent] = useState(false);
  const [deliveryDisabled, setDeliveryDisabled] = useState(false);
  const [deliverySettlements, setDeliverySettlements] = useState<Awaited<ReturnType<typeof apiService.getDeliveryZones>>>([]);
  const { showSuccess, showError } = useToast();

  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [addressSuggestLoading, setAddressSuggestLoading] = useState(false);

  const [formData, setFormData] = useState({
    order_type: 'delivery' as 'delivery' | 'in_house',
    customer_name: user?.name || '',
    customer_phone: user?.phone || '',
    customer_email: user?.email || '',
    delivery_address: '',
    delivery_settlement_id: '',
    notes: '',
    payment_method: 'cash' as 'cash' | 'card',
  });

  // Загружаем список отключённых фич при открытии модала
  useEffect(() => {
    if (!isOpen) return;
    apiService.getDeliveryZones().then(setDeliverySettlements).catch(() => setDeliverySettlements([]));
    apiService.getDisabledFeatures().then((features) => {
      const isDisabled = features.some((f) => f.key === 'delivery' && f.is_disabled);
      setDeliveryDisabled(isDisabled);
      if (isDisabled) {
        setFormData((prev) => ({ ...prev, order_type: 'in_house' }));
      }
    }).catch(() => {});
  }, [isOpen]);

  const isDelivery = formData.order_type === 'delivery';
  const selectedSettlement = deliverySettlements.find(
    (settlement) => settlement.id === formData.delivery_settlement_id,
  );
  const subtotal = getTotalPrice();
  const deliveryFee = isDelivery ? selectedSettlement?.price ?? 0 : 0;
  const totalAmount = subtotal + deliveryFee;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email.trim());
  const checkoutBlocked = loading || !formData.customer_name.trim() || !emailValid || !formData.customer_phone.trim() ||
    !personalDataConsent || (isDelivery && (!formData.delivery_settlement_id || formData.delivery_address.trim().length < 5));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDelivery && !selectedSettlement) {
      showError('Выберите населённый пункт для доставки.');
      return;
    }
    if (isDelivery && formData.delivery_address.trim().length < 5) {
      showError('Укажите полный адрес доставки: улицу, дом и квартиру/офис.');
      return;
    }
    const email = formData.customer_email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Укажите корректный email перед оформлением заказа.');
      return;
    }
    if (!personalDataConsent) {
      showError('Подтвердите согласие на обработку персональных данных.');
      return;
    }
    setLoading(true);

    try {
      const order = await apiService.createOrder({
        items: items.map((i) => ({
          product_id: parseInt(i.product.id, 10),
          quantity: i.quantity,
        })),
        order_type: formData.order_type,
        delivery_address: isDelivery ? formData.delivery_address : 'В заведении',
        delivery_settlement_id: isDelivery ? formData.delivery_settlement_id : undefined,
        delivery_fee: deliveryFee,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || undefined,
        notes: formData.notes || undefined,
        payment_method: formData.payment_method,
      });

      if (formData.payment_method === 'card') {
        try {
          const payment = await apiService.createYooKassaPayment(order.id);
          window.location.assign(payment.confirmation_url);
          return;
        } catch (paymentError) {
          showError(paymentError instanceof Error ? paymentError.message : 'ЮKassa пока не настроена. Выберите оплату наличными.');
          return;
        }
      }
      clearCart();
      onClose();
      showSuccess('Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.');
    } catch (error) {
      console.error('Error creating order:', error);
      showError(error instanceof Error ? error.message : 'Ошибка при оформлении заказа.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'delivery_address') {
      setAddressQuery(value);
    }
  };

  useEffect(() => {
    if (!isDelivery) return;
    const q = addressQuery.trim();
    if (q.length < 2) {
      setAddressSuggestions([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        setAddressSuggestLoading(true);
        const rows = await apiService.dadataSuggestAddress(q);
        if (!cancelled) setAddressSuggestions(rows.slice(0, 10));
      } catch {
        if (!cancelled) setAddressSuggestions([]);
      } finally {
        if (!cancelled) setAddressSuggestLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [addressQuery, isDelivery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center space-x-4">
                <button onClick={onBack} className="text-gray-400 hover:text-gray-600">
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-gray-800">Оформление заказа</h2>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Контактная информация</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
                    <input
                      type="tel"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      placeholder="+7 (___) ___-__-__"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                       <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="customer_email"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                       required
                    />
                  </div>
                </div>
              </div>

              {!deliveryDisabled && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Тип заказа</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="order_type"
                        value="delivery"
                        checked={formData.order_type === 'delivery'}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      Доставка
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="order_type"
                        value="in_house"
                        checked={formData.order_type === 'in_house'}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      Заказ в заведении
                    </label>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <MapPin size={20} />
                  <span>{isDelivery ? 'Информация о доставке' : 'Посещение заведения'}</span>
                </h3>
                {isDelivery ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Населенный пункт *
                      </label>
                      <select
                        name="delivery_settlement_id"
                        value={formData.delivery_settlement_id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      >
                        <option value="">Выберите населенный пункт</option>
                        {deliverySettlements.map((settlement) => (
                          <option key={settlement.id} value={settlement.id}>
                            {settlement.name} — {settlement.price}₽ (мин. заказ от {settlement.min_order_amount}₽)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Адрес доставки *
                      </label>
                      <input
                        type="text"
                        name="delivery_address"
                        value={formData.delivery_address}
                        onChange={handleInputChange}
                        placeholder="Улица, дом, квартира"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                        list="dadata-address-suggestions"
                      />
                      <datalist id="dadata-address-suggestions">
                        {addressSuggestions.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                      {addressSuggestLoading ? (
                        <p className="text-xs text-gray-500 mt-1">Подбираем адрес...</p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Заказ будет подготовлен к выдаче в заведении. Доставка и адрес не требуются.
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <CreditCard size={20} />
                  <span>Способ оплаты</span>
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment_method"
                      value="cash"
                      checked={formData.payment_method === 'cash'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    Наличными
                  </label>
                  {isDelivery && (
                    <label className="flex items-center">
                      <input type="radio" name="payment_method" value="card" checked={formData.payment_method === 'card'} onChange={handleInputChange} className="mr-3" />
                      Картой онлайн через ЮKassa
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Комментарий к заказу
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Дополнительная информация..."
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Итого</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Товары:</span>
                    <span>{subtotal.toLocaleString('ru-RU')}₽</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Доставка:</span>
                    <span>{deliveryFee.toLocaleString('ru-RU')}₽</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Итого:</span>
                    <span>{totalAmount.toLocaleString('ru-RU')}₽</span>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 text-sm text-gray-600">
                <input type="checkbox" checked={personalDataConsent} onChange={(e) => setPersonalDataConsent(e.target.checked)} className="mt-1" required />
                <span>
                  Я согласен(на) на обработку персональных данных в соответствии с{' '}
                  <Link to="/privacy-policy?from=checkout" className="text-red-600 underline">Политикой конфиденциальности</Link>
                  {' '}и принимаю{' '}
                  <Link to="/offer?from=checkout" className="text-red-600 underline">Публичную оферту</Link>.
                </span>
              </label>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                 disabled={checkoutBlocked}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Оформляем заказ...' : 'Оформить заказ'}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
