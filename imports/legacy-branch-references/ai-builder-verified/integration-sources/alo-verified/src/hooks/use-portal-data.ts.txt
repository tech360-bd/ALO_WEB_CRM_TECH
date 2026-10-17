'use client'

import { useEffect, useState } from 'react'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'

interface UsePortalDataOptions {
  endpoint: string
  params?: Record<string, string | number | boolean | undefined>
  enabled?: boolean
}

/**
 * Lightweight data fetching hook for portal pages.
 * Uses the session token from localStorage.
 */
export function usePortalData<T = unknown>({ endpoint, params, enabled = true }: UsePortalDataOptions) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    const session = getSession()
    if (!session) {
      setError('No session')
      setLoading(false)
      return
    }

    const url = new URL(endpoint, window.location.origin)
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.set(k, String(v))
        }
      })
    }

    let cancelled = false
    setLoading(true)
    fetch(url.pathname + url.search, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `Request failed: ${res.status}`)
        }
        return res.json()
      })
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message)
          toast.error(e.message)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [endpoint, enabled, JSON.stringify(params)])

  return { data, loading, error }
}
