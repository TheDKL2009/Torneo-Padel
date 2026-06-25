import { useCallback, useEffect, useRef, useState } from 'react'

export function useAsync(fn) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const execute = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fnRef.current()
      if (mountedRef.current) {
        setData(result)
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) setError(err)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    execute()
    return () => {
      mountedRef.current = false
    }
  }, [execute])

  return { data, loading, error, refresh: execute }
}
