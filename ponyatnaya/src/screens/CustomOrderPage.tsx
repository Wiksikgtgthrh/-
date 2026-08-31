import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChefHat, Sparkles, Truck, User, Phone, MessageSquare, Heart } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const CustomOrderPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    desired_date: '',
    description: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Custom order:', formData);
      setSubmitted(true);
      showSuccess('Спасибо! Мы свяжемся с вами для уточнения деталей.');
    } catch (error) {
      showError('Ошибка при отправке заявки. Попробуйте позже.');
    }
  };

  const advantages = [
    { icon: Sparkles, title: 'Уникальный дизайн', desc: 'Создадим торт, который отразит вашу идею' },
    { icon: ChefHat, title: 'Любые начинки', desc: 'Выбирайте вкусы из нашего меню или придумайте свой' },
    { icon: Heart, title: 'Натуральные продукты', desc: 'Только свежие и качественные ингредиенты' },
    { icon: Calendar, title: 'Точно к дате', desc: 'Гарантируем готовность к вашему празднику' },
  ];

  const steps = [
    { icon: MessageSquare, title: 'Оставьте заявку', desc: 'Заполните форму с вашими пожеланиями' },
    { icon: ChefHat, title: 'Обсуждение', desc: 'Мы свяжемся и уточним детали' },
    { icon: Sparkles, title: 'Создание', desc: 'Наши кондитеры готовят ваш уникальный торт' },
    { icon: Truck, title: 'Доставка', desc: 'Привезём в назначенный день' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  if (submitted) {
    return (
      <div className="py-20 bg-white text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-8 text-green-800"
          >
            <h2 className="text-2xl font-bold mb-4">Заявка отправлена!</h2>
            <p className="text-lg mb-6">
              Спасибо за ваш заказ. Мы свяжемся с вами в ближайшее время для уточнения деталей.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Создать новый заказ
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white"
    >
      {/* Hero секция */}
      <section className="relative bg-gradient-to-r from-red-700 to-red-900 text-white py-20">
        <div className="absolute inset-0 bg-black/40" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Торт на заказ</h1>
            <p className="text-xl md:text-2xl mb-8">
              Создадим уникальный десерт для вашего праздника
            </p>
          </motion.div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {advantages.map((adv, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="text-center"
              >
                <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <adv.icon size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{adv.title}</h3>
                <p className="text-gray-600">{adv.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Как мы работаем */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Как мы работаем</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Четыре простых шага к вашему идеальному торту
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative bg-white rounded-lg p-6 shadow-md text-center"
              >
                <div className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {idx + 1}
                </div>
                <step.icon size={32} className="mx-auto text-red-600 mb-3" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Форма заказа */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-50 rounded-2xl shadow-xl p-8 md:p-12"
          >
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Оставьте заявку</h2>
            <p className="text-center text-gray-600 mb-8">
              Расскажите о своих пожеланиях, и мы свяжемся с вами
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline mr-1" /> Ваше имя *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone size={16} className="inline mr-1" /> Телефон *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+7 (___) ___-__-__"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" /> Желаемая дата *
                </label>
                <input
                  type="date"
                  name="desired_date"
                  required
                  value={formData.desired_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare size={16} className="inline mr-1" /> Описание торта (вкус, дизайн, размер) *
                </label>
                <textarea
                  name="description"
                  rows={5}
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  placeholder="Например: бисквитный торт с кремом из маскарпоне, ягодами и надписью «С днём рождения», диаметр 20 см."
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium text-lg shadow-md"
              >
                Отправить заявку
              </motion.button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Призыв к действию */}
      <section className="py-16 bg-red-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Хотите особенный торт?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Свяжитесь с нами, и мы создадим десерт вашей мечты
            </p>
            <a
              href="tel:+78421234567"
              className="inline-block bg-white text-red-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Позвонить нам
            </a>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default CustomOrderPage;
