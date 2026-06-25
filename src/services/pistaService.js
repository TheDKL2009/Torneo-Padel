import { supabase } from './supabaseClient.js'

export const pistaSelect = 'id,nombre,numero,activa,created_at'

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

function normalizePistaPayload(data) {
  if (!data.nombre?.trim()) {
    throw new Error('Indica el nombre de la pista.')
  }

  const numero = Number(data.numero)
  if (!Number.isFinite(numero) || numero <= 0) {
    throw new Error('Indica un numero de pista valido.')
  }

  return {
    nombre: data.nombre.trim(),
    numero,
    activa: Boolean(data.activa),
  }
}

export async function getPistas() {
  ensureSupabase()
  const result = await supabase.from('pistas').select(pistaSelect).order('numero', { ascending: true })

  if (result.error) throw result.error
  return result.data
}

export async function createPista(data) {
  ensureSupabase()
  throwIfError(await supabase.from('pistas').insert(normalizePistaPayload(data)))
}

export async function updatePista(pistaId, data) {
  ensureSupabase()
  if (!pistaId) throw new Error('Selecciona una pista valida.')

  throwIfError(await supabase.from('pistas').update(normalizePistaPayload(data)).eq('id', pistaId))
}

export async function deletePista(pistaId) {
  ensureSupabase()
  if (!pistaId) throw new Error('Selecciona una pista valida.')

  const partidosResult = await supabase.from('partidos').select('id').eq('pista_id', pistaId).limit(1)
  if (partidosResult.error) throw partidosResult.error

  if (partidosResult.data.length) {
    throwIfError(await supabase.from('pistas').update({ activa: false }).eq('id', pistaId))
    return 'desactivada'
  }

  throwIfError(await supabase.from('pistas').delete().eq('id', pistaId))
  return 'eliminada'
}
