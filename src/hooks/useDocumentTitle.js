import { useEffect } from 'react'
import { torneo } from '../config/torneo.js'

export function useDocumentTitle(page) {
  useEffect(() => {
    const prev = document.title
    document.title = page ? `${page} — ${torneo.nombre}` : torneo.nombre
    return () => {
      document.title = prev
    }
  }, [page])
}
