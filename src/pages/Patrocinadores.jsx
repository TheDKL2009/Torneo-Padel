import { useParams } from 'react-router-dom'
import PublicTournamentFilter from '../components/PublicTournamentFilter.jsx'
import SponsorCard from '../components/SponsorCard.jsx'
import { usePublicData } from '../services/usePublicData.js'
import { usePublicTournamentFilter } from '../services/usePublicTournamentFilter.js'

function Patrocinadores() {
  const { torneoId } = useParams()
  const tournamentFilter = usePublicTournamentFilter(torneoId)
  const { patrocinadores, loading, error } = usePublicData(tournamentFilter.effectiveTorneoId)

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Patrocinadores</p>
        <h2>Colaboradores oficiales</h2>
      </div>
      <PublicTournamentFilter
        hidden={!tournamentFilter.showTournamentFilter}
        torneos={tournamentFilter.torneos}
        value={tournamentFilter.selectedTorneoId}
        onChange={tournamentFilter.setSelectedTorneoId}
      />
      {tournamentFilter.loadingTorneos && <p className="info-state">Cargando torneos...</p>}
      {tournamentFilter.torneosError && <p className="error-state">{tournamentFilter.torneosError}</p>}
      {loading && <p className="info-state">Cargando patrocinadores...</p>}
      {error && <p className="error-state">{error.message}</p>}
      <div className="sponsor-grid">
        {patrocinadores.map((patrocinador) => (
          <SponsorCard key={patrocinador.id} sponsor={patrocinador} />
        ))}
      </div>
    </section>
  )
}

export default Patrocinadores
