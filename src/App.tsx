import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { FeatureFlagsProvider, useFeatureFlags } from './contexts/FeatureFlagsContext';
import { PageGuard } from './components/PageDisabled';
import { SiteMaintenance } from './components/SiteMaintenance';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdminOrderNotifier } from './components/AdminOrderNotifier';
import { SitePopup } from './components/SitePopup';
import HomePage from './screens/HomePage';
import CatalogPage from './screens/CatalogPage';
import { ToastProvider } from './contexts/ToastContext';

/**
 * Код-сплиттинг: админ-панель (~2000 строк + 12 подкомпонентов) и редко
 * посещаемые экраны грузятся отдельными чанками по требованию.
 * Главная и каталог остаются в основном бандле — это основные маршруты.
 */
const AdminPanel = lazy(() =>
  import('./components/AdminPanel').then((m) => ({ default: m.AdminPanel })),
);
const ProductDetailPage = lazy(() => import('./screens/ProductDetailPage'));
const AboutPage = lazy(() => import('./screens/AboutPage'));
const DeliveryPage = lazy(() => import('./screens/DeliveryPage'));
const ContactsPage = lazy(() => import('./screens/ContactsPage'));
const PromotionsPage = lazy(() => import('./screens/PromotionsPage'));
const PromotionDetailPage = lazy(() => import('./screens/PromotionDetailPage'));
const CustomOrderPage = lazy(() => import('./screens/CustomOrderPage'));
const AccountPage = lazy(() => import('./screens/AccountPage'));
const VerifyEmailPage = lazy(() => import('./screens/VerifyEmailPage'));
const ResetPasswordPage = lazy(() => import('./screens/ResetPasswordPage'));
const LegalDocumentPage = lazy(() => import('./screens/LegalDocumentPage'));
const CartPage = lazy(() => import('./screens/CartPage'));

const RouteFallback = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
  </div>
);

const AnimatedPage = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

function AppContent() {
  const location = useLocation();
  const { isPageDisabled } = useFeatureFlags();
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [location.key]); 

  // Весь сайт отключён: показываем заглушку, но оставляем персоналу вход в админ-панель,
  // чтобы можно было снова включить сайт.
  if (isPageDisabled('site')) {
    return (
      <>
        <SiteMaintenance onStaffClick={() => setShowAdminPanel(true)} />
        {showAdminPanel && (
          <Suspense fallback={<RouteFallback />}>
            <AdminPanel isOpen onClose={() => setShowAdminPanel(false)} />
          </Suspense>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onAdminClick={() => setShowAdminPanel(true)} />
      <main className="flex-grow">
        <Suspense fallback={<RouteFallback />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<AnimatedPage><HomePage /></AnimatedPage>} />
              <Route path="/catalog" element={<AnimatedPage><PageGuard disabled={isPageDisabled('catalog')} title="Меню временно недоступно"><CatalogPage /></PageGuard></AnimatedPage>} />
              <Route path="/cart" element={<AnimatedPage><CartPage /></AnimatedPage>} />
              <Route path="/product/:slug" element={<AnimatedPage><PageGuard disabled={isPageDisabled('catalog')} title="Меню временно недоступно"><ProductDetailPage /></PageGuard></AnimatedPage>} />
              <Route path="/about" element={<AnimatedPage><PageGuard disabled={isPageDisabled('about')}><AboutPage /></PageGuard></AnimatedPage>} />
              <Route path="/delivery" element={<AnimatedPage><PageGuard disabled={isPageDisabled('delivery')}><DeliveryPage /></PageGuard></AnimatedPage>} />
              <Route path="/contacts" element={<AnimatedPage><PageGuard disabled={isPageDisabled('contacts')}><ContactsPage /></PageGuard></AnimatedPage>} />
              <Route path="/promotions" element={<AnimatedPage><PageGuard disabled={isPageDisabled('promotions')}><PromotionsPage /></PageGuard></AnimatedPage>} />
              <Route path="/promotions/:id" element={<AnimatedPage><PageGuard disabled={isPageDisabled('promotions')}><PromotionDetailPage /></PageGuard></AnimatedPage>} />
              <Route path="/custom-order" element={<AnimatedPage><PageGuard disabled={isPageDisabled('custom-order')}><CustomOrderPage /></PageGuard></AnimatedPage>} />
              <Route path="/account" element={<AnimatedPage><AccountPage /></AnimatedPage>} />
              <Route path="/verify-email" element={<AnimatedPage><VerifyEmailPage /></AnimatedPage>} />
              <Route path="/reset-password" element={<AnimatedPage><ResetPasswordPage /></AnimatedPage>} />
              <Route path="/documents/:slug" element={<AnimatedPage><LegalDocumentPage /></AnimatedPage>} />
              <Route path="/privacy-policy" element={<AnimatedPage><LegalDocumentPage slugOverride="privacy-policy" /></AnimatedPage>} />
              <Route path="/delivery-terms" element={<AnimatedPage><LegalDocumentPage slugOverride="delivery-terms" /></AnimatedPage>} />
              <Route path="/offer" element={<AnimatedPage><LegalDocumentPage slugOverride="offer" /></AnimatedPage>} />
              <Route path="/user-agreement" element={<AnimatedPage><LegalDocumentPage slugOverride="user-agreement" /></AnimatedPage>} />
              <Route path="/personal-data-consent" element={<AnimatedPage><LegalDocumentPage slugOverride="personal-data-consent" /></AnimatedPage>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      <Footer />
      <SitePopup />
      <AdminOrderNotifier />
      {/* Панель монтируется (и грузит свой чанк) только когда открыта */}
      {showAdminPanel && (
        <Suspense fallback={<RouteFallback />}>
          <AdminPanel isOpen onClose={() => setShowAdminPanel(false)} />
        </Suspense>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <FeatureFlagsProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </FeatureFlagsProvider>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
