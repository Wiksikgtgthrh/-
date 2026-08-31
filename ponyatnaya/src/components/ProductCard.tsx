import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Product } from '../services/api';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find(item => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = () => addItem(product);
  const handleUpdateQuantity = (newQuantity: number) => updateQuantity(product.id, newQuantity);

  const nutrition = product.nutrition_per_100g;
  const nutritionText =
    nutrition && nutrition.length === 4
      ? `Б: ${nutrition[0]} г, Ж: ${nutrition[1]} г, У: ${nutrition[2]} г, Ккал: ${nutrition[3]} ккал`
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="product-card bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col h-full"
    >
      <Link to={`/product/${product.slug}`} className="block relative pb-[100%] bg-gray-100 overflow-hidden p-3">
        {product.image_url ? (
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            src={product.image_url}
            alt={product.name}
            className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)] object-cover rounded-lg border-2 border-amber-300"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-3 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-2 border-amber-300">
            Нет фото
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
          <h3 className="font-bold text-lg hover:text-red-600 transition-colors text-left leading-tight">
            <Link to={`/product/${product.slug}`}>
              {product.name}
            </Link>
          </h3>
        </div>
        {product.weight && (
          <p className="text-gray-500 text-sm mb-2">
            <span className="font-medium text-gray-700">Вес / объём:</span> {product.weight}
          </p>
        )}
        {product.composition && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            <span className="font-medium text-gray-700">Состав:</span> {product.composition}
          </p>
        )}
        {nutritionText && (
          <p className="text-gray-700 text-sm mb-3 line-clamp-2">{nutritionText}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xl font-bold text-gray-900">
            {product.price.toLocaleString('ru-RU')} ₽
          </span>
          {quantity > 0 ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleUpdateQuantity(quantity - 1)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <Minus size={16} />
              </button>
              <motion.span
                key={quantity}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="font-bold w-6 text-center"
              >
                {quantity}
              </motion.span>
              <button
                onClick={() => handleUpdateQuantity(quantity + 1)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full flex items-center space-x-1 transition-colors"
            >
              <ShoppingCart size={18} />
              <span>В корзину</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
