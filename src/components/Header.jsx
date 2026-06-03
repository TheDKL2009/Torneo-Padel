import Navbar from './Navbar.jsx'

const torneo = {
  nombre: 'Torneo Ciudad del Padel',
  sede: 'Club Deportivo La Ribera',
  fechas: '10 - 16 junio 2026',
}

function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="brand">
          <span className="brand__mark">TP</span>
          <div>
            <p className="brand__eyebrow">{torneo.sede}</p>
            <h1>{torneo.nombre}</h1>
            <p>{torneo.fechas}</p>
          </div>
        </div>
        <Navbar />
      </div>
    </header>
  )
}

export default Header
