import { useEffect, useState } from 'react'

let subscribers = []
let toasts = []
let nextId = 0

function notify() {
  const snapshot = [...toasts]
  subscribers.forEach((fn) => fn(snapshot))
}

export function showToast(message, type = 'success') {
  const id = nextId++
  toasts = [...toasts, { id, message, type }]
  notify()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
  }, 3000)
}

export function useToast() {
  const [list, setList] = useState(toasts)

  useEffect(() => {
    subscribers.push(setList)
    return () => {
      subscribers = subscribers.filter((fn) => fn !== setList)
    }
  }, [])

  return list
}
