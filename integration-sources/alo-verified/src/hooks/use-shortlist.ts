'use client'

import { useCallback, useEffect, useState } from 'react'

const SHORTLIST_KEY = 'alo_student_shortlist'

export interface ShortlistItem {
  courseId: string
  name: string
  universityName: string
  country: string
  city: string | null
  level: string | null
  field: string | null
  duration: string | null
  tuitionFee: number | null
  currency: string
  scholarshipAvailable: boolean
  addedAt: string
}

function readStore(): ShortlistItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SHORTLIST_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ShortlistItem[]
  } catch {
    return []
  }
}

function writeStore(items: ShortlistItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SHORTLIST_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('alo:shortlist-changed'))
}

export function useShortlist() {
  const [items, setItems] = useState<ShortlistItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setItems(readStore())
    setReady(true)
    const onChange = () => setItems(readStore())
    window.addEventListener('alo:shortlist-changed', onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener('alo:shortlist-changed', onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  const isShortlisted = useCallback(
    (courseId: string) => items.some((i) => i.courseId === courseId),
    [items]
  )

  const toggle = useCallback((item: ShortlistItem) => {
    const current = readStore()
    const exists = current.some((i) => i.courseId === item.courseId)
    const next = exists
      ? current.filter((i) => i.courseId !== item.courseId)
      : [...current, { ...item, addedAt: new Date().toISOString() }]
    writeStore(next)
    return !exists
  }, [])

  const remove = useCallback((courseId: string) => {
    const next = readStore().filter((i) => i.courseId !== courseId)
    writeStore(next)
  }, [])

  const clear = useCallback(() => {
    writeStore([])
  }, [])

  return { items, ready, isShortlisted, toggle, remove, clear, count: items.length }
}
