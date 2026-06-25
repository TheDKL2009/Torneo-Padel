import { CheckCircle2, XCircle } from 'lucide-react'
import { useToast } from '../hooks/useToast.js'

function Toast() {
  const toasts = useToast()
  if (!toasts.length) return null

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          {toast.type === 'success'
            ? <CheckCircle2 size={16} aria-hidden="true" />
            : <XCircle size={16} aria-hidden="true" />
          }
          {toast.message}
        </div>
      ))}
    </div>
  )
}

export default Toast
