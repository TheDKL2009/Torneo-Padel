import { updatePartido } from './partidoService.js'
import { supabase } from './supabaseClient.js'
import { buildBracketRounds, validateBracketStructure } from '../utils/bracketUtils.js'
import { mapParejaToParticipante, participanteSelect } from './participanteService.js'

const bracketSelect = 'id,categoria_id,ronda,fase,cuadro_tipo,orden,orden_ronda,siguiente_partido_id,siguiente_posicion,pista_id,pareja_a_id,pareja_b_id,ganador_id,fecha,hora,pista,estado,set1_a,set1_b,set2_a,set2_b,set3_a,set3_b,goles_a,goles_b,penaltis_a,penaltis_b,ganador_manual_id,observaciones,created_at'

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el entorno.')
  }
}

function normalizeMatch(match, categoriaMap = new Map(), parejaMap = new Map(), pistaMap = new Map()) {
  const pista = pistaMap.get(match.pista_id)
  const categoria = categoriaMap.get(match.categoria_id)

  return {
    id: match.id,
    categoriaId: match.categoria_id,
    ronda: match.ronda,
    fase: match.fase || 'eliminatoria',
    cuadroTipo: match.cuadro_tipo || 'principal',
    orden: match.orden,
    ordenRonda: match.orden_ronda ?? match.orden,
    siguientePartidoId: match.siguiente_partido_id,
    siguientePosicion: match.siguiente_posicion,
    pistaId: match.pista_id,
    parejaAId: match.pareja_a_id,
    parejaBId: match.pareja_b_id,
    ganadorId: match.ganador_id,
    fecha: match.fecha || '',
    hora: match.hora ? match.hora.slice(0, 5) : '',
    pista: pista?.nombre || match.pista || 'Sin pista asignada',
    pistaData: pista,
    estado: match.estado,
    estadoRaw: match.estado,
    set1_a: match.set1_a,
    set1_b: match.set1_b,
    set2_a: match.set2_a,
    set2_b: match.set2_b,
    set3_a: match.set3_a,
    set3_b: match.set3_b,
    goles_a: match.goles_a,
    goles_b: match.goles_b,
    penaltis_a: match.penaltis_a,
    penaltis_b: match.penaltis_b,
    ganador_manual_id: match.ganador_manual_id,
    observaciones: match.observaciones,
    categoria,
    tipoDeporte: categoria?.tipoDeporte || 'padel',
    parejaA: parejaMap.get(match.pareja_a_id),
    parejaB: parejaMap.get(match.pareja_b_id),
    ganador: parejaMap.get(match.ganador_id),
  }
}

export async function getBracketMatches(categoriaId, cuadroTipo = 'principal') {
  ensureSupabase()
  if (!categoriaId) throw new Error('Selecciona una categoria.')

  const [matchesResult, categoriasResult, parejasResult, pistasResult] = await Promise.all([
    supabase
      .from('partidos')
      .select(bracketSelect)
      .eq('categoria_id', categoriaId)
      .eq('fase', 'eliminatoria')
      .eq('cuadro_tipo', cuadroTipo)
      .order('orden_ronda', { ascending: true, nullsFirst: false })
      .order('orden', { ascending: true, nullsFirst: false }),
    supabase.from('categorias').select('id,nombre,tipo,orden,activo,torneos(tipo_deporte)').eq('id', categoriaId),
    supabase.from('parejas').select(participanteSelect),
    supabase.from('pistas').select('id,nombre,numero,activa'),
  ])

  const firstError = [matchesResult.error, categoriasResult.error, parejasResult.error, pistasResult.error].find(Boolean)
  if (firstError) throw firstError

  const categorias = categoriasResult.data.map((categoria) => ({
    id: categoria.id,
    nombre: categoria.nombre,
    nivel: categoria.tipo,
    tipoDeporte: (Array.isArray(categoria.torneos) ? categoria.torneos[0] : categoria.torneos)?.tipo_deporte || 'padel',
  }))
  const parejas = parejasResult.data.map((pareja) => ({
    id: pareja.id,
    nombre: mapParejaToParticipante(pareja).displayName,
    categoriaId: pareja.categoria_id,
    tipoParticipante: pareja.tipo_participante,
  }))
  const categoriaMap = new Map(categorias.map((categoria) => [categoria.id, categoria]))
  const parejaMap = new Map(parejas.map((pareja) => [pareja.id, pareja]))
  const pistaMap = new Map(pistasResult.data.map((pista) => [pista.id, pista]))

  return matchesResult.data.map((match) => normalizeMatch(match, categoriaMap, parejaMap, pistaMap))
}

export async function getBracketByCategoria(categoriaId, cuadroTipo = 'principal') {
  const matches = await getBracketMatches(categoriaId, cuadroTipo)
  return {
    matches,
    rounds: buildBracketRounds(matches),
    validation: validateBracketStructure(matches),
  }
}

export async function validateBracket(categoriaId, cuadroTipo = 'principal') {
  const matches = await getBracketMatches(categoriaId, cuadroTipo)
  return validateBracketStructure(matches)
}

export async function advanceWinner(partidoId) {
  ensureSupabase()

  const currentResult = await supabase
    .from('partidos')
    .select('id,fase,ganador_id,siguiente_partido_id,siguiente_posicion')
    .eq('id', partidoId)
    .single()

  if (currentResult.error) throw currentResult.error

  return propagateWinner(currentResult.data)
}

export async function replaceAdvancedWinner(partidoId, ganadorId) {
  ensureSupabase()

  const currentResult = await supabase
    .from('partidos')
    .select('id,siguiente_partido_id,siguiente_posicion')
    .eq('id', partidoId)
    .single()

  if (currentResult.error) throw currentResult.error

  const current = currentResult.data
  if (!current.siguiente_partido_id || !current.siguiente_posicion) {
    return { advanced: false, warning: '' }
  }

  const field = current.siguiente_posicion === 'a' ? 'pareja_a_id' : 'pareja_b_id'
  const updateResult = await supabase
    .from('partidos')
    .update({ [field]: ganadorId })
    .eq('id', current.siguiente_partido_id)

  if (updateResult.error) throw updateResult.error

  return { advanced: true, warning: '' }
}

function normalizeNextPosition(value) {
  const normalized = value?.toLowerCase()
  if (normalized === 'a') return 'a'
  if (normalized === 'b') return 'b'
  return null
}

async function propagateWinner(match, previousWinnerId = null) {
  if (match.fase !== 'eliminatoria') {
    return { advanced: false, warning: '' }
  }

  const position = normalizeNextPosition(match.siguiente_posicion)
  console.log('[bracket] partido actualizado', {
    partidoId: match.id,
    ganadorId: match.ganador_id,
    siguientePartidoId: match.siguiente_partido_id,
    siguientePosicion: position,
  })

  if (!match.siguiente_partido_id || !position) {
    return { advanced: false, warning: '' }
  }

  if (!match.ganador_id && !previousWinnerId) {
    return { advanced: false, warning: '' }
  }

  const nextResult = await supabase
    .from('partidos')
    .select('id,fase,pareja_a_id,pareja_b_id,ganador_id,estado,siguiente_partido_id,siguiente_posicion')
    .eq('id', match.siguiente_partido_id)
    .single()

  if (nextResult.error) throw nextResult.error

  const next = nextResult.data
  const field = position === 'a' ? 'pareja_a_id' : 'pareja_b_id'
  const previousValue = next[field]
  const nextPayload = { [field]: match.ganador_id || null }
  let warning = ''

  console.log('[bracket] siguiente partido encontrado', {
    partidoId: next.id,
    campo: field,
    valorAnterior: previousValue,
    ganadorCalculado: match.ganador_id,
  })

  if (next.ganador_id && previousValue !== match.ganador_id) {
    nextPayload.ganador_id = null
    nextPayload.estado = 'pendiente'
    warning = 'El siguiente partido ya tenia resultado; se ha limpiado su ganador para evitar inconsistencias.'
  }

  if (!match.ganador_id && previousWinnerId && previousValue !== previousWinnerId) {
    return { advanced: false, warning: '' }
  }

  const updateResult = await supabase
    .from('partidos')
    .update(nextPayload)
    .eq('id', next.id)
    .select('id,fase,ganador_id,siguiente_partido_id,siguiente_posicion')
    .single()

  if (updateResult.error) throw updateResult.error

  console.log('[bracket] posicion actualizada', {
    partidoId: next.id,
    campo: field,
    parejaId: match.ganador_id || null,
  })

  if (nextPayload.ganador_id === null && next.ganador_id) {
    console.log('[bracket] ganador del siguiente partido limpiado', {
      partidoId: next.id,
      previousWinnerId: next.ganador_id,
    })
    const recursiveResult = await propagateWinner(updateResult.data, next.ganador_id)
    warning = warning || recursiveResult.warning
  }

  return { advanced: true, warning }
}

export async function updateBracketMatch(partidoId, data) {
  const result = await updatePartido(partidoId, data)
  console.log('[bracket] ganador calculado', {
    partidoId,
    ganadorAnterior: result.previous.ganador_id,
    ganadorNuevo: result.partido.ganador_id,
  })

  return propagateWinner(result.partido, result.previous.ganador_id)
}
