import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
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

const LINK_SUGGESTIONS = [
  '/catalog',
  '/promotions',
  '/custom-order',
  '/delivery',
  '/contacts',
  'https://',
]

const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100'

type EditorProps = {
  slide: HeroSlideRecord | null
  nextOrder: number
  slideIndex: number
  slidesCount: number
  onClose: () => void
  onSaved: () => Promise<void> | void
}

const SlideEditor: React.FC<EditorProps> = ({
  slide,
  nextOrder,
  slideIndex,
  slidesCount,
  onClose,
  onSaved,
}) => {
  const { showSuccess } = useToast()
  const [title, setTitle] = useState(slide?.title ?? '')
  const [subtitle, setSubtitle] = useState(slide?.subtitle ?? '')
  const [buttonText, setButtonText] = useState(slide?.button_text ?? '')
  const [buttonLink, setButtonLink] = useState(slide?.button_link ?? '')
  const [order, setOrder] = useState(String(slide?.display_order ?? nextOrder))
  const [isActive, setIsActive] = useState(slide?.is_active ?? true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const objectUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  )
  useEffect(() => {
    if (!objectUrl) return
    return () => URL.revokeObjectURL(objectUrl)
  }, [objectUrl])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose, saving])

  const currentImage = slide?.image ?? null
  const previewSrc = objectUrl ?? (removeImage ? null : currentImage)
  const willRemoveCurrent = Boolean(currentImage) && !imageFile && removeImage

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Заголовок слайда обязателен — без него слайд не сохранится.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const parsedOrder = Number(order)
      const payload = {
        title: trimmedTitle,
        subtitle: subtitle.trim(),
        button_text: buttonText.trim(),
        button_link: buttonLink.trim(),
        display_order: Number.isFinite(parsedOrder) ? Math.trunc(parsedOrder) : nextOrder,
        is_active: isActive,
        ...(imageFile ? { image: imageFile } : {}),
        ...(!imageFile && removeImage ? { remove_image: true } : {}),
      }
      if (slide) {
        await apiService.adminUpdateHeroSlide(slide.id, payload)
        showSuccess('Слайд сохранён')
      } else {
        await apiService.adminCreateHeroSlide(payload)
        showSuccess('Слайд добавлен')
      }
      await onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить слайд')
    } finally {
      setSaving(false)
    }
  }

  const dotsCount = Math.max(1, slidesCount)
  const activeDot = Math.min(Math.max(slideIndex, 0), dotsCount - 1)

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm md:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slide-editor-title"
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 md:px-6">
          <div>
            <h3 id="slide-editor-title" className="text-lg font-semibold text-gray-900">
              {slide ? 'Редактирование слайда' : 'Новый слайд'}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {slide ? 'Изменения появятся на главной сразу после сохранения.' : 'Слайд появится на главной странице.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Закрыть редактор"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid flex-1 gap-6 overflow-y-auto px-5 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Заголовок <span className="text-red-500">*</span>
              </label>
              <textarea
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                rows={2}
                autoFocus
                className={inputCls}
                placeholder={'Понятная еда\nкаждый день'}
              />
              <p className="mt-1 text-xs text-gray-400">Enter переносит строку — так же будет на сайте.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Подзаголовок</label>
              <textarea
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
                rows={2}
                className={inputCls}
                placeholder="Домашние блюда и свежая выпечка"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Текст кнопки</label>
                <input
                  value={buttonText}
                  onChange={(event) => setButtonText(event.target.value)}
                  className={inputCls}
                  placeholder="Смотреть меню"
                />
                <p className="mt-1 text-xs text-gray-400">Пусто — кнопки на слайде не будет.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Ссылка кнопки</label>
                <input
                  value={buttonLink}
                  onChange={(event) => setButtonLink(event.target.value)}
                  className={inputCls}
                  placeholder="/catalog"
                  list="hero-slide-links"
                />
                <datalist id="hero-slide-links">
                  {LINK_SUGGESTIONS.map((link) => (
                    <option key={link} value={link} />
                  ))}
                </datalist>
                <p className="mt-1 text-xs text-gray-400">Внутренний путь или полный https:// адрес.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Порядок</label>
                <input
                  type="number"
                  value={order}
                  onChange={(event) => setOrder(event.target.value)}
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-gray-400">Меньше число — выше слайд. Порядок можно менять и перетаскиванием.</p>
              </div>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Показ на сайте</span>
                <button
                  type="button"
                  onClick={() => setIsActive((value) => !value)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                  aria-pressed={isActive}
                >
                  <span className="flex items-center gap-2">
                    {isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                    {isActive ? 'Слайд показывается' : 'Слайд скрыт'}
                  </span>
                  <span
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      isActive ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                        isActive ? 'left-[18px]' : 'left-0.5'
                      }`}
                    />
                  </span>
                </button>
              </div>
            </div>

            <div>
              <FileDropzone
                label="Изображение слайда"
                value={imageFile}
                onChange={(file) => {
                  setImageFile(file)
                  if (file) setRemoveImage(false)
                }}
                existingUrl={removeImage ? null : currentImage}
                hint="JPG, PNG, WebP до 10 МБ. Лучше горизонтальное фото от 1600×900."
              />
              {willRemoveCurrent && (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <span>Текущее изображение будет удалено после сохранения.</span>
                  <button
                    type="button"
                    onClick={() => setRemoveImage(false)}
                    className="font-medium text-amber-900 underline underline-offset-2"
                  >
                    Отменить
                  </button>
                </div>
              )}
              {!willRemoveCurrent && currentImage && !imageFile && (
                <button
                  type="button"
                  onClick={() => setRemoveImage(true)}
                  className="mt-2 text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
                >
                  Удалить текущее изображение
                </button>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-0 lg:self-start">
            <p className="mb-2 text-sm font-medium text-gray-700">Превью</p>
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-gray-900">
              {previewSrc ? (
                <img src={previewSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-950 text-gray-600">
                  <ImageIcon size={36} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative flex h-full flex-col justify-center px-6 py-8 text-white">
                <div className="line-clamp-4 whitespace-pre-line text-xl font-bold leading-tight md:text-2xl">
                  {title.trim() || <span className="text-gray-400">Заголовок слайда</span>}
                </div>
                {(subtitle.trim() || !title.trim()) && (
                  <div className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-gray-200">
                    {subtitle.trim() || 'Подзаголовок'}
                  </div>
                )}
                {buttonText.trim() && (
                  <span className="mt-4 inline-flex w-fit rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
                    {buttonText.trim()}
                  </span>
                )}
              </div>
              {dotsCount <= 6 ? (
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                  {Array.from({ length: dotsCount }).map((_, index) => (
                    <span
                      key={index}
                      className={`h-1.5 w-1.5 rounded-full ${index === activeDot ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              ) : (
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
                  Слайд {activeDot + 1} из {dotsCount}
                </span>
              )}
              {!isActive && (
                <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                  Скрыт на сайте
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-400">Так блок будет выглядеть на главной странице.</p>
          </div>
        </div>

        {error && (
          <div className="mx-5 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 md:mx-6">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3 md:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Сохранение…' : slide ? 'Сохранить' : 'Добавить слайд'}
          </button>
        </div>
      </form>
    </div>
  )
}

export const AdminHeroSlides: React.FC = () => {
  const { showSuccess, showError } = useToast()
  const [slides, setSlides] = useState<HeroSlideRecord[]>([])
  const [isDefault, setIsDefault] = useState(false)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [editor, setEditor] = useState<{ slide: HeroSlideRecord | null; index: number } | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)

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

  const nextOrder = useMemo(
    () => (isDefault ? 0 : slides.reduce((max, slide) => Math.max(max, slide.display_order), -1) + 1),
    [isDefault, slides],
  )

  const applyOrder = async (next: HeroSlideRecord[]) => {
    const previous = slides
    const normalized = next.map((slide, index) => ({ ...slide, display_order: index }))
    setSlides(normalized)
    setOrdering(true)
    try {
      await apiService.adminReorderHeroSlides(normalized.map((slide) => slide.id))
    } catch (err) {
      setSlides(previous)
      showError(err instanceof Error ? err.message : 'Не удалось сохранить порядок')
    } finally {
      setOrdering(false)
    }
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (isDefault || ordering || target < 0 || target >= slides.length) return
    const next = [...slides]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    void applyOrder(next)
  }

  const handleDrop = (targetIndex: number) => {
    const fromIndex = slides.findIndex((slide) => slide.id === dragId)
    setDragId(null)
    setDragOverId(null)
    if (isDefault || ordering || fromIndex === -1 || fromIndex === targetIndex) return
    const next = [...slides]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(targetIndex, 0, moved)
    void applyOrder(next)
  }

  const toggleActive = async (slide: HeroSlideRecord) => {
    try {
      await apiService.adminUpdateHeroSlide(slide.id, { is_active: !slide.is_active })
      await load()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не удалось изменить видимость слайда')
    }
  }

  const remove = async (slide: HeroSlideRecord) => {
    if (!confirm(`Удалить слайд «${slide.title}»? Действие необратимо.`)) return
    try {
      await apiService.adminDeleteHeroSlide(slide.id)
      showSuccess('Слайд удалён')
      await load()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не удалось удалить слайд')
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Слайдер главной страницы</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Слайды сменяются каждые 5 секунд. Порядок показа — сверху вниз: перетащите карточку за ручку или
            используйте стрелки.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {ordering && <span className="text-xs text-gray-400">Сохранение порядка…</span>}
          <button
            type="button"
            onClick={() => setEditor({ slide: null, index: slides.length })}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            <Plus size={17} />
            Добавить слайд
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Загрузка…</p>
      ) : (
        <div className="space-y-3">
          {isDefault && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-medium">В базе пока нет своих слайдов</p>
              <p className="mt-0.5 text-amber-700">
                На сайте показываются стандартные. Добавьте первый слайд — он заменит их. Стандартные слайды
                редактировать нельзя.
              </p>
            </div>
          )}

          {slides.map((slide, index) => {
            const isDragging = dragId === slide.id
            const isDragOver = dragOverId === slide.id && dragId !== slide.id
            return (
              <div
                key={slide.id}
                draggable={!isDefault && !ordering}
                onDragStart={(event) => {
                  if (isDefault) return
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', String(slide.id))
                  setDragId(slide.id)
                }}
                onDragOver={(event) => {
                  if (isDefault || dragId === null) return
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                  if (dragOverId !== slide.id) setDragOverId(slide.id)
                }}
                onDragLeave={() => {
                  if (dragOverId === slide.id) setDragOverId(null)
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  handleDrop(index)
                }}
                onDragEnd={() => {
                  setDragId(null)
                  setDragOverId(null)
                }}
                onClick={() => {
                  if (!isDefault) setEditor({ slide, index })
                }}
                className={`group flex items-center gap-3 rounded-xl border bg-white p-3 transition-all ${
                  isDefault
                    ? 'cursor-default border-gray-200 bg-gray-50 opacity-80'
                    : 'cursor-pointer border-gray-200 hover:border-red-200 hover:shadow-sm'
                } ${isDragging ? 'opacity-50' : ''} ${
                  isDragOver ? 'border-red-400 ring-2 ring-red-100' : ''
                }`}
              >
                <span
                  className={`shrink-0 rounded-md p-1 text-gray-300 ${
                    isDefault ? '' : 'cursor-grab active:cursor-grabbing group-hover:text-gray-400'
                  }`}
                  title={isDefault ? undefined : 'Перетащите, чтобы изменить порядок'}
                  aria-hidden
                >
                  <GripVertical size={18} />
                </span>

                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {slide.image ? (
                    <img src={slide.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <ImageIcon size={20} />
                    </div>
                  )}
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
                    {index + 1}
                  </span>
                  {!slide.is_active && (
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[11px] font-medium text-white">
                      Скрыт
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-gray-900" title={slide.title}>
                      {slide.title || 'Без заголовка'}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        slide.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {slide.is_active ? 'Активен' : 'Скрыт'}
                    </span>
                  </div>
                  <p className="truncate text-sm text-gray-500" title={slide.subtitle}>
                    {slide.subtitle || 'Без подзаголовка'}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    {slide.button_text
                      ? `Кнопка: ${slide.button_text}${slide.button_link ? ` → ${slide.button_link}` : ''}`
                      : 'Без кнопки'}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-0.5" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={isDefault || ordering || index === 0}
                    className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:pointer-events-none disabled:opacity-30"
                    title="Поднять выше"
                    aria-label="Поднять слайд выше"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={isDefault || ordering || index === slides.length - 1}
                    className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:pointer-events-none disabled:opacity-30"
                    title="Опустить ниже"
                    aria-label="Опустить слайд ниже"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditor({ slide, index })}
                    disabled={isDefault}
                    className="rounded-md p-2 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-30"
                    title="Редактировать"
                    aria-label={`Редактировать слайд «${slide.title}»`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(slide)}
                    disabled={isDefault}
                    className={`rounded-md p-2 transition-colors hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-30 ${
                      slide.is_active ? 'text-emerald-600' : 'text-gray-400'
                    }`}
                    title={slide.is_active ? 'Скрыть с сайта' : 'Показать на сайте'}
                    aria-label={slide.is_active ? 'Скрыть слайд' : 'Показать слайд'}
                  >
                    {slide.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(slide)}
                    disabled={isDefault}
                    className="rounded-md p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:pointer-events-none disabled:opacity-30"
                    title="Удалить"
                    aria-label={`Удалить слайд «${slide.title}»`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}

          {!slides.length && <p className="text-gray-500">Слайдов пока нет.</p>}
        </div>
      )}

      {editor && (
        <SlideEditor
          slide={editor.slide}
          nextOrder={nextOrder}
          slideIndex={editor.index}
          slidesCount={slides.length}
          onClose={() => setEditor(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}