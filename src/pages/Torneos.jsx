import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getDeporteLabel, getTorneosActivos } from '../services/torneoService.js'

function Torneos() {
  const [torneos, setTorneos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadTorneos() {
      try {
        const result = await getTorneosActivos()
        if (active) {
          setTorneos(result)
        }
      } catch (currentError) {
        if (active) {
          setError(currentError.message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadTorneos()

    return () => {
      active = false
    }
  }, [])

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Torneos</p>
        <h2>Selecciona un torneo</h2>
      </div>
      {loading && <p className="info-state">Cargando torneos...</p>}
      {error && <p className="error-state">{error}</p>}
      <div className="category-grid">
        {torneos.map((torneo) => (
          <article key={torneo.id} className="category-card">
            <span>{torneo.temporada || torneo.estado}</span>
            <span>{getDeporteLabel(torneo.tipo_deporte)}</span>
            <h3>{torneo.nombre}</h3>
            <p>{torneo.descripcion || torneo.sede || 'Torneo activo'}</p>
            <Link className="primary-button" to={`/torneos/${torneo.id}`}>
              Ver torneo
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Torneos
