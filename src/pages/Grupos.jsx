import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import MatchCard from '../components/MatchCard.jsx'
import PublicTournamentFilter from '../components/PublicTournamentFilter.jsx'
import { getTorneoById } from '../services/torneoService.js'
import { usePublicData } from '../services/usePublicData.js'
import { usePublicTournamentFilter } from '../services/usePublicTournamentFilter.js'
import { getParticipantLabels, resolveTipoDeporte } from '../utils/participantLabels.js'

function getPairName(pair, tipoDeporte) {
  return pair?.nombre || `${getParticipantLabels(tipoDeporte).singular} pendiente`
}

function sortGroupMatches(a, b) {
  return (a.orden ?? 0) - (b.orden ?? 0) ||
    String(a.fecha || '').localeCompare(String(b.fecha || '')) ||
    String(a.hora || '').localeCompare(String(b.hora || ''))
}

function Grupos() {
  const { torneoId } = useParams()
  const tournamentFilter = usePublicTournamentFilter(torneoId)
  const {
    categorias,
    parejas,
    partidos,
    grupos,
    grupoParejas,
    clasificacionesGrupo,
    loading,
    error,
  } = usePublicData(tournamentFilter.effectiveTorneoId)
  const [categoriaId, setCategoriaId] = useState('todas')
  const [torneo, setTorneo] = useState(null)
  const currentTorneo = torneo || tournamentFilter.selectedTorneo

  const parejasMap = useMemo(
    () => new Map(parejas.map((pareja) => [pareja.id, pareja])),
    [parejas],
  )

  useEffect(() => {
    let active = true

    async function loadTorneo() {
      if (!tournamentFilter.effectiveTorneoId) {
        setTorneo(null)
        return
      }

      try {
        const result = await getTorneoById(tournamentFilter.effectiveTorneoId)
        if (active) setTorneo(result)
      } catch {
        if (active) setTorneo(null)
      }
    }

    loadTorneo()

    return () => {
      active = false
    }
  }, [tournamentFilter.effectiveTorneoId])

  const categoriasConGrupos = useMemo(() => {
    return categorias
      .filter((categoria) => categoria.tieneFaseGrupos || grupos.some((grupo) => grupo.categoria_id === categoria.id))
      .filter((categoria) => categoriaId === 'todas' || categoria.id === categoriaId)
      .map((categoria) => {
        const categoriaTipoDeporte = resolveTipoDeporte({ tipoDeporte: categoria.tipoDeporte, torneo: currentTorneo, categoria })
        const gruposCategoria = grupos
          .filter((grupo) => grupo.categoria_id === categoria.id)
          .map((grupo) => {
            const asignaciones = grupoParejas.filter((asignacion) => asignacion.grupo_id === grupo.id)
            const clasificacion = clasificacionesGrupo
              .filter((fila) => fila.grupo_id === grupo.id)
              .sort((a, b) => a.posicion - b.posicion)
            const clasificacionParejas = clasificacion.length
              ? clasificacion
              : asignaciones.map((asignacion, index) => ({
                grupo_id: grupo.id,
                pareja_id: asignacion.pareja_id,
                posicion: index + 1,
                partidos_jugados: 0,
                partidos_ganados: 0,
                partidos_perdidos: 0,
                partidos_empatados: 0,
                diferencia_sets: 0,
                diferencia_juegos: 0,
                juegos_favor: 0,
                goles_favor: 0,
                goles_contra: 0,
                diferencia_goles: 0,
                puntos: 0,
              }))

            return {
              ...grupo,
              parejas: asignaciones.map((asignacion) => parejasMap.get(asignacion.pareja_id)).filter(Boolean),
              clasificacion: clasificacionParejas,
              partidos: partidos
                .filter((partido) =>
                  partido.fase === 'grupos' &&
                  partido.categoriaId === categoria.id &&
                  partido.grupoId === grupo.id
                )
                .sort(sortGroupMatches),
            }
          })

        return { categoria: { ...categoria, tipoDeporte: categoriaTipoDeporte }, grupos: gruposCategoria }
      })
  }, [categorias, categoriaId, clasificacionesGrupo, currentTorneo, grupoParejas, grupos, parejasMap, partidos])

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Fase de grupos</p>
        <h2>Grupos y clasificaciones</h2>
      </div>

      <PublicTournamentFilter
        hidden={!tournamentFilter.showTournamentFilter}
        torneos={tournamentFilter.torneos}
        value={tournamentFilter.selectedTorneoId}
        onChange={(value) => {
          tournamentFilter.setSelectedTorneoId(value)
          setCategoriaId('todas')
        }}
      />
      {tournamentFilter.loadingTorneos && <p className="info-state">Cargando torneos...</p>}
      {tournamentFilter.torneosError && <p className="error-state">{tournamentFilter.torneosError}</p>}

      <div className="filters">
        <label>
          Categoria
          <select value={categoriaId} onChange={(event) => setCategoriaId(event.target.value)}>
            <option value="todas">Todas</option>
            {categorias
              .filter((categoria) => categoria.tieneFaseGrupos)
              .map((categoria) => (
                <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
              ))}
          </select>
        </label>
      </div>

      {loading && <p className="info-state">Cargando grupos...</p>}
      {error && <p className="error-state">{error.message}</p>}

      <div className="groups-list">
        {categoriasConGrupos.map(({ categoria, grupos: gruposCategoria }) => (
          <article key={categoria.id} className="group-category">
            {(() => {
              const categoryParticipantLabels = getParticipantLabels(categoria.tipoDeporte)
              const isCategoryFutbolSala = categoria.tipoDeporte === 'futbol_sala'

              return (
                <>
            <div className="bracket-section__header">
              <p className="eyebrow">{categoria.nivel}</p>
              <h3>{categoria.nombre}</h3>
            </div>

            <div className="group-grid">
              {gruposCategoria.map((grupo) => (
                <section key={grupo.id} className="group-panel">
                  <div className="group-panel__header">
                    <h4>{grupo.nombre}</h4>
                    <span>{grupo.parejas.length} {categoryParticipantLabels.pluralLower}</span>
                  </div>

                  <div className="group-teams">
                    {grupo.parejas.map((pareja) => (
                      <span key={pareja.id}>{getPairName(pareja, categoria.tipoDeporte)}</span>
                    ))}
                  </div>

                  <div className="standings-table" role="table" aria-label={`Clasificacion ${grupo.nombre}`}>
                    <div className="standings-row standings-head" role="row">
                      <span>Pos</span>
                      <span>{categoryParticipantLabels.singular}</span>
                      <span>PJ</span>
                      <span>PG</span>
                      {isCategoryFutbolSala ? (
                        <>
                          <span>PE</span>
                          <span>GF</span>
                          <span>GC</span>
                          <span>DG</span>
                        </>
                      ) : (
                        <>
                          <span>DS</span>
                          <span>DJ</span>
                        </>
                      )}
                      <span>Pts</span>
                    </div>
                    {grupo.clasificacion.map((fila) => {
                      const isQualified = fila.posicion <= categoria.clasificanPorGrupo
                      return (
                        <div key={fila.pareja_id} className={isQualified ? 'standings-row qualified' : 'standings-row'} role="row">
                          <span>{fila.posicion}</span>
                          <strong>{getPairName(parejasMap.get(fila.pareja_id), categoria.tipoDeporte)}</strong>
                          <span>{fila.partidos_jugados}</span>
                          <span>{fila.partidos_ganados}</span>
                          {isCategoryFutbolSala ? (
                            <>
                              <span>{fila.partidos_empatados || 0}</span>
                              <span>{fila.goles_favor || 0}</span>
                              <span>{fila.goles_contra || 0}</span>
                              <span>{fila.diferencia_goles || 0}</span>
                            </>
                          ) : (
                            <>
                              <span>{fila.diferencia_sets}</span>
                              <span>{fila.diferencia_juegos}</span>
                            </>
                          )}
                          <span>{fila.puntos}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="group-matches">
                    <h5>Partidos del grupo</h5>
                    {grupo.partidos.length ? (
                      grupo.partidos.map((partido) => (
                        <MatchCard key={partido.id} match={partido} tipoDeporte={categoria.tipoDeporte} />
                      ))
                    ) : (
                      <p className="info-state">Todavia no hay partidos generados para este grupo.</p>
                    )}
                  </div>
                </section>
              ))}
            </div>
                </>
              )
            })()}
          </article>
        ))}
      </div>
    </section>
  )
}

export default Grupos
