import React from 'react'
import { Wrench, Lock } from 'lucide-react'

interface SiteMaintenanceProps {
  onStaffClick: () => void
}

/** Полноэкранная заглушка, когда весь сайт отключён администратором. */
export const SiteMaintenance: React.FC<SiteMaintenanceProps> = ({ onStaffClick }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
      <Wrench size={36} className="text-red-600" aria-hidden />
    </div>
    <h1 className="text-3xl font-bold text-gray-900 mb-3 text-balance">Сайт временно не работает</h1>
    <p className="text-gray-500 max-w-md text-pretty leading-relaxed">
      Мы проводим технические работы. Пожалуйста, загляните немного позже — скоро всё снова заработает.
    </p>

    <button
      type="button"
      onClick={onStaffClick}
      className="mt-10 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
    >
      <Lock size={14} />
      Вход для персонала
    </button>
  </div>
)
