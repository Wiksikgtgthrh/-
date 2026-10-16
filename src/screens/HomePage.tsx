import React from 'react';
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
    .map((title) => {
      const category = categories.find((c) =>
        c.name.trim().toLocaleLowerCase('ru-RU') === title.toLocaleLowerCase('ru-RU'),
      );
      if (!category) return null;
      const sectionProducts = products.filter(
        (product: Product) => String(category.id) === String(product.category_id),
      );
      return {
        title,
        categoryId: String(category.id),
        products: sectionProducts,
      };
    })
    .filter((section): section is NonNullable<typeof section> => section !== null && section.products.length > 0);

  return (
    <div>
      <Hero />
      <MenuSlider categories={categories} />
      <DishOfTheDay />
      {sections.map((section) => (
        <ProductsSection
          key={section.title}
          title={section.title}
          products={section.products}
          categoryId={section.categoryId}
        />
      ))}
      <AboutSection />
      <MapSection />
    </div>
  );
};

export default HomePage;
