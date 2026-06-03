import { NavLink } from 'react-router-dom'

const publicLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/categorias', label: 'Categorias' },
  { to: '/cuadros', label: 'Cuadros' },
  { to: '/partidos', label: 'Partidos' },
  { to: '/horarios', label: 'Horarios' },
  { to: '/patrocinadores', label: 'Patrocinadores' },
]

function Navbar() {
  return (
    <nav className="navbar" aria-label="Menu principal">
      {publicLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          {link.label}
        </NavLink>
      ))}
      <NavLink to="/admin" className="nav-link admin-entry">
        Admin
      </NavLink>
    </nav>
  )
}

export default Navbar
