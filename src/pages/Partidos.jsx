import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import MatchCard from '../components/MatchCard.jsx'
import PartidoEditForm from '../components/PartidoEditForm.jsx'
import PublicTournamentFilter from '../components/PublicTournamentFilter.jsx'
import { getCurrentSession, isAdmin } from '../services/authService.js'
import { usePublicData } from '../services/usePublicData.js'
import { usePublicTournamentFilter } from '../services/usePublicTournamentFilter.js'

const estados = ['Todos', 'Pendiente', 'Programado', 'En juego', 'Finalizado', 'Cancelado']
const fases = [
  { value: 'todas', label: 'Todas' },
  { value: 'grupos', label: 'Grupos' },
  { value: 'eliminatoria', label: 'Eliminatoria' },
]

function Partidos() {
  const { torneoId } = useParams()
  const tournamentFilter = usePublicTournamentFilter(torneoId)
  const { categorias, parejas, grupos, pistas, partidos, loading, error, refresh } = usePublicData(tournamentFilter.effectiveTorneoId)
  const [categoriaId, setCategoriaId] = useState('todas')
  const [estado, setEstado] = useState('Todos')
  const [fase, setFase] = useState('todas')
  const [admin, setAdmin] = useState(false)
  const [editingMatch, setEditingMatch] = useState(null)

  useEffect(() => {
    let active = true

    async function loadAdminState() {
      try {
        const session = await getCurrentSession()
        if (active) {
          setAdmin(isAdmin(session?.user))
        }
      } catch {
        if (active) {
          setAdmin(false)
        }
      }
    }

    loadAdminState()

    return () => {
      active = false
    }
  }, [])

  const partidosFiltrados = useMemo(() => {
    return partidos
      .filter((partido) => categoriaId === 'todas' || partido.categoriaId === categoriaId)
      .filter((partido) => estado === 'Todos' || partido.estado === estado)
      .filter((partido) => fase === 'todas' || partido.fase === fase)
  }, [categoriaId, estado, fase, partidos])

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Partidos</p>
        <h2>Listado con filtros</h2>
      </div>

      <PublicTournamentFilter
        hidden={!tournamentFilter.showTournamentFilter}
        torneos={tournamentFilter.torneos}
        value={tournamentFilter.selectedTorneoId}
        onChange={(value) => {
          tournamentFilter.setSelectedTorneoId(value)
          setCategoriaId('todas')
          setEditingMatch(null)
        }}
      />
      {tournamentFilter.loadingTorneos && <p className="info-state">Cargando torneos...</p>}
      {tournamentFilter.torneosError && <p className="error-state">{tournamentFilter.torneosError}</p>}

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
        <label>
          Fase
          <select value={fase} onChange={(event) => setFase(event.target.value)}>
            {fases.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="info-state">Cargando partidos...</p>}
      {error && <p className="error-state">{error.message}</p>}

      {admin && editingMatch && (
        <PartidoEditForm
          partido={editingMatch}
          categorias={categorias}
          parejas={parejas}
          grupos={grupos}
          pistas={pistas}
          onCancel={() => setEditingMatch(null)}
          onSaved={async () => {
            await refresh()
            setEditingMatch(null)
          }}
        />
      )}

      <div className="match-grid">
        {partidosFiltrados.map((partido) => (
          <MatchCard key={partido.id} match={partido} onEdit={admin ? setEditingMatch : null} />
        ))}
      </div>
    </section>
  )
}

export default Partidos
