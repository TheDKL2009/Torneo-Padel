import CategoryCard from '../components/CategoryCard.jsx'
import { usePublicData } from '../services/usePublicData.js'

function Categorias() {
  const { categorias, parejas, loading, error } = usePublicData()

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Categorias</p>
        <h2>Modalidades del torneo</h2>
      </div>
      {loading && <p className="info-state">Cargando categorias...</p>}
      {error && <p className="error-state">{error.message}</p>}
      <div className="category-grid">
        {categorias.map((categoria) => (
          <CategoryCard
            key={categoria.id}
            category={categoria}
            totalParejas={parejas.filter((pareja) => pareja.categoriaId === categoria.id).length}
          />
        ))}
      </div>
    </section>
  )
}

export default Categorias
