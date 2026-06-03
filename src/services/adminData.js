import { supabase } from './supabaseClient.js'

const matchSelect = 'id,categoria_id,ronda,pareja_a_id,pareja_b_id,ganador_id,fecha,hora,pista,estado,set1_a,set1_b,set2_a,set2_b,set3_a,set3_b,observaciones,created_at'

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

export function getPairName(pair) {
  return pair ? `${pair.jugador_1} / ${pair.jugador_2}` : 'Sin pareja'
}

export function calculateWinnerId(match) {
  const sets = [
    [toNullableNumber(match.set1_a), toNullableNumber(match.set1_b)],
    [toNullableNumber(match.set2_a), toNullableNumber(match.set2_b)],
    [toNullableNumber(match.set3_a), toNullableNumber(match.set3_b)],
  ].filter(([a, b]) => a !== null && b !== null && a !== b)

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

  const [categoriasResult, parejasResult, partidosResult, patrocinadoresResult] = await Promise.all([
    supabase
      .from('categorias')
      .select('id,nombre,tipo,orden,activo,created_at')
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true }),
    supabase
      .from('parejas')
      .select('id,categoria_id,jugador_1,jugador_2,telefono,email,activo,created_at')
      .order('created_at', { ascending: true }),
    supabase
      .from('partidos')
      .select(matchSelect)
      .order('fecha', { ascending: true, nullsFirst: false })
      .order('hora', { ascending: true, nullsFirst: false }),
    supabase
      .from('patrocinadores')
      .select('id,nombre,logo_url,web_url,orden,activo,created_at')
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true }),
  ])

  const firstError = [
    categoriasResult.error,
    parejasResult.error,
    partidosResult.error,
    patrocinadoresResult.error,
  ].find(Boolean)

  if (firstError) {
    throw firstError
  }

  return {
    categorias: categoriasResult.data,
    parejas: parejasResult.data,
    partidos: partidosResult.data,
    patrocinadores: patrocinadoresResult.data,
  }
}

export async function saveCategoria(form) {
  ensureSupabase()

  const payload = {
    nombre: form.nombre.trim(),
    tipo: form.tipo.trim(),
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

  const payload = {
    categoria_id: form.categoria_id,
    jugador_1: form.jugador_1.trim(),
    jugador_2: form.jugador_2.trim(),
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
