import { Activity, Calendar, Home, LayoutGrid, Network, Send, ShieldCheck, Star } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const publicLinks = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/categorias', label: 'Categorias', icon: LayoutGrid },
  { to: '/cuadros', label: 'Cuadros', icon: Network },
  { to: '/partidos', label: 'Partidos', icon: Activity },
  { to: '/horarios', label: 'Horarios', icon: Calendar },
  { to: '/patrocinadores', label: 'Patrocinadores', icon: Star },
  // { to: '/inscripcion', label: 'Inscribirme', icon: Send }, Inscripciones deshabilitadas temporalmente
]

function Navbar() {
  return (
    <nav className="navbar" aria-label="Menu principal">
      {publicLinks.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <Icon size={15} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
      <NavLink to="/admin" className="nav-link admin-entry">
        <ShieldCheck size={15} aria-hidden="true" />
        Admin
      </NavLink>
    </nav>
  )
}

export default Navbar
