import SponsorCard from '../components/SponsorCard.jsx'
import { usePublicData } from '../services/usePublicData.js'

function Patrocinadores() {
  const { patrocinadores, loading, error } = usePublicData()

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Patrocinadores</p>
        <h2>Colaboradores oficiales</h2>
      </div>
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
