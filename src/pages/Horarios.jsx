import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { usePublicData } from '../hooks/usePublicData.js'

function groupSchedule(items) {
  return items.reduce((days, partido) => {
    const fecha = partido.fecha
    const hora = partido.hora
    const pista = partido.pista

    days[fecha] ??= {}
    days[fecha][hora] ??= {}
    days[fecha][hora][pista] ??= []
    days[fecha][hora][pista].push(partido)

    return days
  }, {})
}

function Horarios() {
  useDocumentTitle('Horarios')
  const { partidos, loading, error } = usePublicData()
  const agenda = groupSchedule(partidos)

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Horarios</p>
        <h2>Agenda por fecha, hora y pista</h2>
      </div>

      {loading && <p className="info-state">Cargando horarios...</p>}
      {error && <p className="error-state">{error.message}</p>}

      <div className="schedule-list">
        {Object.entries(agenda).map(([fecha, horas]) => (
          <article key={fecha} className="schedule-day">
            <h3>{fecha}</h3>
            {Object.entries(horas).map(([hora, pistas]) => (
              <div key={hora} className="schedule-time">
                <h4>{hora}</h4>
                <div className="court-grid">
                  {Object.entries(pistas).map(([pista, partidosPista]) => (
                    <div key={pista} className="court-card">
                      <strong>{pista}</strong>
                      {partidosPista.map((partido) => (
                        <p key={partido.id}>
                          {partido.parejaA?.nombre} vs {partido.parejaB?.nombre}
                          <span>{partido.categoria?.nombre}</span>
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  )
}

export default Horarios
