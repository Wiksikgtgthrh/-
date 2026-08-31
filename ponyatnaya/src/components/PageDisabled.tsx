import React from 'react'
import { Link } from 'react-router-dom'
import { Ban } from 'lucide-react'

export const PageDisabled: React.FC<{ title?: string }> = ({ title }) => (
  <div className="container mx-auto px-4 py-24 flex flex-col items-center text-center">
    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
      <Ban size={32} className="text-gray-400" />
    </div>
    <h1 className="text-2xl font-bold text-gray-800 mb-2">{title || 'Раздел временно недоступен'}</h1>
    <p className="text-gray-500 max-w-md mb-8">
      Этот раздел сайта сейчас отключён администратором. Пожалуйста, загляните позже.
    </p>
    <Link to="/" className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
      На главную
    </Link>
  </div>
)

export const PageGuard: React.FC<{ disabled: boolean; title?: string; children: React.ReactNode }> = ({
  disabled,
  title,
  children,
}) => {
  if (disabled) return <PageDisabled title={title} />
  return <>{children}</>
}
