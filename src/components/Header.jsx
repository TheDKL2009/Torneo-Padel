import { Link, useNavigate } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import { siteConfig } from '../config/site.js'
import { logout } from '../services/authService.js'
import { useAdminSession } from '../services/useAdminSession.js'

function Header() {
  const { admin, user } = useAdminSession()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="brand">
          <span className="brand__mark">TP</span>
          <div>
            <p className="brand__eyebrow">{siteConfig.sede}</p>
            <h1>{siteConfig.nombre}</h1>
            <p>{siteConfig.fechas}</p>
          </div>
        </div>
        <div className="site-header__actions">
          {admin && (
            <div className="admin-session-badge" aria-label="Sesion de administrador activa">
              <Link className="admin-session-link" to="/admin/torneos">
                Modo administrador
              </Link>
              {user?.email && <span>{user.email}</span>}
              <button type="button" className="admin-session-logout" onClick={handleLogout}>
                Cerrar sesion
              </button>
            </div>
          )}
          <Navbar />
        </div>
      </div>
    </header>
  )
}

export default Header
