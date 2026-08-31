import React from 'react';
import { motion } from 'framer-motion';
import { Hero } from '../components/Hero';
import { ProductsSection } from '../components/ProductsSection';
import { AboutSection } from '../components/AboutSection';
import { MapSection } from '../components/MapSection';
import { MenuSlider } from '../components/MenuSlider';
import { DishOfTheDay } from '../components/DishOfTheDay';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { Product } from '../services/api';

const HomePage: React.FC = () => {
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();

  if (productsLoading || categoriesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  const novelties = products.slice(0, 4);
  const popular = products.filter((p: Product) => p.badges?.some((b) => b.text === 'Хит'));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="animate-fade-up"
    >
      <Hero />
      <MenuSlider categories={categories} />
      <DishOfTheDay />
      <ProductsSection title="Новинки" products={novelties} />
      {popular.length > 0 && <ProductsSection title="Популярное" products={popular} />}
      <AboutSection />
      <MapSection />
    </motion.div>
  );
};

export default HomePage;
