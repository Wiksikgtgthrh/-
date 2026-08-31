import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, Smartphone, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiService, type LegalDocumentRecord } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot-password' | 'forgot-sent';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [resetEmail, setResetEmail] = useState('');

  const [documents, setDocuments] = useState<LegalDocumentRecord[]>([]);

  const { register, login } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    apiService
      .getLegalDocuments()
      .then((docs) => {
        if (active) setDocuments(docs.filter((d) => d.is_published));
      })
      .catch(() => {
        if (active) setDocuments([]);
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  // Строка согласия со ссылками на правовые документы под кнопками входа/регистрации.
  const renderConsent = (verb: string) => {
    if (documents.length === 0) return null;
    return (
      <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">
        {verb}, вы соглашаетесь с{' '}
        {documents.map((doc, i) => (
          <React.Fragment key={doc.slug}>
            {i > 0 && (i === documents.length - 1 ? ' и ' : ', ')}
            <Link
              to={`/documents/${doc.slug}`}
              onClick={handleClose}
              className="text-red-600 underline hover:text-red-700"
            >
              {doc.title.toLowerCase()}
            </Link>
          </React.Fragment>
        ))}
        .
      </p>
    );
  };

  const resetForm = useCallback(() => {
    setMode('login');
    setPhone('');
    setPassword('');
    setPasswordConfirm('');
    setError('');
    setResetEmail('');
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';

    let formatted = '+';
    if (digits[0] === '7' || digits[0] === '8') {
      formatted += '7';
    } else {
      formatted += digits[0];
    }

    const rest = digits.slice(1);
    if (rest.length > 0) formatted += ' (' + rest.slice(0, 3);
    if (rest.length >= 3) formatted += ')';
    if (rest.length > 3) formatted += ' ' + rest.slice(3, 6);
    if (rest.length > 6) formatted += '-' + rest.slice(6, 8);
    if (rest.length > 8) formatted += '-' + rest.slice(8, 10);

    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const normalizePhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('8')) {
      return '+7' + digits.slice(1);
    }
    return '+' + digits;
  };

  // ==================== Regular Registration/Login ====================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10) {
        throw new Error('Введите корректный номер телефона');
      }

      if (mode === 'register') {
        if (password.length < 8) {
          throw new Error('Пароль должен быть не менее 8 символов');
        }
        if (password !== passwordConfirm) {
          throw new Error('Пароли не совпадают');
        }
        await register({
          phone,
          password,
          password_confirm: passwordConfirm,
        });
        handleClose();
      } else if (mode === 'login') {
        await login(phone, password);
        handleClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка авторизации';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== Password Reset ====================

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiService.passwordResetRequest(resetEmail.trim());
      setMode('forgot-sent');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить письмо');
    } finally {
      setLoading(false);
    }
  };

  // ==================== Render Helpers ====================

  const renderBackButton = () => (
    <button
      type="button"
      onClick={() => setMode('login')}
      className="flex items-center text-gray-500 hover:text-gray-700 mb-4"
    >
      <ArrowLeft size={18} className="mr-1" />
      Назад
    </button>
  );

  const renderTitle = () => {
    switch (mode) {
      case 'login': return 'Вход';
      case 'register': return 'Регистрация';
      case 'forgot-password': return 'Восстановление пароля';
      case 'forgot-sent': return 'Проверьте почту';
      default: return '';
    }
  };

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
            className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{renderTitle()}</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-700"
              >
                {error}
              </motion.div>
            )}

            {/* ==================== LOGIN MODE ==================== */}
            {mode === 'login' && (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Номер телефона
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="+7 (999) 123-45-67"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Пароль
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Забыли пароль?
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? 'Вход...' : 'Войти'}
                  </motion.button>
                  {renderConsent('Нажимая «Войти»')}
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                  Нет аккаунта?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Зарегистрироваться
                  </button>
                </p>
              </>
            )}

            {/* ==================== REGISTER MODE ==================== */}
            {mode === 'register' && (
              <>
                {renderBackButton()}
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Номер телефона
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="+7 (999) 123-45-67"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Пароль
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
                      Подтверждение пароля
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="passwordConfirm"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                  </motion.button>
                  {renderConsent('Регистрируясь')}
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                  Уже есть аккаунт?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Войти
                  </button>
                </p>
              </>
            )}

            {/* ==================== FORGOT PASSWORD MODE ==================== */}
            {mode === 'forgot-password' && (
              <>
                {renderBackButton()}
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Введите подтверждённую почту из профиля. Мы отправим ссылку, по которой можно установить новый пароль.
                  </p>
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      id="reset-email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@example.ru"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors font-medium">
                    {loading ? 'Отправка...' : 'Отправить ссылку'}
                  </motion.button>
                </form>
              </>
            )}

            {mode === 'forgot-sent' && (
              <div className="space-y-4">
                <div className="rounded-md bg-green-50 p-4 text-sm leading-relaxed text-green-800">
                  Если аккаунт с такой почтой существует, письмо со ссылкой уже отправлено. Ссылка действует 1 час.
                </div>
                <button type="button" onClick={() => setMode('login')} className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition-colors font-medium">
                  Вернуться ко входу
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
