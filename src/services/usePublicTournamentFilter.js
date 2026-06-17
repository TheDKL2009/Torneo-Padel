import { useEffect, useMemo, useState } from 'react'
import { getTorneosActivos } from './torneoService.js'

export function usePublicTournamentFilter(routeTorneoId = null) {
  const [selectedTorneoId, setSelectedTorneoId] = useState('todos')
  const [torneos, setTorneos] = useState([])
  const [loadingTorneos, setLoadingTorneos] = useState(!routeTorneoId)
  const [torneosError, setTorneosError] = useState('')

  useEffect(() => {
    if (routeTorneoId) {
      return undefined
    }

    let active = true

    async function loadTorneos() {
      setLoadingTorneos(true)
      try {
        const result = await getTorneosActivos()
        if (active) {
          setTorneos(result)
          setTorneosError('')
        }
      } catch (currentError) {
        if (active) {
          setTorneosError(currentError.message)
        }
      } finally {
        if (active) {
          setLoadingTorneos(false)
        }
      }
    }

    loadTorneos()

    return () => {
      active = false
    }
  }, [routeTorneoId])

  const effectiveTorneoId = routeTorneoId || (selectedTorneoId === 'todos' ? null : selectedTorneoId)
  const selectedTorneo = useMemo(
    () => torneos.find((torneo) => torneo.id === selectedTorneoId) || null,
    [selectedTorneoId, torneos],
  )

  return {
    effectiveTorneoId,
    loadingTorneos,
    selectedTorneo,
    selectedTorneoId,
    setSelectedTorneoId,
    showTournamentFilter: !routeTorneoId,
    torneos,
    torneosError,
  }
}
