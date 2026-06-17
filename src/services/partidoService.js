import { matchSelect } from './grupoService.js'
import { supabase } from './supabaseClient.js'
import {
  calcularGanadorPartido,
  calcularGanadorPadel,
  hasResultadoPartido,
} from '../utils/sportRules.js'

export const partidoPersistSelect = `${matchSelect},cuadro_tipo,orden_ronda,siguiente_partido_id,siguiente_posicion`

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

function toNullableNumber(value) {
  return value === '' || value === null || value === undefined ? null : Number(value)
}

function normalizeEstado(value) {
  if (value === 'jugado') return 'finalizado'
  return value || 'pendiente'
}

export function calculateWinnerId(match) {
  return calcularGanadorPadel(match)
}

async function getTipoDeporteByCategoria(categoriaId) {
  const result = await supabase
    .from('categorias')
    .select('torneos(tipo_deporte)')
    .eq('id', categoriaId)
    .single()

  if (result.error) throw result.error
  const torneo = Array.isArray(result.data?.torneos) ? result.data.torneos[0] : result.data?.torneos
  return torneo?.tipo_deporte || 'padel'
}

function buildPartidoPayload(data, current = {}, tipoDeporte = 'padel') {
  if (!data.categoria_id) throw new Error('Selecciona una categoria.')
  if (!data.pareja_a_id) throw new Error('Selecciona el participante local.')
  if (!data.pareja_b_id) throw new Error('Selecciona el participante visitante.')
  if (data.pareja_a_id === data.pareja_b_id) throw new Error('Los participantes del partido deben ser distintos.')
  if (!data.ronda?.trim()) throw new Error('Indica la ronda del partido.')

  const payload = {
    categoria_id: data.categoria_id,
    ronda: data.ronda.trim(),
    fase: data.fase || 'eliminatoria',
    cuadro_tipo: data.cuadro_tipo || data.cuadroTipo || current.cuadro_tipo || 'principal',
    grupo_id: data.fase === 'grupos' ? data.grupo_id || null : null,
    orden: toNullableNumber(data.orden),
    orden_ronda: toNullableNumber(data.orden_ronda ?? data.ordenRonda ?? current.orden_ronda ?? data.orden),
    siguiente_partido_id: data.siguiente_partido_id || data.siguientePartidoId || current.siguiente_partido_id || null,
    siguiente_posicion: data.siguiente_posicion || data.siguientePosicion || data.posicion_siguiente || data.posicionSiguiente || current.siguiente_posicion || null,
    pareja_a_id: data.pareja_a_id,
    pareja_b_id: data.pareja_b_id,
    fecha: data.fecha || null,
    hora: data.hora || null,
    pista_id: data.pista_id || null,
    pista: data.pista || null,
    estado: normalizeEstado(data.estado),
    set1_a: toNullableNumber(data.set1_a),
    set1_b: toNullableNumber(data.set1_b),
    set2_a: toNullableNumber(data.set2_a),
    set2_b: toNullableNumber(data.set2_b),
    set3_a: toNullableNumber(data.set3_a),
    set3_b: toNullableNumber(data.set3_b),
    goles_a: toNullableNumber(data.goles_a),
    goles_b: toNullableNumber(data.goles_b),
    penaltis_a: toNullableNumber(data.penaltis_a),
    penaltis_b: toNullableNumber(data.penaltis_b),
    ganador_manual_id: data.ganador_manual_id || null,
    observaciones: data.observaciones?.trim() || null,
  }

  payload.ganador_id = calcularGanadorPartido(payload, tipoDeporte)
  if (payload.ganador_id) {
    payload.estado = 'finalizado'
  } else if (tipoDeporte === 'futbol_sala' && hasResultadoPartido(payload, tipoDeporte) && (payload.fase === 'grupos' || payload.fase === 'liga')) {
    payload.estado = 'finalizado'
  } else if (payload.estado === 'finalizado') {
    payload.estado = 'pendiente'
  }

  return payload
}

async function validatePistaConflict(partidoId, payload) {
  if (!payload.pista_id || !payload.fecha || !payload.hora) {
    return
  }

  let query = supabase
    .from('partidos')
    .select('id')
    .eq('pista_id', payload.pista_id)
    .eq('fecha', payload.fecha)
    .eq('hora', payload.hora)
    .limit(1)

  if (partidoId) {
    query = query.neq('id', partidoId)
  }

  const result = await query
  if (result.error) throw result.error

  if (result.data.length) {
    throw new Error('Ya existe un partido programado en esta pista a esa hora.')
  }
}

async function validatePartidoPairs(payload) {
  const pairsResult = await supabase
    .from('parejas')
    .select('id,categoria_id')
    .in('id', [payload.pareja_a_id, payload.pareja_b_id])

  if (pairsResult.error) throw pairsResult.error

  if (pairsResult.data.length !== 2) {
    throw new Error('Selecciona dos participantes validos.')
  }

  const invalidPair = pairsResult.data.find((pareja) => pareja.categoria_id !== payload.categoria_id)
  if (invalidPair) {
    throw new Error('No puedes mezclar participantes de categorias o torneos distintos en un partido.')
  }
}

export async function getPartidos() {
  ensureSupabase()
  const result = await supabase.from('partidos').select(matchSelect).order('fecha', { ascending: true, nullsFirst: false })

  if (result.error) throw result.error
  return result.data
}

export async function getPartidoById(partidoId) {
  ensureSupabase()
  if (!partidoId) throw new Error('Selecciona un partido valido.')

  const result = await supabase.from('partidos').select(matchSelect).eq('id', partidoId).single()
  if (result.error) throw result.error
  return result.data
}

export async function getPartidosByCategoria(categoriaId) {
  ensureSupabase()
  if (!categoriaId) throw new Error('Selecciona una categoria.')

  const result = await supabase.from('partidos').select(matchSelect).eq('categoria_id', categoriaId)
  if (result.error) throw result.error
  return result.data
}

export async function createPartido(data) {
  ensureSupabase()
  const tipoDeporte = await getTipoDeporteByCategoria(data.categoria_id)
  const payload = buildPartidoPayload(data, {}, tipoDeporte)
  await validatePartidoPairs(payload)
  await validatePistaConflict(null, payload)
  throwIfError(await supabase.from('partidos').insert(payload))
}

export async function updatePartido(partidoId, data) {
  ensureSupabase()
  if (!partidoId) throw new Error('Selecciona un partido valido.')

  const currentResult = await supabase
    .from('partidos')
    .select(partidoPersistSelect)
    .eq('id', partidoId)
    .single()

  if (currentResult.error) throw currentResult.error

  const previous = currentResult.data
  const tipoDeporte = await getTipoDeporteByCategoria(data.categoria_id)
  const payload = buildPartidoPayload(data, previous, tipoDeporte)
  await validatePartidoPairs(payload)
  await validatePistaConflict(partidoId, payload)
  const updateResult = await supabase
    .from('partidos')
    .update(payload)
    .eq('id', partidoId)
    .select(partidoPersistSelect)
    .single()

  throwIfError(updateResult)

  return {
    previous,
    partido: updateResult.data,
    ganadorId: payload.ganador_id,
  }
}
