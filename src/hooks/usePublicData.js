import { fetchPublicTournamentData } from '../services/publicData.js'
import { useAsync } from './useAsync.js'

const initialData = {
  categorias: [],
  parejas: [],
  partidos: [],
  patrocinadores: [],
}

export function usePublicData() {
  const { data, loading, error } = useAsync(fetchPublicTournamentData)
  return { ...(data ?? initialData), loading, error }
}
