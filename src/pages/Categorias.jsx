import CategoryCard from '../components/CategoryCard.jsx'
import SkeletonGrid from '../components/SkeletonGrid.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { usePublicData } from '../hooks/usePublicData.js'

function Categorias() {
  useDocumentTitle('Categorias')
  const { categorias, parejas, loading, error } = usePublicData()

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Categorias</p>
        <h2>Modalidades del torneo</h2>
      </div>
      {error && <p className="error-state">{error.message}</p>}
      {loading
        ? <SkeletonGrid count={6} className="category-grid" />
        : (
          <div className="category-grid">
            {categorias.map((categoria) => (
              <CategoryCard
                key={categoria.id}
                category={categoria}
                totalParejas={parejas.filter((pareja) => pareja.categoriaId === categoria.id).length}
              />
            ))}
          </div>
        )
      }
    </section>
  )
}

export default Categorias
