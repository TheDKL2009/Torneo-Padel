import { NavLink } from 'react-router-dom'

const publicLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/torneos', label: 'Torneos' },
  { to: '/categorias', label: 'Categorias' },
  { to: '/grupos', label: 'Grupos' },
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
    </nav>
  )
}

export default Navbar
