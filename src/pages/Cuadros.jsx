import { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { usePublicData } from '../hooks/usePublicData.js'

const SLOT_H = 92

const ROUNDS = [
  { key: '16avos', label: '16avos' },
  { key: 'octavos', label: 'Octavos' },
  { key: 'cuartos', label: 'Cuartos' },
  { key: 'semifinal', label: 'Semifinal' },
  { key: 'final', label: 'Final' },
  { key: '3er_puesto', label: '3er Puesto' },
]

function normalizeRound(value = '') {
  const r = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  if (r.includes('grupo')) return 'grupos'
  if (r.includes('16') || r.includes('dieciseis') || r.includes('dieciseisavos')) return '16avos'
  if (r.includes('octavo') || r === 'octavos') return 'octavos'
  if (r.includes('cuarto') || r === 'cuartos') return 'cuartos'
  if (r.includes('semi')) return 'semifinal'
  if (r.includes('tercer') || r.includes('3er') || r.includes('bronce') || r.includes('puesto')) return '3er_puesto'
  if (r.includes('final')) return 'final'
  return 'otros'
}

function sortMatches(a, b) {
  return (a.ordenRonda ?? a.orden ?? Infinity) - (b.ordenRonda ?? b.orden ?? Infinity)
}

function groupEliminationRounds(partidos) {
  const byRound = {}

  partidos
    .filter((partido) => partido.fase !== 'grupos')
    .forEach((partido) => {
      const key = normalizeRound(partido.ronda)
      if (key === 'grupos') return
      ;(byRound[key] ??= []).push(partido)
    })

  Object.values(byRound).forEach((matches) => matches.sort(sortMatches))

  const rounds = ROUNDS.filter((round) => byRound[round.key]?.length).map((round) => ({
    ...round,
    matches: byRound[round.key],
  }))

  if (byRound.otros?.length) {
    rounds.push({ key: 'otros', label: 'Otros', matches: byRound.otros })
  }

  return rounds
}

function emptyStanding(grupo, pareja, orden) {
  return {
    grupoId: grupo.id,
    grupoNombre: grupo.nombre,
    parejaId: pareja.id,
    nombre: pareja.nombre,
    orden,
    pj: 0,
    pg: 0,
    pe: 0,
    pp: 0,
    gf: 0,
    gc: 0,
    dg: 0,
    pts: 0,
  }
}

function hasGoals(match) {
  return Number.isFinite(Number(match.goles?.a)) && Number.isFinite(Number(match.goles?.b))
}

function calculateStandings({ grupos, grupoParejas, parejasMap, partidos }) {
  return grupos.map((grupo) => {
    const asignaciones = grupoParejas
      .filter((asignacion) => asignacion.grupoId === grupo.id)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))

    const rowsByPair = new Map()

    asignaciones.forEach((asignacion, index) => {
      const pareja = parejasMap.get(asignacion.parejaId)
      if (pareja) rowsByPair.set(pareja.id, emptyStanding(grupo, pareja, index))
    })

    partidos
      .filter((partido) => partido.grupoId === grupo.id && partido.estadoRaw === 'finalizado')
      .forEach((partido) => {
        const rowA = rowsByPair.get(partido.parejaAId)
        const rowB = rowsByPair.get(partido.parejaBId)
        if (!rowA || !rowB) return

        rowA.pj += 1
        rowB.pj += 1

        if (hasGoals(partido)) {
          const golesA = Number(partido.goles.a)
          const golesB = Number(partido.goles.b)

          rowA.gf += golesA
          rowA.gc += golesB
          rowB.gf += golesB
          rowB.gc += golesA

          if (golesA > golesB) {
            rowA.pg += 1
            rowB.pp += 1
            rowA.pts += 3
          } else if (golesB > golesA) {
            rowB.pg += 1
            rowA.pp += 1
            rowB.pts += 3
          } else {
            rowA.pe += 1
            rowB.pe += 1
            rowA.pts += 1
            rowB.pts += 1
          }
          return
        }

        if (partido.ganadorId === partido.parejaAId) {
          rowA.pg += 1
          rowB.pp += 1
          rowA.pts += 3
        } else if (partido.ganadorId === partido.parejaBId) {
          rowB.pg += 1
          rowA.pp += 1
          rowB.pts += 3
        }
      })

    const rows = [...rowsByPair.values()]
      .map((row) => ({ ...row, dg: row.gf - row.gc }))
      .sort((a, b) =>
        b.pts - a.pts ||
        b.dg - a.dg ||
        b.gf - a.gf ||
        a.orden - b.orden ||
        a.nombre.localeCompare(b.nombre)
      )
      .map((row, index) => ({ ...row, posicion: index + 1 }))

    return { grupo, rows }
  })
}

function formatMatchResult(match) {
  return match.marcador || 'Pendiente'
}

function TabsCategorias({ categorias, selectedId, onSelect }) {
  return (
    <div className="category-tabs" role="tablist" aria-label="Categorias">
      {categorias.map((categoria) => (
        <button
          key={categoria.id}
          type="button"
          role="tab"
          aria-selected={categoria.id === selectedId}
          className={categoria.id === selectedId ? 'category-tab active' : 'category-tab'}
          onClick={() => onSelect(categoria.id)}
        >
          <span>{categoria.nombre}</span>
          <small>{categoria.nivel}</small>
        </button>
      ))}
    </div>
  )
}

function TablaGrupo({ grupoData, selectedParejaId, onParejaClick }) {
  return (
    <div className="standings-table group-standings">
      <div className="standings-row standings-head">
        <span>Pos</span>
        <span>Equipo</span>
        <span>PJ</span>
        <span>PG</span>
        <span>PE</span>
        <span>PP</span>
        <span>GF</span>
        <span>GC</span>
        <span>DG</span>
        <span>PTS</span>
      </div>
      {grupoData.rows.map((row) => (
        <button
          key={row.parejaId}
          type="button"
          className={row.parejaId === selectedParejaId ? 'standings-row standings-row-button selected' : 'standings-row standings-row-button'}
          onClick={() => onParejaClick(row.parejaId)}
        >
          <span>{row.posicion}</span>
          <strong>{row.nombre}</strong>
          <span>{row.pj}</span>
          <span>{row.pg}</span>
          <span>{row.pe}</span>
          <span>{row.pp}</span>
          <span>{row.gf}</span>
          <span>{row.gc}</span>
          <span>{row.dg}</span>
          <span>{row.pts}</span>
        </button>
      ))}
    </div>
  )
}

function ListaPartidosGrupo({ partidos, selectedParejaId, onParejaClick }) {
  if (!partidos.length) {
    return <p className="info-state">Todavia no hay partidos generados para este grupo.</p>
  }

  return (
    <div className="group-match-list">
      {partidos.sort(sortMatches).map((partido) => (
        <article key={partido.id} className="group-match-row">
          <button
            type="button"
            className={partido.parejaAId === selectedParejaId ? 'group-match-team selected' : 'group-match-team'}
            onClick={() => onParejaClick(partido.parejaAId)}
            disabled={!partido.parejaAId}
          >
            {partido.parejaA?.nombre || 'Por definir'}
          </button>
          <span className="group-match-score">{formatMatchResult(partido)}</span>
          <button
            type="button"
            className={partido.parejaBId === selectedParejaId ? 'group-match-team selected' : 'group-match-team'}
            onClick={() => onParejaClick(partido.parejaBId)}
            disabled={!partido.parejaBId}
          >
            {partido.parejaB?.nombre || 'Por definir'}
          </button>
        </article>
      ))}
    </div>
  )
}

function VistaFaseGrupos({ gruposData, partidosGrupo, selectedParejaId, onParejaClick }) {
  if (!gruposData.length) return null

  return (
    <section className="groups-stage">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Fase de grupos</p>
        <h3>Clasificacion y partidos</h3>
      </div>
      <div className="public-groups-grid">
        {gruposData.map((grupoData) => {
          const partidosDelGrupo = partidosGrupo.filter((partido) => partido.grupoId === grupoData.grupo.id)

          return (
            <article key={grupoData.grupo.id} className="group-panel">
              <div className="group-panel__header">
                <h3>{grupoData.grupo.nombre}</h3>
              </div>
              <TablaGrupo
                grupoData={grupoData}
                selectedParejaId={selectedParejaId}
                onParejaClick={onParejaClick}
              />
              <div className="group-matches">
                <h4>Partidos</h4>
                <ListaPartidosGrupo
                  partidos={partidosDelGrupo}
                  selectedParejaId={selectedParejaId}
                  onParejaClick={onParejaClick}
                />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function PreviewCruces({ gruposData, clasificanPorGrupo }) {
  if (gruposData.length !== 2 || !clasificanPorGrupo) return null

  const [grupoA, grupoB] = gruposData
  const cruces = []

  for (let index = 1; index <= clasificanPorGrupo; index += 1) {
    const opposite = clasificanPorGrupo - index + 1
    cruces.push([`${index}º ${grupoA.grupo.nombre}`, `${opposite}º ${grupoB.grupo.nombre}`])
  }

  return (
    <section className="preview-bracket">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Preview</p>
        <h3>Cruces previstos</h3>
      </div>
      <div className="preview-match-list">
        {cruces.map(([a, b]) => (
          <article key={`${a}-${b}`} className="preview-match">
            <span>{a}</span>
            <strong>vs</strong>
            <span>{b}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

function BracketTeam({ name, scores = [], isWinner, isSelected, clickable, onClick }) {
  let cls = 'bracket-team'
  if (isWinner) cls += ' bracket-team--winner'
  if (isSelected) cls += ' bracket-team--selected'
  if (clickable) cls += ' bracket-team--clickable'
  if (!name) cls += ' bracket-team--empty'

  return (
    <div
      className={cls}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      data-team="1"
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
    >
      {isWinner && <span className="bracket-team__indicator" aria-hidden="true" />}
      <span className="bracket-team__name">{name ?? 'Por definir'}</span>
      {scores.length > 0 && (
        <span className="bracket-team__scores" aria-label="Marcador">
          {scores.map((s, i) => (
            <span key={i} className={`bracket-team__score${isWinner ? ' bracket-team__score--win' : ''}`}>
              {s}
            </span>
          ))}
        </span>
      )}
    </div>
  )
}

const BracketMatchCard = forwardRef(function BracketMatchCard(
  { match, selectedParejaId, isActivated, onParejaClick },
  ref,
) {
  const hasSelection = Boolean(selectedParejaId)

  if (!match) {
    return (
      <article ref={ref} className="bracket-match bracket-match--empty" aria-hidden="true">
        <BracketTeam />
        <BracketTeam />
      </article>
    )
  }

  let cls = 'bracket-match'
  if (hasSelection && !isActivated) cls += ' bracket-match--dimmed'
  if (hasSelection && isActivated) cls += ' bracket-match--active'

  return (
    <article ref={ref} className={cls}>
      <BracketTeam
        name={match.parejaA?.nombre ?? null}
        scores={match.scores?.a ?? []}
        isWinner={Boolean(match.ganadorId && match.ganadorId === match.parejaAId)}
        isSelected={match.parejaAId === selectedParejaId}
        clickable={Boolean(match.parejaA)}
        onClick={() => onParejaClick(match.parejaAId)}
      />
      <BracketTeam
        name={match.parejaB?.nombre ?? null}
        scores={match.scores?.b ?? []}
        isWinner={Boolean(match.ganadorId && match.ganadorId === match.parejaBId)}
        isSelected={match.parejaBId === selectedParejaId}
        clickable={Boolean(match.parejaB)}
        onClick={() => onParejaClick(match.parejaBId)}
      />
    </article>
  )
})

function BracketSection({ categoria, rounds, selectedParejaId, onParejaClick, onClearSelection }) {
  const boardRef = useRef(null)
  const matchRefs = useRef({})
  const [paths, setPaths] = useState([])

  const maxMatchCount = useMemo(
    () => Math.max(...rounds.map((r) => r.matches.length), 1),
    [rounds],
  )
  const boardH = maxMatchCount * SLOT_H

  const { activatedMatchIds, activatedConnectorKeys } = useMemo(() => {
    if (!selectedParejaId) return { activatedMatchIds: null, activatedConnectorKeys: null }

    const activatedMatchIds = new Set()
    const activatedConnectorKeys = new Set()

    rounds.forEach((round, roundIdx) => {
      if (round.key === '3er_puesto') return
      const nextRound = rounds[roundIdx + 1]

      round.matches.forEach((match, matchIdx) => {
        if (match.parejaAId === selectedParejaId || match.parejaBId === selectedParejaId) {
          activatedMatchIds.add(match.id)
          if (nextRound && nextRound.key !== '3er_puesto') {
            activatedConnectorKeys.add(`${roundIdx}-${Math.floor(matchIdx / 2)}`)
          }
        }
      })
    })

    return { activatedMatchIds, activatedConnectorKeys }
  }, [selectedParejaId, rounds])

  const computePaths = useCallback(() => {
    if (!boardRef.current) return
    const board = boardRef.current.getBoundingClientRect()
    const newPaths = []

    rounds.forEach((round, roundIdx) => {
      const nextRound = rounds[roundIdx + 1]
      if (!nextRound) return
      if (round.key === '3er_puesto' || nextRound.key === '3er_puesto') return

      const pairs = Math.ceil(round.matches.length / 2)

      for (let pairIdx = 0; pairIdx < pairs; pairIdx++) {
        const topRef = matchRefs.current[`${roundIdx}-${pairIdx * 2}`]
        const botRef = matchRefs.current[`${roundIdx}-${pairIdx * 2 + 1}`]
        const tgtRef = matchRefs.current[`${roundIdx + 1}-${pairIdx}`]

        if (!topRef || !tgtRef) continue

        const topR = topRef.getBoundingClientRect()
        const tgtR = tgtRef.getBoundingClientRect()

        const xSrc = topR.right - board.left
        const xTgt = tgtR.left - board.left
        const xMid = (xSrc + xTgt) / 2
        const cyTop = topR.top + topR.height / 2 - board.top
        const cyTgt = tgtR.top + tgtR.height / 2 - board.top

        if (botRef) {
          const botR = botRef.getBoundingClientRect()
          const cyBot = botR.top + botR.height / 2 - board.top
          newPaths.push({
            key: `${roundIdx}-${pairIdx}`,
            dTop: `M${xSrc},${cyTop} H${xMid} V${cyTgt}`,
            dBot: `M${xSrc},${cyBot} H${xMid} V${cyTgt}`,
            dOut: `M${xMid},${cyTgt} H${xTgt}`,
          })
        } else {
          newPaths.push({
            key: `${roundIdx}-${pairIdx}`,
            dTop: `M${xSrc},${cyTop} H${xTgt}`,
            dBot: null,
            dOut: null,
          })
        }
      }
    })

    setPaths(newPaths)
  }, [rounds])

  useLayoutEffect(() => {
    computePaths()
  }, [computePaths])

  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const ro = new ResizeObserver(computePaths)
    ro.observe(el)
    return () => ro.disconnect()
  }, [computePaths])

  const hasSelection = Boolean(selectedParejaId)

  function handleBoardClick(e) {
    if (!e.target.closest('[data-team]')) onClearSelection()
  }

  return (
    <article className="bracket-section">
      <div className="bracket-section__header">
        <p className="eyebrow">{categoria.nivel}</p>
        <h3>{categoria.nombre}</h3>
      </div>

      <div className="bracket-scroll" tabIndex="0" aria-label={`Bracket ${categoria.nombre}, desplazable horizontalmente`}>
        <div className="bracket-board" ref={boardRef} onClick={handleBoardClick}>
          {rounds.map((round, roundIdx) => {
            const displayMatches = round.matches.length > 0 ? round.matches : [null]
            return (
              <section key={round.key} className="bracket-round">
                <h4 className="bracket-round__label">{round.label}</h4>
                <div className="bracket-matches" style={{ height: `${boardH}px` }}>
                  {displayMatches.map((match, matchIdx) => (
                    <BracketMatchCard
                      key={match?.id ?? `empty-${roundIdx}-${matchIdx}`}
                      ref={(el) => { matchRefs.current[`${roundIdx}-${matchIdx}`] = el }}
                      match={match}
                      selectedParejaId={selectedParejaId}
                      isActivated={!hasSelection || !match || activatedMatchIds?.has(match.id) || false}
                      onParejaClick={onParejaClick}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          <svg className="bracket-svg" aria-hidden="true">
            {paths.map((path) => {
              const active = !hasSelection || activatedConnectorKeys?.has(path.key)
              const stroke = hasSelection && active ? 'var(--accent)' : 'rgba(255,255,255,0.18)'
              const strokeWidth = hasSelection && active ? 2.5 : 1.5
              const opacity = hasSelection && !active ? 0.2 : 1

              return (
                <g
                  key={path.key}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  opacity={opacity}
                >
                  <path d={path.dTop} />
                  {path.dBot && <path d={path.dBot} />}
                  {path.dOut && <path d={path.dOut} />}
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </article>
  )
}

function Cuadros() {
  useDocumentTitle('Cuadros')
  const { categorias, parejas, partidos, grupos, grupoParejas, loading, error } = usePublicData()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedParejaId, setSelectedParejaId] = useState(null)

  const selectedCategoryId = useMemo(() => {
    const fromUrl = searchParams.get('categoria')
    return categorias.some((categoria) => categoria.id === fromUrl) ? fromUrl : categorias[0]?.id
  }, [categorias, searchParams])

  const selectedCategory = categorias.find((categoria) => categoria.id === selectedCategoryId)
  const categoryMatches = partidos.filter((partido) => partido.categoriaId === selectedCategoryId)
  const partidosGrupo = categoryMatches.filter((partido) => partido.fase === 'grupos')
  const partidosEliminatoria = categoryMatches.filter((partido) => partido.fase !== 'grupos')
  const gruposCategoria = grupos
    .filter((grupo) => grupo.categoriaId === selectedCategoryId)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))

  const parejasMap = useMemo(
    () => new Map(parejas.map((pareja) => [pareja.id, pareja])),
    [parejas],
  )

  const gruposData = useMemo(
    () => calculateStandings({
      grupos: gruposCategoria,
      grupoParejas,
      parejasMap,
      partidos: partidosGrupo,
    }),
    [gruposCategoria, grupoParejas, parejasMap, partidosGrupo],
  )

  const rounds = useMemo(
    () => groupEliminationRounds(partidosEliminatoria),
    [partidosEliminatoria],
  )

  function handleCategorySelect(id) {
    setSelectedParejaId(null)
    setSearchParams({ categoria: id })
  }

  function handleParejaClick(id) {
    if (!id) return
    setSelectedParejaId((prev) => (prev === id ? null : id))
  }

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Cuadros</p>
        <h2>Cuadros y fase de grupos</h2>
      </div>

      {loading && <p className="info-state">Cargando cuadros...</p>}
      {error && <p className="error-state">{error.message}</p>}

      {!loading && categorias.length > 0 && (
        <TabsCategorias
          categorias={categorias}
          selectedId={selectedCategoryId}
          onSelect={handleCategorySelect}
        />
      )}

      {selectedParejaId && (
        <p className="bracket-hint">
          Haz click sobre otro participante para cambiar el filtro, o sobre el mismo para quitarlo.
        </p>
      )}

      {selectedCategory && (
        <>
          <VistaFaseGrupos
            gruposData={gruposData}
            partidosGrupo={partidosGrupo}
            selectedParejaId={selectedParejaId}
            onParejaClick={handleParejaClick}
          />

          <section className="elimination-stage">
            <div className="section-heading compact-heading">
              <p className="eyebrow">Eliminatorias</p>
              <h3>Cuadro final</h3>
            </div>
            {rounds.length ? (
              <BracketSection
                categoria={selectedCategory}
                rounds={rounds}
                selectedParejaId={selectedParejaId}
                onParejaClick={handleParejaClick}
                onClearSelection={() => setSelectedParejaId(null)}
              />
            ) : (
              <>
                <p className="info-state">Todavia no hay partidos eliminatorios generados para esta categoria.</p>
                <PreviewCruces
                  gruposData={gruposData}
                  clasificanPorGrupo={selectedCategory.clasificanPorGrupo}
                />
              </>
            )}
          </section>
        </>
      )}
    </section>
  )
}

export default Cuadros
