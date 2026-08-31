import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Phone, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';
import { AuthModal } from './AuthModal';
import { apiService } from '../services/api';
const logo = '/logo.png';

interface HeaderProps {
  onAdminClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAdminClick }) => {
  const { getTotalItems } = useCart();
  const { user, signOut } = useAuth();
  const { isPageDisabled } = useFeatureFlags();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [telegramCallbackToken, setTelegramCallbackToken] = useState<string | null>(null);
  const [sitePhone, setSitePhone] = useState('+7 (842) 123-45-67');
  const [hoursWeekdays, setHoursWeekdays] = useState('8:00–21:00');
  const [hoursWeekends, setHoursWeekends] = useState('9:00–21:00');
  const [deliveryMode, setDeliveryMode] = useState<'yandex' | 'local'>('yandex');
  const [deliveryUrl, setDeliveryUrl] = useState('https://eda.yandex.ru/r/ponatnaa_plan_restaurant?placeSlug=ponyatnaya_plan');
  const [deliveryContactUrl, setDeliveryContactUrl] = useState('');

  useEffect(() => {
    apiService.getSiteSettings().then((s) => {
      if (s.phone) setSitePhone(s.phone);
      if (s.hours_weekdays) setHoursWeekdays(s.hours_weekdays);
      if (s.hours_weekends) setHoursWeekends(s.hours_weekends);
      setDeliveryMode(s.delivery_mode ?? 'yandex');
      if (s.delivery_url) setDeliveryUrl(s.delivery_url);
      setDeliveryContactUrl(s.delivery_contact_url ?? '');
    }).catch(() => {});
  }, []);

  // Check for Telegram callback parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const telegramToken = params.get('telegram_token');
    const telegramAction = params.get('telegram_action');

    if (telegramToken && telegramAction === 'register') {
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
      // Save token and open auth modal
      setTelegramCallbackToken(telegramToken);
      setShowAuthModal(true);
    }
  }, []);

  const totalItems = getTotalItems();

  const navLinks: Array<{ to: string; label: string; flag: string; highlight?: boolean }> = [
    { to: '/catalog', label: 'Меню', flag: 'catalog' },
    { to: '/about', label: 'О нас', flag: 'about' },
    { to: deliveryMode === 'yandex' ? deliveryUrl : (deliveryContactUrl || '/delivery'), label: 'Доставка', flag: 'delivery' },
    { to: '/contacts', label: 'Контакты', flag: 'contacts' },
    { to: '/promotions', label: 'Акции', flag: 'promotions', highlight: true },
    { to: '/custom-order', label: 'На заказ', flag: 'custom-order' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        {/* Верхняя утилитарная полоса: телефон и часы работы */}
        <div className="hidden lg:block bg-red-600 text-white">
          <div className="container mx-auto px-8">
            <div className="flex h-9 items-center justify-between text-xs">
              {!isPageDisabled('contacts') ? (
                <a
                  href={`tel:${sitePhone.replace(/\D/g, '')}`}
                  className="flex items-center gap-2 font-medium transition-opacity hover:opacity-80"
                >
                  <Phone size={14} />
                  <span>{sitePhone}</span>
                </a>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-5 text-red-50">
                <span className="flex items-center gap-1.5">
                  <span className="text-red-200">Пн–Пт</span>
                  <span className="font-medium">{hoursWeekdays}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-red-200">Сб–Вс</span>
                  <span className="font-medium">{hoursWeekends}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Основная полоса: логотип, навигация, действия */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4 h-20 md:h-24 px-2 md:px-6">
            <Link to="/" className="flex-shrink-0" aria-label="Понятная еда — на главную">
              <img
                src={logo || "/placeholder.svg"}
                alt="Понятная еда"
                className="h-20 md:h-24 w-auto object-contain max-w-[220px] md:max-w-[280px]"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                if (isPageDisabled(item.flag)) return null;
                const className = `relative rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 ${item.highlight ? 'font-semibold' : ''}`;
                const content = <>{item.label}{item.highlight && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}</>;
                return item.to.startsWith('http') ? (
                  <a key={item.to} href={item.to} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>
                ) : (
                  <Link key={item.to} to={item.to} className={className}>{content}</Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-1.5 md:gap-2">
              {user?.is_staff && onAdminClick && (
                <button
                  onClick={onAdminClick}
                  className="hidden md:block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                >
                  Админка
                </button>
              )}

              <Link
                to="/cart"
                className="relative rounded-lg p-2 text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label="Корзина"
              >
                <ShoppingCart size={22} />
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </Link>

              {user ? (
                <div className="relative group">
                  <button
                    className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Аккаунт"
                  >
                    <User size={22} />
                  </button>
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="invisible absolute right-0 z-50 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-2 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100"
                    >
                      <Link
                        to="/account"
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Настройки аккаунта
                      </Link>
                      <button
                        type="button"
                        onClick={signOut}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Выйти
                      </button>
                    </motion.div>
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                >
                  Войти
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 md:hidden"
                aria-label="Меню"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden overflow-hidden border-t border-gray-100 py-3"
              >
                <nav className="flex flex-col">
                  {navLinks.map((item) =>
                    isPageDisabled(item.flag) ? null : (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium text-gray-800 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        {item.label}
                        {item.highlight && (
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                      </Link>
                    ),
                  )}
                  {user?.is_staff && onAdminClick && (
                    <button
                      onClick={() => { onAdminClick(); setMobileMenuOpen(false); }}
                      className="rounded-lg px-3 py-2.5 text-left text-base font-medium text-gray-800 transition-colors hover:bg-gray-100"
                    >
                      Админка
                    </button>
                  )}
                  {user && (
                    <Link
                      to="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-base font-medium text-gray-800 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      Настройки аккаунта
                    </Link>
                  )}
                </nav>
                <div className="mt-3 space-y-2 border-t border-gray-100 px-3 pt-3">
                  {!isPageDisabled('contacts') && (
                    <a href={`tel:${sitePhone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <Phone size={16} className="text-red-600" />
                      {sitePhone}
                    </a>
                  )}
                  <p className="text-sm text-gray-500">Пн–Пт: {hoursWeekdays}</p>
                  <p className="text-sm text-gray-500">Сб–Вс: {hoursWeekends}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => { setShowAuthModal(false); setTelegramCallbackToken(null); }} />
    </>
  );
};
