import { NavLink, Outlet, useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../services/supabaseClient.js'

const adminLinks = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/categorias', label: 'Categorias' },
  { to: '/admin/parejas', label: 'Parejas' },
  { to: '/admin/partidos', label: 'Partidos' },
  { to: '/admin/patrocinadores', label: 'Patrocinadores' },
]

function AdminLayout() {
  const navigate = useNavigate()
  const { session } = useOutletContext()

  async function handleLogout() {
    await supabase?.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <section className="admin-layout">
      <aside className="admin-sidebar">
        <div>
          <p className="eyebrow">Administracion</p>
          <h2>Panel privado</h2>
          <p className="admin-user">{session.user.email}</p>
        </div>
        <nav aria-label="Menu de administracion">
          {adminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'admin-nav active' : 'admin-nav')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="ghost-button" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </aside>
      <div className="admin-content">
        <Outlet context={{ session }} />
      </div>
    </section>
  )
}

export default AdminLayout
