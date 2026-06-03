import { useEffect, useState } from 'react'
import { fetchPublicTournamentData } from './publicData.js'

const initialData = {
  categorias: [],
  parejas: [],
  partidos: [],
  patrocinadores: [],
}

export function usePublicData() {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function loadData() {
      try {
        setLoading(true)
        const result = await fetchPublicTournamentData()
        if (active) {
          setData(result)
          setError(null)
        }
      } catch (currentError) {
        if (active) {
          setError(currentError)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [])

  return { ...data, loading, error }
}
