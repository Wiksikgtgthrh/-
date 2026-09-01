import axios, { type AxiosInstance, isAxiosError } from 'axios';

/** Бэкенд теперь живёт в этом же Next.js-приложении под /api */
const API_ORIGIN = '';
const API_BASE = '/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  // Убираем завершающий слэш из пути (перед query-строкой), чтобы запрос
  // попадал прямо в route.ts без 308-редиректа. Иначе proxy предпросмотра
  // и Next.js могут зациклить перенаправление (ERR_TOO_MANY_REDIRECTS).
  if (config.url) {
    const [path, query] = config.url.split('?');
    const trimmed = path.length > 1 ? path.replace(/\/+$/, '') : path;
    config.url = query !== undefined ? `${trimmed}?${query}` : trimmed;
  }
  return config;
});

// Авто-повтор при сетевых сбоях (нет ответа сервера).
// Такое бывает во время пересборки dev-сервера или кратковременного
// разрыва соединения — вместо «Network Error» тихо повторяем запрос.
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 700;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config as (typeof error.config & { _retryCount?: number }) | undefined;
    // Повторяем только «сетевые» ошибки (ответа нет вовсе), не 4xx/5xx.
    const isNetworkError = !error?.response && !isAxiosError(error) ? true : !error?.response;
    if (!config || !isNetworkError) {
      return Promise.reject(error);
    }
    config._retryCount = config._retryCount ?? 0;
    if (config._retryCount >= MAX_RETRIES) {
      return Promise.reject(error);
    }
    config._retryCount += 1;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * config._retryCount!));
    return api(config);
  },
);

function formatApiError(err: unknown): string {
  if (!isAxiosError(err) || !err.response?.data) {
    return err instanceof Error ? err.message : 'Произошла ошибка';
  }
  const data = err.response.data as Record<string, unknown>;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.non_field_errors) && typeof data.non_field_errors[0] === 'string') {
    return data.non_field_errors[0];
  }
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const v = data[firstKey];
    if (typeof v === 'string') return v;
    if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  }
  return 'Произошла ошибка';
}

/** Код ошибки API (например email_not_verified) и текст. */
export function parseApiError(err: unknown): { message: string; code?: string } {
  if (!isAxiosError(err) || !err.response?.data) {
    return { message: err instanceof Error ? err.message : 'Произошла ошибка' };
  }
  const data = err.response.data as Record<string, unknown>;
  const message = typeof data.detail === 'string' ? data.detail : formatApiError(err);
  const code = typeof data.code === 'string' ? data.code : undefined;
  return { message, code };
}

export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (path == null || path === '') return undefined;
  // Абсолютные URL (например Vercel Blob) отдаём как есть.
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Остальное — статические файлы этого же приложения (из /public).
  return path.startsWith('/') ? path : `/${path}`;
}

export interface Badge {
  id: string;
  text: string;
  color: string;
}

/** Единый тип карточки товара для UI и корзины */
export interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string;
  composition?: string;
  price: number;
  image_url?: string;
  weight?: string;
  category_id: string;
  subcategory_id?: string | null;
  is_active: boolean;
  stock_status?: string;
  stock_color?: string;
  badges?: Badge[];
  nutrition_per_100g?: number[];
}

export interface PromotionCard {
  id: string;
  slug: string;
  title: string;
  description: string;
  image_url?: string;
  created_at?: string;
  /** Условия акции (например, "При покупке от 2000₽") */
  conditions?: string;
  /** Пользовательское соглашение (HTML или текст) */
  terms?: string;
  /** PDF файл с подробными условиями акции */
  pdf_file_url?: string;
  /** Текст ссылки на PDF (например: "Подробнее про акцию") */
  pdf_link_text?: string;
  /** Изображение для шапки (рекомендуется 1920x600 или 16:5) */
  banner_image_url?: string;
  /** Дата окончания акции */
  end_date?: string;
}

export interface BlogPostCard {
  id: string;
  title: string;
  date: string;
  excerpt: string;
}

export interface CategoryCard {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
  subcategories?: SubcategoryCard[];
}

export interface SubcategoryCard {
  id: string;
  name: string;
  slug: string;
  category_id: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  is_staff: boolean;
  /** Email подтверждён (аккаунт активирован). */
  email_verified: boolean;
}

type DjangoUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  is_staff: boolean;
  email_verified?: boolean;
  phone?: string;
};

function mapUser(u: DjangoUser): AuthUser {
  return {
    id: String(u.id),
    email: u.email || u.username,
    name: u.first_name || undefined,
    phone: typeof u.phone === 'string' ? u.phone : undefined,
    is_staff: Boolean(u.is_staff),
    email_verified: u.email_verified ?? false,
  };
}

type DjangoProduct = {
  id: number;
  slug: string;
  name_with_weight: string;
  price: string | number;
  image: string | null;
  is_available: boolean;
  composition?: string;
  category: number;
  subcategory?: number | null;
  promotion?: number | null;
  nutrition_per_100g?: (string | number)[];
};

/**
 * Собирает строку "Название (вес)" для отправки на сервер.
 * Если вес не указан — возвращает только название (без пустых скобок).
 */
export function buildNameWithWeight(name: string, weight: string): string {
  const n = name.trim();
  const w = weight.trim();
  return w ? `${n} (${w})` : n;
}

function mapProduct(p: DjangoProduct): Product {
  const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
  // Разделяем название и вес (формат: "Название (XXX г)" или "Название XXX г")
  const nameWithWeight = p.name_with_weight;
  // Разбираем "Название (вес)" или "Название, вес" / "Название вес".
  // 1) Любая группа в скобках в конце строки считается весом — так вес
  //    никогда не «протекает» в название, а лишние пустые скобки () убираются.
  const bracketMatch = nameWithWeight.match(/\s*\(([^)]*)\)\s*$/);
  // 2) Иначе — число с единицей измерения в конце (после пробела или запятой).
  const plainMatch = nameWithWeight.match(/[\s,]+(\d+[\s\d]*\s*(?:г|кг|мл|л))\s*$/i);
  const weightMatch = bracketMatch || plainMatch;
  const weight = weightMatch && weightMatch[1].trim() ? weightMatch[1].trim() : undefined;
  const name = weightMatch ? nameWithWeight.replace(weightMatch[0], '').replace(/[\s,]+$/, '').trim() : nameWithWeight;
  return {
    id: String(p.id),
    slug: p.slug,
    name,
    weight,
    description: p.composition || undefined,
    composition: p.composition || undefined,
    price: Number.isFinite(price) ? price : 0,
    image_url: resolveMediaUrl(p.image),
    category_id: String(p.category),
    subcategory_id: p.subcategory == null ? null : String(p.subcategory),
    is_active: p.is_available,
    stock_status: p.is_available ? 'В наличии' : 'Нет в наличии',
    stock_color: p.is_available ? '#10B981' : '#9CA3AF',
    badges: p.promotion
      ? [{ id: `promo-${p.promotion}`, text: 'Акция', color: '#EF4444' }]
      : undefined,
    nutrition_per_100g: p.nutrition_per_100g?.map((x) =>
      typeof x === 'string' ? parseFloat(x) : x,
    ),
  };
}

type DjangoCategory = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  subcategories?: Array<{
    id: number;
    name: string;
    slug: string;
    category: number;
  }>;
};

function mapCategory(c: DjangoCategory): CategoryCard {
  return {
    id: String(c.id),
    name: c.name,
    slug: c.slug,
    image_url: resolveMediaUrl(c.image),
    sort_order: 0,
    is_active: true,
    subcategories: (c.subcategories ?? []).map((s) => ({
      id: String(s.id),
      name: s.name,
      slug: s.slug,
      category_id: String(s.category),
    })),
  };
}

type DjangoPromotion = {
  id: number;
  name: string;
  slug?: string;
  description: string;
  image: string | null;
  created_at?: string;
  conditions?: string;
  terms?: string;
  pdf_file?: string | null;
  pdf_link_text?: string;
  banner_image?: string | null;
  end_date?: string;
};

function mapPromotionCard(p: DjangoPromotion): PromotionCard {
  return {
    id: String(p.id),
    slug: p.slug || String(p.id),
    title: p.name,
    description: p.description,
    image_url: resolveMediaUrl(p.image),
    created_at: p.created_at,
    conditions: p.conditions,
    terms: p.terms,
    pdf_file_url: resolveMediaUrl(p.pdf_file),
    pdf_link_text: p.pdf_link_text,
    banner_image_url: resolveMediaUrl(p.banner_image),
    end_date: p.end_date,
  };
}

function mapBlogPost(p: DjangoPromotion): BlogPostCard {
  const created = p.created_at ? new Date(p.created_at) : new Date();
  return {
    id: String(p.id),
    title: p.name,
    date: created.toISOString(),
    excerpt:
      p.description.length > 220
        ? `${p.description.slice(0, 220)}…`
        : p.description,
  };
}

async function fetchList<T>(url: string, params?: Record<string, string>): Promise<T[]> {
  const { data } = await api.get<T[]>(url, { params });
  return Array.isArray(data) ? data : [];
}

export interface OrderItemRow {
  id: number;
  product: number;
  product_name: string;
  product_slug: string;
  quantity: number;
  price: string;
}

export interface OrderRecord {
  id: string;
  created_at: string;
  order_type: 'delivery' | 'in_house';
  status: string;
  total_price: string;
  total_amount: string;
  delivery_address: string;
  delivery_fee: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes: string;
  payment_method: string;
  items: OrderItemRow[];
}

function mapOrder(o: Omit<OrderRecord, 'id'> & { id: string | number }): OrderRecord {
  return {
    ...o,
    id: String(o.id),
  };
}

export interface TelegramBotStatus {
  configured: boolean;
  reachable: boolean;
  error: string;
  bot_username: string;
  subscribers: number;
  proxy_enabled: boolean;
  pending_registrations: number;
}

export interface ReviewRecord {
  id: number;
  author: string;
  rating: number;
  text: string;
  avatar_url: string | null;
  is_published: boolean;
  created_at: string;
  date: string;
}

export interface DishOfTheDay {
  id: string;
  product: Product;
  old_price?: number;
  sale_price?: number;
  active_from?: string;
  active_until?: string;
  is_active: boolean;
}

export interface CreateOrderPayload {
  items: { product_id: number; quantity: number }[];
  order_type: 'delivery' | 'in_house';
  delivery_address: string;
  delivery_fee: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
  payment_method: 'cash' | 'card' | 'qr';
  discount_percent?: number;
}

export interface PaymentResponse {
  payment_id: string;
  confirmation_url: string;
}

export interface AdminProductPayload {
  name_with_weight: string;
  price: number;
  image?: File | null;
  is_available: boolean;
  composition: string;
  nutrition_per_100g: [number, number, number, number];
  category: number;
  subcategory?: number;
  promotion?: number;
}

export const apiService = {
  getProducts: async (options?: { availableOnly?: boolean }): Promise<Product[]> => {
    const params: Record<string, string> = {};
    if (options?.availableOnly !== false) {
      params.available = '1';
    }
    const rows = await fetchList<DjangoProduct>('/products/', params);
    return rows.map(mapProduct);
  },

  getProduct: async (slug: string): Promise<Product | undefined> => {
    try {
      const { data } = await api.get<DjangoProduct>(
        `/products/${encodeURIComponent(slug)}/`,
      );
      return mapProduct(data);
    } catch {
      return undefined;
    }
  },

  getCategories: async (): Promise<CategoryCard[]> => {
    const rows = await fetchList<DjangoCategory>('/categories/');
    return rows.map(mapCategory);
  },

  getPromotions: async (): Promise<PromotionCard[]> => {
    const rows = await fetchList<DjangoPromotion>('/promotions/');
    return rows.map(mapPromotionCard);
  },

  getBlogPosts: async (): Promise<BlogPostCard[]> => {
    const rows = await fetchList<DjangoPromotion>('/promotions/');
    return rows.map(mapBlogPost);
  },

  createOrder: async (payload: CreateOrderPayload): Promise<OrderRecord> => {
    try {
      const { data } = await api.post<Omit<OrderRecord, 'id'> & { id: string | number }>('/orders/', payload);
      return mapOrder(data);
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  createYooKassaPayment: async (orderId: string | number): Promise<PaymentResponse> => {
    const { data } = await api.post<PaymentResponse>('/payments/create', { order_id: orderId });
    return data;
  },

  /** Регистрация нового пользователя */
  register: async (payload: { phone: string; password: string; password_confirm: string }): Promise<{ token: string; user: AuthUser }> => {
    try {
      const { data } = await api.post<{ token: string; user: DjangoUser }>('/auth/register/', payload);
      return { token: data.token, user: mapUser(data.user) };
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  /** Вход по номеру телефона и паролю */
  login: async (phone: string, password: string): Promise<{ token: string; user: AuthUser }> => {
    try {
      const { data } = await api.post<{ token: string; user: DjangoUser }>('/auth/login/', {
        phone,
        password,
      });
      return { token: data.token, user: mapUser(data.user) };
    } catch (e) {
      const { message, code: errCode } = parseApiError(e);
      const err = new Error(message) as Error & { code?: string };
      if (errCode) err.code = errCode;
      throw err;
    }
  },

  updateProfile: async (firstName: string): Promise<AuthUser> => {
    const { data } = await api.patch<DjangoUser>('/auth/profile/', { first_name: firstName });
    return mapUser(data);
  },

  updateProfilePhone: async (phone: string): Promise<AuthUser> => {
    const { data } = await api.patch<DjangoUser>('/auth/profile/', { phone });
    return mapUser(data);
  },

  updateProfileEmail: async (email: string): Promise<AuthUser> => {
    const { data } = await api.patch<DjangoUser>('/auth/profile/', { email });
    return mapUser(data);
  },

  sendEmailVerification: async (): Promise<{ detail: string }> => {
    const { data } = await api.post<{ detail: string }>('/auth/email/send-verification/');
    return data;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    try {
      await api.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  verifyEmail: async (token: string): Promise<{ detail: string }> => {
    try {
      const { data } = await api.post<{ detail: string }>('/auth/email/verify/', { token });
      return data;
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout/');
    } catch {
      /* сеть / 401 — токен всё равно удалим на клиенте */
    }
  },

  getCurrentUser: async (): Promise<AuthUser | null> => {
    try {
      const { data } = await api.get<DjangoUser>('/auth/me/');
      return mapUser(data);
    } catch {
      return null;
    }
  },

  adminGetOrders: async (): Promise<OrderRecord[]> => {
    const rows = await fetchList<OrderRecord>('/orders/');
    return rows.map(mapOrder);
  },

  adminGetOrderHistory: async (date?: string): Promise<OrderRecord[]> => {
    const params: Record<string, string> = {};
    if (date) {
      params.date = date;
    }
    const rows = await fetchList<OrderRecord>('/orders/history/', params);
    return rows.map(mapOrder);
  },

  adminCompleteOrder: async (orderId: string): Promise<void> => {
    await api.patch(`/orders/${orderId}/`, { status: 'completed' });
  },

  adminUpdateOrderStatus: async (orderId: string, status: string): Promise<void> => {
    await api.patch(`/orders/${orderId}/`, { status });
  },

  adminGetProducts: async (): Promise<Product[]> => {
    const rows = await fetchList<DjangoProduct>('/admin/products/');
    return rows.map(mapProduct);
  },
  adminGetCategories: async () => apiService.getCategories(),
  adminGetPromotions: async (): Promise<PromotionCard[]> => {
    const rows = await fetchList<DjangoPromotion>('/promotions/');
    return rows.map(mapPromotionCard);
  },

  adminCreatePromotion: async (payload: {
    name: string;
    description: string;
    image: File;
    conditions?: string;
    terms?: string;
    pdf_file?: File;
    pdf_link_text?: string;
    banner_image?: File;
    end_date?: string;
  }): Promise<void> => {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('description', payload.description);
    formData.append('image', payload.image);
    if (payload.conditions) formData.append('conditions', payload.conditions);
    if (payload.terms) formData.append('terms', payload.terms);
    if (payload.pdf_file) formData.append('pdf_file', payload.pdf_file);
    if (payload.pdf_link_text) formData.append('pdf_link_text', payload.pdf_link_text);
    if (payload.banner_image) formData.append('banner_image', payload.banner_image);
    if (payload.end_date) formData.append('end_date', payload.end_date);
    await api.post('/promotions/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  adminUpdatePromotion: async (
    slug: string,
    payload: {
      name?: string;
      description?: string;
      image?: File | null | undefined;
      conditions?: string;
      terms?: string;
      pdf_file?: File | null | undefined;
      pdf_link_text?: string;
      banner_image?: File | null | undefined;
      end_date?: string;
    },
  ): Promise<void> => {
    const formData = new FormData();
    if (payload.name != null) formData.append('name', payload.name);
    if (payload.description != null) formData.append('description', payload.description);
    if (payload.image instanceof File) formData.append('image', payload.image);
    if (payload.conditions != null) formData.append('conditions', payload.conditions);
    if (payload.terms != null) formData.append('terms', payload.terms);
    if (payload.pdf_file instanceof File) formData.append('pdf_file', payload.pdf_file);
    if (payload.pdf_link_text != null) formData.append('pdf_link_text', payload.pdf_link_text);
    if (payload.banner_image instanceof File) formData.append('banner_image', payload.banner_image);
    if (payload.end_date != null) formData.append('end_date', payload.end_date);
    await api.patch(`/promotions/${encodeURIComponent(slug)}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  adminDeletePromotion: async (slug: string): Promise<void> => {
    await api.delete(`/promotions/${encodeURIComponent(slug)}/`);
  },

  adminCreateProduct: async (payload: AdminProductPayload) => {
    const formData = new FormData();
    formData.append('name_with_weight', payload.name_with_weight);
    formData.append('price', String(payload.price));
    if (payload.image instanceof File) formData.append('image', payload.image);
    formData.append('is_available', payload.is_available ? 'true' : 'false');
    formData.append('composition', payload.composition);
    formData.append('category', String(payload.category));
    if (payload.subcategory != null) formData.append('subcategory', String(payload.subcategory));
    if (payload.promotion != null) formData.append('promotion', String(payload.promotion));
    payload.nutrition_per_100g.forEach((item) =>
      formData.append('nutrition_per_100g', String(item)),
    );
    await api.post('/products/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  adminUpdateProduct: async (product: Product, body: Record<string, unknown>) => {
    // Если админ поменял картинку, отправляем multipart.
    const image = body.image;
    if (image instanceof File) {
      const formData = new FormData();
      Object.entries(body).forEach(([key, value]) => {
        if (key === 'image') return;
        if (key === 'nutrition_per_100g' && Array.isArray(value)) {
          (value as unknown[]).forEach((item) => formData.append('nutrition_per_100g', String(item)));
          return;
        }
        if (value === undefined) return;
        if (value === null) {
          // В multipart не всегда корректно парсится `null` для PK-полей.
          // Если нужно очистить значение — обновляйте без изменения изображения.
          return;
        }
        formData.append(key, String(value));
      });
      formData.append('image', image);
      await api.patch(`/products/${encodeURIComponent(product.slug)}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return;
    }

    await api.patch(`/products/${encodeURIComponent(product.slug)}/`, body);
  },

  adminDeleteProduct: async (slug: string) => {
    await api.delete(`/products/${encodeURIComponent(slug)}/`);
  },

  adminCreateCategory: async (payload: { name: string; image?: File | null }): Promise<void> => {
    const formData = new FormData();
    formData.append('name', payload.name);
    if (payload.image instanceof File) formData.append('image', payload.image);
    await api.post('/categories/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  adminUpdateCategory: async (slug: string, payload: { name?: string; image?: File | null | undefined }): Promise<void> => {
    const hasFile = payload.image instanceof File;
    if (hasFile) {
      const formData = new FormData();
      if (payload.name != null) formData.append('name', payload.name);
      formData.append('image', payload.image as File);
      await api.patch(`/categories/${encodeURIComponent(slug)}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return;
    }
    await api.patch(`/categories/${encodeURIComponent(slug)}/`, payload);
  },

  getMyOrders: async (): Promise<OrderRecord[]> => {
    // Собираем и активные заказы, и завершённые/отменённые,
    // чтобы в личном кабинете была полноценная история покупок.
    const [active, archive] = await Promise.all([
      fetchList<OrderRecord>('/orders/', { scope: 'my' }).catch(() => [] as OrderRecord[]),
      fetchList<OrderRecord>('/orders/history/', { scope: 'my' }).catch(() => [] as OrderRecord[]),
    ]);
    const combined = [...active, ...archive];
    const seen = new Set<string>();
    const unique = combined.filter((o) => {
      const key = String(o.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return unique.map(mapOrder);
  },
  cancelMyOrder: async (orderId: string): Promise<OrderRecord> => {
    const { data } = await api.post<Omit<OrderRecord, 'id'> & { id: string | number }>(`/orders/${orderId}/cancel/`);
    return mapOrder(data);
  },
  adminCreateSubcategory: async (payload: { name: string; category: number }): Promise<void> => {
    await api.post('/subcategories/', payload);
  },
  adminDeleteCategory: async (slug: string): Promise<void> => {
    await api.delete(`/categories/${encodeURIComponent(slug)}/`);
  },
  adminDeleteSubcategory: async (slug: string): Promise<void> => {
    await api.delete(`/subcategories/${encodeURIComponent(slug)}/`);
  },
  dadataSuggestAddress: async (query: string): Promise<string[]> => {
    const { data } = await api.get<{ suggestions?: string[] }>('/dadata/address-suggest/', {
      params: { query },
    });
    return Array.isArray(data?.suggestions) ? data!.suggestions : [];
  },

  // Блюдо дня
  getDishOfTheDay: async (): Promise<DishOfTheDay | null> => {
    try {
      const { data } = await api.get<DishOfTheDay>('/dish-of-the-day/');
      return data;
    } catch {
      return null;
    }
  },

  adminGetDishOfTheDay: async (): Promise<DishOfTheDay | null> => {
    try {
      const { data } = await api.get<DishOfTheDay>('/admin/dish-of-the-day/');
      return data;
    } catch {
      return null;
    }
  },

  adminSetDishOfTheDay: async (payload: {
    product_id: number;
    old_price?: number;
    sale_price?: number;
    active_from?: string;
    active_until?: string;
  }): Promise<void> => {
    await api.post('/admin/dish-of-the-day/', payload);
  },

  adminUpdateDishOfTheDay: async (payload: {
    product_id?: number;
    old_price?: number;
    sale_price?: number;
    active_from?: string;
    active_until?: string;
    is_active?: boolean;
  }): Promise<void> => {
    await api.patch('/admin/dish-of-the-day/', payload);
  },

  adminDeleteDishOfTheDay: async (): Promise<void> => {
    await api.delete('/admin/dish-of-the-day/');
  },

  // ==================== Telegram Регистрация ====================

  /** Инициирует регистрацию через Telegram */
  telegramInitiateRegistration: async (phone: string): Promise<{
    telegram_link: string;
    token: string;
    expires_in: number;
  }> => {
    try {
      const { data } = await api.post('/auth/telegram/initiate-registration/', { phone });
      return data;
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  /** Проверяет статус регистрации по токену */
  telegramCheckRegistration: async (token: string): Promise<{
    success: boolean;
    status: 'pending' | 'completed' | 'expired';
    phone?: string;
    chat_id?: number;
    first_name?: string;
  }> => {
    try {
      const { data } = await api.get(`/auth/telegram/check-registration/${token}/`);
      return data;
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  /** Завершает регистрацию через Telegram */
  telegramCompleteRegistration: async (payload: {
    token: string;
    password: string;
    password_confirm: string;
  }): Promise<{ token: string; user: AuthUser }> => {
    try {
      const { data } = await api.post<{ token: string; user: DjangoUser }>('/auth/telegram/complete-registration/', payload);
      return { token: data.token, user: mapUser(data.user) };
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  // ==================== Восстановление пароля ====================

  passwordResetRequest: async (email: string): Promise<{ detail: string }> => {
    try {
      const { data } = await api.post<{ detail: string }>('/auth/password-reset/request/', { email });
      return data;
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  passwordResetConfirm: async (payload: { token: string; password: string; password_confirm: string }): Promise<{ detail: string }> => {
    try {
      const { data } = await api.post<{ detail: string }>('/auth/password-reset/confirm/', payload);
      return data;
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  // ==================== Рассылки ====================

  getBroadcasts: async (): Promise<Array<{
    id: number;
    title: string;
    text: string;
    has_image: boolean;
    created_at: string;
    sent_at: string | null;
    sent_count: number;
    is_sent: boolean;
  }>> => {
    try {
      const { data } = await api.get('/admin/broadcasts/');
      return data;
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  createBroadcast: async (payload: {
    title: string;
    title_style: string;
    text: string;
    image?: File;
  }): Promise<{ id: number; title: string; text: string; has_image: boolean; created_at: string }> => {
    try {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('title_style', payload.title_style);
      formData.append('text', payload.text);
      if (payload.image) {
        formData.append('image', payload.image);
      }
      const { data } = await api.post('/admin/broadcasts/create/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  sendBroadcast: async (broadcastId: number): Promise<{ success: boolean; sent_count: number; failed_count: number; total: number; errors?: string[] }> => {
  try {
  const { data } = await api.post(`/admin/broadcasts/${broadcastId}/send/`);
  return data;
  } catch (e) {
  throw new Error(formatApiError(e));
  }
  },

  // Диагностика связки «сайт → бот → Telegram».
  getTelegramStatus: async (): Promise<TelegramBotStatus> => {
  const { data } = await api.get<TelegramBotStatus>('/admin/telegram/status/');
  return data;
  },

  deleteBroadcast: async (broadcastId: number): Promise<{ success: boolean; message: string }> => {
    try {
      const { data } = await api.delete(`/admin/broadcasts/${broadcastId}/delete/`);
      return data;
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  // ==================== Отзывы ====================

  /** Список опубликованных отзывов. fiveStarOnly=true — только 5★. */
  getReviews: async (fiveStarOnly = false): Promise<ReviewRecord[]> => {
    const { data } = await api.get<ReviewRecord[] | { results: ReviewRecord[] }>('/reviews/', {
      params: fiveStarOnly ? { five_star: 1 } : {},
    });
    return Array.isArray(data) ? data : data.results ?? [];
  },

  /** Отправка отзыва посетителем (уходит на модерацию). */
  createReview: async (payload: { author: string; rating: number; text: string }): Promise<ReviewRecord> => {
    try {
      const { data } = await api.post<ReviewRecord>('/reviews/', payload);
      return data;
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  /** Все отзывы (включая неопубликованные) — для админа. */
  adminGetReviews: async (): Promise<ReviewRecord[]> => {
    const { data } = await api.get<ReviewRecord[] | { results: ReviewRecord[] }>('/reviews/');
    return Array.isArray(data) ? data : data.results ?? [];
  },

  /** Публикация/снятие отзыва админом. */
  adminUpdateReview: async (id: number, payload: Partial<{ is_published: boolean; rating: number; text: string; author: string }>): Promise<ReviewRecord> => {
    const { data } = await api.patch<ReviewRecord>(`/reviews/${id}/`, payload);
    return data;
  },

  /** Создание отзыва админо�� (публикуется сраз����). */
  adminCreateReview: async (payload: { author: string; rating: number; text: string; is_published?: boolean }): Promise<ReviewRecord> => {
    const { data } = await api.post<ReviewRecord>('/reviews/', payload);
    return data;
  },

  adminDeleteReview: async (id: number): Promise<void> => {
    await api.delete(`/reviews/${id}/`);
  },

  // ==================== Заказы на месте и активность ====================

  /** Проверяет новые заказы (для уведомлений) */
  checkNewOrders: async (since?: string): Promise<{ count: number }> => {
    const { data } = await api.get<{ count: number }>('/orders/new_orders/', {
      params: since ? { since } : {},
    });
    return data;
  },

  /** Статистика активности заказов */
  getOrdersActivity: async (): Promise<{
    orders_today: number;
    active_orders: number;
    new_orders: number;
    orders_this_hour: number;
    today_revenue: string;
    status_counts: Record<string, number>;
  }> => {
    const { data } = await api.get('/admin/orders-activity/');
    return data;
  },

  /** Создание заказа на месте (через админку) */
  createOnSiteOrder: async (payload: CreateOrderPayload): Promise<OrderRecord> => {
    try {
      const { data } = await api.post<Omit<OrderRecord, 'id'> & { id: string | number }>('/orders/', payload);
      return mapOrder(data);
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  // ==================== Вкладка «Админ» ====================

  /** Какие пароли-гейты включены в .env (нужен ли пароль для входа в панель / в режим «Админ»). */
  getAdminGates: async (): Promise<{ staff_required: boolean; admin_required: boolean }> => {
    const { data } = await api.get('/auth/verify-admin/');
    return data;
  },

  /**
   * Проверка пароля из .env для входа в панель.
   * scope='staff' — пароль входа в панель (STAFF_PASSWORD),
   * scope='admin' — пароль режима «Админ» (ADMIN_PASSWORD).
   */
  verifyAdminPassword: async (
    password: string,
    scope: 'staff' | 'admin' = 'admin',
  ): Promise<{ verified: boolean; scope: string; phone?: string }> => {
    try {
      const { data } = await api.post('/auth/verify-admin/', { password, scope });
      return data;
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  // ---- Управление сотрудниками ----
  adminGetStaff: async (): Promise<StaffRecord[]> => {
    const { data } = await api.get<StaffRecord[]>('/admin/staff/');
    return Array.isArray(data) ? data : [];
  },

  /** Назначить нового сотрудника/админа. Возвращает созданную запись и пароль (показывается один раз). */
  adminCreateStaff: async (payload: {
    first_name: string;
    phone: string;
    role: 'admin' | 'staff';
    password?: string;
  }): Promise<{ staff: StaffRecord; password: string }> => {
    try {
      const { data } = await api.post('/admin/staff/', payload);
      return data;
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  adminSetStaffRole: async (id: number, role: 'admin' | 'staff' | 'user'): Promise<StaffRecord> => {
    try {
      const { data } = await api.patch(`/admin/staff/${id}/`, { action: 'set_role', role });
      return data.staff;
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  adminResetStaffPassword: async (id: number, password?: string): Promise<{ staff: StaffRecord; password: string }> => {
    try {
      const { data } = await api.patch(`/admin/staff/${id}/`, { action: 'reset_password', password });
      return data;
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  adminRemoveStaff: async (id: number): Promise<void> => {
    try {
      await api.delete(`/admin/staff/${id}/`);
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  // ---- Слайды главного экрана (Hero) ----
  getHeroSlides: async (): Promise<HeroSlideRecord[]> => {
    const { data } = await api.get<HeroSlideRecord[]>('/hero-slides/');
    return Array.isArray(data) ? data.map(mapHeroSlide) : [];
  },
  adminGetHeroSlides: async (): Promise<HeroSlideRecord[]> => {
    const { data } = await api.get<HeroSlideRecord[]>('/hero-slides/', { params: { all: 1 } });
    return Array.isArray(data) ? data.map(mapHeroSlide) : [];
  },
  adminCreateHeroSlide: async (payload: {
    title: string;
    subtitle?: string;
    button_text?: string;
    button_link?: string;
    display_order?: number;
    is_active?: boolean;
    image?: File | null;
  }): Promise<void> => {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('subtitle', payload.subtitle ?? '');
    formData.append('button_text', payload.button_text ?? '');
    formData.append('button_link', payload.button_link ?? '');
    formData.append('display_order', String(payload.display_order ?? 0));
    formData.append('is_active', payload.is_active === false ? 'false' : 'true');
    if (payload.image instanceof File) formData.append('image', payload.image);
    await api.post('/hero-slides/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  adminUpdateHeroSlide: async (
    id: number,
    payload: Partial<{
      title: string;
      subtitle: string;
      button_text: string;
      button_link: string;
      display_order: number;
      is_active: boolean;
      image: File | null;
    }>,
  ): Promise<void> => {
    if (payload.image instanceof File) {
      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (k === 'image' || v === undefined) return;
        formData.append(k, String(v));
      });
      formData.append('image', payload.image);
      await api.patch(`/hero-slides/${id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return;
    }
    await api.patch(`/hero-slides/${id}/`, payload);
  },
  adminDeleteHeroSlide: async (id: number): Promise<void> => {
    await api.delete(`/hero-slides/${id}/`);
  },

  // ---- Отключение страниц/вкладок ----
  getDisabledFeatures: async (): Promise<DisabledFeatureRecord[]> => {
    const { data } = await api.get<DisabledFeatureRecord[]>('/disabled-features/');
    return Array.isArray(data) ? data : [];
  },
  adminSetDisabledFeature: async (payload: {
    key: string;
    feature_type: 'page' | 'tab';
    label?: string;
    is_disabled: boolean;
  }): Promise<void> => {
    await api.post('/disabled-features/', payload);
  },

  // ---- Правовые документы ----
  getLegalDocuments: async (): Promise<LegalDocumentRecord[]> => {
    const { data } = await api.get<LegalDocumentRecord[]>('/legal-documents/');
    return Array.isArray(data) ? data : [];
  },
  adminUpdateLegalDocument: async (payload: {
    slug: string;
    title?: string;
    content?: string;
    is_published?: boolean;
  }): Promise<LegalDocumentRecord> => {
    const { data } = await api.post<LegalDocumentRecord>('/legal-documents/', payload);
    return data;
  },

  // ---- Импорт/экспорт меню ----
  exportMenu: async (format: 'xlsx' | 'json'): Promise<Blob> => {
    const { data } = await api.get(`/menu/export/`, {
      params: { format },
      responseType: 'blob',
    });
    return data as Blob;
  },
  importMenu: async (file: File, mode: 'merge' | 'replace' = 'merge'): Promise<MenuImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    try {
      const { data } = await api.post('/menu/import/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data as MenuImportResult;
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  // ---- Настройка колонок Excel-шаблона меню ----
  getMenuColumns: async (): Promise<MenuColumnConfig[]> => {
    const { data } = await api.get<MenuColumnConfig[]>('/menu/columns/');
    return Array.isArray(data) ? data : [];
  },
  adminSaveMenuColumns: async (columns: MenuColumnConfig[]): Promise<MenuColumnConfig[]> => {
    try {
      const { data } = await api.put<MenuColumnConfig[]>('/menu/columns/', { columns });
      return Array.isArray(data) ? data : [];
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  getSiteSettings: async (): Promise<{ phone: string; hours_weekdays: string; hours_weekends: string; delivery_mode: 'yandex' | 'local'; delivery_url: string; delivery_phone: string; delivery_contact_url: string }> => {
    try {
      const { data } = await api.get('/admin/settings');
      return data;
    } catch {
      return { phone: '+7 (842) 123-45-67', hours_weekdays: '8:00–21:00', hours_weekends: '9:00–21:00', delivery_mode: 'yandex', delivery_url: 'https://eda.yandex.ru/r/ponatnaa_plan_restaurant?placeSlug=ponyatnaya_plan', delivery_phone: '+7 (842) 123-45-67', delivery_contact_url: '' };
    }
  },

  saveSiteSettings: async (settings: { phone: string; hours_weekdays: string; hours_weekends: string; delivery_mode: 'yandex' | 'local'; delivery_url: string; delivery_phone: string; delivery_contact_url: string }): Promise<void> => {
    try {
      await api.put('/admin/settings', settings);
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },
};

// ==================== Типы и мапперы новых сущностей ====================

export interface StaffRecord {
  id: number;
  phone: string;
  first_name: string;
  role: 'admin' | 'staff' | 'user';
  is_active: boolean;
  /** Роль задана через переменные окружения — редактирование в панели запрещено. */
  locked: boolean;
  created_at: string;
}

export interface HeroSlideRecord {
  id: number;
  title: string;
  subtitle: string;
  image: string | null;
  button_text: string;
  button_link: string;
  display_order: number;
  is_active: boolean;
}

function mapHeroSlide(raw: HeroSlideRecord): HeroSlideRecord {
  return { ...raw, image: raw.image ? resolveMediaUrl(raw.image) ?? null : null };
}

export interface DisabledFeatureRecord {
  key: string;
  feature_type: 'page' | 'tab';
  label: string;
  is_disabled: boolean;
}

export interface LegalDocumentRecord {
  id: number;
  slug: string;
  title: string;
  content: string;
  is_published: boolean;
  display_order: number;
  updated_at: string;
}

export interface MenuImportResult {
  success: boolean;
  mode: 'merge' | 'replace';
  created: number;
  updated: number;
  deactivated: number;
  total: number;
  errors: string[];
}

export interface MenuColumnConfig {
  field: string;
  label: string;
  aliases: string[];
  order: number;
  enabled: boolean;
  required: boolean;
  }
