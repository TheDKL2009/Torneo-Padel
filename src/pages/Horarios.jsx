import { useParams } from 'react-router-dom'
import PublicTournamentFilter from '../components/PublicTournamentFilter.jsx'
import { usePublicData } from '../services/usePublicData.js'
import { usePublicTournamentFilter } from '../services/usePublicTournamentFilter.js'

function groupSchedule(items) {
  return items.reduce((days, partido) => {
    const fecha = partido.fecha || 'Horario pendiente'
    const hora = partido.hora || 'Horario pendiente'
    const pista = partido.pista || 'Pista pendiente'

    days[fecha] ??= {}
    days[fecha][hora] ??= {}
    days[fecha][hora][pista] ??= []
    days[fecha][hora][pista].push(partido)

    return days
  }, {})
}

function Horarios() {
  const { torneoId } = useParams()
  const tournamentFilter = usePublicTournamentFilter(torneoId)
  const { partidos, loading, error } = usePublicData(tournamentFilter.effectiveTorneoId)
  const agenda = groupSchedule(partidos)

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Horarios</p>
        <h2>Agenda por fecha, hora y pista</h2>
      </div>

      <PublicTournamentFilter
        hidden={!tournamentFilter.showTournamentFilter}
        torneos={tournamentFilter.torneos}
        value={tournamentFilter.selectedTorneoId}
        onChange={tournamentFilter.setSelectedTorneoId}
      />
      {tournamentFilter.loadingTorneos && <p className="info-state">Cargando torneos...</p>}
      {tournamentFilter.torneosError && <p className="error-state">{tournamentFilter.torneosError}</p>}

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
