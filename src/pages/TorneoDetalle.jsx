import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import MatchCard from '../components/MatchCard.jsx'
import { getDeporteLabel, getTorneoById } from '../services/torneoService.js'
import { usePublicData } from '../services/usePublicData.js'
import { getParticipantPluralLabel, resolveTipoDeporte } from '../utils/participantLabels.js'

function TorneoDetalle() {
  const { torneoId } = useParams()
  const { categorias, parejas, partidos, patrocinadores, loading, error } = usePublicData(torneoId)
  const [torneo, setTorneo] = useState(null)
  const [torneoError, setTorneoError] = useState('')
  const participantSummaryLabel = getParticipantPluralLabel(resolveTipoDeporte({ torneo }))

  useEffect(() => {
    let active = true

    async function loadTorneo() {
      try {
        const result = await getTorneoById(torneoId)
        if (active) setTorneo(result)
      } catch (currentError) {
        if (active) setTorneoError(currentError.message)
      }
    }

    loadTorneo()

    return () => {
      active = false
    }
  }, [torneoId])

  return (
    <div className="page-stack">
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">{torneo?.temporada || torneo?.estado || 'Torneo'}</p>
          <h2>{torneo?.nombre || 'Torneo'}</h2>
          <p className="eyebrow">{getDeporteLabel(torneo?.tipo_deporte)}</p>
          <p>{torneo?.descripcion || torneo?.sede || 'Consulta categorias, grupos, cuadros, partidos y patrocinadores.'}</p>
          <div className="hero__actions">
            <Link to={`/torneos/${torneoId}/partidos`} className="primary-button">Ver partidos</Link>
            <Link to={`/torneos/${torneoId}/cuadros`} className="secondary-button">Ver cuadros</Link>
          </div>
        </div>
      </section>

      {torneoError && <p className="error-state">{torneoError}</p>}
      {loading && <p className="info-state">Cargando datos del torneo...</p>}
      {error && <p className="error-state">{error.message}</p>}

      <section className="summary-grid" aria-label="Resumen del torneo">
        <article className="summary-card"><span>Categorias</span><strong>{categorias.length}</strong></article>
        <article className="summary-card"><span>{participantSummaryLabel}</span><strong>{parejas.length}</strong></article>
        <article className="summary-card"><span>Partidos</span><strong>{partidos.length}</strong></article>
        <article className="summary-card"><span>Patrocinadores</span><strong>{patrocinadores.length}</strong></article>
      </section>

      <nav className="filters" aria-label="Navegacion del torneo">
        <Link className="secondary-button" to={`/torneos/${torneoId}/categorias`}>Categorias</Link>
        <Link className="secondary-button" to={`/torneos/${torneoId}/grupos`}>Grupos</Link>
        <Link className="secondary-button" to={`/torneos/${torneoId}/cuadros`}>Cuadros</Link>
        <Link className="secondary-button" to={`/torneos/${torneoId}/horarios`}>Horarios</Link>
        <Link className="secondary-button" to={`/torneos/${torneoId}/patrocinadores`}>Patrocinadores</Link>
      </nav>

      <section className="section-block">
        <div className="section-heading">
          <p className="eyebrow">Agenda</p>
          <h2>Proximos encuentros</h2>
        </div>
        <div className="match-grid">
          {partidos.filter((partido) => partido.estado !== 'Finalizado').slice(0, 3).map((partido) => (
            <MatchCard key={partido.id} match={partido} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default TorneoDetalle
