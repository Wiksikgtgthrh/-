import React, { useState, useEffect } from 'react'
import { MapPin, Phone, Clock, Navigation } from 'lucide-react'
import { apiService } from '../services/api'

export const MapSection: React.FC = () => {
  const [sitePhone, setSitePhone] = useState('+7 (842) 123-45-67')
  const [hoursWeekdays, setHoursWeekdays] = useState('8:00–21:00')
  const [hoursWeekends, setHoursWeekends] = useState('9:00–21:00')

  useEffect(() => {
    apiService.getSiteSettings().then((s) => {
      if (s.phone) setSitePhone(s.phone)
      if (s.hours_weekdays) setHoursWeekdays(s.hours_weekdays)
      if (s.hours_weekends) setHoursWeekends(s.hours_weekends)
    }).catch(() => {})
  }, [])

  return (
    <section id="contacts" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Где нас найти</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Мы находимся в центре Ульяновска и доставляем по всему городу
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Contact Information */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Контактная информация</h3>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-red-600 rounded-lg flex items-center justify-center text-white">
                    <MapPin size={18} className="md:w-5 md:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm md:text-base">Адрес</h4>
                    <p className="text-gray-600 text-sm md:text-base break-words">Ульяновск, улица Железной Дивизии, 7</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-red-600 rounded-lg flex items-center justify-center text-white">
                    <Phone size={18} className="md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm md:text-base">Телефон</h4>
                    <a href={`tel:${sitePhone.replace(/\D/g, '')}`} className="text-gray-600 text-sm md:text-base hover:text-red-600 transition-colors">{sitePhone}</a>
                  </div>
                </div>

                <div className="flex items-start space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-red-600 rounded-lg flex items-center justify-center text-white">
                    <Clock size={18} className="md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm md:text-base">Время работы</h4>
                    <p className="text-gray-600 text-sm md:text-base">Пн — Пт: {hoursWeekdays}</p>
                    <p className="text-gray-600 text-sm md:text-base">Сб — Вс: {hoursWeekends}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-red-600 rounded-lg flex items-center justify-center text-white">
                    <Navigation size={18} className="md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm md:text-base">Зона доставки</h4>
                    <p className="text-gray-600 text-sm md:text-base">По всему Ульяновску и области</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg overflow-hidden h-96 relative">
            <div style={{position:'relative',overflow:'hidden',width:'100%',height:'100%'}}>
              <a href="https://yandex.ru/maps/org/ponyatnaya_yeda/218896215154/?utm_medium=mapframe&utm_source=maps" style={{color:'#eee',fontSize:'12px',position:'absolute',top:'0px'}}>Понятная Еда</a>
              <a href="https://yandex.ru/maps/195/ulyanovsk/category/cafe/184106390/?utm_medium=mapframe&utm_source=maps" style={{color:'#eee',fontSize:'12px',position:'absolute',top:'14px'}}>Кафе в Ульяновске</a>
              <a href="https://yandex.ru/maps/195/ulyanovsk/category/fast_food/184106386/?utm_medium=mapframe&utm_source=maps" style={{color:'#eee',fontSize:'12px',position:'absolute',top:'28px'}}>Быстрое питание в Ульяновске</a>
              <iframe src="https://yandex.ru/map-widget/v1/?ll=48.387534%2C54.310921&mode=search&oid=218896215154&ol=biz&sctx=ZAAAAAgBEAAaKAoSCUbu6eqOMUhAEWQ6dHreJ0tAEhIJdCMsKuJ0cj8RJ2ppboWwWj8iBgABAgMEBSgKOABAwwFIAWoCcnWdAc3MzD2gAQCoAQC9ARFr7VrCAQby2Oy5rwaCAhfQn9C%2B0L3Rj9GC0L3QsNGPINC10LTQsIoCAJICAJoCDGRlc2t0b3AtbWFwcw%3D%3D&sll=48.387405%2C54.310921&sspn=0.000909%2C0.000329&text=%D0%9F%D0%BE%D0%BD%D1%8F%D1%82%D0%BD%D0%B0%D1%8F%20%D0%B5%D0%B4%D0%B0&z=21" width="100%" height="100%" frameBorder="0" allowFullScreen={true} style={{position:'relative'}}></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
