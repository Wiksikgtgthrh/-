import React, { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { apiService } from '../services/api'
import { AnimatedButton } from './ui/AnimatedButton'
import { useToast } from '../contexts/ToastContext'

/**
 * Раздел «Для разработчиков» в админке.
 * Здесь только опасные разовые операции, которые не должны быть спрятаны
 * среди повседневных настроек. Сейчас единственная функция — полное
 * удаление всех заказов из истории.
 */
export const AdminDeveloperTools: React.FC = () => {
  const { showSuccess, showError } = useToast()
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const confirmPhrase = 'УДАЛИТЬ ВСЕ ЗАКАЗЫ'

  const wipe = async () => {
    if (confirmText.trim().toUpperCase() !== confirmPhrase) {
      showError(`Введите фразу «${confirmPhrase}» без кавычек для подтверждения.`)
      return
    }
    setBusy(true)
    try {
      const result = await apiService.adminDeleteAllOrders()
      showSuccess(`Удалено заказов: ${result.deleted}.`)
      setConfirming(false)
      setConfirmText('')
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Не удалось очистить заказы')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Для разработчиков</h3>
      <p className="text-sm text-gray-500 mb-6">Опасные разовые действия. Выполняются только владельцем сайта.</p>

      <div className="rounded-lg border border-red-200 bg-red-50 p-5 max-w-2xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-red-600 shrink-0 mt-1" size={22} />
          <div className="w-full">
            <h4 className="font-semibold text-red-800">Очистить всю историю заказов</h4>
            <p className="text-sm text-red-700 mt-1">
              Удалит абсолютно все заказы, включая активные и оплаченные. Это действие необратимо и
              рекомендуется только для тестовой среды или перед боевым запуском сайта.
            </p>

            {!confirming ? (
              <AnimatedButton
                type="button"
                variant="danger"
                icon={<Trash2 size={17} />}
                onClick={() => setConfirming(true)}
                className="mt-4"
              >
                Очистить все заказы
              </AnimatedButton>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-red-800">
                  Введите фразу <code className="rounded bg-white px-1 py-0.5 text-red-700 font-semibold">{confirmPhrase}</code> для подтверждения.
                </p>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={confirmPhrase}
                  className="w-full rounded-md border border-red-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="flex gap-2">
                  <AnimatedButton type="button" variant="danger" loading={busy} icon={<Trash2 size={17} />} onClick={wipe}>
                    Подтвердить и удалить
                  </AnimatedButton>
                  <button type="button" onClick={() => { setConfirming(false); setConfirmText('') }} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
