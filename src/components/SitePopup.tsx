'use client'

import { useEffect, useState } from 'react'
import { Send, X } from 'lucide-react'
import { api } from '../services/api'

type Popup = {
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
  updatedAt: string
}

export function SitePopup() {
  const [popup, setPopup] = useState<Popup | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    api.get<Popup | null>('/site-popup').then(({ data }) => {
      if (!data?.enabled) return
      const key = `site-popup-closed-${data.updatedAt}`
      const closedAt = Number(localStorage.getItem(key) || 0)
      const canShow = Date.now() - closedAt >= data.repeatAfterMinutes * 60_000
      if (!canShow) return
      setPopup(data)
      timer = setTimeout(() => setVisible(true), data.initialDelaySeconds * 1000)
    }).catch(() => undefined)
    return () => { if (timer) clearTimeout(timer) }
  }, [])

  if (!popup || !visible) return null
  const close = () => {
    localStorage.setItem(`site-popup-closed-${popup.updatedAt}`, String(Date.now()))
    setVisible(false)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/60 p-4" role="dialog" aria-modal="true" aria-labelledby="site-popup-title">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#fff5e7] shadow-2xl">
        <button type="button" onClick={close} aria-label="Закрыть окно" className="absolute right-3 top-3 z-10 rounded-full bg-[#fff5e7]/95 p-2 text-[#2f2b27] shadow-sm transition-colors hover:bg-[#f3e4cf]">
          <X size={20} />
        </button>
        {popup.imageUrl && <img src={popup.imageUrl} alt="Свежая выпечка Понятной еды" className="aspect-[3/2] w-full object-cover" />}
        <div className="flex flex-col gap-5 bg-[#fff5e7] p-6 text-center md:p-10">
          <h2 id="site-popup-title" className="text-balance text-2xl font-bold text-[#b38b00] md:text-4xl">{popup.title}</h2>
          <p className="text-pretty leading-relaxed text-[#4d4842]">{popup.body}</p>
          <div className="mx-auto flex w-full max-w-sm flex-col justify-center gap-3">
            {popup.primaryLabel && popup.primaryUrl && (
              <a href={popup.primaryUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 rounded-full border-2 border-[#229ed9] px-8 py-3 font-semibold text-[#1687ba] transition-colors hover:bg-[#229ed9] hover:text-white">
                <Send size={20} aria-hidden="true" />
                {popup.primaryLabel}
              </a>
            )}
            {popup.secondaryLabel && popup.secondaryUrl && (
              <a href={popup.secondaryUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 rounded-full border-2 border-[#2787f5] px-8 py-3 font-semibold text-[#1f6fc9] transition-colors hover:bg-[#2787f5] hover:text-white">
                <span aria-hidden="true" className="flex size-5 items-center justify-center rounded bg-[#2787f5] text-[10px] font-bold text-white">VK</span>
                {popup.secondaryLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
