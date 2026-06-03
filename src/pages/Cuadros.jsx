import { useMemo } from 'react'
import { usePublicData } from '../services/usePublicData.js'

const rondas = [
  { key: 'octavos', label: 'Octavos' },
  { key: 'cuartos', label: 'Cuartos' },
  { key: 'semifinal', label: 'Semifinal' },
  { key: 'final', label: 'Final' },
]

function normalizeRound(value = '') {
  const round = value.toLowerCase()

  if (round.includes('octavo')) return 'octavos'
  if (round.includes('cuarto')) return 'cuartos'
  if (round.includes('semi')) return 'semifinal'
  if (round.includes('final')) return 'final'

  return 'otros'
}

function getPairName(pair) {
  return pair?.nombre || 'Por definir'
}

function getScore(match) {
  return match.marcador || 'Sin resultado'
}

function groupByCategoryAndRound(categorias, partidos) {
  return categorias.map((categoria) => {
    const matches = partidos.filter((partido) => partido.categoriaId === categoria.id)
    const rounds = rondas.map((ronda) => ({
      ...ronda,
      matches: matches.filter((partido) => normalizeRound(partido.ronda) === ronda.key),
    }))
    const otherMatches = matches.filter((partido) => normalizeRound(partido.ronda) === 'otros')

    return {
      categoria,
      rounds: otherMatches.length
        ? [...rounds, { key: 'otros', label: 'Otros', matches: otherMatches }]
        : rounds,
    }
  })
}

function Cuadros() {
  const { categorias, partidos, loading, error } = usePublicData()
  const cuadros = useMemo(
    () => groupByCategoryAndRound(categorias, partidos),
    [categorias, partidos],
  )

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Cuadros</p>
        <h2>Cuadros eliminatorios</h2>
      </div>
      {loading && <p className="info-state">Cargando cuadros...</p>}
      {error && <p className="error-state">{error.message}</p>}

      <div className="bracket-list">
        {cuadros.map(({ categoria, rounds }) => (
          <article key={categoria.id} className="bracket-section">
            <div className="bracket-section__header">
              <p className="eyebrow">{categoria.nivel}</p>
              <h3>{categoria.nombre}</h3>
            </div>

            <div className="bracket-scroll" tabIndex="0">
              <div className="bracket-board">
                {rounds.map((round) => (
                  <section key={round.key} className="bracket-round">
                    <h4>{round.label}</h4>
                    <div className="bracket-matches">
                      {round.matches.length ? (
                        round.matches.map((match) => (
                          <article key={match.id} className="bracket-match">
                            <div className={match.ganadorId === match.parejaAId ? 'bracket-team winner' : 'bracket-team'}>
                              <span>{getPairName(match.parejaA)}</span>
                            </div>
                            <div className={match.ganadorId === match.parejaBId ? 'bracket-team winner' : 'bracket-team'}>
                              <span>{getPairName(match.parejaB)}</span>
                            </div>
                            <div className="bracket-result">
                              <strong>{getScore(match)}</strong>
                              <span>Ganador: {getPairName(match.ganador)}</span>
                            </div>
                          </article>
                        ))
                      ) : (
                        <article className="bracket-match empty">
                          <div className="bracket-team"><span>Por definir</span></div>
                          <div className="bracket-team"><span>Por definir</span></div>
                          <div className="bracket-result">
                            <strong>Sin resultado</strong>
                            <span>Ganador: Por definir</span>
                          </div>
                        </article>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Cuadros
