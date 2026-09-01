import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Package, ShoppingBag, Settings, RefreshCw, Percent, Sparkles, Send, PlusCircle, Star, Users, Shield, Lock, Ban, LayoutTemplate, FileUp, Plus, Eye, EyeOff, Edit3, Trash2, Save, FileText, Phone } from 'lucide-react';
import { AdminDishOfTheDay } from './AdminDishOfTheDay';
import { BroadcastTab } from './BroadcastTab';
import { OnSiteOrderTab } from './OnSiteOrderTab';
import { AdminReviewsTab } from './AdminReviewsTab';
  import { AdminHeroSlides } from './AdminHeroSlides';
  import { AdminDisableFeatures } from './AdminDisableFeatures';
  import { AdminLegalDocuments } from './AdminLegalDocuments';
  import { AdminStaff } from './AdminStaff';
  import { AdminMenuImportExport } from './AdminMenuImportExport';
  import { AdminSitePopup } from './AdminSitePopup';
  import { AdminContactSettings } from './AdminContactSettings';
import { AnimatedButton } from './ui/AnimatedButton';
import { FileDropzone } from './ui/FileDropzone';
import { apiService, buildNameWithWeight, type OrderRecord } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Компактный контрол статуса заказа: цветной бейдж как в списке заказов
// + подписанные кнопки быстрого перехода между статусами по цепочке.
// В `allowReopen` разрешаем менять статус даже у завершённых/отменённых заказов —
// админ может вернуть заказ в работу, если его случайно закрыли.
type OrderStatusValue =
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'delivering'
  | 'completed'
  | 'cancelled'
  | 'awaiting_payment'
  | 'paid';

const ORDER_STATUS_META: Record<OrderStatusValue, { label: string; color: string }> = {
  new: { label: 'Новый', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  awaiting_payment: { label: 'Ожидает оплаты', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  paid: { label: 'Оплачен', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  confirmed: { label: 'Подтверждён', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  preparing: { label: 'Готовится', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  delivering: { label: 'Доставляется', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  completed: { label: 'Завершён', color: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: 'Отменён', color: 'bg-red-100 text-red-700 border-red-200' },
};

const OrderStatusControl: React.FC<{
  status: string;
  onChange: (next: string) => void | Promise<void>;
  allowReopen?: boolean;
}> = ({ status, onChange, allowReopen }) => {
  const current = (status as OrderStatusValue) in ORDER_STATUS_META
    ? (status as OrderStatusValue)
    : ('new' as OrderStatusValue);
  const meta = ORDER_STATUS_META[current] ?? ORDER_STATUS_META.new;

  return (
    <div className="flex flex-col items-stretch gap-2">
      <span
        className={`inline-flex justify-center items-center rounded-full border px-3 py-1 text-sm font-medium ${meta.color}`}
      >
        {meta.label}
      </span>
      <label className="text-xs text-gray-500 text-left">
        Сменить статус:
        <select
          value={current}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:border-red-500 focus:outline-none"
        >
          {Object.entries(ORDER_STATUS_META).map(([value, m]) => (
            <option key={value} value={value}>{m.label}</option>
          ))}
        </select>
      </label>
      {allowReopen && (current === 'completed' || current === 'cancelled') && (
        <button
          type="button"
          onClick={() => onChange('preparing')}
          className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
        >
          Вернуть в работу
        </button>
      )}
    </div>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { isTabDisabled, refresh: refreshFlags } = useFeatureFlags();
  const [mode, setMode] = useState<'employee' | 'admin'>('employee');
  // Пароль ADMIN_PASSWORD запрашивается только при переключении в режим «Админ».
  // Вход в саму панель для сотрудника свободный (по роли).
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [verifyingAdmin, setVerifyingAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [adminTab, setAdminTab] = useState<'disable' | 'slider' | 'popup' | 'broadcast' | 'staff' | 'documents' | 'contacts' | 'delivery'>('disable');
  const [loading, setLoading] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderRecord[]>([]);
  const [historyDate, setHistoryDate] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof apiService.adminGetProducts>>>([]);
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof apiService.adminGetCategories>>>([]);
  const [promotions, setPromotions] = useState<Awaited<ReturnType<typeof apiService.adminGetPromotions>>>([]);
  const knownOrderIds = useRef<Set<string>>(new Set());
  const [newOrderNotice, setNewOrderNotice] = useState<string>('');
  const [productForm, setProductForm] = useState({
    name: '',
    weight: '',
    price: '',
    category: '',
    subcategory: '',
    promotion: '',
    composition: '',
    protein_per_100g: '',
    fat_per_100g: '',
    carbs_per_100g: '',
    calories_per_100g: '',
    is_available: true,
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState<File | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryCategoryId, setNewSubcategoryCategoryId] = useState('');
  const [editingCategorySlug, setEditingCategorySlug] = useState<string | null>(null);
  const [categoryEditName, setCategoryEditName] = useState('');
  const [categoryEditImage, setCategoryEditImage] = useState<File | null>(null);

  const [promotionForm, setPromotionForm] = useState({
    name: '',
    description: '',
    conditions: '',
    terms: '',
    pdf_link_text: '',
    end_date: '',
  });
  const [promotionImage, setPromotionImage] = useState<File | null>(null);
  const [promotionBannerImage, setPromotionBannerImage] = useState<File | null>(null);
  const [promotionPdfFile, setPromotionPdfFile] = useState<File | null>(null);
  const [submittingPromotion, setSubmittingPromotion] = useState(false);
  const [editingPromotionSlug, setEditingPromotionSlug] = useState<string | null>(null);
  const [submittingPromotionEdit, setSubmittingPromotionEdit] = useState(false);

  const [editingProductSlug, setEditingProductSlug] = useState<string | null>(null);
  const [submittingProductEdit, setSubmittingProductEdit] = useState(false);
  const [productEditImage, setProductEditImage] = useState<File | null>(null);
  const [productEditForm, setProductEditForm] = useState({
    name: '',
    weight: '',
    price: '',
    category: '',
    subcategory: '',
    promotion: '',
    composition: '',
    protein_per_100g: '',
    fat_per_100g: '',
    carbs_per_100g: '',
    calories_per_100g: '',
    is_available: true,
  });

  const [refreshingOrders, setRefreshingOrders] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiService.adminGetOrders();
      // Фильтруем только незавершенные заказы
      const activeOrders = data.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
      const ids = new Set(activeOrders.map((o) => String(o.id)));
      if (knownOrderIds.current.size > 0) {
        const freshOrders = activeOrders.filter((o) => !knownOrderIds.current.has(String(o.id)));
        if (freshOrders.length > 0) {
          setNewOrderNotice(`Новый заказ: +${freshOrders.length}`);
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('Новый заказ', { body: `Поступило новых заказов: ${freshOrders.length}` });
            } else if (Notification.permission === 'default') {
              void Notification.requestPermission();
            }
          }
        }
      }
      knownOrderIds.current = ids;
      setOrders(activeOrders);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    const data = await apiService.adminGetProducts();
    setProducts(data);
  }, []);

  const loadCategories = useCallback(async () => {
    const data = await apiService.adminGetCategories();
    setCategories(data);
  }, []);

  const loadPromotions = useCallback(async () => {
    const data = await apiService.adminGetPromotions();
    setPromotions(data);
  }, []);

  const loadOrderHistory = useCallback(async (date?: string) => {
    setHistoryLoading(true);
    try {
      const data = await apiService.adminGetOrderHistory(date);
      setOrderHistory(data);
    } catch (e) {
      console.error(e);
      showError('Не удалось загрузить историю заказов');
    } finally {
      setHistoryLoading(false);
    }
  }, [showError]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([loadOrders(), loadProducts(), loadCategories(), loadPromotions()]);
      results.forEach((r) => {
        if (r.status === 'rejected') console.error('Error loading admin data:', r.reason);
      });
    } finally {
      setLoading(false);
    }
  }, [loadOrders, loadProducts, loadCategories, loadPromotions]);

  useEffect(() => {
    if (!isOpen || !user?.is_staff) return;
    void loadAllData();
  }, [isOpen, user?.is_staff, loadAllData]);

  // При закрытии панели или потере роли сбрасываем режим «Админ».
  useEffect(() => {
    if (!isOpen || !user?.is_staff) {
      setAdminUnlocked(false);
      setMode('employee');
    }
  }, [isOpen, user?.is_staff]);

  useEffect(() => {
    if (!categories.length) return;
    if (!newSubcategoryCategoryId) {
      setNewSubcategoryCategoryId(categories[0].id);
    }
  }, [categories, newSubcategoryCategoryId]);

  useEffect(() => {
    if (!isOpen || !user?.is_staff || activeTab !== 'orders') return;
    const interval = setInterval(() => {
      void loadOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, user?.is_staff, activeTab, loadOrders]);

  // При переходе на вкладку «История заказов» сразу подгружаем актуальные данные.
  useEffect(() => {
    if (!isOpen || !user?.is_staff || activeTab !== 'history') return;
    void loadOrderHistory(historyDate);
  }, [isOpen, user?.is_staff, activeTab, historyDate, loadOrderHistory]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await apiService.adminUpdateOrderStatus(orderId, status);
      // Обновляем ОБЕ вкладки: заказ мог переехать между «Текущие» и «История»,
      // поэтому нельзя перезагружать только тот список, где сейчас пользователь.
      await Promise.all([loadOrders(), loadOrderHistory(historyDate)]);
      showSuccess('Статус заказа обновлён');
    } catch (e) {
      showError('Не удалось обновить статус');
    }
  };

  const completeOrder = async (orderId: string) => {
    if (!window.confirm('Завершить заказ? Он переместится в историю.')) return;
    try {
      await apiService.adminCompleteOrder(orderId);
      await loadOrders();
      showSuccess('Заказ завершён');
    } catch (e) {
      showError('Не удалось завершить заказ');
    }
  };

  const deleteCategory = async (slug: string) => {
    if (!window.confirm('Удалить категорию? Это действие необратимо.')) return;
    try {
      await apiService.adminDeleteCategory(slug);
      await loadCategories();
      showSuccess('Категория удалена');
    } catch (e) {
      showError('Не удалось удалить категорию');
    }
  };

  const deleteSubcategory = async (slug: string) => {
    if (!window.confirm('Удалить подкатегорию? Это действие необратимо.')) return;
    try {
      await apiService.adminDeleteSubcategory(slug);
      await loadCategories();
      showSuccess('Подкатегория удалена');
    } catch (e) {
      showError('Не удалось удалить подкатегорию');
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'delivering':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const orderShortId = (id: string) => (id.length > 8 ? id.slice(-8) : id);

  // Имя и телефон клиента: имя по умолчанию «Гость», телефон показываем только если он указан.
  const customerLine = (name?: string, phone?: string) => {
    const displayName = (name || '').trim() || 'Гость';
    const displayPhone = (phone || '').trim();
    return displayPhone ? `${displayName} · ${displayPhone}` : displayName;
  };

  const parseNum = (v: string) => parseFloat(v.replace(',', '.')) || 0;
  const parseDecimalOrNull = (v: string): number | null => {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };

  const toggleAvailability = async (product: (typeof products)[number]) => {
    try {
      await apiService.adminUpdateProduct(product, {
        is_available: !product.is_active,
      });
      await loadProducts();
    } catch (error) {
      console.error(error);
      alert('Не удалось изменить наличие товара.');
    }
  };

  const deleteProduct = async (slug: string) => {
    if (!window.confirm('Удалить товар? Это действие необратимо.')) return;
    try {
      await apiService.adminDeleteProduct(slug);
      await loadProducts();
    } catch (error) {
      console.error(error);
      alert('Не удалось удалить товар.');
    }
  };

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const protein = parseDecimalOrNull(productForm.protein_per_100g);
    const fat = parseDecimalOrNull(productForm.fat_per_100g);
    const carbs = parseDecimalOrNull(productForm.carbs_per_100g);
    const calories = parseDecimalOrNull(productForm.calories_per_100g);
    if ([protein, fat, carbs, calories].some((x) => x == null)) {
      alert('Укажите БЖУ и ккал (4 числа) на 100 г.');
      return;
    }
    const price = parseNum(productForm.price);
    if (!price) {
      alert('Укажите корректную цену.');
      return;
    }
    if (!productForm.category) {
      alert('Выберите категорию.');
      return;
    }

    setSubmittingProduct(true);
    try {
      await apiService.adminCreateProduct({
        name_with_weight: buildNameWithWeight(productForm.name, productForm.weight),
        price,
        image: productImage ?? undefined,
        is_available: productForm.is_available,
        composition: productForm.composition.trim(),
        category: parseInt(productForm.category, 10),
        nutrition_per_100g: [protein!, fat!, carbs!, calories!],
        ...(productForm.subcategory ? { subcategory: parseInt(productForm.subcategory, 10) } : {}),
        ...(productForm.promotion ? { promotion: parseInt(productForm.promotion, 10) } : {}),
      });
      setProductForm({
        name: '',
        weight: '',
        price: '',
        category: '',
        subcategory: '',
        promotion: '',
        composition: '',
        protein_per_100g: '',
        fat_per_100g: '',
        carbs_per_100g: '',
        calories_per_100g: '',
        is_available: true,
      });
      setProductImage(null);
      await loadProducts();
      setActiveTab('products');
    } catch (error) {
      console.error(error);
      alert('Не удалось создать товар. Проверьте заполнение формы.');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) {
      alert('Укажите название категории.');
      return;
    }
    try {
      await apiService.adminCreateCategory({ name, image: newCategoryImage });
      setNewCategoryName('');
      setNewCategoryImage(null);
      await loadCategories();
    } catch (error) {
      console.error(error);
      alert('Не удалось создать категорию.');
    }
  };

  const startEditCategory = (slug: string, name: string) => {
    setEditingCategorySlug(slug);
    setCategoryEditName(name);
    setCategoryEditImage(null);
  };

  const closeEditCategory = () => {
    setEditingCategorySlug(null);
    setCategoryEditImage(null);
  };

  const submitEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategorySlug) return;
    const name = categoryEditName.trim();
    if (!name) {
      alert('Укажите название категории.');
      return;
    }
    try {
      await apiService.adminUpdateCategory(editingCategorySlug, {
        name,
        image: categoryEditImage ?? undefined,
      });
      await loadCategories();
      closeEditCategory();
    } catch (error) {
      console.error(error);
      alert('Не удалось обновить категорию.');
    }
  };

  const createSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSubcategoryName.trim();
    if (!name) {
      alert('Укажите название подкатегории.');
      return;
    }
    if (!newSubcategoryCategoryId) {
      alert('Выберите категорию для подкатегории.');
      return;
    }
    try {
      await apiService.adminCreateSubcategory({
        name,
        category: parseInt(newSubcategoryCategoryId, 10),
      });
      setNewSubcategoryName('');
      await loadCategories();
    } catch (error) {
      console.error(error);
      alert('Не удалось создать подкатегорию.');
    }
  };

  const createPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = promotionForm.name.trim();
    const description = promotionForm.description.trim();
    const conditions = promotionForm.conditions.trim();
    const terms = promotionForm.terms.trim();
    const pdf_link_text = promotionForm.pdf_link_text.trim();
    if (!name) {
      alert('Укажите название акции.');
      return;
    }
    if (!description) {
      alert('Укажите описание акции.');
      return;
    }
    if (!promotionImage) {
      alert('Добавьте изображение акции.');
      return;
    }
    setSubmittingPromotion(true);
    try {
      await apiService.adminCreatePromotion({
        name,
        description,
        image: promotionImage,
        conditions,
        terms,
        pdf_file: promotionPdfFile || undefined,
        pdf_link_text,
        banner_image: promotionBannerImage || undefined,
        end_date: promotionForm.end_date || undefined,
      });
      setPromotionForm({ name: '', description: '', conditions: '', terms: '', pdf_link_text: '', end_date: '' });
      setPromotionImage(null);
      setPromotionBannerImage(null);
      setPromotionPdfFile(null);
      await loadPromotions();
      setActiveTab('promotions');
    } catch (error) {
      console.error(error);
      alert('Не удалось создать акцию.');
    } finally {
      setSubmittingPromotion(false);
    }
  };

  const startEditPromotion = (promotion: (typeof promotions)[number]) => {
    setEditingPromotionSlug(promotion.slug);
    setPromotionForm({
      name: promotion.title,
      description: promotion.description,
      conditions: promotion.conditions || '',
      terms: promotion.terms || '',
      pdf_link_text: promotion.pdf_link_text || '',
      end_date: promotion.end_date ? promotion.end_date.slice(0, 16) : '',
    });
    setPromotionImage(null);
    setPromotionBannerImage(null);
    setPromotionPdfFile(null);
  };

  const cancelEditPromotion = () => {
    setEditingPromotionSlug(null);
    setPromotionForm({ name: '', description: '', conditions: '', terms: '', pdf_link_text: '', end_date: '' });
    setPromotionImage(null);
    setPromotionBannerImage(null);
    setPromotionPdfFile(null);
  };

  const saveEditPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromotionSlug) return;
    const name = promotionForm.name.trim();
    const description = promotionForm.description.trim();
    if (!name || !description) {
      alert('Укажите название и описание акции.');
      return;
    }
    setSubmittingPromotionEdit(true);
    try {
      await apiService.adminUpdatePromotion(editingPromotionSlug, {
        name,
        description,
        image: promotionImage,
        conditions: promotionForm.conditions.trim(),
        terms: promotionForm.terms.trim(),
        pdf_file: promotionPdfFile,
        pdf_link_text: promotionForm.pdf_link_text.trim(),
        banner_image: promotionBannerImage,
        end_date: promotionForm.end_date || undefined,
      });
      cancelEditPromotion();
      await loadPromotions();
    } catch (error) {
      console.error(error);
      alert('Не удалось обновить акцию.');
    } finally {
      setSubmittingPromotionEdit(false);
    }
  };

  const deletePromotion = async (slug: string) => {
    if (!window.confirm('Удалить акцию? Это действие необратимо.')) return;
    try {
      await apiService.adminDeletePromotion(slug);
      await loadPromotions();
    } catch (error) {
      console.error(error);
      alert('Не удалось удалить акцию.');
    }
  };

  const startEditProduct = (product: (typeof products)[number]) => {
    const nutrition = product.nutrition_per_100g ?? [];
    setProductEditImage(null);
    setProductEditForm({
      name: product.name,
      weight: product.weight ?? '',
      price: String(product.price),
      category: product.category_id,
      subcategory: product.subcategory_id ?? '',
      promotion: '',
      composition: product.description ?? '',
      protein_per_100g: String(nutrition[0] ?? ''),
      fat_per_100g: String(nutrition[1] ?? ''),
      carbs_per_100g: String(nutrition[2] ?? ''),
      calories_per_100g: String(nutrition[3] ?? ''),
      is_available: product.is_active,
    });
    setEditingProductSlug(product.slug);
  };

  const closeEditProduct = () => {
    setEditingProductSlug(null);
    setProductEditImage(null);
  };

  const submitEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductSlug) return;

    const productToEdit = products.find((p) => p.slug === editingProductSlug);
    if (!productToEdit) return;

    const name = productEditForm.name.trim();
    if (!name) {
      alert('Укажите название товара.');
      return;
    }
    const name_with_weight = buildNameWithWeight(name, productEditForm.weight);

    const composition = productEditForm.composition.trim();
    if (!composition) {
      alert('Укажите состав товара.');
      return;
    }

    const price = parseNum(productEditForm.price);
    if (!price) {
      alert('Укажите корректную цену.');
      return;
    }

    if (!productEditForm.category) {
      alert('Выберите категорию.');
      return;
    }

    const protein = parseDecimalOrNull(productEditForm.protein_per_100g);
    const fat = parseDecimalOrNull(productEditForm.fat_per_100g);
    const carbs = parseDecimalOrNull(productEditForm.carbs_per_100g);
    const calories = parseDecimalOrNull(productEditForm.calories_per_100g);
    if ([protein, fat, carbs, calories].some((x) => x == null)) {
      alert('Укажите БЖУ и ккал (4 числа) на 100 г.');
      return;
    }

    const body: Record<string, unknown> = {
      name_with_weight,
      price,
      is_available: productEditForm.is_available,
      composition,
      category: parseInt(productEditForm.category, 10),
      subcategory: productEditForm.subcategory
        ? parseInt(productEditForm.subcategory, 10)
        : null,
      promotion: productEditForm.promotion ? parseInt(productEditForm.promotion, 10) : null,
      nutrition_per_100g: [protein!, fat!, carbs!, calories!],
    };

    if (productEditImage) {
      body.image = productEditImage;
    }

    setSubmittingProductEdit(true);
    try {
      await apiService.adminUpdateProduct(productToEdit, body);
      await loadProducts();
      closeEditProduct();
    } catch (error) {
      console.error(error);
      alert('Не удалось обновить товар.');
    } finally {
      setSubmittingProductEdit(false);
    }
  };

  const handleVerifyAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError('');
    setVerifyingAdmin(true);
    try {
      const res = await apiService.verifyAdminPassword(adminPassword, 'admin');
      if (res.verified) {
        setAdminUnlocked(true);
        setAdminPassword('');
        void refreshFlags();
      } else {
        setAdminAuthError('Неверный пароль администратора.');
      }
    } catch (err) {
      setAdminAuthError(err instanceof Error ? err.message : 'Ошибка проверки пароля.');
    } finally {
      setVerifyingAdmin(false);
    }
  };

  const switchMode = (next: 'employee' | 'admin') => {
    setMode(next);
    if (next === 'admin') {
      setAdminAuthError('');
    }
  };

  if (!isOpen) return null;

  if (!user?.is_staff) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <p className="text-gray-700 mb-4">Доступ к панели только у сотрудников.</p>
          <button type="button" onClick={onClose} className="w-full bg-red-600 text-white py-2 rounded-lg">
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        <div className="flex flex-col gap-4 p-6 border-b md:flex-row md:justify-between md:items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Панель управления</h2>
            <div className="inline-flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => switchMode('employee')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'employee' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Users size={16} />
                Сотрудник
              </button>
              <button
                type="button"
                onClick={() => switchMode('admin')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'admin' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Shield size={16} />
                Админ
              </button>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 self-end md:self-auto">
            <X size={24} />
          </button>
        </div>

        {mode === 'admin' && !adminUnlocked ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <form onSubmit={handleVerifyAdmin} className="w-full max-w-sm text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Lock size={26} className="text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-1">Вход в режим «Админ»</h3>
              <p className="text-sm text-gray-500 mb-6">
                Введите отдельный пароль администратора для доступа к настройкам.
              </p>
              <input
                type="password"
                autoFocus
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Пароль администратора"
                className="w-full border rounded-lg px-4 py-2.5 mb-3 text-center"
              />
              {adminAuthError && <p className="text-sm text-red-600 mb-3">{adminAuthError}</p>}
              <button
                type="submit"
                disabled={verifyingAdmin}
                className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {verifyingAdmin ? 'Проверка…' : 'Войти'}
              </button>
            </form>
          </div>
        ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 bg-gray-50 border-r overflow-y-auto">
            {mode === 'employee' ? (
            <nav className="p-4 space-y-2">
              {[
                { id: 'orders', icon: ShoppingBag, label: 'Текущие заказы' },
                { id: 'onsite', icon: PlusCircle, label: 'Новый заказ' },
                { id: 'history', icon: ShoppingBag, label: 'История заказов' },
                { id: 'products', icon: Package, label: 'Товары' },
                { id: 'categories', icon: Settings, label: 'Категории' },
                { id: 'promotions', icon: Percent, label: 'Акции' },
                { id: 'dishofday', icon: Sparkles, label: 'Блюдо дня' },
                { id: 'reviews', icon: Star, label: 'Отзывы' },
                { id: 'import-export', icon: FileUp, label: 'Импорт / Экспорт' },
              ]
                .filter((tab) => !isTabDisabled(tab.id))
                .map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <tab.icon size={20} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
            ) : (
            <nav className="p-4 space-y-2">
              {[
                 { id: 'contacts' as const, icon: Phone, label: 'Телефон и часы' },
                 { id: 'delivery' as const, icon: ShoppingBag, label: 'Настройки доставки' },
                { id: 'disable' as const, icon: Ban, label: 'Отключить страницы' },
                { id: 'slider' as const, icon: LayoutTemplate, label: 'Слайдер' },
                { id: 'popup' as const, icon: Sparkles, label: 'Всплывающее окно' },
                { id: 'broadcast' as const, icon: Send, label: 'Рассылка в Telegram' },
                { id: 'documents' as const, icon: FileText, label: 'Документы' },
                { id: 'staff' as const, icon: Users, label: 'Сотрудники' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAdminTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    adminTab === tab.id ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <tab.icon size={20} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {mode === 'admin' && (
              <>
                {adminTab === 'contacts' && <AdminContactSettings />}
                {adminTab === 'delivery' && <AdminContactSettings focus="delivery" />}
                {adminTab === 'disable' && <AdminDisableFeatures />}
                {adminTab === 'slider' && <AdminHeroSlides />}
                {adminTab === 'popup' && <AdminSitePopup />}
                {adminTab === 'broadcast' && <BroadcastTab />}
                {adminTab === 'documents' && <AdminLegalDocuments />}
                {adminTab === 'staff' && <AdminStaff />}
              </>
            )}

            {mode === 'employee' && (
            <>
            {activeTab === 'import-export' && <AdminMenuImportExport onImported={() => { void loadProducts(); void loadCategories(); }} />}

            {loading && activeTab === 'orders' && orders.length === 0 && (
              <p className="text-gray-500">Загрузка...</p>
            )}

            {activeTab === 'orders' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Текущие заказы</h3>
                  <div className="flex items-center gap-3">
                    {newOrderNotice ? (
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">{newOrderNotice}</span>
                    ) : null}
                    <AnimatedButton
                      type="button"
                      variant="info"
                      loading={refreshingOrders}
                      icon={<RefreshCw size={16} />}
                      onClick={async () => {
                        setNewOrderNotice('');
                        setRefreshingOrders(true);
                        try {
                          await loadOrders();
                        } finally {
                          setRefreshingOrders(false);
                        }
                      }}
                    >
                      Обновить
                    </AnimatedButton>
                  </div>
                </div>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
                        <div>
                          <h4 className="font-semibold text-lg">Заказ #{orderShortId(String(order.id))}</h4>
                          <p>{customerLine(order.customer_name, order.customer_phone)}</p>
                          <p className="text-sm text-gray-600">{order.delivery_address}</p>
                          <p className="text-sm text-gray-600">
                            Тип заказа: {order.order_type === 'delivery' ? 'Доставка' : 'В заведении'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Оплата: {order.payment_method === 'cash' ? 'Наличные' : order.payment_method}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleString('ru-RU')}
                          </p>
                        </div>
                        <div className="text-right w-full sm:w-auto sm:min-w-[280px]">
                          <div className="text-2xl font-bold text-green-600 mb-2">
                            {parseNum(order.total_amount || order.total_price).toLocaleString('ru-RU')}₽
                          </div>
                          <OrderStatusControl
                            status={order.status}
                            onChange={(next) => updateOrderStatus(String(order.id), next)}
                          />
                          <button
                            type="button"
                            onClick={() => completeOrder(String(order.id))}
                            className="mt-2 w-full px-3 py-1.5 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                          >
                            Завершить и в архив
                          </button>
                        </div>
                      </div>
                      {order.items?.length ? (
                        <div className="border-t pt-4">
                          <h5 className="font-medium mb-2">Состав:</h5>
                          {order.items.map((item) => {
                            const unit = parseNum(item.price);
                            const line = unit * item.quantity;
                            return (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>
                                  {item.product_name} × {item.quantity}
                                </span>
                                <span>{line.toLocaleString('ru-RU')}₽</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {!orders.length && !loading && (
                    <p className="text-gray-500">Текущих заказов нет.</p>
                  )}
                </div>
              </>
            )}

            {activeTab === 'history' && (
              <>
                <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
                  <h3 className="text-xl font-semibold">История заказов</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Дата:</span>
                      <input
                        type="date"
                        value={historyDate}
                        onChange={(e) => {
                          setHistoryDate(e.target.value);
                          void loadOrderHistory(e.target.value);
                        }}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                      />
                    </label>
                    {historyDate && (
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryDate('');
                          void loadOrderHistory('');
                        }}
                        className="text-sm text-red-600 hover:text-red-700 underline"
                      >
                        Сбросить
                      </button>
                    )}
                    <AnimatedButton
                      type="button"
                      variant="info"
                      loading={historyLoading}
                      icon={<RefreshCw size={16} />}
                      onClick={() => loadOrderHistory(historyDate)}
                    >
                      Обновить
                    </AnimatedButton>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {historyDate
                    ? `Показаны заказы за ${new Date(historyDate).toLocaleDateString('ru-RU')}.`
                    : 'Показаны все завершённые и отменённые заказы. Выберите дату, чтобы отфильтровать.'}
                </p>
                {historyLoading ? (
                  <p className="text-gray-500">Загрузка…</p>
                ) : (
                  <div className="space-y-4">
                    {orderHistory.map((order) => (
                      <div key={order.id} className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
                          <div>
                            <h4 className="font-semibold text-lg">Заказ #{orderShortId(String(order.id))}</h4>
                            <p>{customerLine(order.customer_name, order.customer_phone)}</p>
                            <p className="text-sm text-gray-600">{order.delivery_address}</p>
                            <p className="text-sm text-gray-600">
                              Тип заказа: {order.order_type === 'delivery' ? 'Доставка' : 'В заведении'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Оплата: {order.payment_method === 'cash' ? 'Наличные' : order.payment_method}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleString('ru-RU')}
                            </p>
                          </div>
                          <div className="text-right w-full sm:w-auto sm:min-w-[280px]">
                            <div className="text-2xl font-bold text-green-600 mb-2">
                              {parseNum(order.total_amount || order.total_price).toLocaleString('ru-RU')}₽
                            </div>
                            <OrderStatusControl
                              status={order.status}
                              onChange={(next) => updateOrderStatus(String(order.id), next)}
                              allowReopen
                            />
                          </div>
                        </div>
                        {order.items?.length ? (
                          <div className="border-t pt-4">
                            <h5 className="font-medium mb-2">Состав:</h5>
                            {order.items.map((item) => {
                              const unit = parseNum(item.price);
                              const line = unit * item.quantity;
                              return (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span>
                                    {item.product_name} × {item.quantity}
                                  </span>
                                  <span>{line.toLocaleString('ru-RU')}₽</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {!orderHistory.length && !historyLoading && (
                      <p className="text-gray-500">Заказов за выбранную дату нет. Выберите дату и нажмите "Загрузить".</p>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'products' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Товары и ассортимент</h3>
                </div>
                <form onSubmit={createProduct} className="bg-gray-50 border rounded-lg p-4 mb-6 space-y-3">
                  <h4 className="font-medium">Добавить новый товар</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={productForm.name}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Название"
                      className="border rounded px-3 py-2"
                      required
                    />
                    <input
                      value={productForm.weight}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, weight: e.target.value }))}
                      placeholder="Вес (например: 500 г)"
                      className="border rounded px-3 py-2"
                    />
                    <input
                      value={productForm.price}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))}
                      placeholder="Цена"
                      className="border rounded px-3 py-2"
                      required
                    />
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, category: e.target.value }))}
                      className="border rounded px-3 py-2"
                      required
                    >
                      <option value="">Выберите категорию</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={productForm.subcategory}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, subcategory: e.target.value }))}
                      className="border rounded px-3 py-2"
                    >
                      <option value="">Без подкатегории</option>
                      {(categories.find((cat) => cat.id === productForm.category)?.subcategories ?? []).map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={productForm.promotion}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, promotion: e.target.value }))}
                      className="border rounded px-3 py-2"
                    >
                      <option value="">Без акции</option>
                      {promotions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>

                    <input
                      value={productForm.protein_per_100g}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, protein_per_100g: e.target.value }))}
                      placeholder="Белки на 100 г"
                      className="border rounded px-3 py-2"
                      required
                    />
                    <input
                      value={productForm.fat_per_100g}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, fat_per_100g: e.target.value }))}
                      placeholder="Жиры на 100 г"
                      className="border rounded px-3 py-2"
                      required
                    />
                    <input
                      value={productForm.carbs_per_100g}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, carbs_per_100g: e.target.value }))}
                      placeholder="Углеводы на 100 г"
                      className="border rounded px-3 py-2"
                      required
                    />
                    <input
                      value={productForm.calories_per_100g}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, calories_per_100g: e.target.value }))}
                      placeholder="Ккал на 100 г"
                      className="border rounded px-3 py-2"
                      required
                    />
                    <textarea
                      value={productForm.composition}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, composition: e.target.value }))}
                      placeholder="Состав"
                      className="border rounded px-3 py-2 md:col-span-2"
                      rows={2}
                      required
                    />
                    <div className="md:col-span-2">
                      <FileDropzone
                        label="Фото товара"
                        value={productImage}
                        onChange={setProductImage}
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={productForm.is_available}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, is_available: e.target.checked }))}
                    />
                    В наличии
                  </label>
                  <AnimatedButton
                    type="submit"
                    loading={submittingProduct}
                    icon={<Plus size={18} />}
                  >
                    {submittingProduct ? 'Сохраняем...' : 'Добавить товар'}
                  </AnimatedButton>
                </form>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">Нет фото</div>
                        )}
                      </div>
                      <h4 className="font-medium mb-1 line-clamp-2 min-h-[2.5rem]">{product.name}</h4>
                      <p className="text-green-600 font-bold mb-3">{product.price}₽</p>
                      <div className="grid grid-cols-2 gap-2">
                        <AnimatedButton
                          type="button"
                          size="sm"
                          variant={product.is_active ? 'warning' : 'success'}
                          className="col-span-2"
                          icon={product.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                          onClick={() => void toggleAvailability(product)}
                        >
                          {product.is_active ? 'Снять с наличия' : 'Вернуть в наличие'}
                        </AnimatedButton>
                        <AnimatedButton
                          type="button"
                          size="sm"
                          variant="secondary"
                          icon={<Edit3 size={16} />}
                          onClick={() => startEditProduct(product)}
                        >
                          Изменить
                        </AnimatedButton>
                        <AnimatedButton
                          type="button"
                          size="sm"
                          variant="danger"
                          icon={<Trash2 size={16} />}
                          onClick={() => void deleteProduct(product.slug)}
                        >
                          Удалить
                        </AnimatedButton>
                      </div>
                    </div>
                  ))}
                </div>

                {editingProductSlug ? (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center p-6 border-b">
                        <h3 className="text-xl font-semibold">Редактирование товара</h3>
                        <button
                          type="button"
                          onClick={closeEditProduct}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={22} />
                        </button>
                      </div>

                      <form onSubmit={submitEditProduct} className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            value={productEditForm.name}
                            onChange={(e) => setProductEditForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Название"
                            className="border rounded px-3 py-2"
                            required
                          />
                          <input
                            value={productEditForm.weight}
                            onChange={(e) => setProductEditForm((prev) => ({ ...prev, weight: e.target.value }))}
                            placeholder="Вес (например: 500 г)"
                            className="border rounded px-3 py-2"
                          />
                          <input
                            value={productEditForm.price}
                            onChange={(e) => setProductEditForm((prev) => ({ ...prev, price: e.target.value }))}
                            placeholder="Цена"
                            className="border rounded px-3 py-2"
                            required
                          />

                          <select
                            value={productEditForm.category}
                            onChange={(e) => setProductEditForm((prev) => ({ ...prev, category: e.target.value, subcategory: '' }))}
                            className="border rounded px-3 py-2"
                            required
                          >
                            <option value="">Выберите категорию</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>

                          <select
                            value={productEditForm.subcategory}
                            onChange={(e) => setProductEditForm((prev) => ({ ...prev, subcategory: e.target.value }))}
                            className="border rounded px-3 py-2"
                          >
                            <option value="">Без подкатегории</option>
                            {(categories.find((cat) => cat.id === productEditForm.category)?.subcategories ?? []).map((sc) => (
                              <option key={sc.id} value={sc.id}>
                                {sc.name}
                              </option>
                            ))}
                          </select>

                          <select
                            value={productEditForm.promotion}
                            onChange={(e) => setProductEditForm((prev) => ({ ...prev, promotion: e.target.value }))}
                            className="border rounded px-3 py-2"
                          >
                            <option value="">Без акции</option>
                            {promotions.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title}
                              </option>
                            ))}
                          </select>

                          <input
                            value={productEditForm.protein_per_100g}
                            onChange={(e) => setProductEditForm((prev) => ({ ...prev, protein_per_100g: e.target.value }))}
                            placeholder="Белки на 100 г"
                            className="border rounded px-3 py-2"
                            required
                          />
                          <input
                            value={productEditForm.fat_per_100g}
                            onChange={(e) => setProductEditForm((prev) => ({ ...prev, fat_per_100g: e.target.value }))}
                            placeholder="Жиры на 100 г"
                            className="border rounded px-3 py-2"
                            required
                          />
                          <input
                            value={productEditForm.carbs_per_100g}
                            onChange={(e) => setProductEditForm((prev) => ({ ...prev, carbs_per_100g: e.target.value }))}
                            placeholder="Углеводы на 100 г"
                            className="border rounded px-3 py-2"
                            required
                          />
                          <input
                            value={productEditForm.calories_per_100g}
                            onChange={(e) => setProductEditForm((prev) => ({ ...prev, calories_per_100g: e.target.value }))}
                            placeholder="Ккал на 100 г"
                            className="border rounded px-3 py-2"
                            required
                          />

                          <textarea
                            value={productEditForm.composition}
                            onChange={(e) => setProductEditForm((prev) => ({ ...prev, composition: e.target.value }))}
                            placeholder="Состав"
                            className="border rounded px-3 py-2 md:col-span-2"
                            rows={3}
                            required
                          />
                          <div className="md:col-span-2">
                            <FileDropzone
                              label="Новое фото (необязательно)"
                              value={productEditImage}
                              onChange={setProductEditImage}
                              existingUrl={products.find((p) => p.slug === editingProductSlug)?.image_url}
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={productEditForm.is_available}
                            onChange={(e) => setProductEditForm((prev) => ({ ...prev, is_available: e.target.checked }))}
                          />
                          В наличии
                        </label>

                        <div className="flex gap-3 justify-end pt-2">
                          <AnimatedButton type="button" variant="neutral" onClick={closeEditProduct}>
                            Отмена
                          </AnimatedButton>
                          <AnimatedButton
                            type="submit"
                            loading={submittingProductEdit}
                            icon={<Save size={18} />}
                          >
                            {submittingProductEdit ? 'Сохраняем...' : 'Сохранить изменения'}
                          </AnimatedButton>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {activeTab === 'categories' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Категории</h3>
                </div>
                <div className="space-y-8">
                  <form onSubmit={createCategory} className="bg-gray-50 border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium">Добавить категорию</h4>
                    <input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Название категории"
                      className="border rounded px-3 py-2 w-full"
                      required
                    />
                    <FileDropzone
                      label="Фото категории (необязательно)"
                      value={newCategoryImage}
                      onChange={setNewCategoryImage}
                    />
                    <AnimatedButton type="submit" icon={<Plus size={18} />}>
                      Добавить
                    </AnimatedButton>
                  </form>

                  <form onSubmit={createSubcategory} className="bg-gray-50 border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium">Добавить подкатегорию</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select
                        value={newSubcategoryCategoryId}
                        onChange={(e) => setNewSubcategoryCategoryId(e.target.value)}
                        className="border rounded px-3 py-2"
                        required
                        disabled={!categories.length}
                      >
                        {categories.length ? (
                          categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))
                        ) : (
                          <option value="">Сначала загрузите категории</option>
                        )}
                      </select>
                      <input
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        placeholder="Название подкатегории"
                        className="border rounded px-3 py-2"
                        required
                      />
                    </div>
                    <AnimatedButton
                      type="submit"
                      icon={<Plus size={18} />}
                      disabled={!categories.length}
                    >
                      Добавить подкатегорию
                    </AnimatedButton>
                  </form>

                  <div>
                    <h4 className="font-medium mb-4">Список категорий</h4>
                    <div className="space-y-4">
                      {categories.map((cat) => (
                        <div key={cat.id} className="bg-white border rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="font-medium">{cat.name}</h4>
                              <p className="text-gray-500 text-sm">Slug: {cat.slug}</p>
                            </div>
                            <div className="text-sm text-gray-600">{cat.subcategories?.length ?? 0} подкатег.</div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <AnimatedButton
                              type="button"
                              size="sm"
                              variant="secondary"
                              icon={<Edit3 size={16} />}
                              onClick={() => startEditCategory(cat.slug, cat.name)}
                            >
                              Изменить
                            </AnimatedButton>
                            <AnimatedButton
                              type="button"
                              size="sm"
                              variant="danger"
                              icon={<Trash2 size={16} />}
                              onClick={() => deleteCategory(cat.slug)}
                            >
                              Удалить
                            </AnimatedButton>
                          </div>

                          {cat.subcategories?.length ? (
                            <div className="mt-3 space-y-2">
                              {cat.subcategories.map((sc) => (
                                <div
                                  key={sc.id}
                                  className="flex justify-between items-center text-sm text-gray-800 bg-gray-50 border rounded px-3 py-2"
                                >
                                  <div>
                                    <span>{sc.name}</span>
                                    <span className="text-gray-500 ml-2">/{sc.slug}</span>
                                  </div>
                                  <AnimatedButton
                                    type="button"
                                    size="sm"
                                    variant="danger"
                                    onClick={() => deleteSubcategory(sc.slug)}
                                  >
                                    Удалить
                                  </AnimatedButton>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mt-3">Подкатегорий нет.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {editingCategorySlug ? (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-xl">
                      <div className="flex justify-between items-center p-6 border-b">
                        <h3 className="text-xl font-semibold">Редактирование категории</h3>
                        <button
                          type="button"
                          onClick={closeEditCategory}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={22} />
                        </button>
                      </div>
                      <form onSubmit={submitEditCategory} className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                          <input
                            value={categoryEditName}
                            onChange={(e) => setCategoryEditName(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            required
                          />
                        </div>
                        <FileDropzone
                          label="Фото (необязательно)"
                          value={categoryEditImage}
                          onChange={setCategoryEditImage}
                        />
                        <div className="flex gap-3 justify-end">
                          <AnimatedButton type="button" variant="neutral" onClick={closeEditCategory}>
                            Отмена
                          </AnimatedButton>
                          <AnimatedButton type="submit" icon={<Save size={18} />}>
                            Сохранить
                          </AnimatedButton>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {activeTab === 'promotions' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Акции</h3>
                </div>

                {editingPromotionSlug ? (
                  <form onSubmit={saveEditPromotion} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 space-y-3">
                    <h4 className="font-medium">Редактировать акцию</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        value={promotionForm.name}
                        onChange={(e) => setPromotionForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Название акции"
                        className="border rounded px-3 py-2"
                        required
                      />
                      <div>
                        <FileDropzone
                          label="Основное изображение (карточка)"
                          value={promotionImage}
                          onChange={setPromotionImage}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <FileDropzone
                          label="Изображение шапки (1920×600, 16:5)"
                          hint="Если не выбрано — используется основное изображение"
                          value={promotionBannerImage}
                          onChange={setPromotionBannerImage}
                        />
                      </div>
                      <textarea
                        value={promotionForm.description}
                        onChange={(e) => setPromotionForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Описание"
                        className="border rounded px-3 py-2 md:col-span-2"
                        rows={3}
                        required
                      />
                      <input
                        value={promotionForm.conditions}
                        onChange={(e) => setPromotionForm((prev) => ({ ...prev, conditions: e.target.value }))}
                        placeholder="Условия акции (например: При покупке от 2000₽)"
                        className="border rounded px-3 py-2 md:col-span-2"
                      />
                      <textarea
                        value={promotionForm.terms}
                        onChange={(e) => setPromotionForm((prev) => ({ ...prev, terms: e.target.value }))}
                        placeholder="Пользовательское соглашение / Условия использования"
                        className="border rounded px-3 py-2 md:col-span-2"
                        rows={4}
                      />
                      <div className="md:col-span-2">
                        <FileDropzone
                          label="PDF файл с условиями акции"
                          hint="Загрузите PDF с подробными условиями акции"
                          image={false}
                          accept=".pdf"
                          value={promotionPdfFile}
                          onChange={setPromotionPdfFile}
                        />
                      </div>
                      <input
                        value={promotionForm.pdf_link_text}
                        onChange={(e) => setPromotionForm((prev) => ({ ...prev, pdf_link_text: e.target.value }))}
                        placeholder="Текст ссылки на PDF (например: Подробнее про акцию)"
                        className="border rounded px-3 py-2 md:col-span-2"
                      />
                      <div className="border rounded px-3 py-2 bg-white md:col-span-2">
                        <label className="text-sm text-gray-600 block mb-1">Дата окончания акции</label>
                        <input
                          type="datetime-local"
                          value={promotionForm.end_date}
                          onChange={(e) => setPromotionForm((prev) => ({ ...prev, end_date: e.target.value }))}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Если не указана — акция действует бессрочно
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <AnimatedButton
                        type="submit"
                        variant="warning"
                        loading={submittingPromotionEdit}
                        icon={<Save size={18} />}
                      >
                        {submittingPromotionEdit ? 'Сохраняем...' : 'Сохранить изменения'}
                      </AnimatedButton>
                      <AnimatedButton
                        type="button"
                        variant="neutral"
                        onClick={cancelEditPromotion}
                      >
                        Отмена
                      </AnimatedButton>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={createPromotion} className="bg-gray-50 border rounded-lg p-4 mb-6 space-y-3">
                    <h4 className="font-medium">Добавить акцию</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        value={promotionForm.name}
                        onChange={(e) => setPromotionForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Название акции"
                        className="border rounded px-3 py-2"
                        required
                      />
                      <div>
                        <FileDropzone
                          label="Основное изображение (карточка) *"
                          value={promotionImage}
                          onChange={setPromotionImage}
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <FileDropzone
                          label="Изображение шапки (1920×600, 16:5)"
                          hint="Если не выбрано — используется основное изображение"
                          value={promotionBannerImage}
                          onChange={setPromotionBannerImage}
                        />
                      </div>
                      <textarea
                        value={promotionForm.description}
                        onChange={(e) => setPromotionForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Описание"
                        className="border rounded px-3 py-2 md:col-span-2"
                        rows={3}
                        required
                      />
                      <input
                        value={promotionForm.conditions}
                        onChange={(e) => setPromotionForm((prev) => ({ ...prev, conditions: e.target.value }))}
                        placeholder="Условия акции (например: При покупке от 2000₽)"
                        className="border rounded px-3 py-2 md:col-span-2"
                      />
                      <textarea
                        value={promotionForm.terms}
                        onChange={(e) => setPromotionForm((prev) => ({ ...prev, terms: e.target.value }))}
                        placeholder="Пользовательское соглашение / Условия использования"
                        className="border rounded px-3 py-2 md:col-span-2"
                        rows={4}
                      />
                      <div className="md:col-span-2">
                        <FileDropzone
                          label="PDF файл с условиями акции"
                          hint="Загрузите PDF с подробными условиями акции"
                          image={false}
                          accept=".pdf"
                          value={promotionPdfFile}
                          onChange={setPromotionPdfFile}
                        />
                      </div>
                      <input
                        value={promotionForm.pdf_link_text}
                        onChange={(e) => setPromotionForm((prev) => ({ ...prev, pdf_link_text: e.target.value }))}
                        placeholder="Текст ссылки на PDF (например: Подробнее про акцию)"
                        className="border rounded px-3 py-2 md:col-span-2"
                      />
                      <div className="border rounded px-3 py-2 bg-white md:col-span-2">
                        <label className="text-sm text-gray-600 block mb-1">Дата окончания акции</label>
                        <input
                          type="datetime-local"
                          value={promotionForm.end_date}
                          onChange={(e) => setPromotionForm((prev) => ({ ...prev, end_date: e.target.value }))}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Если не указана — акция действует бессрочно
                        </p>
                      </div>
                    </div>
                    <AnimatedButton
                      type="submit"
                      loading={submittingPromotion}
                      icon={<Plus size={18} />}
                    >
                      {submittingPromotion ? 'Сохраняем...' : 'Добавить акцию'}
                    </AnimatedButton>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {promotions.map((p) => (
                    <div key={p.id} className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">Нет фото</div>
                        )}
                      </div>
                      <h4 className="font-medium mb-1">{p.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3">{p.description}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <AnimatedButton
                          type="button"
                          size="sm"
                          variant="warning"
                          icon={<Edit3 size={16} />}
                          onClick={() => startEditPromotion(p)}
                        >
                          Изменить
                        </AnimatedButton>
                        <AnimatedButton
                          type="button"
                          size="sm"
                          variant="danger"
                          icon={<Trash2 size={16} />}
                          onClick={() => deletePromotion(p.slug)}
                        >
                          Удалить
                        </AnimatedButton>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'dishofday' && (
              <AdminDishOfTheDay />
            )}

            {activeTab === 'onsite' && (
              <OnSiteOrderTab
                products={products}
                categories={categories}
                onCreated={() => {
                  setActiveTab('orders');
                  void loadOrders();
                }}
              />
            )}

            {activeTab === 'reviews' && (
              <AdminReviewsTab />
            )}
            </>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
