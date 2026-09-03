import React, { useEffect, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { apiService, type DeliveryZoneRecord } from '../services/api'
import { AnimatedButton } from './ui/AnimatedButton'
import { useToast } from '../contexts/ToastContext'

export const AdminDeliveryZones: React.FC = () => {
  const { showSuccess, showError } = useToast()
  const [zones, setZones] = useState<DeliveryZoneRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  useEffect(() => { apiService.getDeliveryZones().then(setZones).catch(() => showError('Не удалось загрузить зоны доставки')).finally(() => setLoading(false)) }, [showError])
  const update = (index: number, key: keyof DeliveryZoneRecord, value: string) => setZones((prev) => prev.map((z, i) => i === index ? { ...z, [key]: key === 'price' || key === 'min_order_amount' ? (value === '' ? '' as unknown as number : Number(value)) : value } : z))
  const save = async () => { const valid = zones.filter((z) => z.name.trim()); if (!valid.length) { showError('Добавьте хотя бы одну заполненную зону.'); return }; if (valid.some((z) => !Number.isFinite(z.price) || z.price < 0 || !Number.isFinite(z.min_order_amount) || z.min_order_amount < 0)) { showError('Проверьте стоимость и минимальную сумму заказа.'); return }; setSaving(true); try { await apiService.saveDeliveryZones(valid); setZones(await apiService.getDeliveryZones()); showSuccess('Зоны доставки сохранены') } catch (e) { showError(e instanceof Error ? e.message : 'Не удалось сохранить зоны') } finally { setSaving(false) } }
  if (loading) return <p className="text-gray-500">Загрузка…</p>
  return <div><h3 className="text-xl font-semibold mb-2">Зоны доставки</h3><p className="text-sm text-gray-500 mb-6">Эти значения используются в форме заказа и проверяются сервером.</p><div className="space-y-3 max-w-4xl"><div className="hidden md:grid md:grid-cols-[1.4fr_1fr_1fr_auto] gap-3 text-xs font-medium text-gray-500 px-3"><span>Зона</span><span>Стоимость, ₽</span><span>Минимальный заказ, ₽</span><span /></div>{zones.map((zone, index) => <div key={zone.id} className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_auto] gap-3 items-center border rounded-lg p-3 bg-white"><input value={zone.name} onChange={(e) => update(index, 'name', e.target.value)} placeholder="Название зоны" className="border rounded px-3 py-2" /><input type="number" min="0" value={zone.price === 0 ? '' : zone.price} onChange={(e) => update(index, 'price', e.target.value)} className="border rounded px-3 py-2" /><input type="number" min="0" value={zone.min_order_amount === 0 ? '' : zone.min_order_amount} onChange={(e) => update(index, 'min_order_amount', e.target.value)} className="border rounded px-3 py-2" /><button type="button" onClick={() => setZones((prev) => prev.filter((_, i) => i !== index))} className="text-red-600 p-2" aria-label="Удалить зону"><Trash2 size={18} /></button></div>)}<button type="button" onClick={() => setZones((prev) => [...prev, { id: `zone-${Date.now()}`, name: '', price: 0, min_order_amount: 0 }])} className="inline-flex items-center gap-2 text-sm text-red-600"><Plus size={16} /> Добавить зону</button><div><AnimatedButton type="button" loading={saving} icon={<Save size={17} />} onClick={save}>Сохранить зоны</AnimatedButton></div></div></div>
}
