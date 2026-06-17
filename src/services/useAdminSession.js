import { useEffect, useState } from 'react'
import { getCurrentSession, isAdmin } from './authService.js'
import { supabase } from './supabaseClient.js'

export function useAdminSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [checked, setChecked] = useState(!supabase)

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let active = true

    async function loadSession() {
      try {
        const currentSession = await getCurrentSession()

        if (active) {
          setSession(currentSession)
        }
      } finally {
        if (active) {
          setLoading(false)
          setChecked(true)
        }
      }
    }

    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setLoading(false)
      setChecked(true)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const user = session?.user || null
  const admin = isAdmin(user)

  return { session, user, admin, loading, checked }
}
