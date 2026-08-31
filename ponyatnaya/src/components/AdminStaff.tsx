import React, { useEffect, useState } from 'react'
import { Users, Shield, UserPlus, KeyRound, UserMinus, Copy, Check, Lock, Phone } from 'lucide-react'
import { apiService, type StaffRecord } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { AnimatedButton } from './ui/AnimatedButton'

/** Плашка с одноразовым паролем — админ копирует и передаёт сотруднику. */
const PasswordReveal: React.FC<{ password: string; onClose: () => void }> = ({ password, onClose }) => {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard недоступен */
    }
  }
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
        <KeyRound size={16} />
        Пароль создан — сохраните его сейчас
      </div>
      <p className="mt-1 text-sm text-green-700">
        Этот пароль показывается только один раз. Передайте его сотруднику для входа.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 rounded-md border border-green-300 bg-white px-3 py-2 font-mono text-base tracking-wide text-gray-900">
          {password}
        </code>
        <AnimatedButton
          type="button"
          variant="success"
          size="sm"
          icon={copied ? <Check size={16} /> : <Copy size={16} />}
          onClick={copy}
        >
          {copied ? 'Скопировано' : 'Копировать'}
        </AnimatedButton>
        <AnimatedButton type="button" variant="neutral" size="sm" onClick={onClose}>
          Скрыть
        </AnimatedButton>
      </div>
    </div>
  )
}

const roleLabel: Record<StaffRecord['role'], string> = {
  admin: 'Администратор',
  staff: 'Сотрудник',
  user: 'Пользователь',
}

export const AdminStaff: React.FC = () => {
  const { showToast } = useToast()
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [revealed, setRevealed] = useState<{ id: number | 'new'; password: string } | null>(null)

  const [form, setForm] = useState<{ first_name: string; phone: string; role: 'admin' | 'staff'; password: string }>({
    first_name: '',
    phone: '',
    role: 'staff',
    password: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const rows = await apiService.adminGetStaff()
      setStaff(rows)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Не удалось загрузить сотрудников', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const createStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.phone.trim()) {
      showToast('Укажите номер телефона', 'error')
      return
    }
    setCreating(true)
    try {
      const { password } = await apiService.adminCreateStaff({
        first_name: form.first_name.trim(),
        phone: form.phone.trim(),
        role: form.role,
        password: form.password.trim() || undefined,
      })
      setRevealed({ id: 'new', password })
      setForm({ first_name: '', phone: '', role: 'staff', password: '' })
      showToast('Сотрудник назначен', 'success')
      await load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Не удалось назначить сотрудника', 'error')
    } finally {
      setCreating(false)
    }
  }

  const changeRole = async (member: StaffRecord, role: 'admin' | 'staff') => {
    try {
      await apiService.adminSetStaffRole(member.id, role)
      showToast('Роль обновлена', 'success')
      await load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Не удалось изменить роль', 'error')
    }
  }

  const resetPassword = async (member: StaffRecord) => {
    try {
      const { password } = await apiService.adminResetStaffPassword(member.id)
      setRevealed({ id: member.id, password })
      showToast('Пароль сброшен', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Не удалось сбросить пароль', 'error')
    }
  }

  const removeStaff = async (member: StaffRecord) => {
    if (!window.confirm(`Снять «${member.first_name || member.phone}» с должности? Аккаунт останется, но доступ к панели пропадёт.`)) {
      return
    }
    try {
      await apiService.adminRemoveStaff(member.id)
      showToast('Сотрудник снят с должности', 'success')
      await load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Не удалось снять с должности', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Форма назначения */}
      <form onSubmit={createStaff} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
        <div className="flex items-center gap-2 text-base font-semibold text-gray-800">
          <UserPlus size={20} className="text-red-600" />
          Назначить сотрудника или администратора
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            value={form.first_name}
            onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
            placeholder="Имя"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="Телефон (например +7 999 000-00-00)"
            className="rounded-lg border border-gray-300 px-3 py-2"
            required
          />
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as 'admin' | 'staff' }))}
            className="rounded-lg border border-gray-300 px-3 py-2 bg-white"
          >
            <option value="staff">Сотрудник</option>
            <option value="admin">Администратор</option>
          </select>
          <input
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="Пароль (пусто — сгенерируем)"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
        <p className="text-xs text-gray-500">
          Если оставить пароль пустым, система сгенерирует надёжный пароль и покажет его один раз. Если сотрудник уже
          зарегистрирован по этому номеру — ему будет выдана роль и новый пароль.
        </p>
        <AnimatedButton type="submit" loading={creating} icon={<UserPlus size={18} />}>
          Назначить
        </AnimatedButton>
        {revealed?.id === 'new' && (
          <PasswordReveal password={revealed.password} onClose={() => setRevealed(null)} />
        )}
      </form>

      {/* Список сотрудников */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
          <Users size={20} className="text-red-600" />
          Сотрудники и администраторы
          <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-600">
            {staff.length}
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Загрузка…</p>
        ) : staff.length === 0 ? (
          <p className="text-sm text-gray-500">Пока нет назначенных сотрудников.</p>
        ) : (
          <div className="space-y-3">
            {staff.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {member.first_name || 'Без имени'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          member.role === 'admin'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {member.role === 'admin' ? <Shield size={12} /> : <Users size={12} />}
                        {roleLabel[member.role]}
                      </span>
                      {member.locked && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                          <Lock size={12} />
                          из env
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                      <Phone size={14} />
                      {member.phone}
                    </div>
                  </div>
                </div>

                {member.locked ? (
                  <p className="mt-3 text-xs text-gray-400">
                    Роль задана через переменные окружения и не может быть изменена в панели.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {member.role === 'admin' ? (
                      <AnimatedButton
                        type="button"
                        size="sm"
                        variant="secondary"
                        icon={<Users size={16} />}
                        onClick={() => changeRole(member, 'staff')}
                      >
                        Сделать сотрудником
                      </AnimatedButton>
                    ) : (
                      <AnimatedButton
                        type="button"
                        size="sm"
                        variant="secondary"
                        icon={<Shield size={16} />}
                        onClick={() => changeRole(member, 'admin')}
                      >
                        Сделать админом
                      </AnimatedButton>
                    )}
                    <AnimatedButton
                      type="button"
                      size="sm"
                      variant="warning"
                      icon={<KeyRound size={16} />}
                      onClick={() => resetPassword(member)}
                    >
                      Сбросить пароль
                    </AnimatedButton>
                    <AnimatedButton
                      type="button"
                      size="sm"
                      variant="danger"
                      icon={<UserMinus size={16} />}
                      onClick={() => removeStaff(member)}
                    >
                      Снять с должности
                    </AnimatedButton>
                  </div>
                )}

                {revealed?.id === member.id && (
                  <div className="mt-3">
                    <PasswordReveal password={revealed.password} onClose={() => setRevealed(null)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminStaff
