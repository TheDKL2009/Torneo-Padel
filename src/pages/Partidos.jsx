import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import MatchCard from '../components/MatchCard.jsx'
import SkeletonGrid from '../components/SkeletonGrid.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { usePublicData } from '../hooks/usePublicData.js'

const estados = ['Todos', 'Pendiente', 'Programado', 'En juego', 'Finalizado', 'Cancelado']

function Partidos() {
  useDocumentTitle('Partidos')
  const { categorias, partidos, loading, error } = usePublicData()
  const [searchParams, setSearchParams] = useSearchParams()

  const categoriaId = searchParams.get('categoria') ?? 'todas'
  const estado = searchParams.get('estado') ?? 'Todos'

  function setCategoriaId(val) {
    setSearchParams((prev) => {
      if (val === 'todas') prev.delete('categoria')
      else prev.set('categoria', val)
      return prev
    }, { replace: true })
  }

  function setEstado(val) {
    setSearchParams((prev) => {
      if (val === 'Todos') prev.delete('estado')
      else prev.set('estado', val)
      return prev
    }, { replace: true })
  }

  const partidosFiltrados = useMemo(() => {
    return partidos
      .filter((partido) => categoriaId === 'todas' || partido.categoriaId === categoriaId)
      .filter((partido) => estado === 'Todos' || partido.estado === estado)
  }, [categoriaId, estado, partidos])

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Partidos</p>
        <h2>Listado con filtros</h2>
      </div>

      <div className="filters">
        <label>
          Categoria
          <select value={categoriaId} onChange={(event) => setCategoriaId(event.target.value)}>
            <option value="todas">Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
            ))}
          </select>
        </label>
        <label>
          Estado
          <select value={estado} onChange={(event) => setEstado(event.target.value)}>
            {estados.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="error-state">{error.message}</p>}

      {loading
        ? <SkeletonGrid count={6} className="match-grid" />
        : (
          <div className="match-grid">
            {partidosFiltrados.map((partido) => (
              <MatchCard key={partido.id} match={partido} />
            ))}
          </div>
        )
      }
    </section>
  )
}

export default Partidos
