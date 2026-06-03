import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        navigate(from, { replace: true })
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

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (loginError) {
      setError(loginError.message)
      return
    }

    navigate(from, { replace: true })
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
