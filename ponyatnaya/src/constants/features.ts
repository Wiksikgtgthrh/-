// Ключи страниц публичного сайта, которые можно отключать из админки
export const PAGE_FEATURES: { key: string; label: string; path: string }[] = [
  { key: 'catalog', label: 'Меню (каталог)', path: '/catalog' },
  { key: 'about', label: 'О нас', path: '/about' },
  { key: 'delivery', label: 'Доставка', path: '/delivery' },
  { key: 'contacts', label: 'Контакты', path: '/contacts' },
  { key: 'promotions', label: 'Акции', path: '/promotions' },
  { key: 'custom-order', label: 'На заказ', path: '/custom-order' },
]

// Ключи вкладок сотрудника, которые можно отключать из админки
export const EMPLOYEE_TAB_FEATURES: { key: string; label: string }[] = [
  { key: 'orders', label: 'Текущие заказы' },
  { key: 'onsite', label: 'Новый заказ' },
  { key: 'history', label: 'История заказов' },
  { key: 'products', label: 'Товары' },
  { key: 'categories', label: 'Категории' },
  { key: 'promotions', label: 'Акции' },
  { key: 'dishofday', label: 'Блюдо дня' },
  { key: 'reviews', label: 'Отзывы' },
  { key: 'import-export', label: 'Импорт / Экспорт меню' },
]

export const PAGE_KEY_BY_PATH: Record<string, string> = PAGE_FEATURES.reduce(
  (acc, f) => {
    acc[f.path] = f.key
    return acc
  },
  {} as Record<string, string>,
)
