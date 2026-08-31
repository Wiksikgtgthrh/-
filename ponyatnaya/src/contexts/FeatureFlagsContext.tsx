import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiService, type DisabledFeatureRecord } from '../services/api'

interface FeatureFlagsContextValue {
  disabled: DisabledFeatureRecord[]
  loading: boolean
  isPageDisabled: (key: string) => boolean
  isTabDisabled: (key: string) => boolean
  refresh: () => Promise<void>
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | undefined>(undefined)

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [disabled, setDisabled] = useState<DisabledFeatureRecord[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await apiService.getDisabledFeatures()
      setDisabled(data.filter((d) => d.is_disabled))
    } catch {
      setDisabled([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const isPageDisabled = useCallback(
    (key: string) => disabled.some((d) => d.feature_type === 'page' && d.key === key && d.is_disabled),
    [disabled],
  )
  const isTabDisabled = useCallback(
    (key: string) => disabled.some((d) => d.feature_type === 'tab' && d.key === key && d.is_disabled),
    [disabled],
  )

  return (
    <FeatureFlagsContext.Provider value={{ disabled, loading, isPageDisabled, isTabDisabled, refresh }}>
      {children}
    </FeatureFlagsContext.Provider>
  )
}

export function useFeatureFlags(): FeatureFlagsContextValue {
  const ctx = useContext(FeatureFlagsContext)
  if (!ctx) throw new Error('useFeatureFlags must be used within FeatureFlagsProvider')
  return ctx
}
