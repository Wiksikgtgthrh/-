'use client'

import { FormEvent, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { apiService } from '../services/api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await apiService.passwordResetConfirm({ token, password, password_confirm: confirm })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось изменить пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-gray-50 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-lg sm:p-8">
        <h1 className="text-balance text-2xl font-bold text-gray-900">Новый пароль</h1>
        {!token ? (
          <div className="mt-6 space-y-4"><p className="text-red-700">В ссылке отсутствует токен сброса.</p><Link to="/" className="font-medium text-red-600 hover:text-red-700">На главную</Link></div>
        ) : success ? (
          <div className="mt-6 space-y-5"><p className="rounded-md bg-green-50 p-4 text-green-800">Пароль успешно изменён. Теперь можно войти с новым паролем.</p><Link to="/" className="block rounded-md bg-red-600 px-4 py-3 text-center font-medium text-white hover:bg-red-700">Перейти ко входу</Link></div>
        ) : (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-gray-600">Придумайте новый пароль длиной не менее 8 символов.</p>
            {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {[{ id: 'reset-password', label: 'Новый пароль', value: password, set: setPassword }, { id: 'reset-password-confirm', label: 'Повторите пароль', value: confirm, set: setConfirm }].map((field) => (
              <label key={field.id} htmlFor={field.id} className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                {field.label}
                <span className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input id={field.id} type={show ? 'text' : 'password'} value={field.value} onChange={(e) => field.set(e.target.value)} minLength={8} required className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500" />
                </span>
              </label>
            ))}
            <button type="button" onClick={() => setShow((value) => !value)} className="flex items-center justify-end gap-2 text-sm text-gray-600 hover:text-gray-900">{show ? <EyeOff size={18} /> : <Eye size={18} />}{show ? 'Скрыть пароли' : 'Показать пароли'}</button>
            <button type="submit" disabled={loading} className="rounded-md bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-50">{loading ? 'Сохранение...' : 'Сохранить новый пароль'}</button>
          </form>
        )}
      </div>
    </section>
  )
}
