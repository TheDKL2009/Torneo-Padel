import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import PartidoEditForm from '../components/PartidoEditForm.jsx'
import PublicTournamentFilter from '../components/PublicTournamentFilter.jsx'
import BracketToolbar from '../components/bracket/BracketToolbar.jsx'
import BracketView from '../components/bracket/BracketView.jsx'
import { getCurrentSession, isAdmin } from '../services/authService.js'
import { getBracketByCategoria, updateBracketMatch } from '../services/bracketService.js'
import { usePublicData } from '../services/usePublicData.js'
import { usePublicTournamentFilter } from '../services/usePublicTournamentFilter.js'

function Cuadros() {
  const { torneoId } = useParams()
  const tournamentFilter = usePublicTournamentFilter(torneoId)
  const { categorias, parejas, grupos, pistas, loading, error } = usePublicData(tournamentFilter.effectiveTorneoId)
  const [categoriaId, setCategoriaId] = useState('')
  const [cuadroTipo, setCuadroTipo] = useState('principal')
  const [bracket, setBracket] = useState({ rounds: [], matches: [], validation: { warnings: [] } })
  const [bracketLoading, setBracketLoading] = useState(false)
  const [bracketError, setBracketError] = useState('')
  const [admin, setAdmin] = useState(false)
  const [editingMatch, setEditingMatch] = useState(null)

  const selectedCategoria = useMemo(
    () => categorias.find((categoria) => categoria.id === categoriaId),
    [categorias, categoriaId],
  )

  useEffect(() => {
    let active = true

    async function loadAdminState() {
      try {
        const session = await getCurrentSession()
        if (active) setAdmin(isAdmin(session?.user))
      } catch {
        if (active) setAdmin(false)
      }
    }

    loadAdminState()

    return () => {
      active = false
    }
  }, [])

  const refreshBracket = useCallback(async () => {
    if (!categoriaId) {
      setBracket({ rounds: [], matches: [], validation: { warnings: [] } })
      return
    }

    setBracketLoading(true)
    setBracketError('')

    try {
      setBracket(await getBracketByCategoria(categoriaId, cuadroTipo))
    } catch (currentError) {
      setBracketError(currentError.message)
    } finally {
      setBracketLoading(false)
    }
  }, [categoriaId, cuadroTipo])

  useEffect(() => {
    let active = true

    async function loadBracket() {
      if (!active) return
      await refreshBracket()
    }

    loadBracket()

    return () => {
      active = false
    }
  }, [refreshBracket])

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Cuadros</p>
        <h2>Cuadro eliminatorio</h2>
      </div>

      <PublicTournamentFilter
        hidden={!tournamentFilter.showTournamentFilter}
        torneos={tournamentFilter.torneos}
        value={tournamentFilter.selectedTorneoId}
        onChange={(value) => {
          tournamentFilter.setSelectedTorneoId(value)
          setCategoriaId('')
          setEditingMatch(null)
        }}
      />
      {tournamentFilter.loadingTorneos && <p className="info-state">Cargando torneos...</p>}
      {tournamentFilter.torneosError && <p className="error-state">{tournamentFilter.torneosError}</p>}

      <BracketToolbar
        categorias={categorias}
        categoriaId={categoriaId}
        cuadroTipo={cuadroTipo}
        onCategoriaChange={(value) => {
          setCategoriaId(value)
          setEditingMatch(null)
        }}
        onCuadroTipoChange={(value) => {
          setCuadroTipo(value)
          setEditingMatch(null)
        }}
      />

      {loading && <p className="info-state">Cargando categorias...</p>}
      {error && <p className="error-state">{error.message}</p>}
      {bracketLoading && <p className="info-state">Cargando cuadro...</p>}
      {bracketError && <p className="error-state">{bracketError}</p>}

      {admin && editingMatch && (
        <PartidoEditForm
          partido={editingMatch}
          categorias={categorias}
          parejas={parejas}
          grupos={grupos}
          pistas={pistas}
          saveMatch={updateBracketMatch}
          onCancel={() => setEditingMatch(null)}
          onSaved={async () => {
            await refreshBracket()
            setEditingMatch(null)
          }}
        />
      )}

      {!categoriaId ? (
        <p className="info-state">Selecciona una categoria para ver su cuadro.</p>
      ) : (
        <BracketView
          rounds={bracket.rounds}
          validation={bracket.validation}
          emptyMessage={`No se ha generado todavia el cuadro eliminatorio para ${selectedCategoria?.nombre || 'esta categoria'}.`}
          onEdit={admin ? setEditingMatch : null}
        />
      )}
    </section>
  )
}

export default Cuadros
