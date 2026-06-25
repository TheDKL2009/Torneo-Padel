import { Activity, LayoutDashboard, LayoutGrid, LogOut, Star, Users } from 'lucide-react'
import { NavLink, Outlet, useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../services/supabaseClient.js'

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/categorias', label: 'Categorias', icon: LayoutGrid },
  { to: '/admin/parejas', label: 'Parejas', icon: Users },
  { to: '/admin/partidos', label: 'Partidos', icon: Activity },
  { to: '/admin/patrocinadores', label: 'Patrocinadores', icon: Star },
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
          {adminLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? 'admin-nav active' : 'admin-nav')}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="ghost-button" onClick={handleLogout}>
          <LogOut size={15} aria-hidden="true" />
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
