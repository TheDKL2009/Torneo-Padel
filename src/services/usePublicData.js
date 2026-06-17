import { useCallback, useEffect, useState } from 'react'
import { fetchPublicTournamentDataByTorneo } from './publicData.js'

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

export function usePublicData(torneoId = null) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const result = await fetchPublicTournamentDataByTorneo(torneoId)
      setData(result)
      setError(null)
    } catch (currentError) {
      setError(currentError)
    } finally {
      setLoading(false)
    }
  }, [torneoId])

  useEffect(() => {
    let active = true

    async function loadData() {
      if (active) {
        await refresh()
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [refresh])

  return { ...data, loading, error, refresh }
}
