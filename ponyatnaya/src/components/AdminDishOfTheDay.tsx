import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Clock, Save, Trash2 } from 'lucide-react';
import { apiService, type Product } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { AnimatedButton } from './ui/AnimatedButton';

interface DishOfTheDayData {
  id?: string;
  product?: Product;
  old_price?: number;
  sale_price?: number;
  active_from?: string;
  active_until?: string;
  is_active?: boolean;
}

export const AdminDishOfTheDay: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [dishData, setDishData] = useState<DishOfTheDayData | null>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [activeFrom, setActiveFrom] = useState('');
  const [activeUntil, setActiveUntil] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, dishData] = await Promise.all([
        apiService.adminGetProducts(),
        apiService.adminGetDishOfTheDay(),
      ]);
      setProducts(productsData);
      if (dishData) {
        setDishData(dishData);
        setSelectedProductId(dishData.product?.id || '');
        setOldPrice(dishData.old_price?.toString() || '');
        setSalePrice(dishData.sale_price?.toString() || '');
        setActiveFrom(dishData.active_from?.slice(0, 16) || '');
        setActiveUntil(dishData.active_until?.slice(0, 16) || '');
      }
    } catch (err) {
      showError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProductId) {
      showError('Выберите блюдо');
      return;
    }

    const oldPriceNum = oldPrice ? parseFloat(oldPrice) : null;
    const salePriceNum = salePrice ? parseFloat(salePrice) : null;
    const basePrice = selectedProduct ? Number(selectedProduct.price) : null;
    const effectiveSale = salePriceNum ?? basePrice;

    // Цены не могут быть отрицательными или нулевыми.
    if (oldPriceNum !== null && oldPriceNum <= 0) {
      showError('Старая цена должна быть больше нуля');
      return;
    }
    if (salePriceNum !== null && salePriceNum <= 0) {
      showError('Цена со скидкой должна быть больше нуля');
      return;
    }
    // Скидка не может уходить в минус: старая цена должна быть строго больше
    // цены со скидкой, иначе это наценка, а не скидка.
    if (oldPriceNum !== null && effectiveSale !== null && oldPriceNum <= effectiveSale) {
      showError('Старая цена должна быть больше цены со скидкой');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        product_id: parseInt(selectedProductId),
        old_price: oldPrice ? parseFloat(oldPrice) : undefined,
        sale_price: salePrice ? parseFloat(salePrice) : undefined,
        active_from: activeFrom || undefined,
        active_until: activeUntil || undefined,
      };

      if (dishData?.id) {
        await apiService.adminUpdateDishOfTheDay(payload);
      } else {
        await apiService.adminSetDishOfTheDay(payload);
      }
      showSuccess('Блюдо дня сохранено');
      loadData();
    } catch (err) {
      showError('Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить блюдо дня?')) return;

    setLoading(true);
    try {
      await apiService.adminDeleteDishOfTheDay();
      showSuccess('Блюдо дня удалено');
      setDishData(null);
      setSelectedProductId('');
      setOldPrice('');
      setSalePrice('');
      setActiveFrom('');
      setActiveUntil('');
    } catch (err) {
      showError('Ошибка удаления');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xl font-semibold">
        <Sparkles className="text-amber-500" />
        <h2>Блюдо дня</h2>
      </div>

      {loading && <div className="text-gray-500">Загрузка...</div>}

      {/* Текущее блюдо дня */}
      {dishData?.id && dishData.product && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="text-amber-500" size={24} />
              <div>
                <div className="text-sm text-gray-500">Текущее блюдо дня:</div>
                <div className="font-semibold text-lg">{dishData.product.name}</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-red-600 font-bold">
                    {dishData.sale_price || dishData.product.price} ₽
                  </span>
                  {dishData.old_price && (
                    <span className="text-gray-400 line-through">{dishData.old_price} ₽</span>
                  )}
                  {dishData.active_until && (
                    <span className="text-gray-500">
                      до {new Date(dishData.active_until).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <AnimatedButton
                variant="danger"
                loading={loading}
                icon={<Trash2 size={16} />}
                onClick={handleDelete}
              >
                Удалить
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        {/* Выбор блюда */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите блюдо
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">-- Выберите блюдо --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - {product.price} ₽
              </option>
            ))}
          </select>
        </div>

        {/* Старая цена (для скидки) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Старая цена (для отображения скидки)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={oldPrice}
            onChange={(e) => {
              const v = e.target.value;
              // Не допускаем отрицательных значений цены.
              if (v === '' || parseFloat(v) >= 0) setOldPrice(v);
            }}
            placeholder="Введите старую цену"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Цена со скидкой */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-red-600">
            Цена со скидкой (необязательно)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={salePrice}
            onChange={(e) => {
              const v = e.target.value;
              // Цена со скидкой не может быть отрицательной.
              if (v === '' || parseFloat(v) >= 0) setSalePrice(v);
            }}
            placeholder={selectedProduct ? `Текущая: ${selectedProduct.price} ₽` : 'Введите цену со скидкой'}
            className="w-full px-3 py-2 border-2 border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Если не указать, будет использована текущая цена товара
          </p>
        </div>

        {/* Дата начала */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Calendar size={16} />
            Активно с (необязательно)
          </label>
          <input
            type="datetime-local"
            value={activeFrom}
            onChange={(e) => setActiveFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Дата окончания */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Clock size={16} />
            Активно до (необязательно)
          </label>
          <input
            type="datetime-local"
            value={activeUntil}
            onChange={(e) => setActiveUntil(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Предпросмотр */}
        {selectedProduct && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-medium mb-2">Предпросмотр:</h3>
            <div className="flex items-center gap-4">
              {selectedProduct.image_url && (
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div>
                <div className="font-semibold">{selectedProduct.name}</div>
                <div className="flex items-center gap-2">
                  <span className="text-red-600 font-bold text-xl">
                    {salePrice || selectedProduct.price} ₽
                  </span>
                  {oldPrice && parseFloat(oldPrice) > parseFloat(salePrice || String(selectedProduct.price)) && (
                    <>
                      <span className="text-gray-400 line-through">
                        {oldPrice} ₽
                      </span>
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm">
                        -{Math.max(0, Math.round(((parseFloat(oldPrice) - parseFloat(salePrice || String(selectedProduct.price))) / parseFloat(oldPrice)) * 100))}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-3 pt-4">
          <AnimatedButton
            loading={loading}
            icon={<Save size={18} />}
            onClick={handleSave}
          >
            {dishData?.id ? 'Обновить' : 'Сохранить'}
          </AnimatedButton>

          {dishData?.id && (
            <AnimatedButton
              variant="neutral"
              loading={loading}
              icon={<Trash2 size={18} />}
              onClick={handleDelete}
            >
              Удалить
            </AnimatedButton>
          )}
        </div>
      </div>
    </div>
  );
};
