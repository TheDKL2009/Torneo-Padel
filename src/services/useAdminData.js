import { useCallback, useEffect, useState } from 'react'
import { fetchAdminData } from './adminData.js'

const initialData = {
  categorias: [],
  parejas: [],
  partidos: [],
  patrocinadores: [],
  pistas: [],
  grupos: [],
  grupoParejas: [],
  clasificacionesGrupo: [],
}

export function useAdminData(torneoId = null) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      await Promise.resolve()
      setLoading(true)
      const result = await fetchAdminData(torneoId)
      setData(result)
      setError('')
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setLoading(false)
    }
  }, [torneoId])

  useEffect(() => {
    let active = true

    async function loadInitialData() {
      try {
        const result = await fetchAdminData(torneoId)

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
  }, [torneoId])

  return { ...data, loading, error, refresh }
}
