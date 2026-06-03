import { useCallback, useEffect, useState } from 'react'
import { fetchAdminData } from './adminData.js'

const initialData = {
  categorias: [],
  parejas: [],
  partidos: [],
  patrocinadores: [],
}

export function useAdminData() {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      await Promise.resolve()
      setLoading(true)
      const result = await fetchAdminData()
      setData(result)
      setError('')
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadInitialData() {
      try {
        const result = await fetchAdminData()

        if (active) {
          setData(result)
          setError('')
        }
      } catch (currentError) {
        if (active) {
          setError(currentError.message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadInitialData()

    return () => {
      active = false
    }
  }, [])

  return { ...data, loading, error, refresh }
}
