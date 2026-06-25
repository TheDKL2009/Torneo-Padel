import SkeletonGrid from '../components/SkeletonGrid.jsx'
import SponsorCard from '../components/SponsorCard.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { usePublicData } from '../hooks/usePublicData.js'

function Patrocinadores() {
  useDocumentTitle('Patrocinadores')
  const { patrocinadores, loading, error } = usePublicData()

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Patrocinadores</p>
        <h2>Colaboradores oficiales</h2>
      </div>
      {error && <p className="error-state">{error.message}</p>}
      {loading
        ? <SkeletonGrid count={3} className="sponsor-grid" />
        : (
          <div className="sponsor-grid">
            {patrocinadores.map((patrocinador) => (
              <SponsorCard key={patrocinador.id} sponsor={patrocinador} />
            ))}
          </div>
        )
      }
    </section>
  )
}

export default Patrocinadores
