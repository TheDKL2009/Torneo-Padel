import { fetchAdminData } from '../services/adminData.js'
import { useAsync } from './useAsync.js'

const initialData = {
  categorias: [],
  parejas: [],
  partidos: [],
  patrocinadores: [],
}

export function useAdminData() {
  const { data, loading, error, refresh } = useAsync(fetchAdminData)
  return { ...(data ?? initialData), loading, error: error?.message ?? '', refresh }
}
