import React from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import { useReveal } from '../hooks/useReveal';

interface ProductsSectionProps {
  title: string;
  products: any[];
  /** id категории — для ссылки «Все блюда» в каталог. */
  categoryId?: string;
}

/**
 * На главной показываем только витрину категории (8 карточек) —
 * раньше рендерились все 116 товаров меню разом, что тормозило
 * первую отрисовку и прокрутку.
 */
const MAX_CARDS = 8;

export const ProductsSection: React.FC<ProductsSectionProps> = ({ title, products, categoryId }) => {
  const revealRef = useReveal<HTMLElement>();
  if (!products.length) return null;

  const shown = products.slice(0, MAX_CARDS);
  const hasMore = products.length > MAX_CARDS;

  return (
    <section ref={revealRef} className="py-12 bg-white reveal-on-scroll">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {shown.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
        {hasMore && (
          <div className="text-center mt-8">
            <Link
              to={categoryId ? `/catalog?category=${categoryId}` : '/catalog'}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-full transition-colors"
            >
              Все блюда категории ({products.length})
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
