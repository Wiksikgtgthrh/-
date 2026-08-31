import React, { useState } from 'react'
import { Ban, Check } from 'lucide-react'
import { apiService } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'
import { PAGE_FEATURES, EMPLOYEE_TAB_FEATURES } from '../constants/features'

export const AdminDisableFeatures: React.FC = () => {
  const { showSuccess, showError } = useToast()
  const { isPageDisabled, isTabDisabled, refresh } = useFeatureFlags()
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const toggle = async (
    key: string,
    featureType: 'page' | 'tab',
    label: string,
    currentlyDisabled: boolean,
  ) => {
    setBusyKey(`${featureType}:${key}`)
    try {
      await apiService.adminSetDisabledFeature({
        key,
        feature_type: featureType,
        label,
        is_disabled: !currentlyDisabled,
      })
      await refresh()
      showSuccess(!currentlyDisabled ? `«${label}» отключено` : `«${label}» включено`)
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setBusyKey(null)
    }
  }

  const Row = ({
    label,
    disabled,
    onToggle,
    busy,
  }: {
    label: string
    disabled: boolean
    onToggle: () => void
    busy: boolean
  }) => (
    <div className="flex items-center justify-between border rounded-lg px-4 py-3 bg-white">
      <div className="flex items-center gap-3">
        <span
          className={`w-2.5 h-2.5 rounded-full ${disabled ? 'bg-red-500' : 'bg-green-500'}`}
          aria-hidden
        />
        <span className={disabled ? 'text-gray-500 line-through' : 'text-gray-800'}>{label}</span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-60 ${
          disabled ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'
        }`}
      >
        {disabled ? <Check size={16} /> : <Ban size={16} />}
        {disabled ? 'Включить' : 'Отключить'}
      </button>
    </div>
  )

  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Отключение разделов</h3>
      <p className="text-sm text-gray-500 mb-6">
        Отключённые страницы скрываются в меню сайта и показывают заглушку. Отключённые вкладки исчезают из панели у
        сотрудников.
      </p>

      {(() => {
        const siteOff = isPageDisabled('site')
        return (
          <div
            className={`mb-8 rounded-xl border-2 p-4 ${
              siteOff ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${siteOff ? 'bg-red-500' : 'bg-green-500'}`}
                    aria-hidden
                  />
                  <span className="font-semibold text-gray-900">Весь сайт</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {siteOff
                    ? 'Сайт полностью отключён — посетители видят «Сайт временно не работает».'
                    : 'Полностью отключить сайт. Посетители увидят «Сайт временно не работает», вход в панель сохранится.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle('site', 'page', 'Весь сайт', siteOff)}
                disabled={busyKey === 'page:site'}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-60 whitespace-nowrap ${
                  siteOff
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {siteOff ? <Check size={16} /> : <Ban size={16} />}
                {siteOff ? 'Включить сайт' : 'Отключить сайт'}
              </button>
            </div>
          </div>
        )
      })()}

      <h4 className="font-semibold text-gray-700 mb-3">Страницы сайта</h4>
      <div className="space-y-2 mb-8">
        {PAGE_FEATURES.map((f) => {
          const disabled = isPageDisabled(f.key)
          return (
            <Row
              key={f.key}
              label={f.label}
              disabled={disabled}
              busy={busyKey === `page:${f.key}`}
              onToggle={() => toggle(f.key, 'page', f.label, disabled)}
            />
          )
        })}
      </div>

      <h4 className="font-semibold text-gray-700 mb-3">Вкладки сотрудника</h4>
      <div className="space-y-2">
        {EMPLOYEE_TAB_FEATURES.map((f) => {
          const disabled = isTabDisabled(f.key)
          return (
            <Row
              key={f.key}
              label={f.label}
              disabled={disabled}
              busy={busyKey === `tab:${f.key}`}
              onToggle={() => toggle(f.key, 'tab', f.label, disabled)}
            />
          )
        })}
      </div>
    </div>
  )
}
