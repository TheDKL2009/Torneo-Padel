import { supabase } from './supabaseClient.js'
import { clasificacionSelect, grupoParejaSelect, grupoSelect } from './grupoService.js'
import { pistaSelect } from './pistaService.js'

const matchSelect = 'id,categoria_id,ronda,fase,grupo_id,cuadro_tipo,orden_ronda,siguiente_partido_id,siguiente_posicion,pista_id,pareja_a_id,pareja_b_id,ganador_id,ganador_manual_id,fecha,hora,pista,estado,set1_a,set1_b,set2_a,set2_b,set3_a,set3_b,goles_a,goles_b,penaltis_a,penaltis_b,observaciones,orden,created_at'
const modalidades = new Set(['pareja', 'equipo', 'individual'])

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

export function normalizeModalidad(value) {
  return modalidades.has(value) ? value : 'pareja'
}

function splitLines(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function getParticipantName(participant) {
  if (!participant) {
    return 'Sin participante'
  }

  if (participant.nombre?.trim()) {
    return participant.nombre.trim()
  }

  const modalidad = normalizeModalidad(participant.tipo_participante)

  if (modalidad === 'equipo') {
    return participant.nombre_equipo?.trim() || 'Equipo sin nombre'
  }

  if (modalidad === 'individual') {
    return participant.jugador_1?.trim() || 'Jugador sin nombre'
  }

  return [participant.jugador_1, participant.jugador_2].filter(Boolean).join(' / ') || 'Sin participante'
}

export function getPairName(pair) {
  return getParticipantName(pair)
}

export function calculateWinnerId(match) {
  const sets = [
    [toNullableNumber(match.set1_a), toNullableNumber(match.set1_b)],
    [toNullableNumber(match.set2_a), toNullableNumber(match.set2_b)],
    [toNullableNumber(match.set3_a), toNullableNumber(match.set3_b)],
  ].filter(([a, b]) => a !== null && b !== null)

  const wins = sets.reduce(
    (total, [a, b]) => ({
      a: total.a + (a > b ? 1 : 0),
      b: total.b + (b > a ? 1 : 0),
    }),
    { a: 0, b: 0 },
  )

  if (wins.a >= 2) {
    return match.pareja_a_id || null
  }

  if (wins.b >= 2) {
    return match.pareja_b_id || null
  }

  return null
}

export async function fetchAdminData() {
  ensureSupabase()

  const [
    categoriasResult,
    parejasResult,
    partidosResult,
    patrocinadoresResult,
    pistasResult,
    gruposResult,
    grupoParejasResult,
    clasificacionesResult,
  ] = await Promise.all([
    supabase
      .from('categorias')
      .select('id,nombre,tipo,modalidad,orden,activo,tiene_fase_grupos,numero_grupos,parejas_por_grupo,clasifican_por_grupo,tipo_cuadro_final,criterios_clasificacion,created_at')
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true }),
    supabase
      .from('parejas')
      .select('id,categoria_id,tipo_participante,nombre,jugador_1,jugador_2,nombre_equipo,jugadores,telefono,email,activo,created_at')
      .order('created_at', { ascending: true }),
    supabase
      .from('partidos')
      .select(matchSelect)
      .order('orden', { ascending: true, nullsFirst: false })
      .order('fecha', { ascending: true, nullsFirst: false })
      .order('hora', { ascending: true, nullsFirst: false }),
    supabase
      .from('patrocinadores')
      .select('id,nombre,logo_url,web_url,orden,activo,created_at')
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true }),
    supabase
      .from('pistas')
      .select(pistaSelect)
      .order('numero', { ascending: true }),
    supabase
      .from('grupos')
      .select(grupoSelect)
      .order('categoria_id')
      .order('orden', { ascending: true }),
    supabase
      .from('grupo_parejas')
      .select(grupoParejaSelect)
      .order('orden', { ascending: true }),
    supabase
      .from('clasificaciones_grupo')
      .select(clasificacionSelect)
      .order('posicion', { ascending: true }),
  ])

  const firstError = [
    categoriasResult.error,
    parejasResult.error,
    partidosResult.error,
    patrocinadoresResult.error,
    pistasResult.error,
    gruposResult.error,
    grupoParejasResult.error,
    clasificacionesResult.error,
  ].find(Boolean)

  if (firstError) {
    throw firstError
  }

  return {
    categorias: categoriasResult.data,
    parejas: parejasResult.data,
    partidos: partidosResult.data,
    patrocinadores: patrocinadoresResult.data,
    pistas: pistasResult.data,
    grupos: gruposResult.data,
    grupoParejas: grupoParejasResult.data,
    clasificacionesGrupo: clasificacionesResult.data,
  }
}

export async function saveCategoria(form) {
  ensureSupabase()

  const payload = {
    nombre: form.nombre.trim(),
    tipo: form.tipo.trim(),
    modalidad: normalizeModalidad(form.modalidad),
    orden: Number(form.orden || 0),
    activo: Boolean(form.activo),
  }

  if (form.id) {
    throwIfError(await supabase.from('categorias').update(payload).eq('id', form.id))
    return
  }

  throwIfError(await supabase.from('categorias').insert(payload))
}

export async function toggleCategoria(id, activo) {
  ensureSupabase()
  throwIfError(await supabase.from('categorias').update({ activo }).eq('id', id))
}

export async function savePareja(form) {
  ensureSupabase()

  const tipoParticipante = normalizeModalidad(form.tipo_participante || form.modalidad)
  const jugador1 = String(form.jugador_1 || '').trim()
  const jugador2 = String(form.jugador_2 || '').trim()
  const nombreEquipo = String(form.nombre_equipo || '').trim()
  const nombre = tipoParticipante === 'equipo'
    ? nombreEquipo
    : tipoParticipante === 'individual'
      ? jugador1
      : [jugador1, jugador2].filter(Boolean).join(' / ')

  const payload = {
    categoria_id: form.categoria_id,
    tipo_participante: tipoParticipante,
    nombre,
    jugador_1: jugador1 || null,
    jugador_2: jugador2 || null,
    nombre_equipo: nombreEquipo || null,
    jugadores: splitLines(form.jugadores),
    telefono: form.telefono.trim() || null,
    email: form.email.trim() || null,
    activo: Boolean(form.activo),
  }

  if (form.id) {
    throwIfError(await supabase.from('parejas').update(payload).eq('id', form.id))
    return
  }

  throwIfError(await supabase.from('parejas').insert(payload))
}

export async function savePartido(form) {
  ensureSupabase()

  const payload = {
    categoria_id: form.categoria_id,
    ronda: form.ronda.trim(),
    pareja_a_id: form.pareja_a_id,
    pareja_b_id: form.pareja_b_id,
    fecha: form.fecha || null,
    hora: form.hora || null,
    pista: form.pista.trim() || null,
    estado: form.estado,
    orden: toNullableNumber(form.orden),
    set1_a: toNullableNumber(form.set1_a),
    set1_b: toNullableNumber(form.set1_b),
    set2_a: toNullableNumber(form.set2_a),
    set2_b: toNullableNumber(form.set2_b),
    set3_a: toNullableNumber(form.set3_a),
    set3_b: toNullableNumber(form.set3_b),
    observaciones: form.observaciones.trim() || null,
  }
  payload.ganador_id = calculateWinnerId(payload)

  if (form.id) {
    throwIfError(await supabase.from('partidos').update(payload).eq('id', form.id))
    return
  }

  throwIfError(await supabase.from('partidos').insert(payload))
}

export async function savePatrocinador(form) {
  ensureSupabase()

  const payload = {
    nombre: form.nombre.trim(),
    logo_url: form.logo_url.trim() || null,
    web_url: form.web_url.trim() || null,
    orden: Number(form.orden || 0),
    activo: Boolean(form.activo),
  }

  if (form.id) {
    throwIfError(await supabase.from('patrocinadores').update(payload).eq('id', form.id))
    return
  }

  throwIfError(await supabase.from('patrocinadores').insert(payload))
}

export async function togglePatrocinador(id, activo) {
  ensureSupabase()
  throwIfError(await supabase.from('patrocinadores').update({ activo }).eq('id', id))
}
