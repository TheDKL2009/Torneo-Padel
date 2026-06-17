import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import CategoryCard from '../components/CategoryCard.jsx'
import PublicTournamentFilter from '../components/PublicTournamentFilter.jsx'
import { getTorneoById } from '../services/torneoService.js'
import { usePublicData } from '../services/usePublicData.js'
import { usePublicTournamentFilter } from '../services/usePublicTournamentFilter.js'
import { getParticipantCountLabel, resolveTipoDeporte } from '../utils/participantLabels.js'

function Categorias() {
  const { torneoId } = useParams()
  const tournamentFilter = usePublicTournamentFilter(torneoId)
  const { categorias, parejas, loading, error } = usePublicData(tournamentFilter.effectiveTorneoId)
  const [torneo, setTorneo] = useState(null)
  const currentTorneo = torneo || tournamentFilter.selectedTorneo
  const participantCountLabel = getParticipantCountLabel(resolveTipoDeporte({ torneo: currentTorneo }))

  useEffect(() => {
    let active = true

    async function loadTorneo() {
      if (!tournamentFilter.effectiveTorneoId) {
        setTorneo(null)
        return
      }

      try {
        const result = await getTorneoById(tournamentFilter.effectiveTorneoId)
        if (active) setTorneo(result)
      } catch {
        if (active) setTorneo(null)
      }
    }

    loadTorneo()

    return () => {
      active = false
    }
  }, [tournamentFilter.effectiveTorneoId])

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Categorias</p>
        <h2>Modalidades del torneo</h2>
      </div>
      <PublicTournamentFilter
        hidden={!tournamentFilter.showTournamentFilter}
        torneos={tournamentFilter.torneos}
        value={tournamentFilter.selectedTorneoId}
        onChange={tournamentFilter.setSelectedTorneoId}
      />
      {tournamentFilter.loadingTorneos && <p className="info-state">Cargando torneos...</p>}
      {tournamentFilter.torneosError && <p className="error-state">{tournamentFilter.torneosError}</p>}
      {loading && <p className="info-state">Cargando categorias...</p>}
      {error && <p className="error-state">{error.message}</p>}
      <div className="category-grid">
        {categorias.map((categoria) => (
          <CategoryCard
            key={categoria.id}
            category={categoria}
            totalParejas={parejas.filter((pareja) => pareja.categoriaId === categoria.id).length}
            participantCountLabel={participantCountLabel}
          />
        ))}
      </div>
    </section>
  )
}

export default Categorias
