import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, type HeroSlideRecord } from '../services/api';

interface Slide {
  title: string;
  subtitle: string;
  image: string;
  cta: string;
  link: string;
}

const defaultSlides: Slide[] = [
  {
    title: 'Понятная еда\nв самом центре Ульяновска',
    subtitle: 'Домашние блюда, свежая выпечка\nи первая в городе Колобочная №1',
    image: '/images/interior-1.png',
    cta: 'Заказать сейчас',
    link: '/catalog'
  },
  {
    title: 'Быстрая доставка по Ульяновску',
    subtitle: 'Доставляем горячую выпечку за 30-60 минут',
    image: '/images/hero/slide-2.jpg',
    cta: 'Смотреть меню',
    link: '/catalog'
  },
  {
    title: 'Торты на заказ',
    subtitle: 'Создаем уникальные торты для ваших праздников',
    image: '/images/hero/slide-3.jpg',
    cta: 'Заказать торт',
    link: '/custom-order'
  }
];

export const Hero: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<Slide[]>(defaultSlides);

  useEffect(() => {
    let active = true;
    apiService
      .getHeroSlides()
      .then((data: HeroSlideRecord[]) => {
        if (!active || !data.length) return;
        setSlides(
          data.map((s) => ({
            title: s.title,
            subtitle: s.subtitle,
            image: s.image || defaultSlides[0].image,
            cta: s.button_text || 'Подробнее',
            link: s.button_link || '/catalog',
          })),
        );
        setCurrentSlide(0);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative h-[500px] md:h-[600px] overflow-hidden bg-gray-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
          >
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="relative h-full flex items-center">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="max-w-2xl text-white"
              >
                <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight whitespace-pre-line">
                  {slides[currentSlide].title}
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-gray-200 whitespace-pre-line">
                  {slides[currentSlide].subtitle}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const link = slides[currentSlide].link;
                    if (link?.startsWith('http')) window.open(link, '_blank');
                    else navigate(link || '/catalog');
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white text-lg font-medium px-8 py-4 rounded-lg transition-all duration-300 shadow-lg"
                >
                  {slides[currentSlide].cta}
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300"
      >
        <ChevronRight size={24} />
      </button>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
