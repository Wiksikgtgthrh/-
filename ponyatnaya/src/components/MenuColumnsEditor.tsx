import React, { useEffect, useState } from 'react'
import { FileSpreadsheet, ChevronUp, ChevronDown, Eye, EyeOff, Save, RotateCcw, Plus, X } from 'lucide-react'
import { apiService, type MenuColumnConfig } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { AnimatedButton } from './ui/AnimatedButton'

export const MenuColumnsEditor: React.FC = () => {
  const { showSuccess, showError } = useToast()
  const [columns, setColumns] = useState<MenuColumnConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aliasDraft, setAliasDraft] = useState<Record<string, string>>({})

  const load = async () => {
    setLoading(true)
    try {
      const cols = await apiService.getMenuColumns()
      setColumns(cols)
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Не удалось загрузить колонки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const update = (field: string, patch: Partial<MenuColumnConfig>) => {
    setColumns((prev) => prev.map((c) => (c.field === field ? { ...c, ...patch } : c)))
  }

  const move = (index: number, dir: -1 | 1) => {
    setColumns((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((c, i) => ({ ...c, order: i }))
    })
  }

  const addAlias = (field: string) => {
    const value = (aliasDraft[field] || '').trim()
    if (!value) return
    const col = columns.find((c) => c.field === field)
    if (!col) return
    if (col.aliases.some((a) => a.toLowerCase() === value.toLowerCase())) {
      setAliasDraft((d) => ({ ...d, [field]: '' }))
      return
    }
    update(field, { aliases: [...col.aliases, value] })
    setAliasDraft((d) => ({ ...d, [field]: '' }))
  }

  const removeAlias = (field: string, alias: string) => {
    const col = columns.find((c) => c.field === field)
    if (!col) return
    update(field, { aliases: col.aliases.filter((a) => a !== alias) })
  }

  const save = async () => {
    // Проверяем, что заголовки не пустые
    if (columns.some((c) => !c.label.trim())) {
      showError('Заголовок колонки не может быть пустым')
      return
    }
    setSaving(true)
    try {
      const ordered = columns.map((c, i) => ({ ...c, order: i }))
      const saved = await apiService.adminSaveMenuColumns(ordered)
      setColumns(saved)
      showSuccess('Настройки колонок сохранены')
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Загрузка колонок…</p>
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-800">
        <FileSpreadsheet size={18} className="text-green-600" />
        Формат Excel-файла
      </div>
      <p className="mb-4 text-sm text-gray-600">
        Настройте колонки шаблона: переименуйте заголовки, добавьте альтернативные названия (их распознает импорт),
        измените порядок или скройте необязательные. Обязательные колонки отмечены и всегда включены.
      </p>

      <div className="space-y-2">
        {columns.map((col, i) => (
          <div
            key={col.field}
            className={`rounded-lg border bg-white p-3 ${col.enabled ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-70'}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  aria-label="Выше"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === columns.length - 1}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  aria-label="Ниже"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              <input
                value={col.label}
                onChange={(e) => update(col.field, { label: e.target.value })}
                placeholder="Заголовок колонки"
                className="min-w-[160px] flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />

              {col.required ? (
                <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600">Обязательная</span>
              ) : (
                <button
                  type="button"
                  onClick={() => update(col.field, { enabled: !col.enabled })}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                    col.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {col.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                  {col.enabled ? 'Показана' : 'Скрыта'}
                </button>
              )}
            </div>

            <div className="mt-2 pl-8">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-gray-400">Синонимы:</span>
                {col.aliases.map((alias) => (
                  <span
                    key={alias}
                    className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                  >
                    {alias}
                    <button
                      type="button"
                      onClick={() => removeAlias(col.field, alias)}
                      className="text-gray-400 hover:text-red-600"
                      aria-label={`Удалить синоним ${alias}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <span className="inline-flex items-center gap-1">
                  <input
                    value={aliasDraft[col.field] || ''}
                    onChange={(e) => setAliasDraft((d) => ({ ...d, [col.field]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        e.preventDefault()
                        addAlias(col.field)
                      }
                    }}
                    placeholder="добавить…"
                    className="w-28 rounded-md border border-gray-200 px-2 py-0.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => addAlias(col.field)}
                    className="text-gray-400 hover:text-green-600"
                    aria-label="Добавить синоним"
                  >
                    <Plus size={14} />
                  </button>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <AnimatedButton type="button" loading={saving} icon={<Save size={18} />} onClick={save}>
          {saving ? 'Сохранение…' : 'Сохранить колонки'}
        </AnimatedButton>
        <AnimatedButton
          type="button"
          variant="secondary"
          icon={<RotateCcw size={18} />}
          onClick={load}
          disabled={saving}
        >
          Отменить изменения
        </AnimatedButton>
      </div>

      <p className="mt-3 text-sm text-gray-500">
        Изображения блюд загружаются отдельно вручную в разделе «Товары».
      </p>
    </div>
  )
}
