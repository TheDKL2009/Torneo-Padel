import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getTorneoById } from '../services/torneoService.js'
import { useAdminData } from '../services/useAdminData.js'
import { getParticipantPluralLabel, resolveTipoDeporte } from '../utils/participantLabels.js'

function AdminTorneoDetalle() {
  const { torneoId } = useParams()
  const { categorias, parejas, partidos, patrocinadores, loading, error } = useAdminData(torneoId)
  const [torneo, setTorneo] = useState(null)
  const [torneoError, setTorneoError] = useState('')

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

  const participantLabel = getParticipantPluralLabel(resolveTipoDeporte({ torneo }))
  const links = [
    { to: 'categorias', label: 'Categorias' },
    { to: 'parejas', label: participantLabel },
    { to: 'grupos', label: 'Grupos' },
    { to: 'partidos', label: 'Partidos' },
    { to: 'patrocinadores', label: 'Patrocinadores' },
  ]

  return (
    <div className="admin-page">
      <div className="section-heading">
        <p className="eyebrow">Admin &gt; Torneos &gt; {torneo?.nombre || 'Torneo'}</p>
        <h2>{torneo?.nombre || 'Gestion del torneo'}</h2>
      </div>
      {loading && <p className="info-state">Cargando torneo...</p>}
      {error && <p className="error-state">{error}</p>}
      {torneoError && <p className="error-state">{torneoError}</p>}
      <section className="summary-grid compact">
        <article className="summary-card"><span>Categorias</span><strong>{categorias.length}</strong></article>
        <article className="summary-card"><span>{participantLabel}</span><strong>{parejas.length}</strong></article>
        <article className="summary-card"><span>Partidos</span><strong>{partidos.length}</strong></article>
        <article className="summary-card"><span>Patrocinadores</span><strong>{patrocinadores.length}</strong></article>
      </section>
      <nav className="filters" aria-label="Gestion del torneo">
        {links.map((link) => (
          <Link key={link.to} className="secondary-button" to={`/admin/torneos/${torneoId}/${link.to}`}>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default AdminTorneoDetalle
