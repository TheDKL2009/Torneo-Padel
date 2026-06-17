import { supabase } from './supabaseClient.js'

export const deporteOptions = [
  { value: 'padel', label: 'Pádel' },
  { value: 'futbol_sala', label: 'Fútbol sala' },
]

export const torneoSelect = 'id,nombre,temporada,descripcion,sede,fecha_inicio,fecha_fin,estado,activo,destacado,tipo_deporte,created_at'

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el entorno.')
  }
}

function throwIfError({ error }) {
  if (error) throw error
}

export function normalizeTipoDeporte(value) {
  return deporteOptions.some((option) => option.value === value) ? value : 'padel'
}

export function getDeporteLabel(value) {
  const tipoDeporte = normalizeTipoDeporte(value)
  return deporteOptions.find((option) => option.value === tipoDeporte)?.label || 'Pádel'
}

function normalizeTorneoPayload(data) {
  if (!data.nombre?.trim()) {
    throw new Error('Indica el nombre del torneo.')
  }

  return {
    nombre: data.nombre.trim(),
    temporada: data.temporada?.trim() || null,
    descripcion: data.descripcion?.trim() || null,
    sede: data.sede?.trim() || null,
    fecha_inicio: data.fecha_inicio || null,
    fecha_fin: data.fecha_fin || null,
    estado: data.estado || 'borrador',
    activo: Boolean(data.activo),
    destacado: Boolean(data.destacado),
    tipo_deporte: normalizeTipoDeporte(data.tipo_deporte),
  }
}

export async function getTorneosActivos() {
  ensureSupabase()
  const result = await supabase
    .from('torneos')
    .select(torneoSelect)
    .eq('activo', true)
    .order('destacado', { ascending: false })
    .order('fecha_inicio', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (result.error) throw result.error
  return result.data
}

export async function getTorneosAdmin() {
  ensureSupabase()
  const result = await supabase
    .from('torneos')
    .select(torneoSelect)
    .order('destacado', { ascending: false })
    .order('created_at', { ascending: false })

  if (result.error) throw result.error
  return result.data
}

export async function getTorneoById(torneoId) {
  ensureSupabase()
  if (!torneoId) throw new Error('Selecciona un torneo.')

  const result = await supabase.from('torneos').select(torneoSelect).eq('id', torneoId).single()
  if (result.error) throw result.error
  return result.data
}

export async function getTorneoDestacado() {
  ensureSupabase()
  const result = await supabase
    .from('torneos')
    .select(torneoSelect)
    .eq('activo', true)
    .eq('destacado', true)
    .maybeSingle()

  if (result.error) throw result.error
  return result.data
}

export async function createTorneo(data) {
  ensureSupabase()
  const payload = normalizeTorneoPayload(data)

  if (payload.destacado) {
    await clearDestacados()
  }

  throwIfError(await supabase.from('torneos').insert(payload))
}

export async function updateTorneo(torneoId, data) {
  ensureSupabase()
  if (!torneoId) throw new Error('Selecciona un torneo valido.')

  const payload = normalizeTorneoPayload(data)
  if (payload.destacado) {
    await clearDestacados(torneoId)
  }

  throwIfError(await supabase.from('torneos').update(payload).eq('id', torneoId))
}

export async function deleteOrDeactivateTorneo(torneoId) {
  ensureSupabase()
  if (!torneoId) throw new Error('Selecciona un torneo valido.')

  throwIfError(await supabase.from('torneos').update({ activo: false, destacado: false }).eq('id', torneoId))
}

export async function setTorneoDestacado(torneoId) {
  ensureSupabase()
  if (!torneoId) throw new Error('Selecciona un torneo valido.')

  await clearDestacados(torneoId)
  throwIfError(await supabase.from('torneos').update({ destacado: true, activo: true }).eq('id', torneoId))
}

async function clearDestacados(exceptId = null) {
  let query = supabase.from('torneos').update({ destacado: false }).eq('destacado', true)
  if (exceptId) query = query.neq('id', exceptId)
  throwIfError(await query)
}

export async function getCategoriasByTorneo(torneoId) {
  ensureSupabase()
  if (!torneoId) throw new Error('Selecciona un torneo.')

  const result = await supabase
    .from('categorias')
    .select('id,nombre,tipo,orden,activo,tiene_fase_grupos,numero_grupos,parejas_por_grupo,clasifican_por_grupo,tipo_cuadro_final,criterios_clasificacion,torneo_id,created_at')
    .eq('torneo_id', torneoId)
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true })

  if (result.error) throw result.error
  return result.data
}

export async function getPartidosByTorneo(torneoId) {
  const categorias = await getCategoriasByTorneo(torneoId)
  const categoriaIds = categorias.map((categoria) => categoria.id)
  if (!categoriaIds.length) return []

  const result = await supabase.from('partidos').select('*').in('categoria_id', categoriaIds)
  if (result.error) throw result.error
  return result.data
}

export async function getGruposByTorneo(torneoId) {
  const categorias = await getCategoriasByTorneo(torneoId)
  const categoriaIds = categorias.map((categoria) => categoria.id)
  if (!categoriaIds.length) return []

  const result = await supabase.from('grupos').select('*').in('categoria_id', categoriaIds)
  if (result.error) throw result.error
  return result.data
}

export async function getPatrocinadoresByTorneo(torneoId) {
  ensureSupabase()
  if (!torneoId) throw new Error('Selecciona un torneo.')

  const result = await supabase
    .from('patrocinadores')
    .select('id,nombre,logo_url,web_url,orden,activo,torneo_id,created_at')
    .eq('torneo_id', torneoId)
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true })

  if (result.error) throw result.error
  return result.data
}
