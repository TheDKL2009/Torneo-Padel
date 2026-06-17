import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCurrentSession, isAdmin, login, logout } from '../services/authService.js'
import { supabase } from '../services/supabaseClient.js'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const from = location.state?.from?.pathname || '/admin'

  useEffect(() => {
    if (!supabase) {
      return
    }

    async function redirectIfLoggedIn() {
      try {
        const session = await getCurrentSession()

        if (session && isAdmin(session.user)) {
          navigate(from, { replace: true })
        }
      } catch {
        // Login already shows Supabase configuration/auth errors on submit.
      }
    }

    redirectIfLoggedIn()
  }, [from, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!supabase) {
      setError('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env.')
      return
    }

    setLoading(true)

    try {
      const { user } = await login(email, password)

      if (!isAdmin(user)) {
        await logout()
        setError('Tu usuario no tiene permisos de administracion.')
        return
      }

      navigate(from, { replace: true })
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Acceso privado</p>
          <h2>Iniciar sesion</h2>
        </div>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Contrasena
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="error-state">{error}</p>}
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar al panel'}
        </button>
      </form>
    </section>
  )
}

export default Login
