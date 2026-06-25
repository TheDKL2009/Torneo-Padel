import { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { usePublicData } from '../hooks/usePublicData.js'

// Slot height = match card height + vertical gap between cards
// Must stay in sync with .bracket-match height (2 × 38px rows + 2px borders = 78px) + 14px gap
const SLOT_H = 92

const ROUNDS = [
  { key: '16avos', label: '16° de Final' },
  { key: 'octavos', label: 'Octavos' },
  { key: 'cuartos', label: 'Cuartos' },
  { key: 'semifinal', label: 'Semifinal' },
  { key: 'final', label: 'Final' },
  { key: '3er_puesto', label: '3er Puesto' },
]

function normalizeRound(value = '') {
  const r = value.toLowerCase().trim()
  if (r.includes('16') || r.includes('diecis')) return '16avos'
  if (r.includes('octavo')) return 'octavos'
  if (r.includes('cuarto')) return 'cuartos'
  if (r.includes('semi')) return 'semifinal'
  if (r.includes('tercer') || r.includes('3er') || r.includes('bronce') || r.includes('puesto')) return '3er_puesto'
  if (r.includes('final')) return 'final'
  return 'otros'
}

function groupByCategoryAndRound(categorias, partidos) {
  return categorias.map((categoria) => {
    const catPartidos = partidos.filter((p) => p.categoriaId === categoria.id)
    const byRound = {}

    catPartidos.forEach((p) => {
      const key = normalizeRound(p.ronda)
      ;(byRound[key] ??= []).push(p)
    })

    Object.values(byRound).forEach((arr) =>
      arr.sort((a, b) => (a.orden ?? Infinity) - (b.orden ?? Infinity)),
    )

    const rounds = ROUNDS.filter((r) => byRound[r.key]?.length > 0).map((r) => ({
      ...r,
      matches: byRound[r.key],
    }))

    if (byRound.otros?.length > 0) {
      rounds.push({ key: 'otros', label: 'Otros', matches: byRound.otros })
    }

    return { categoria, rounds }
  })
}

// ─── BracketTeam ─────────────────────────────────────────────────────────────

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

// ─── BracketMatchCard ─────────────────────────────────────────────────────────

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

// ─── BracketSection ───────────────────────────────────────────────────────────

function BracketSection({ categoria, rounds, selectedParejaId, onParejaClick, onClearSelection }) {
  const boardRef = useRef(null)
  const matchRefs = useRef({})
  const [paths, setPaths] = useState([])

  const maxMatchCount = useMemo(
    () => Math.max(...rounds.map((r) => r.matches.length), 1),
    [rounds],
  )
  const boardH = maxMatchCount * SLOT_H

  // Which matches and connectors belong to the selected pareja's path
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

  // Build SVG elbow connector paths from DOM measurements
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
                      isActivated={
                        !hasSelection ||
                        !match ||
                        activatedMatchIds?.has(match.id) ||
                        false
                      }
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

// ─── Cuadros (page) ───────────────────────────────────────────────────────────

function Cuadros() {
  useDocumentTitle('Cuadros')
  const { categorias, partidos, loading, error } = usePublicData()
  const [selectedParejaId, setSelectedParejaId] = useState(null)

  const cuadros = useMemo(
    () => groupByCategoryAndRound(categorias, partidos),
    [categorias, partidos],
  )

  function handleParejaClick(id) {
    setSelectedParejaId((prev) => (prev === id ? null : id))
  }

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Cuadros</p>
        <h2>Cuadros eliminatorios</h2>
      </div>

      {selectedParejaId && (
        <p className="bracket-hint">
          Haz click sobre otra pareja para cambiar el camino, o fuera del cuadro para quitar el filtro.
        </p>
      )}

      {loading && <p className="info-state">Cargando cuadros...</p>}
      {error && <p className="error-state">{error.message}</p>}

      <div className="bracket-list">
        {cuadros.map(({ categoria, rounds }) =>
          rounds.length > 0 ? (
            <BracketSection
              key={categoria.id}
              categoria={categoria}
              rounds={rounds}
              selectedParejaId={selectedParejaId}
              onParejaClick={handleParejaClick}
              onClearSelection={() => setSelectedParejaId(null)}
            />
          ) : null,
        )}
      </div>
    </section>
  )
}

export default Cuadros
