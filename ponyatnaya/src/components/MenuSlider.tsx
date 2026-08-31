import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  image_url?: string | null;
}

interface MenuSliderProps {
  categories: Category[];
}

// Иконки для категорий
const categoryIcons: Record<string, string> = {
  'Супы': '🍲',
  'Горячее': '🍗',
  'Салаты': '🥗',
  'Выпечка': '🥐',
  'Колобки': '🟡',
  'Напитки': '☕️',
};

export const MenuSlider: React.FC<MenuSliderProps> = ({ categories }) => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/catalog?category=${categoryId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Берем только первые 6 категорий
  const displayCategories = categories.slice(0, 6);

  return (
    <div className="w-full bg-white py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            МЕНЮ
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Выберите категорию и откройте для себя вкусные блюда
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto"
        >
          {displayCategories.map((category) => (
            <motion.div
              key={category.id}
              variants={itemVariants}
              className="cursor-pointer group"
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.02] p-3">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                  {(category.image || category.image_url) ? (
                    <img
                      src={category.image || category.image_url!}
                      alt={category.name}
                      className="w-full h-full object-cover border-2 border-amber-300 rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center border-2 border-amber-300 rounded-lg">
                      <span className="text-5xl">{categoryIcons[category.name] || '🍽️'}</span>
                    </div>
                  )}
                </div>
                <div className="py-4 text-center">
                  <span className="text-gray-800 font-semibold text-lg md:text-xl">
                    {category.name}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
