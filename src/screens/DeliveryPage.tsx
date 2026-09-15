import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CreditCard, MapPin, Package, Phone, CheckCircle, ExternalLink } from 'lucide-react';
import { apiService } from '../services/api';

const DeliveryPage: React.FC = () => {
  const [deliveryMode, setDeliveryMode] = React.useState<'yandex' | 'local'>('yandex');
  const [deliveryUrl, setDeliveryUrl] = React.useState('https://eda.yandex.ru/r/ponatnaa_plan_restaurant?placeSlug=ponyatnaya_plan');
  const [deliveryPhone, setDeliveryPhone] = React.useState('+7 (842) 123-45-67');
  const [deliveryContactUrl, setDeliveryContactUrl] = React.useState('mailto:info@ponyatnaya-eda.ru');

  React.useEffect(() => {
    apiService.getSiteSettings().then((settings) => {
      setDeliveryMode(settings.delivery_mode ?? 'yandex');
      if (settings.delivery_url) setDeliveryUrl(settings.delivery_url);
      setDeliveryPhone(settings.delivery_phone || settings.phone);
      setDeliveryContactUrl(settings.delivery_contact_url || 'mailto:info@ponyatnaya-eda.ru');
    }).catch(() => {});
  }, []);
  const deliveryZones = [
    { name: 'Центр города', price: 199, minOrder: 0, time: '30-40 мин' },
    { name: 'Спальные районы', price: 299, minOrder: 0, time: '40-60 мин' },
    { name: 'Пригород', price: 399, minOrder: 1500, time: '60-90 мин' },
  ];

  const features = [
    { icon: Clock, title: 'Быстрая доставка', desc: 'Среднее время доставки 30-60 минут' },
    { icon: Package, title: 'Свежие продукты', desc: 'Готовим в день доставки' },
    { icon: CreditCard, title: 'Оплата при получении', desc: 'Наличными или картой' },
    { icon: Phone, title: 'Поддержка 24/7', desc: 'Всегда на связи' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white"
    >
      {/* Hero секция с фото кафе */}
      <section className="relative text-white py-20 overflow-hidden">
        <img
          src="/images/delivery/delivery-hero.webp"
          alt="Кафе «Понятная Еда» — вывеска"
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/70" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">Доставка</h1>
            <p className="text-xl md:text-2xl mb-8 drop-shadow">
              Привезём ваши любимые десерты в любую точку Ульяновска
            </p>
          </motion.div>
        </div>
      </section>

      {deliveryMode === 'yandex' ? (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Заказы принимаются через Яндекс.Еду</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-7">
              Выберите блюда, оформите корзину и оплатите заказ на странице нашего ресторана в Яндекс.Еде.
            </p>
            <motion.a
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              href={deliveryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-7 py-3 font-semibold text-white shadow-lg hover:bg-red-700 transition-colors"
            >
              Перейти в Яндекс.Еду <ExternalLink size={18} />
            </motion.a>
          </div>
        </section>
      ) : (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Локальная доставка</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-7">Добавьте блюда в корзину и оформите заказ на сайте.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.a whileHover={{ scale: 1.05, y: -3, boxShadow: '0 12px 30px -12px rgba(220,38,38,0.7)' }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} href={`tel:${deliveryPhone.replace(/\D/g, '')}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-7 py-3 font-semibold text-white shadow-md">
                <Phone size={18} /> Позвонить
              </motion.a>
              <motion.a whileHover={{ scale: 1.05, y: -3, backgroundColor: '#fee2e2' }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} href={deliveryContactUrl} target={deliveryContactUrl.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-red-600 px-7 py-3 font-semibold text-red-600">
                Написать
              </motion.a>
              <motion.a whileHover={{ scale: 1.05, y: -3, boxShadow: '0 12px 30px -12px rgba(0,0,0,0.35)' }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} href="/cart" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-7 py-3 font-semibold text-white shadow-md">
                Перейти в корзину
              </motion.a>
            </div>
          </div>
        </section>
      )}

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
            {features.map((feat, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="text-center"
              >
                <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feat.icon size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{feat.title}</h3>
                <p className="text-gray-600">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Зоны доставки */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Зоны доставки</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Мы доставляем по всему Ульяновску и пригороду. Стоимость зависит от района.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {deliveryZones.map((zone, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <MapPin size={24} className="text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{zone.name}</h3>
                  <div className="space-y-2 text-gray-600">
                    <p className="flex justify-between">
                      <span>Стоимость:</span>
                      <span className="font-semibold text-red-600">{zone.price} ₽</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Мин. заказ:</span>
                      <span>{zone.minOrder === 0 ? 'без ограничений' : `от ${zone.minOrder} ₽`}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Время:</span>
                      <span>{zone.time}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Условия доставки */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-50 rounded-2xl p-8 md:p-12"
          >
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Условия доставки</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-800">Бесплатная доставка</h3>
                  <p className="text-gray-600">При заказе от 3000 ₽ — доставка по городу бесплатно.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Clock className="text-red-500 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-800">Время доставки</h3>
                  <p className="text-gray-600">
                    Доставка осуществляется ежедневно с 8:00 до 21:00. Точное время согласовывается с менеджером.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Package className="text-red-500 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-800">Самовывоз</h3>
                  <p className="text-gray-600">
                    Вы можете забрать заказ самостоятельно из нашей кондитерской по адресу: Ульяновск, улица Железной Дивизии, 7.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CreditCard className="text-red-500 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-800">Оплата</h3>
                  <p className="text-gray-600">
                    Наличными курьеру или картой при получении. Безналичный расчёт доступен только для юридических лиц.
                  </p>
                </div>
              </div>
            </div>
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
            <h2 className="text-3xl font-bold mb-4">Остались вопросы?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Свяжитесь с нами — мы с радостью поможем!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="tel:+78421234567"
                className="inline-block bg-white text-red-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Позвонить
              </a>
              <a
                href="mailto:info@ponyatnaya-eda.ru"
                className="inline-block bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-red-600 transition-colors"
              >
                Написать
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default DeliveryPage;
