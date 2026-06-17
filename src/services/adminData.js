import { supabase } from './supabaseClient.js'
import {
  categoriaSelect,
  fetchCategoriasAdmin,
  saveCategoriaGroupConfig,
} from './categoriaService.js'
import {
  assignParejaToGrupo,
  assignParejasAutomaticamente,
  clasificacionSelect,
  fetchGruposByCategoria,
  generateEliminationFromClassified as generateEliminationFromClassifiedBase,
  generateGroupMatches,
  grupoParejaSelect,
  grupoSelect,
  matchSelect,
  obtenerClasificacion,
  recalcularClasificacion as recalcularClasificacionBase,
  removeParejaFromGrupo,
  saveGrupo,
} from './grupoService.js'
import { createPartido, updatePartido, calculateWinnerId } from './partidoService.js'
import { pistaSelect } from './pistaService.js'
import {
  createParticipante,
  mapParejaToParticipante,
  participanteSelect,
  updateParticipante,
} from './participanteService.js'

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

export function getPairName(pair) {
  return pair ? mapParejaToParticipante(pair).displayName : 'Sin participante'
}

export async function fetchAdminData(torneoId = null) {
  ensureSupabase()

  const [categoriasResult, parejasResult, partidosResult, patrocinadoresResult, pistasResult] = await Promise.all([
    fetchCategoriasAdmin(torneoId).then((data) => ({ data, error: null })).catch((error) => ({ data: null, error })),
    supabase
      .from('parejas')
      .select(participanteSelect)
      .order('created_at', { ascending: true }),
    supabase
      .from('partidos')
      .select(matchSelect)
      .order('fecha', { ascending: true, nullsFirst: false })
      .order('hora', { ascending: true, nullsFirst: false }),
    supabase
      .from('patrocinadores')
      .select('id,nombre,logo_url,web_url,orden,activo,torneo_id,created_at')
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true }),
    supabase
      .from('pistas')
      .select(pistaSelect)
      .order('numero', { ascending: true }),
  ])

  const categoriaIds = categoriasResult.data?.map((categoria) => categoria.id) || []
  const filteredParejasBase = torneoId
    ? parejasResult.data?.filter((pareja) => categoriaIds.includes(pareja.categoria_id)) || []
    : parejasResult.data
  const filteredParejas = filteredParejasBase?.map(mapParejaToParticipante) || []
  const filteredPartidos = torneoId
    ? partidosResult.data?.filter((partido) => categoriaIds.includes(partido.categoria_id)) || []
    : partidosResult.data
  const filteredPatrocinadores = torneoId
    ? patrocinadoresResult.data?.filter((patrocinador) => patrocinador.torneo_id === torneoId) || []
    : patrocinadoresResult.data

  const [gruposResult, grupoParejasResult, clasificacionesResult] = await Promise.all([
    supabase.from('grupos').select(grupoSelect).order('categoria_id').order('orden', { ascending: true }),
    supabase.from('grupo_parejas').select(grupoParejaSelect).order('orden', { ascending: true }),
    supabase.from('clasificaciones_grupo').select(clasificacionSelect).order('posicion', { ascending: true }),
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

  const filteredGrupos = torneoId
    ? gruposResult.data.filter((grupo) => categoriaIds.includes(grupo.categoria_id))
    : gruposResult.data
  const grupoIds = filteredGrupos.map((grupo) => grupo.id)
  const filteredGrupoParejas = torneoId
    ? grupoParejasResult.data.filter((asignacion) => grupoIds.includes(asignacion.grupo_id))
    : grupoParejasResult.data
  const filteredClasificaciones = torneoId
    ? clasificacionesResult.data.filter((fila) => grupoIds.includes(fila.grupo_id))
    : clasificacionesResult.data

  return {
    categorias: categoriasResult.data,
    parejas: filteredParejas,
    partidos: filteredPartidos,
    patrocinadores: filteredPatrocinadores,
    pistas: pistasResult.data,
    grupos: filteredGrupos,
    grupoParejas: filteredGrupoParejas,
    clasificacionesGrupo: filteredClasificaciones,
  }
}

export async function saveCategoria(form) {
  ensureSupabase()

  const payload = {
    torneo_id: form.torneo_id,
    nombre: form.nombre.trim(),
    tipo: form.tipo.trim(),
    orden: Number(form.orden || 0),
    activo: Boolean(form.activo),
  }

  if (!payload.torneo_id) {
    throw new Error('Selecciona un torneo antes de crear la categoria.')
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

export async function savePareja(form, tipoDeporte = 'padel') {
  if (form.id) {
    await updateParticipante(form.id, form, tipoDeporte)
    return
  }

  await createParticipante(form, tipoDeporte)
}

export async function savePartido(form) {
  if (form.id) {
    await updatePartido(form.id, form)
    return
  }

  await createPartido(form)
}

export async function savePatrocinador(form) {
  ensureSupabase()

  const payload = {
    nombre: form.nombre.trim(),
    logo_url: form.logo_url.trim() || null,
    web_url: form.web_url.trim() || null,
    orden: Number(form.orden || 0),
    activo: Boolean(form.activo),
    torneo_id: form.torneo_id,
  }

  if (!payload.torneo_id) {
    throw new Error('Selecciona un torneo antes de crear el patrocinador.')
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

export {
  assignParejaToGrupo,
  assignParejasAutomaticamente,
  categoriaSelect,
  fetchGruposByCategoria,
  generateGroupMatches,
  grupoParejaSelect,
  grupoSelect,
  obtenerClasificacion,
  removeParejaFromGrupo,
  saveCategoriaGroupConfig,
  saveGrupo,
  calculateWinnerId,
}

export function recalcularClasificacion(categoriaId) {
  return recalcularClasificacionBase(categoriaId)
}

export function generateEliminationFromClassified(categoriaId) {
  return generateEliminationFromClassifiedBase(categoriaId)
}
