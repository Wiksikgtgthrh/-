import React, { useState, useEffect, useCallback } from 'react'
import { Trash2, Plus, ArrowUp, ArrowDown, Eye, EyeOff, ImageIcon } from 'lucide-react'
import { apiService, type HeroSlideRecord } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { FileDropzone } from './ui/FileDropzone'

const DEFAULT_SLIDES: HeroSlideRecord[] = [
  {
    id: -1,
    title: 'Понятная еда\nв самом центре Ульяновска',
    subtitle: 'Домашние блюда, свежая выпечка\nи первая в городе Колобочная №1',
    image: '/images/interior-1.png',
    button_text: 'Заказать сейчас',
    button_link: '/catalog',
    display_order: 0,
    is_active: true,
  },
  {
    id: -2,
    title: 'Быстрая доставка по Ульяновску',
    subtitle: 'Доставляем горячую выпечку за 30-60 минут',
    image: '/images/hero/slide-2.jpg',
    button_text: 'Смотреть меню',
    button_link: '/catalog',
    display_order: 1,
    is_active: true,
  },
  {
    id: -3,
    title: 'Торты на заказ',
    subtitle: 'Создаем уникальные торты для ваших праздников',
    image: '/images/hero/slide-3.jpg',
    button_text: 'Заказать торт',
    button_link: '/custom-order',
    display_order: 2,
    is_active: true,
  },
]

export const AdminHeroSlides: React.FC = () => {
  const { showSuccess, showError } = useToast()
  const [slides, setSlides] = useState<HeroSlideRecord[]>([])
  const [isDefault, setIsDefault] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    button_text: '',
    button_link: '',
    display_order: '0',
    is_active: true,
  })
  const [image, setImage] = useState<File | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiService.adminGetHeroSlides()
      if (data.length === 0) {
        setSlides(DEFAULT_SLIDES)
        setIsDefault(true)
      } else {
        setSlides(data)
        setIsDefault(false)
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Не удалось загрузить слайды')
      setSlides(DEFAULT_SLIDES)
      setIsDefault(true)
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    void load()
  }, [load])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      showError('Укажите заголовок слайда')
      return
    }
    setSaving(true)
    try {
      await apiService.adminCreateHeroSlide({
        title: form.title,
        subtitle: form.subtitle,
        button_text: form.button_text,
        button_link: form.button_link,
        display_order: Number(form.display_order) || 0,
        is_active: form.is_active,
        image,
      })
      showSuccess('Слайд добавлен')
      setForm({ title: '', subtitle: '', button_text: '', button_link: '', display_order: '0', is_active: true })
      setImage(null)
      await load()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка при создании слайда')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (s: HeroSlideRecord) => {
    try {
      await apiService.adminUpdateHeroSlide(s.id, { is_active: !s.is_active })
      await load()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const move = async (s: HeroSlideRecord, dir: -1 | 1) => {
    try {
      await apiService.adminUpdateHeroSlide(s.id, { display_order: s.display_order + dir })
      await load()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const remove = async (s: HeroSlideRecord) => {
    if (!confirm(`Удалить слайд «${s.title}»?`)) return
    try {
      await apiService.adminDeleteHeroSlide(s.id)
      showSuccess('Слайд удалён')
      await load()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Редактор слайдера главной страницы</h3>

      <form onSubmit={create} className="bg-gray-50 border rounded-lg p-4 mb-8 grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок *</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="Понятная еда каждый день"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Подзаголовок</label>
          <textarea
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Текст кнопки</label>
          <input
            value={form.button_text}
            onChange={(e) => setForm({ ...form, button_text: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="Смотреть меню"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка кнопки</label>
          <input
            value={form.button_link}
            onChange={(e) => setForm({ ...form, button_link: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="/catalog"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Порядок</label>
          <input
            type="number"
            value={form.display_order}
            onChange={(e) => setForm({ ...form, display_order: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
            <div className="md:col-span-2">
              <FileDropzone label="Изображение" value={image} onChange={setImage} />
            </div>
        <div className="md:col-span-2 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Активен
          </label>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-60"
          >
            <Plus size={18} />
            {saving ? 'Сохранение…' : 'Добавить слайд'}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-gray-500">Загрузка…</p>
      ) : (
        <div className="space-y-3">
          {isDefault && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-4 py-3">
              В базе данных нет слайдов. Ниже показаны слайды по умолчанию. Добавьте новый слайд через форму выше — он заменит их.
            </div>
          )}
          {slides.map((s) => (
            <div key={s.id} className={`flex items-center gap-4 border rounded-lg p-3 ${isDefault ? 'bg-gray-50 opacity-70' : 'bg-white'}`}>
              <div className="w-24 h-16 rounded bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {s.image ? (
                  <img src={s.image || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={20} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{s.title}</p>
                <p className="text-sm text-gray-500 truncate">{s.subtitle}</p>
                <p className="text-xs text-gray-400">Порядок: {s.display_order}</p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(s, -1)} disabled={isDefault} className="p-2 text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed" title="Выше">
                  <ArrowUp size={16} />
                </button>
                <button type="button" onClick={() => move(s, 1)} disabled={isDefault} className="p-2 text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed" title="Ниже">
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(s)}
                  disabled={isDefault}
                  className={`p-2 disabled:opacity-30 disabled:cursor-not-allowed ${s.is_active ? 'text-green-600' : 'text-gray-400'}`}
                  title={s.is_active ? 'Активен' : 'Скрыт'}
                >
                  {s.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button type="button" onClick={() => remove(s)} disabled={isDefault} className="p-2 text-red-600 hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed" title="Удалить">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {!slides.length && <p className="text-gray-500">Слайдов пока нет.</p>}
        </div>
      )}
    </div>
  )
}
