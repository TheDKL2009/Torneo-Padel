import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminSession } from '../../services/useAdminSession.js'

function ProtectedAdminRoute() {
  const location = useLocation()
  const { session, user, admin, loading, checked } = useAdminSession()

  if (loading || !checked) {
    return <p className="info-state">Comprobando sesion...</p>
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  if (!admin) {
    return (
      <section className="login-page">
        <div className="login-card">
          <p className="eyebrow">Acceso privado</p>
          <h2>Acceso denegado</h2>
          <p className="error-state">Tu usuario no tiene permisos de administracion.</p>
        </div>
      </section>
    )
  }

  return <Outlet context={{ session, user }} />
}

export default ProtectedAdminRoute
