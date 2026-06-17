import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import MatchCard from '../components/MatchCard.jsx'
import { getDeporteLabel, getTorneoDestacado, getTorneosActivos } from '../services/torneoService.js'
import { usePublicData } from '../services/usePublicData.js'
import { getParticipantPluralLabel, resolveTipoDeporte } from '../utils/participantLabels.js'

function Home() {
  const [torneo, setTorneo] = useState(null)
  const [torneos, setTorneos] = useState([])
  const [torneoError, setTorneoError] = useState('')
  const { categorias, parejas, partidos, loading, error } = usePublicData(torneo?.id)

  useEffect(() => {
    let active = true

    async function loadTorneo() {
      try {
        const destacado = await getTorneoDestacado()
        if (active) {
          setTorneo(destacado)
        }

        if (!destacado) {
          const activos = await getTorneosActivos()
          if (active) setTorneos(activos)
        }
      } catch (currentError) {
        if (active) setTorneoError(currentError.message)
      }
    }

    loadTorneo()

    return () => {
      active = false
    }
  }, [])
  const participantSummaryLabel = getParticipantPluralLabel(resolveTipoDeporte({ torneo }))
  const partidosJugados = partidos.filter((partido) => partido.estado === 'Finalizado').length
  const proximosPartidos = partidos.filter((partido) => partido.estado === 'Programado')
  const resumen = [
    { label: 'Categorias', value: categorias.length },
    { label: participantSummaryLabel, value: parejas.length },
    { label: 'Partidos jugados', value: partidosJugados },
    { label: 'Proximos partidos', value: proximosPartidos.length },
  ]

  return (
    <div className="page-stack">
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">{torneo?.temporada || torneo?.estado || 'Torneos'}</p>
          <h2>{torneo?.nombre || 'Torneos'}</h2>
          {torneo && <p className="eyebrow">{getDeporteLabel(torneo.tipo_deporte)}</p>}
          <p>
            Calendario, categorias, cuadros y patrocinadores en una
            web preparada para crecer hacia el panel de gestion.
          </p>
          <div className="hero__actions">
            {torneo ? (
              <>
                <Link to={`/torneos/${torneo.id}/horarios`} className="primary-button">Ver horarios</Link>
                <Link to={`/torneos/${torneo.id}/partidos`} className="secondary-button">Consultar partidos</Link>
              </>
            ) : (
              <Link to="/torneos" className="primary-button">Ver torneos</Link>
            )}
          </div>
        </div>
      </section>

      {torneoError && <p className="error-state">{torneoError}</p>}

      {!torneo && torneos.length > 0 && (
        <section className="category-grid">
          {torneos.map((item) => (
            <article key={item.id} className="category-card">
              <span>{item.temporada || item.estado}</span>
              <span>{getDeporteLabel(item.tipo_deporte)}</span>
              <h3>{item.nombre}</h3>
              <Link className="primary-button" to={`/torneos/${item.id}`}>Ver torneo</Link>
            </article>
          ))}
        </section>
      )}

      <section className="summary-grid" aria-label="Resumen del torneo">
        {resumen.map((item) => (
          <article key={item.label} className="summary-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      {loading && <p className="info-state">Cargando datos del torneo...</p>}
      {error && <p className="error-state">{error.message}</p>}

      <section className="section-block">
        <div className="section-heading">
          <p className="eyebrow">Agenda</p>
          <h2>Proximos encuentros</h2>
        </div>
        <div className="match-grid">
          {partidos
            .filter((partido) => partido.estado !== 'Finalizado')
            .slice(0, 3)
            .map((partido) => <MatchCard key={partido.id} match={partido} />)}
        </div>
      </section>
    </div>
  )
}

export default Home
