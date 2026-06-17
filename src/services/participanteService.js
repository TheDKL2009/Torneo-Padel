import { supabase } from './supabaseClient.js'

export const participanteSelect = 'id,categoria_id,tipo_participante,nombre,jugador_1,jugador_2,nombre_equipo,contacto,telefono,email,activo,created_at'

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

function getTipoParticipante(tipoDeporte) {
  return tipoDeporte === 'futbol_sala' ? 'equipo' : 'pareja'
}

function normalizeText(value) {
  return value?.trim() || ''
}

function buildPairName(data) {
  return `${normalizeText(data.jugador_1)} / ${normalizeText(data.jugador_2)}`
}

export function mapParejaToParticipante(row) {
  if (!row) return null

  const tipoParticipante = row.tipo_participante || (row.nombre_equipo ? 'equipo' : 'pareja')
  const nombre = row.nombre || row.nombre_equipo || buildPairName(row)

  return {
    ...row,
    tipo_participante: tipoParticipante,
    nombre,
    nombre_equipo: row.nombre_equipo || (tipoParticipante === 'equipo' ? nombre : null),
    displayName: nombre,
  }
}

function buildParticipantePayload(data, tipoDeporte) {
  const tipoParticipante = getTipoParticipante(tipoDeporte)
  const categoriaId = data.categoria_id

  if (!categoriaId) {
    throw new Error('Selecciona una categoria.')
  }

  if (tipoParticipante === 'equipo') {
    const nombreEquipo = normalizeText(data.nombre_equipo)
    if (!nombreEquipo) {
      throw new Error('Indica el nombre del equipo.')
    }

    return {
      categoria_id: categoriaId,
      tipo_participante: 'equipo',
      nombre: nombreEquipo,
      nombre_equipo: nombreEquipo,
      contacto: normalizeText(data.contacto) || null,
      jugador_1: nombreEquipo,
      jugador_2: 'Equipo',
      telefono: normalizeText(data.telefono) || null,
      email: normalizeText(data.email) || null,
      activo: Boolean(data.activo),
    }
  }

  const jugador1 = normalizeText(data.jugador_1)
  const jugador2 = normalizeText(data.jugador_2)
  if (!jugador1 || !jugador2) {
    throw new Error('Indica los dos jugadores de la pareja.')
  }

  return {
    categoria_id: categoriaId,
    tipo_participante: 'pareja',
    nombre: `${jugador1} / ${jugador2}`,
    nombre_equipo: null,
    contacto: normalizeText(data.contacto) || null,
    jugador_1: jugador1,
    jugador_2: jugador2,
    telefono: normalizeText(data.telefono) || null,
    email: normalizeText(data.email) || null,
    activo: Boolean(data.activo),
  }
}

export async function getParticipantesByCategoria(categoriaId) {
  ensureSupabase()
  if (!categoriaId) {
    throw new Error('Selecciona una categoria.')
  }

  const result = await supabase
    .from('parejas')
    .select(participanteSelect)
    .eq('categoria_id', categoriaId)
    .order('created_at', { ascending: true })

  if (result.error) throw result.error
  return result.data.map(mapParejaToParticipante)
}

export async function createParticipante(data, tipoDeporte = 'padel') {
  ensureSupabase()
  const payload = buildParticipantePayload(data, tipoDeporte)
  throwIfError(await supabase.from('parejas').insert(payload))
}

export async function updateParticipante(id, data, tipoDeporte = 'padel') {
  ensureSupabase()
  if (!id) {
    throw new Error('Selecciona un participante valido.')
  }

  const payload = buildParticipantePayload(data, tipoDeporte)
  throwIfError(await supabase.from('parejas').update(payload).eq('id', id))
}

export async function deleteOrDeactivateParticipante(id) {
  ensureSupabase()
  if (!id) {
    throw new Error('Selecciona un participante valido.')
  }

  throwIfError(await supabase.from('parejas').update({ activo: false }).eq('id', id))
}
