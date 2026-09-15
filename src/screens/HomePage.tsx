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

  const menuCategories = ['Гарниры', 'Супы', 'Горячие блюда', 'Завтраки', 'Салаты', 'Лимонады'];
  const sections = menuCategories
    .map((title) => ({
      title,
      products: products.filter((product: Product) => categories.some((category) =>
        category.name.trim().toLocaleLowerCase('ru-RU') === title.toLocaleLowerCase('ru-RU') &&
        String(category.id) === String(product.category_id),
      )),
    }))
    .filter((section) => section.products.length > 0);

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
      {sections.map((section) => (
        <ProductsSection key={section.title} title={section.title} products={section.products} />
      ))}
      <AboutSection />
      <MapSection />
    </motion.div>
  );
};

export default HomePage;
