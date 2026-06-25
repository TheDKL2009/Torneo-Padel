function toNullableNumber(value) {
  return value === '' || value === null || value === undefined ? null : Number(value)
}

function isNumber(value) {
  return Number.isFinite(Number(value))
}

export function formatResultadoPartido(partido) {
  if (isNumber(partido.goles_a) && isNumber(partido.goles_b)) {
    const base = `${partido.goles_a}-${partido.goles_b}`
    if (
      partido.penaltis_a !== null &&
      partido.penaltis_a !== undefined &&
      partido.penaltis_b !== null &&
      partido.penaltis_b !== undefined
    ) {
      return `${base} (pen. ${partido.penaltis_a}-${partido.penaltis_b})`
    }

    return base
  }

  const sets = [
    [partido.set1_a, partido.set1_b],
    [partido.set2_a, partido.set2_b],
    [partido.set3_a, partido.set3_b],
  ].filter(([a, b]) => a !== null && a !== undefined && b !== null && b !== undefined)

  return sets.length ? sets.map(([a, b]) => `${a}-${b}`).join(' / ') : null
}

function getCompletedSets(match) {
  return [
    [toNullableNumber(match.set1_a), toNullableNumber(match.set1_b)],
    [toNullableNumber(match.set2_a), toNullableNumber(match.set2_b)],
    [toNullableNumber(match.set3_a), toNullableNumber(match.set3_b)],
  ].filter(([a, b]) => a !== null && b !== null && a !== b)
}

function buildEmptyStanding(grupoId, parejaId) {
  return {
    grupo_id: grupoId,
    pareja_id: parejaId,
    partidos_jugados: 0,
    partidos_ganados: 0,
    partidos_empatados: 0,
    partidos_perdidos: 0,
    sets_favor: 0,
    sets_contra: 0,
    diferencia_sets: 0,
    juegos_favor: 0,
    juegos_contra: 0,
    diferencia_juegos: 0,
    goles_favor: 0,
    goles_contra: 0,
    diferencia_goles: 0,
    puntos: 0,
  }
}

function compareStandings(a, b) {
  return b.puntos - a.puntos ||
    b.diferencia_sets - a.diferencia_sets ||
    b.diferencia_juegos - a.diferencia_juegos ||
    b.juegos_favor - a.juegos_favor ||
    b.diferencia_goles - a.diferencia_goles ||
    b.goles_favor - a.goles_favor
}

export function recalcularClasificacionGrupo({ grupoId, asignaciones = [], partidos = [] }) {
  const statsByPair = new Map(
    asignaciones.map((asignacion) => [asignacion.pareja_id, buildEmptyStanding(grupoId, asignacion.pareja_id)]),
  )

  partidos
    .filter((partido) => partido.grupo_id === grupoId && partido.estado === 'finalizado')
    .forEach((partido) => {
      const statsA = statsByPair.get(partido.pareja_a_id)
      const statsB = statsByPair.get(partido.pareja_b_id)
      if (!statsA || !statsB) return

      const golesA = toNullableNumber(partido.goles_a)
      const golesB = toNullableNumber(partido.goles_b)

      statsA.partidos_jugados += 1
      statsB.partidos_jugados += 1

      if (golesA !== null && golesB !== null) {
        statsA.goles_favor += golesA
        statsA.goles_contra += golesB
        statsB.goles_favor += golesB
        statsB.goles_contra += golesA

        if (golesA > golesB) {
          statsA.partidos_ganados += 1
          statsB.partidos_perdidos += 1
          statsA.puntos += 3
        } else if (golesB > golesA) {
          statsB.partidos_ganados += 1
          statsA.partidos_perdidos += 1
          statsB.puntos += 3
        } else {
          statsA.partidos_empatados += 1
          statsB.partidos_empatados += 1
          statsA.puntos += 1
          statsB.puntos += 1
        }
        return
      }

      if (!partido.ganador_id) return

      const sets = getCompletedSets(partido)
      const setWins = sets.reduce((total, [a, b]) => ({
        a: total.a + (a > b ? 1 : 0),
        b: total.b + (b > a ? 1 : 0),
      }), { a: 0, b: 0 })

      statsA.partidos_ganados += partido.ganador_id === partido.pareja_a_id ? 1 : 0
      statsB.partidos_ganados += partido.ganador_id === partido.pareja_b_id ? 1 : 0
      statsA.partidos_perdidos += partido.ganador_id === partido.pareja_b_id ? 1 : 0
      statsB.partidos_perdidos += partido.ganador_id === partido.pareja_a_id ? 1 : 0
      statsA.puntos += partido.ganador_id === partido.pareja_a_id ? 1 : 0
      statsB.puntos += partido.ganador_id === partido.pareja_b_id ? 1 : 0
      statsA.sets_favor += setWins.a
      statsA.sets_contra += setWins.b
      statsB.sets_favor += setWins.b
      statsB.sets_contra += setWins.a

      sets.forEach(([a, b]) => {
        statsA.juegos_favor += a
        statsA.juegos_contra += b
        statsB.juegos_favor += b
        statsB.juegos_contra += a
      })
    })

  return [...statsByPair.values()]
    .map((stats) => ({
      ...stats,
      diferencia_sets: stats.sets_favor - stats.sets_contra,
      diferencia_juegos: stats.juegos_favor - stats.juegos_contra,
      diferencia_goles: stats.goles_favor - stats.goles_contra,
    }))
    .sort(compareStandings)
    .map((stats, index) => ({ ...stats, posicion: index + 1 }))
}
