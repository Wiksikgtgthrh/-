import React from 'react'
import { Heart, Award, Clock, Truck } from 'lucide-react'

const features = [
  {
    icon: Heart,
    title: 'Домашние блюда',
    description: 'Каждый торт создается с особым вниманием к деталям и качеству ингредиентов'
  },
  {
    icon: Award,
    title: 'Понятные цены',
    description: 'Используем только свежие и натуральные продукты от проверенных поставщиков'
  },
  {
    icon: Clock,
    title: 'Свежая выпечка',
    description: 'Соблюдаем сроки доставки и всегда информируем о готовности заказа'
  },
  {
    icon: Truck,
    title: 'Еда на каждый день',
    description: 'Доставляем по всему Ульяновску в удобное для вас время'
  }
]

const whyChoose = [
  {
    emoji: '🥘',
    title: 'Домашняя кухня',
    description:
      'Каждый день готовим блюда, которые хочется есть снова и снова. Без лишних сложностей — только понятные и любимые вкусы.',
  },
  {
    emoji: '🥬',
    title: 'Свежие блюда каждый день',
    description:
      'Мы готовим небольшими порциями и регулярно обновляем ассортимент, чтобы гости всегда получали свежую еду.',
  },
  {
    emoji: '☕️',
    title: 'Всё в одном месте',
    description:
      'Горячие обеды, ароматный кофе, свежая выпечка, десерты и напитки — всё, что нужно для вкусного перерыва.',
  },
  {
    emoji: '❤️',
    title: 'Уютная атмосфера',
    description:
      '«Понятная еда» — это место, куда можно зайти одному, с семьёй, друзьями или коллегами и просто хорошо провести время.',
  },
]

const dailyStats = [
  { emoji: '🍲', value: '30+', label: 'блюд на линии раздачи' },
  { emoji: '☕️', value: '10+', label: 'видов напитков' },
  { emoji: '🥐', value: 'Каждый день', label: 'свежая выпечка' },
]

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 whitespace-pre-line">Понятная еда
в самом центре Ульяновска</h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg whitespace-pre-line">
Домашние блюда, свежая выпечка
и первая в городе Колобочная №1</p>
        </div>

        {/* Что такое «Понятная еда»? - Большой блок */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-16">
          <div className="text-center mb-10">
            <h3 className="inline-block text-2xl md:text-3xl font-bold text-gray-800 bg-red-50 rounded-full px-8 py-4">
              Что такое «Понятная еда»?
            </h3>
            <p className="text-xl font-medium text-gray-700 mt-6">
              Это место, где всё просто:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Финальный текст */}
          <div className="text-center max-w-3xl mx-auto pt-8 border-t border-gray-100">
            <p className="text-xl text-gray-700 leading-relaxed whitespace-pre-line">
              Мы создаём современное городское кафе,
куда можно зайти на обед,
ужин или просто взять что-то вкусное с собой.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-6">Почему выбирают «Понятную Еду»?</h3>
            <div className="space-y-6">
              {whyChoose.map((item, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="text-3xl flex-shrink-0 leading-none">{item.emoji}</div>
                  <div>
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative bg-gray-50 rounded-2xl p-4">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ngSs7tn2Z2wc81G3y5rwcO1n6SrRQz.png"
              alt="Интерьер кафе Понятная Еда"
              className="rounded-xl shadow-lg w-full border-2 border-amber-300"
            />
          </div>
        </div>

        {/* Ежедневно */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-8">Ежедневно</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {dailyStats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg p-8 shadow-md">
                <div className="text-4xl mb-3">{stat.emoji}</div>
                <div className="text-3xl font-bold text-red-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
