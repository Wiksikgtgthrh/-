import React, { useState } from 'react'
import { Upload, Download, FileSpreadsheet, FileJson, CheckCircle2, AlertTriangle } from 'lucide-react'
import { apiService, type MenuImportResult } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { AnimatedButton } from './ui/AnimatedButton'
import { FileDropzone } from './ui/FileDropzone'
import { MenuColumnsEditor } from './MenuColumnsEditor'

export const AdminMenuImportExport: React.FC<{ onImported?: () => void }> = ({ onImported }) => {
  const { showSuccess, showError } = useToast()
  const [exporting, setExporting] = useState<'xlsx' | 'json' | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<MenuImportResult | null>(null)

  const doExport = async (format: 'xlsx' | 'json') => {
    setExporting(format)
    try {
      const blob = await apiService.exportMenu(format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `menu-export.${format === 'xlsx' ? 'xlsx' : 'json'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      showSuccess('Файл меню выгружен')
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Не удалось выгрузить меню')
    } finally {
      setExporting(null)
    }
  }

  const downloadJsonTemplate = () => {
    const template = {
      columns: [
        { field: 'category', label: 'Категория' },
        { field: 'subcategory', label: 'Подкатегория' },
        { field: 'name_with_weight', label: 'Название и вес' },
        { field: 'price', label: 'Цена' },
        { field: 'composition', label: 'Состав' },
        { field: 'allergens', label: 'Аллергены' },
        { field: 'additives', label: 'Пищевые добавки' },
        { field: 'shelf_life', label: 'Срок годности' },
        { field: 'storage_conditions', label: 'Условия хранения' },
        { field: 'regulatory_documents', label: 'Нормативные документы' },
        { field: 'protein_per_100g', label: 'Белки на 100 г' },
        { field: 'fat_per_100g', label: 'Жиры на 100 г' },
        { field: 'carbs_per_100g', label: 'Углеводы на 100 г' },
        { field: 'calories_per_100g', label: 'Ккал на 100 г' },
        { field: 'is_available', label: 'Доступно' },
      ],
      products: [
        {
          category: 'Выпечка',
          subcategory: 'Хлеб',
          name_with_weight: 'Хлеб ремесленный (500 г)',
          price: 250,
          composition: 'Мука, вода, закваска, соль',
          allergens: 'Глютен',
          additives: '',
          shelf_life: '24 часа',
          storage_conditions: '0…+6 °C',
          regulatory_documents: 'ТУ/СТО — укажите документ',
          protein_per_100g: 8.2,
          fat_per_100g: 1.1,
          carbs_per_100g: 48.5,
          calories_per_100g: 235,
          is_available: 1,
        },
      ],
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'menu-template.json'
    anchor.click()
    URL.revokeObjectURL(url)
    showSuccess('JSON-шаблон скачан')
  }

  const doImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      showError('Выберите файл (.xlsx или .json)')
      return
    }
    setImporting(true)
    setResult(null)
    try {
      const res = await apiService.importMenu(file, mode)
      setResult(res)
      showSuccess('Импорт завершён')
      onImported?.()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка импорта')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h3 className="text-xl font-semibold mb-2">Импорт и экспорт меню</h3>
      <p className="text-sm text-gray-500 mb-6">
        Загрузите блюда файлом (Excel или JSON) — категории, подкатегории, цены, состав и КБЖУ попадут в базу
        автоматически. Изображения добавляются отдельно в разделе «Товары». Сначала выгрузите текущее меню как шаблон.
      </p>

      <section className="bg-gray-50 border rounded-lg p-5 mb-6">
        <h4 className="font-semibold text-gray-700 mb-1">1. Выгрузить текущее меню</h4>
        <p className="text-sm text-gray-500 mb-4">
          Готовый файл можно отредактировать и загрузить обратно, добавив новые блюда.
        </p>
        <div className="flex flex-wrap gap-3">
          <AnimatedButton
            type="button"
            variant="success"
            loading={exporting === 'xlsx'}
            disabled={exporting !== null}
            icon={<FileSpreadsheet size={18} />}
            onClick={() => doExport('xlsx')}
          >
            {exporting === 'xlsx' ? 'Готовим…' : 'Excel (.xlsx)'}
          </AnimatedButton>
          <AnimatedButton
            type="button"
            variant="info"
            loading={exporting === 'json'}
            disabled={exporting !== null}
            icon={<FileJson size={18} />}
            onClick={() => doExport('json')}
          >
            {exporting === 'json' ? 'Готовим…' : 'JSON (.json)'}
          </AnimatedButton>
          <AnimatedButton type="button" variant="secondary" icon={<Download size={18} />} onClick={downloadJsonTemplate}>
            Пример JSON
          </AnimatedButton>
        </div>
      </section>

      <form onSubmit={doImport} className="bg-gray-50 border rounded-lg p-5">
        <h4 className="font-semibold text-gray-700 mb-1">2. Загрузить меню из файла</h4>
        <p className="text-sm text-gray-500 mb-4">Поддерживаются файлы .xlsx и .json того же формата, что и при выгрузке.</p>

        <div className="mb-4">
          <FileDropzone
            value={file}
            onChange={setFile}
            image={false}
            accept=".xlsx,.json,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            hint="Форматы: .xlsx или .json"
          />
        </div>

        <div className="flex flex-col gap-2 mb-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" checked={mode === 'merge'} onChange={() => setMode('merge')} />
            Дополнить меню (обновить существующие блюда, добавить новые)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" checked={mode === 'replace'} onChange={() => setMode('replace')} />
            <span className="text-red-600">Полностью заменить активное меню (скрыть блюда, которых нет в файле)</span>
          </label>
        </div>

        <AnimatedButton
          type="submit"
          loading={importing}
          icon={<Upload size={18} />}
        >
          {importing ? 'Импорт…' : 'Загрузить в базу'}
        </AnimatedButton>
      </form>

      {result && (
        <div className="mt-6 border rounded-lg p-5 bg-white">
          <div className="flex items-center gap-2 mb-3 text-green-700">
            <CheckCircle2 size={18} />
            <span className="font-semibold">Импорт завершён</span>
          </div>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>Строк обработано: {result.total}</li>
            <li>Блюд добавлено: {result.created}</li>
            <li>Блюд обновлено: {result.updated}</li>
            {result.mode === 'replace' && <li>Скрыто отсутствующих в файле блюд: {result.deactivated}</li>}
          </ul>
          {result.errors?.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <AlertTriangle size={16} />
                <span className="font-medium">Предупреждения ({result.errors.length})</span>
              </div>
              <ul className="text-sm text-gray-500 list-disc pl-5 space-y-0.5 max-h-40 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <MenuColumnsEditor />
      </div>
    </div>
  )
}
