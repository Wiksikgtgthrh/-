import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import YandexReviews from '../components/YandexReviews';
import { apiService } from '../services/api';

const AboutPage: React.FC = () => {
  const [hoursWeekdays, setHoursWeekdays] = useState('8:00–21:00');
  const [hoursWeekends, setHoursWeekends] = useState('9:00–21:00');

  useEffect(() => {
    apiService.getSiteSettings().then((s) => {
      if (s.hours_weekdays) setHoursWeekdays(s.hours_weekdays);
      if (s.hours_weekends) setHoursWeekends(s.hours_weekends);
    }).catch(() => {});
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
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
            <h1 className="text-4xl md:text-5xl font-bold mb-6">О нас</h1>
            <p className="text-xl md:text-2xl">
              Когда вкусно — всё понятно.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Наша философия */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Наша философия</h2>
              <p className="text-gray-600 text-lg mb-4">
                «Понятная Еда» — это современное кафе домашней кухни, где всё сделано просто и честно.
              </p>
              <p className="text-gray-600 text-lg mb-4">
                Мы верим, что вкусная еда не должна быть сложной в приготовлении или недоступной.
                Каждый день мы готовим блюда, знакомые каждому с детства: горячие супы, домашние
                гарниры, свежие салаты, ароматную выпечку и хороший кофе.
              </p>
              <p className="text-gray-600 text-lg mb-4">
                Мы создаём место, куда можно прийти всей семьёй, быстро пообедать с коллегами,
                встретиться с друзьями или просто сделать небольшой перерыв в течение рабочего дня.
              </p>
              <p className="text-gray-600 text-lg mb-4">
                Для нас главное — качество продуктов, свежесть блюд, уютная атмосфера и искреннее
                отношение к каждому гостю.
              </p>
              <p className="text-gray-800 text-lg font-semibold">
                Потому что когда вкусно — всё понятно.
              </p>
            </motion.div>
            <motion.div variants={itemVariants} className="relative">
              <img
                src="/images/about/entrance-philosophy.webp"
                alt="Вход в кафе Понятная Еда — открытые двери, летняя терраса"
                className="rounded-lg shadow-xl w-full object-cover h-80"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-red-600/10 to-transparent rounded-lg" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Наше заведение — галерея */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Наше заведение</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Уютная летняя терраса, яркий зал с потолком из подсолнухов и домашняя атмосфера — добро пожаловать!
            </p>
          </motion.div>

          {/* Главное широкое фото */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden shadow-2xl mb-6 h-72 md:h-96"
          >
            <img
              src="/images/about/terrace-hero.webp"
              alt="Летняя терраса кафе Понятная Еда с красными зонтиками и подсолнухами"
              className="w-full h-full object-cover"
              fetchPriority="high"
              decoding="async"
            />
            <div className="absolute inset-0 bg-black/30 flex items-end">
              <div className="p-6 md:p-10">
                <span className="inline-block bg-red-600 text-white text-sm font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                  Летняя терраса
                </span>
                <h3 className="text-white text-2xl md:text-4xl font-bold text-balance">
                  Кафе «Понятная Еда»
                </h3>
                <p className="text-white/80 text-base md:text-lg mt-1">Кафе быстрого питания — вкусно, быстро, по-домашнему</p>
              </div>
            </div>
          </motion.div>

          {/* Сетка фото 3 колонки */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {[
              {
                src: '/images/about/terrace-1.webp',
                alt: 'Летняя терраса с красными зонтиками',
                label: 'Терраса с подсолнухами',
              },
              {
                src: '/images/about/signboard.webp',
                alt: 'Вывеска Понятная Еда крупным планом',
                label: 'Вывеска',
              },
              {
                src: '/images/about/entrance-1.webp',
                alt: 'Вход в кафе — красные зонтики и подсолнухи',
                label: 'Главный вход',
              },
              {
                src: '/images/about/hall-counter.webp',
                alt: 'Зал кафе — стойка со шведским столом и потолок из подсолнухов',
                label: 'Зал и стойка',
              },
              {
                src: '/images/about/hall-guests-1.webp',
                alt: 'Гости за столиками в уютном зале',
                label: 'Уютный зал',
              },
              {
                src: '/images/about/hall-family.webp',
                alt: 'Семья обедает в кафе Понятная Еда',
                label: 'Семейная атмосфера',
              },
            ].map((photo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative rounded-xl overflow-hidden shadow-md group h-52"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <span className="text-white text-sm font-medium">{photo.label}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Нижняя строка — два широких фото */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                src: '/images/about/hall-interior.webp',
                alt: 'Интерьер зала с шаровыми светильниками и деревянными панелями',
                label: 'Интерьер зала',
              },
              {
                src: '/images/about/hall-atmosphere.webp',
                alt: 'Гости за столиками, стойка, яркий зал',
                label: 'Живая атмосфера',
              },
            ].map((photo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-xl overflow-hidden shadow-md group h-64"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <span className="text-white text-sm font-semibold">{photo.label}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Детали — витрины и напитки */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {[
              {
                src: '/images/about/desserts.webp',
                alt: 'Витрина с домашними тортами и десертами',
                label: 'Домашние десерты',
              },
              {
                src: '/images/about/drinks.webp',
                alt: 'Стойка с напитками, кофемашина и холодильник',
                label: 'Напитки и кофе',
              },
              {
                src: '/images/about/hall-panorama.webp',
                alt: 'Панорама зала со стойкой и потолком из подсолнухов',
                label: 'Панорама зала',
              },
            ].map((photo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative rounded-xl overflow-hidden shadow-md group h-48"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <span className="text-white text-sm font-medium">{photo.label}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Финальное широкое панорамное фото */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl overflow-hidden shadow-xl mt-4 h-64 md:h-80"
          >
            <img
              src="/images/about/hall-wide.webp"
              alt="Панорама зала кафе — деревянные панели, шаровые светильники, столики"
              className="w-full h-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
              <div className="text-center">
                <p className="text-white/90 text-lg md:text-xl font-light tracking-widest uppercase mb-2">Добро пожаловать</p>
                <h3 className="text-white text-3xl md:text-5xl font-bold text-balance">Вкусно. Быстро. По-домашнему.</h3>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Время работы */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Время работы</h2>
            <div className="max-w-sm mx-auto space-y-3">
              <div className="bg-white rounded-lg p-6 shadow-md flex justify-between items-center">
                <div className="text-gray-600 font-medium">Пн — Пт</div>
                <div className="text-xl font-bold text-red-600">{hoursWeekdays}</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-md flex justify-between items-center">
                <div className="text-gray-600 font-medium">Сб — Вс</div>
                <div className="text-xl font-bold text-red-600">{hoursWeekends}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Отзывы */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Что говорят наши гости</h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <YandexReviews />
          </motion.div>
        </div>
      </section>

      {/* Присоединяйтесь */}
      <section className="py-16 bg-red-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Заходите в «Понятную Еду»</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Загляните в меню и выберите то, что хочется именно сегодня.
            </p>
            <a
              href="/catalog"
              className="inline-block bg-white text-red-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Перейти в меню
            </a>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default AboutPage;
