import { useMemo, useState } from 'react'
import MatchCard from '../components/MatchCard.jsx'
import { usePublicData } from '../services/usePublicData.js'

const estados = ['Todos', 'Pendiente', 'Programado', 'En juego', 'Finalizado', 'Cancelado']

function Partidos() {
  const { categorias, partidos, loading, error } = usePublicData()
  const [categoriaId, setCategoriaId] = useState('todas')
  const [estado, setEstado] = useState('Todos')

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

      {loading && <p className="info-state">Cargando partidos...</p>}
      {error && <p className="error-state">{error.message}</p>}

      <div className="match-grid">
        {partidosFiltrados.map((partido) => (
          <MatchCard key={partido.id} match={partido} />
        ))}
      </div>
    </section>
  )
}

export default Partidos
