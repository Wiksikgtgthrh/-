'use client'

import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { api } from '../services/api'
import { FileDropzone } from './ui/FileDropzone'
import { useToast } from '../contexts/ToastContext'

type Form = {
  enabled: boolean
  imageUrl: string
  title: string
  body: string
  primaryLabel: string
  primaryUrl: string
  secondaryLabel: string
  secondaryUrl: string
  initialDelaySeconds: number
  repeatAfterMinutes: number
}

const defaults: Form = {
  enabled: false,
  imageUrl: '/images/popup-buns.png',
  title: 'Мы делаем важное дело, и нам не обойтись без вас!',
  body: 'Пока город спит, мы создаем для вас настоящий ремесленный хлеб. Ваша подписка — это поддержка наших традиций. Будьте рядом и узнавайте о горячих новинках первыми!',
  primaryLabel: 'Telegram', primaryUrl: 'https://t.me/ponytnayaeda',
  secondaryLabel: 'ВКонтакте', secondaryUrl: 'https://vk.com/ponytnayaeda',
  initialDelaySeconds: 5, repeatAfterMinutes: 1440,
}

export function AdminSitePopup() {
  const [form, setForm] = useState<Form>(defaults)
  const [image, setImage] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    api.get<Form | null>('/site-popup').then(({ data }) => { if (data) setForm(data) }).catch(() => undefined)
  }, [])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([key, value]) => data.append(key, String(value)))
      if (image) data.append('image', image)
      const response = await api.patch<Form>('/site-popup', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(response.data)
      setImage(null)
      showSuccess('Настройки всплывающего окна сохранены')
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Не удалось сохранить настройки')
    } finally { setSaving(false) }
  }

  const field = (key: keyof Form, value: string | number | boolean) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <form onSubmit={save} className="max-w-4xl space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Всплывающее окно</h3>
        <p className="mt-1 text-sm text-gray-500">Рекомендуемый размер изображения: 1200 × 800 px, JPG/PNG/WebP до 5 МБ. Важные детали размещайте ближе к центру.</p>
      </div>
      <label className="flex items-center gap-3 rounded-lg bg-gray-50 p-4"><input type="checkbox" checked={form.enabled} onChange={(e) => field('enabled', e.target.checked)} /><span className="font-medium">Показывать окно посетителям</span></label>
      {form.imageUrl && !image && <img src={form.imageUrl} alt="Текущее изображение popup" className="max-h-64 w-full rounded-lg object-cover" />}
      <FileDropzone label="Новое изображение" value={image} onChange={setImage} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="md:col-span-2 text-sm font-medium">Заголовок<input value={form.title} onChange={(e) => field('title', e.target.value)} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="md:col-span-2 text-sm font-medium">Текст<textarea value={form.body} onChange={(e) => field('body', e.target.value)} rows={4} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="text-sm font-medium">Текст первой кнопки<input value={form.primaryLabel} onChange={(e) => field('primaryLabel', e.target.value)} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="text-sm font-medium">Ссылка первой кнопки<input value={form.primaryUrl} onChange={(e) => field('primaryUrl', e.target.value)} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="text-sm font-medium">Текст второй кнопки<input value={form.secondaryLabel} onChange={(e) => field('secondaryLabel', e.target.value)} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="text-sm font-medium">Ссылка второй кнопки<input value={form.secondaryUrl} onChange={(e) => field('secondaryUrl', e.target.value)} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="text-sm font-medium">Показать через, секунд<input type="number" min="0" value={form.initialDelaySeconds} onChange={(e) => field('initialDelaySeconds', Number(e.target.value))} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="text-sm font-medium">Повторить после закрытия, минут<input type="number" min="1" value={form.repeatAfterMinutes} onChange={(e) => field('repeatAfterMinutes', Number(e.target.value))} className="mt-1 w-full rounded border px-3 py-2" /></label>
      </div>
      <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"><Save size={18} />{saving ? 'Сохранение…' : 'Сохранить'}</button>
    </form>
  )
}
