import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Instagram } from 'lucide-react';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';
import { apiService, type LegalDocumentRecord } from '../services/api';

const VkIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.785 16.241s.288-.032.435-.193c.135-.148.131-.425.131-.425s-.02-1.302.582-1.494c.594-.19 1.357 1.259 2.165 1.816.611.421 1.076.329 1.076.329l2.163-.03s1.131-.07.595-.96c-.044-.073-.312-.659-1.606-1.866-1.354-1.263-1.172-1.058.459-3.238.993-1.328 1.39-2.139 1.266-2.486-.118-.331-.85-.244-.85-.244l-2.434.015s-.18-.025-.314.055c-.131.079-.215.262-.215.262s-.387 1.031-.902 1.908c-1.087 1.852-1.522 1.95-1.7 1.835-.413-.267-.31-1.072-.31-1.644 0-1.787.271-2.532-.527-2.725-.265-.064-.46-.106-1.138-.113-.87-.009-1.606.003-2.023.207-.277.136-.491.439-.361.457.16.022.522.098.714.36.248.338.239 1.097.239 1.097s.143 2.088-.333 2.347c-.327.178-.776-.185-1.745-1.866-.496-.861-.871-1.812-.871-1.812s-.072-.177-.201-.272c-.156-.115-.374-.151-.374-.151l-2.313.015s-.347.01-.474.161c-.114.135-.009.414-.009.414s1.811 4.237 3.862 6.374c1.881 1.959 4.016 1.83 4.016 1.83z"/>
  </svg>
);

const TelegramIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

export const Footer: React.FC = () => {
  const { isPageDisabled } = useFeatureFlags();
  const [documents, setDocuments] = useState<LegalDocumentRecord[]>([]);
  const [sitePhone, setSitePhone] = useState('+7 (842) 123-45-67');
  const [hoursWeekdays, setHoursWeekdays] = useState('8:00–21:00');
  const [hoursWeekends, setHoursWeekends] = useState('9:00–21:00');

  useEffect(() => {
    apiService.getSiteSettings().then((s) => {
      if (s.phone) setSitePhone(s.phone);
      if (s.hours_weekdays) setHoursWeekdays(s.hours_weekdays);
      if (s.hours_weekends) setHoursWeekends(s.hours_weekends);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    apiService
      .getLegalDocuments()
      .then((docs) => {
        if (active) setDocuments(docs.filter((d) => d.is_published));
      })
      .catch(() => {
        if (active) setDocuments([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Колонка 1: Информация о компании */}
          <div>
            <h3 className="text-2xl font-bold text-red-500 mb-4">Понятная еда</h3>
            <p className="text-gray-300 mb-4">
              Кафе домашней кухни в Ульяновске. Горячие обеды, свежая выпечка,
              ароматный кофе и десерты — всё, чтобы вкусно перекусить.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://vk.com/ponytnayaeda"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ВКонтакте"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <VkIcon size={24} />
              </a>
              <a
                href="https://www.instagram.com/ponytnayaeda"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Instagram size={24} />
              </a>
              <a
                href="https://t.me/ponytnayaeda"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <TelegramIcon size={24} />
              </a>
            </div>
          </div>

          <div className="text-sm text-gray-300 lg:col-span-2">
            <h4 className="text-lg font-semibold mb-4 text-white">Реквизиты</h4>
            <p>ИП Бодров Сергей Юрьевич</p>
            <p>ИНН: 732603950300</p>
            <p>ОГРНИП: 31773250013295</p>
            <p className="mt-2 max-w-sm leading-relaxed">Адрес: 432044, г. Ульяновск,<br />ул. Хрустальная, д. 28, кв. 20</p>
          </div>

          {/* Колонка 2: Контакты */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Контакты</h4>
            <div className="space-y-3">
              {!isPageDisabled('contacts') && (
                <a href={`tel:${sitePhone.replace(/\D/g, '')}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                  <Phone size={18} className="text-red-500" />
                  <span>{sitePhone}</span>
                </a>
              )}
              <div className="flex items-center space-x-3">
                <Mail size={18} className="text-red-500" />
                <span>info@ponyatnaya-eda.ru</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin size={18} className="text-red-500" />
                <span>Ульяновск, улица Железной Дивизии, 7</span>
              </div>
              <div className="flex items-start space-x-3">
                <Clock size={18} className="text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <div>Пн — Пт: {hoursWeekdays}</div>
                  <div>Сб — Вс: {hoursWeekends}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Колонка 3: Навигация по сайту */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Быстрые ссылки</h4>
            <ul className="space-y-2">
              {!isPageDisabled('catalog') && <li><Link to="/catalog" className="text-gray-300 hover:text-white transition-colors">Меню</Link></li>}
              {!isPageDisabled('about') && <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors">О нас</Link></li>}
              {!isPageDisabled('delivery') && <li><Link to="/delivery" className="text-gray-300 hover:text-white transition-colors">Доставка</Link></li>}
              {!isPageDisabled('contacts') && <li><Link to="/contacts" className="text-gray-300 hover:text-white transition-colors">Контакты</Link></li>}
              {!isPageDisabled('promotions') && <li><Link to="/promotions" className="text-gray-300 hover:text-white transition-colors">Акции</Link></li>}
              {!isPageDisabled('custom-order') && <li><Link to="/custom-order" className="text-gray-300 hover:text-white transition-colors">На заказ</Link></li>}
            </ul>
          </div>

          {/* Колонка 4: Документы */}
          <div>
              <h4 className="text-lg font-semibold mb-4">Документы</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy-policy" className="text-gray-300 hover:text-white transition-colors">Политика конфиденциальности</Link></li>
                <li><Link to="/delivery-terms" className="text-gray-300 hover:text-white transition-colors">Условия доставки и оплаты</Link></li>
                {documents.map((doc) => (
                    doc.slug !== 'privacy-policy' && doc.slug !== 'delivery-terms' && doc.slug !== 'offer' &&
                  <li key={doc.slug}>
                    <Link
                      to={`/documents/${doc.slug}`}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {doc.title}
                    </Link>
                  </li>
                ))}
              </ul>
          </div>
        </div>

        <hr className="border-gray-600 my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm">© 2026 Понятная еда. Все права защищены.</p>
          <p className="text-gray-300 text-sm mt-2 md:mt-0">Разработано с ❤️ для города Ульяновска</p>
        </div>
      </div>
    </footer>
  );
};
