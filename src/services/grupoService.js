import { supabase } from './supabaseClient.js'
import { criteriosPorDefecto } from './categoriaService.js'
import { recalcularClasificacionGrupo } from '../utils/sportRules.js'

export const grupoSelect = 'id,categoria_id,nombre,orden,created_at'
export const grupoParejaSelect = 'id,grupo_id,pareja_id,orden,created_at'
export const clasificacionSelect = 'id,grupo_id,pareja_id,partidos_jugados,partidos_ganados,partidos_empatados,partidos_perdidos,sets_favor,sets_contra,diferencia_sets,juegos_favor,juegos_contra,diferencia_juegos,goles_favor,goles_contra,diferencia_goles,puntos,posicion,created_at'

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el entorno.')
  }
}

function throwIfError({ error }) {
  if (error) {
    throw error
  }
}

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function requireCategoria(categoriaId) {
  if (!categoriaId) {
    throw new Error('Selecciona una categoria.')
  }
}

function requireGrupo(grupoId) {
  if (!grupoId) {
    throw new Error('Selecciona un grupo.')
  }
}

function requirePareja(parejaId) {
  if (!parejaId) {
    throw new Error('Selecciona un participante.')
  }
}

function getFirstRoundName(totalPairs, fallback) {
  if (fallback) return fallback
  if (totalPairs > 8) return 'octavos'
  if (totalPairs > 4) return 'cuartos'
  if (totalPairs > 2) return 'semifinal'
  return 'final'
}

function getNextRoundName(roundName) {
  if (roundName === 'dieciseisavos') return 'octavos'
  if (roundName === 'octavos') return 'cuartos'
  if (roundName === 'cuartos') return 'semifinal'
  if (roundName === 'semifinal') return 'final'
  return null
}

function buildBracketSeeds(classifiedPairs) {
  const seeds = [...classifiedPairs].sort((a, b) =>
    b.puntos - a.puntos ||
    b.diferencia_sets - a.diferencia_sets ||
    b.diferencia_juegos - a.diferencia_juegos ||
    b.juegos_favor - a.juegos_favor ||
    b.diferencia_goles - a.diferencia_goles ||
    b.goles_favor - a.goles_favor ||
    a.posicion - b.posicion
  )
  const matches = []

  while (seeds.length > 1) {
    const first = seeds.shift()
    let opponentIndex = seeds.length - 1
    const differentGroupIndex = seeds.findLastIndex((seed) => seed.grupo_id !== first.grupo_id)

    if (differentGroupIndex >= 0) {
      opponentIndex = differentGroupIndex
    }

    const [second] = seeds.splice(opponentIndex, 1)
    matches.push([first, second])
  }

  return matches
}

function compareDirectResult(a, b, matches) {
  const directMatch = matches.find((match) =>
    match.estado === 'finalizado' &&
    match.ganador_id &&
    (
      (match.pareja_a_id === a.pareja_id && match.pareja_b_id === b.pareja_id) ||
      (match.pareja_a_id === b.pareja_id && match.pareja_b_id === a.pareja_id)
    )
  )

  if (!directMatch) return 0
  if (directMatch.ganador_id === a.pareja_id) return -1
  if (directMatch.ganador_id === b.pareja_id) return 1
  return 0
}

function compareStatsByCriteria(a, b, criteria, matches) {
  for (const criterion of criteria) {
    if (criterion === 'resultado_directo') {
      const directResult = compareDirectResult(a, b, matches)
      if (directResult !== 0) return directResult
      continue
    }

    const difference = (b[criterion] || 0) - (a[criterion] || 0)
    if (difference !== 0) return difference
  }

  return 0
}

export async function fetchGruposByCategoria(categoriaId) {
  ensureSupabase()
  requireCategoria(categoriaId)

  const [gruposResult, asignacionesResult, clasificacionesResult, partidosResult] = await Promise.all([
    supabase.from('grupos').select(grupoSelect).eq('categoria_id', categoriaId).order('orden', { ascending: true }),
    supabase.from('grupo_parejas').select(grupoParejaSelect).order('orden', { ascending: true }),
    supabase.from('clasificaciones_grupo').select(clasificacionSelect).order('posicion', { ascending: true }),
    supabase.from('partidos').select('id,categoria_id,ronda,fase,grupo_id,orden,pareja_a_id,pareja_b_id,ganador_id,fecha,hora,pista,estado,set1_a,set1_b,set2_a,set2_b,set3_a,set3_b,goles_a,goles_b,penaltis_a,penaltis_b,observaciones').eq('categoria_id', categoriaId).eq('fase', 'grupos').order('orden', { ascending: true }),
  ])

  const firstError = [gruposResult.error, asignacionesResult.error, clasificacionesResult.error, partidosResult.error].find(Boolean)
  if (firstError) throw firstError

  const grupoIds = new Set(gruposResult.data.map((grupo) => grupo.id))

  return {
    grupos: gruposResult.data,
    grupoParejas: asignacionesResult.data.filter((asignacion) => grupoIds.has(asignacion.grupo_id)),
    clasificacionesGrupo: clasificacionesResult.data.filter((fila) => grupoIds.has(fila.grupo_id)),
    partidosGrupo: partidosResult.data,
  }
}

export async function saveGrupo(form) {
  ensureSupabase()
  requireCategoria(form.categoria_id)

  if (!form.nombre?.trim()) {
    throw new Error('Indica un nombre para el grupo.')
  }

  const payload = {
    categoria_id: form.categoria_id,
    nombre: form.nombre.trim(),
    orden: toNumber(form.orden),
  }

  if (form.id) {
    throwIfError(await supabase.from('grupos').update(payload).eq('id', form.id))
    return
  }

  throwIfError(await supabase.from('grupos').insert(payload))
}

export async function assignParejaToGrupo({ categoriaId, grupo_id, grupoId, pareja_id, parejaId, orden = 0 }) {
  ensureSupabase()
  const selectedGrupoId = grupo_id || grupoId
  const selectedParejaId = pareja_id || parejaId
  requireCategoria(categoriaId)
  requireGrupo(selectedGrupoId)
  requirePareja(selectedParejaId)

  const [grupoResult, parejaResult, existingResult] = await Promise.all([
    supabase.from('grupos').select('id,categoria_id').eq('id', selectedGrupoId).single(),
    supabase.from('parejas').select('id,categoria_id').eq('id', selectedParejaId).single(),
    supabase
      .from('grupo_parejas')
      .select('id,grupo_id,grupos!inner(categoria_id)')
      .eq('pareja_id', selectedParejaId)
      .eq('grupos.categoria_id', categoriaId),
  ])

  const firstError = [grupoResult.error, parejaResult.error, existingResult.error].find(Boolean)
  if (firstError) throw firstError

  if (grupoResult.data.categoria_id !== categoriaId) {
    throw new Error('El grupo seleccionado no pertenece a la categoria elegida.')
  }

  if (parejaResult.data.categoria_id !== categoriaId) {
    throw new Error('El participante seleccionado no pertenece a la categoria elegida.')
  }

  if (existingResult.data.length) {
    throw new Error('Este participante ya esta asignado a un grupo de esta categoria.')
  }

  throwIfError(await supabase.from('grupo_parejas').insert({
    grupo_id: selectedGrupoId,
    pareja_id: selectedParejaId,
    orden: toNumber(orden),
  }))
}

export async function assignParejasAutomaticamente(categoriaId) {
  ensureSupabase()
  requireCategoria(categoriaId)

  const [{ grupos }, parejasResult, asignacionesResult] = await Promise.all([
    fetchGruposByCategoria(categoriaId),
    supabase.from('parejas').select('id,categoria_id,activo').eq('categoria_id', categoriaId).eq('activo', true).order('created_at', { ascending: true }),
    supabase.from('grupo_parejas').select('pareja_id,grupos!inner(categoria_id)').eq('grupos.categoria_id', categoriaId),
  ])

  const firstError = [parejasResult.error, asignacionesResult.error].find(Boolean)
  if (firstError) throw firstError
  if (!grupos.length) throw new Error('Crea al menos un grupo antes de repartir participantes.')

  const asignadas = new Set(asignacionesResult.data.map((item) => item.pareja_id))
  const disponibles = parejasResult.data.filter((pareja) => !asignadas.has(pareja.id))
  const inserts = disponibles.map((pareja, index) => ({
    grupo_id: grupos[index % grupos.length].id,
    pareja_id: pareja.id,
    orden: Math.floor(index / grupos.length) + 1,
  }))

  if (!inserts.length) {
    throw new Error('No hay participantes disponibles para repartir.')
  }

  throwIfError(await supabase.from('grupo_parejas').insert(inserts))
}

export async function removeParejaFromGrupo(asignacionId) {
  ensureSupabase()

  if (!asignacionId) {
    throw new Error('Selecciona una asignacion valida.')
  }

  throwIfError(await supabase.from('grupo_parejas').delete().eq('id', asignacionId))
}

export async function generateGroupMatches(categoriaId) {
  ensureSupabase()
  requireCategoria(categoriaId)

  const { grupos, grupoParejas } = await fetchGruposByCategoria(categoriaId)
  if (!grupos.length) throw new Error('Crea grupos antes de generar partidos.')

  const existingResult = await supabase
    .from('partidos')
    .select('id')
    .eq('categoria_id', categoriaId)
    .eq('fase', 'grupos')
    .limit(1)
  if (existingResult.error) throw existingResult.error
  if (existingResult.data.length) throw new Error('Ya existen partidos de grupos para esta categoria.')

  const matches = []
  const parejaIds = [...new Set(grupoParejas.map((asignacion) => asignacion.pareja_id))]
  const parejasResult = parejaIds.length
    ? await supabase.from('parejas').select('id,categoria_id').in('id', parejaIds)
    : { data: [], error: null }
  if (parejasResult.error) throw parejasResult.error
  const parejasCategoriaMap = new Map(parejasResult.data.map((pareja) => [pareja.id, pareja.categoria_id]))

  grupos.forEach((grupo) => {
    const parejasGrupo = grupoParejas.filter((asignacion) => asignacion.grupo_id === grupo.id)
    if (parejasGrupo.length < 2) {
      throw new Error(`${grupo.nombre} tiene menos de 2 participantes.`)
    }

    const invalidAssignment = parejasGrupo.find((asignacion) => parejasCategoriaMap.get(asignacion.pareja_id) !== categoriaId)
    if (invalidAssignment) {
      throw new Error(`${grupo.nombre} tiene un participante que no pertenece a la categoria.`)
    }

    parejasGrupo.forEach((participanteA, index) => {
      parejasGrupo.slice(index + 1).forEach((participanteB) => {
        matches.push({
          categoria_id: categoriaId,
          ronda: grupo.nombre,
          fase: 'grupos',
          grupo_id: grupo.id,
          orden: matches.length + 1,
          pareja_a_id: participanteA.pareja_id,
          pareja_b_id: participanteB.pareja_id,
          estado: 'pendiente',
        })
      })
    })
  })

  throwIfError(await supabase.from('partidos').insert(matches))
}

export async function recalcularClasificacion(categoriaId) {
  ensureSupabase()
  requireCategoria(categoriaId)

  const categoriaResult = await supabase
    .from('categorias')
    .select('criterios_clasificacion')
    .eq('id', categoriaId)
    .single()
  if (categoriaResult.error) throw categoriaResult.error

  const criteriosOrden = categoriaResult.data.criterios_clasificacion?.length
    ? categoriaResult.data.criterios_clasificacion
    : criteriosPorDefecto
  const { grupos, grupoParejas, partidosGrupo } = await fetchGruposByCategoria(categoriaId)
  const standings = []

  grupos.forEach((grupo) => {
    const partidosDelGrupo = partidosGrupo.filter((partido) => partido.grupo_id === grupo.id)
    const asignacionesGrupo = grupoParejas.filter((asignacion) => asignacion.grupo_id === grupo.id)
    const sorted = recalcularClasificacionGrupo({
      grupoId: grupo.id,
      asignaciones: asignacionesGrupo,
      partidos: partidosDelGrupo,
    })

    standings.push(...sorted
      .sort((a, b) => compareStatsByCriteria(a, b, criteriosOrden, partidosDelGrupo))
      .map((stats, index) => ({ ...stats, posicion: index + 1 })))
  })

  if (!standings.length) return []

  throwIfError(await supabase
    .from('clasificaciones_grupo')
    .upsert(standings, { onConflict: 'grupo_id,pareja_id' }))

  return standings
}

export async function generateEliminationFromClassified(categoriaId) {
  ensureSupabase()
  requireCategoria(categoriaId)

  const categoriaResult = await supabase
    .from('categorias')
    .select('id,clasifican_por_grupo,tipo_cuadro_final')
    .eq('id', categoriaId)
    .single()
  if (categoriaResult.error) throw categoriaResult.error

  const { grupos, partidosGrupo } = await fetchGruposByCategoria(categoriaId)
  const pendingMatches = partidosGrupo.filter((partido) => partido.estado !== 'finalizado' || !partido.ganador_id)
  if (pendingMatches.length) {
    throw new Error('Faltan resultados de la fase de grupos.')
  }

  const existingResult = await supabase
    .from('partidos')
    .select('id')
    .eq('categoria_id', categoriaId)
    .eq('fase', 'eliminatoria')
    .limit(1)
  if (existingResult.error) throw existingResult.error
  if (existingResult.data.length) throw new Error('Ya existen partidos eliminatorios para esta categoria.')

  const standings = await recalcularClasificacion(categoriaId)
  const pasan = Math.max(1, categoriaResult.data.clasifican_por_grupo || 1)
  const classifiedPairs = grupos.flatMap((grupo) =>
    standings
      .filter((fila) => fila.grupo_id === grupo.id)
      .sort((a, b) => a.posicion - b.posicion)
      .slice(0, pasan),
  )

  if (classifiedPairs.length < 2) {
    throw new Error('No hay suficientes participantes clasificados para generar cuadro.')
  }

  const firstRound = getFirstRoundName(classifiedPairs.length, categoriaResult.data.tipo_cuadro_final)
  const firstRoundMatches = buildBracketSeeds(classifiedPairs)
  const firstRoundInserts = firstRoundMatches.map(([pairA, pairB], index) => ({
    categoria_id: categoriaId,
    ronda: firstRound,
    fase: 'eliminatoria',
    cuadro_tipo: 'principal',
    orden: index + 1,
    orden_ronda: index + 1,
    pareja_a_id: pairA.pareja_id,
    pareja_b_id: pairB.pareja_id,
    estado: 'pendiente',
  }))

  const insertedFirstRound = await supabase.from('partidos').insert(firstRoundInserts).select('id,orden_ronda')
  if (insertedFirstRound.error) throw insertedFirstRound.error

  let previousMatches = insertedFirstRound.data.sort((a, b) => a.orden_ronda - b.orden_ronda)
  let nextRound = getNextRoundName(firstRound)

  while (nextRound && previousMatches.length > 1) {
    const placeholders = Array.from({ length: Math.ceil(previousMatches.length / 2) }, (_item, index) => ({
      categoria_id: categoriaId,
      ronda: nextRound,
      fase: 'eliminatoria',
      cuadro_tipo: 'principal',
      orden: index + 1,
      orden_ronda: index + 1,
      pareja_a_id: null,
      pareja_b_id: null,
      estado: 'pendiente',
      observaciones: 'Pendiente de ganadores de la ronda anterior',
    }))

    const insertedNextRound = await supabase.from('partidos').insert(placeholders).select('id,orden_ronda')
    if (insertedNextRound.error) throw insertedNextRound.error

    const nextMatches = insertedNextRound.data.sort((a, b) => a.orden_ronda - b.orden_ronda)
    const updates = previousMatches.map((match, index) => {
      const target = nextMatches[Math.floor(index / 2)]
      return supabase
        .from('partidos')
        .update({
          siguiente_partido_id: target.id,
          siguiente_posicion: index % 2 === 0 ? 'a' : 'b',
        })
        .eq('id', match.id)
    })

    const results = await Promise.all(updates)
    const firstUpdateError = results.map((result) => result.error).find(Boolean)
    if (firstUpdateError) throw firstUpdateError

    previousMatches = nextMatches
    nextRound = getNextRoundName(nextRound)
  }
}
