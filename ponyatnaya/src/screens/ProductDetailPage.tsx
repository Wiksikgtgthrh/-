import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { ShoppingCart } from 'lucide-react';

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    apiService.getProduct(slug).then((data) => {
      setProduct(data ?? null);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="text-center py-20">Загрузка...</div>;
  if (!product) return <div className="text-center py-20">Товар не найден</div>;

  const nutrition = product.nutrition_per_100g as number[] | undefined;
  const nutritionText =
    nutrition && nutrition.length === 4
      ? `Б: ${nutrition[0]} г, Ж: ${nutrition[1]} г, У: ${nutrition[2]} г, Ккал: ${nutrition[3]} ккал`
      : null;

  return (
    <div className="py-12 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Image */}
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <img src={product.image_url} alt={product.name} className="w-full h-auto" />
          </div>
          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            {product.weight && <p className="text-gray-500 mb-2">Вес: {product.weight}</p>}
            <p className="text-gray-700 mb-6">{product.description}</p>
            {nutritionText && <p className="text-gray-800 mb-6">{nutritionText}</p>}
            <div className="text-2xl font-bold text-green-600 mb-6">
              {product.price.toLocaleString('ru-RU')}₽
            </div>
            <button
              onClick={() => addItem(product)}
              className="bg-red-600 text-white px-8 py-3 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition-colors"
            >
              <ShoppingCart size={20} />
              <span>В корзину</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
