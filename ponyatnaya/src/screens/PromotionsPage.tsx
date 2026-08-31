import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { ArrowRight, Clock } from 'lucide-react';

const PromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getPromotions().then(data => {
      setPromotions(data);
      setLoading(false);
    });
  }, []);

  const getTimeLeft = (endDate: string): string => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Акция завершена';
    if (diffDays === 1) return '1 день до конца';
    if (diffDays >= 2 && diffDays <= 4) return `${diffDays} дня до конца`;
    return `${diffDays} дней до конца`;
  };

  if (loading) return <div className="text-center py-20">Загрузка...</div>;

  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Акции</h1>
        {promotions.length === 0 ? (
          <p className="text-center text-gray-500">Нет активных акций</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {promotions.map(promo => (
              <Link 
                key={promo.id} 
                to={`/promotions/${promo.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow group"
              >
                <div className="w-full p-6 md:p-8">
                  <div className="w-full aspect-[16/10] md:aspect-[4/3] rounded-lg overflow-hidden">
                    <img 
                      src={promo.image_url} 
                      alt={promo.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
                <div className="px-4 pb-4 flex flex-col flex-grow">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-lg font-bold">{promo.title}</h2>
                    {promo.end_date && (
                      <span className="text-xs text-red-600 font-medium whitespace-nowrap bg-red-50 px-2 py-1 rounded flex items-center gap-1">
                        <Clock size={12} />
                        {getTimeLeft(promo.end_date)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mt-auto line-clamp-2">{promo.description}</p>
                  <div className="mt-3 flex items-center text-red-600 text-sm font-medium">
                    <span>Подробнее</span>
                    <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionsPage;
