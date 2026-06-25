import { Link } from 'react-router-dom'
import MatchCard from '../components/MatchCard.jsx'
import SkeletonGrid from '../components/SkeletonGrid.jsx'
import { torneo } from '../config/torneo.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { usePublicData } from '../hooks/usePublicData.js'

function Home() {
  useDocumentTitle(null)
  const { categorias, parejas, partidos, loading, error } = usePublicData()
  const partidosJugados = partidos.filter((partido) => partido.estadoRaw === 'finalizado').length
  const proximosPartidos = partidos.filter((partido) => partido.estadoRaw === 'programado')
  const resumen = [
    { label: 'Categorias', value: categorias.length },
    { label: 'Participantes', value: parejas.length },
    { label: 'Partidos jugados', value: partidosJugados },
    { label: 'Proximos partidos', value: proximosPartidos.length },
  ]

  return (
    <div className="page-stack">
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">{torneo.fechas}</p>
          <h2>{torneo.nombre}</h2>
          <p>
            Calendario, categorias, cuadros y patrocinadores del torneo en una
            web preparada para crecer hacia el panel de gestion.
          </p>
          <div className="hero__actions">
            <Link to="/horarios" className="primary-button">Ver horarios</Link>
            <Link to="/partidos" className="secondary-button">Consultar partidos</Link>
          </div>
        </div>
      </section>

      <section className="summary-grid" aria-label="Resumen del torneo">
        {resumen.map((item) => (
          <article key={item.label} className="summary-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      {error && <p className="error-state">{error.message}</p>}

      <section className="section-block">
        <div className="section-heading">
          <p className="eyebrow">Agenda</p>
          <h2>Proximos encuentros</h2>
        </div>
        {loading
          ? <SkeletonGrid count={3} className="match-grid" />
          : (
            <div className="match-grid">
              {partidos
                .filter((partido) => partido.estadoRaw !== 'finalizado')
                .slice(0, 3)
                .map((partido) => <MatchCard key={partido.id} match={partido} />)}
            </div>
          )
        }
      </section>
    </div>
  )
}

export default Home
