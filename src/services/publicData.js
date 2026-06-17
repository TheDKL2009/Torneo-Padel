import { supabase } from './supabaseClient.js'
import { mapParejaToParticipante, participanteSelect } from './participanteService.js'
import { formatResultadoPartido } from '../utils/sportRules.js'

const estadoLabels = {
  pendiente: 'Pendiente',
  programado: 'Programado',
  en_juego: 'En juego',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el entorno.')
  }
}

function formatTime(value) {
  return value ? value.slice(0, 5) : null
}

function formatDate(value) {
  return value || null
}

function getRelatedSingle(value) {
  return Array.isArray(value) ? value[0] : value
}

function normalizeCategoria(categoria) {
  const torneo = getRelatedSingle(categoria.torneos)

  return {
    id: categoria.id,
    nombre: categoria.nombre,
    nivel: categoria.tipo,
    descripcion: `Categoria ${categoria.tipo}`,
    orden: categoria.orden,
    torneoId: categoria.torneo_id,
    tieneFaseGrupos: categoria.tiene_fase_grupos,
    numeroGrupos: categoria.numero_grupos,
    parejasPorGrupo: categoria.parejas_por_grupo,
    clasificanPorGrupo: categoria.clasifican_por_grupo,
    tipoCuadroFinal: categoria.tipo_cuadro_final,
    tipoDeporte: torneo?.tipo_deporte || null,
  }
}

function normalizePareja(pareja, categoriaMap) {
  const participante = mapParejaToParticipante(pareja)

  return {
    id: pareja.id,
    nombre: participante.displayName,
    jugadores: [pareja.jugador_1, pareja.jugador_2],
    categoriaId: pareja.categoria_id,
    categoria: categoriaMap.get(pareja.categoria_id),
    tipoParticipante: participante.tipo_participante,
    nombreEquipo: participante.nombre_equipo,
    contacto: participante.contacto,
  }
}

function normalizePartido(partido, categoriaMap, parejaMap, pistaMap) {
  const estado = estadoLabels[partido.estado] || partido.estado
  const pista = pistaMap.get(partido.pista_id)
  const parejaA = parejaMap.get(partido.pareja_a_id)
  const parejaB = parejaMap.get(partido.pareja_b_id)
  const categoria = categoriaMap.get(partido.categoria_id)
  const tipoDeporte = categoria?.tipoDeporte || (parejaA?.tipoParticipante === 'equipo' || parejaB?.tipoParticipante === 'equipo'
    ? 'futbol_sala'
    : 'padel')

  return {
    id: partido.id,
    categoriaId: partido.categoria_id,
    parejaAId: partido.pareja_a_id,
    parejaBId: partido.pareja_b_id,
    ganadorId: partido.ganador_id,
    fecha: formatDate(partido.fecha),
    hora: formatTime(partido.hora),
    ronda: partido.ronda,
    estado,
    estadoRaw: partido.estado,
    fase: partido.fase || 'eliminatoria',
    cuadroTipo: partido.cuadro_tipo || 'principal',
    grupoId: partido.grupo_id,
    pistaId: partido.pista_id,
    orden: partido.orden,
    ordenRonda: partido.orden_ronda ?? partido.orden,
    siguientePartidoId: partido.siguiente_partido_id,
    siguientePosicion: partido.siguiente_posicion,
    set1_a: partido.set1_a,
    set1_b: partido.set1_b,
    set2_a: partido.set2_a,
    set2_b: partido.set2_b,
    set3_a: partido.set3_a,
    set3_b: partido.set3_b,
    goles_a: partido.goles_a,
    goles_b: partido.goles_b,
    penaltis_a: partido.penaltis_a,
    penaltis_b: partido.penaltis_b,
    ganador_manual_id: partido.ganador_manual_id,
    marcador: formatResultadoPartido(partido, tipoDeporte),
    tipoDeporte,
    observaciones: partido.observaciones,
    categoria,
    parejaA,
    parejaB,
    ganador: parejaMap.get(partido.ganador_id),
    pistaData: pista,
    pista: pista?.nombre || partido.pista || null,
  }
}

function normalizePatrocinador(patrocinador) {
  return {
    id: patrocinador.id,
    nombre: patrocinador.nombre,
    logoUrl: patrocinador.logo_url,
    web: patrocinador.web_url,
    categoria: 'Patrocinador oficial',
    descripcion: 'Colaborador del torneo',
    orden: patrocinador.orden,
    torneoId: patrocinador.torneo_id,
  }
}

export async function fetchPublicTournamentData() {
  return fetchPublicTournamentDataByTorneo(null)
}

export async function fetchPublicTournamentDataByTorneo(torneoId = null) {
  ensureSupabase()

  let categoriasQuery = supabase
      .from('categorias')
      .select('id,nombre,tipo,orden,torneo_id,tiene_fase_grupos,numero_grupos,parejas_por_grupo,clasifican_por_grupo,tipo_cuadro_final,torneos(tipo_deporte)')
      .eq('activo', true)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true })

  if (torneoId) {
    categoriasQuery = categoriasQuery.eq('torneo_id', torneoId)
  }

  let patrocinadoresQuery = supabase
      .from('patrocinadores')
      .select('id,nombre,logo_url,web_url,orden,torneo_id')
      .eq('activo', true)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true })

  if (torneoId) {
    patrocinadoresQuery = patrocinadoresQuery.eq('torneo_id', torneoId)
  }

  const [categoriasResult, parejasResult, partidosResult, patrocinadoresResult, pistasResult] = await Promise.all([
    categoriasQuery,
    supabase
      .from('parejas')
      .select(participanteSelect)
      .eq('activo', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('partidos')
      .select('id,categoria_id,ronda,fase,grupo_id,orden,pista_id,pareja_a_id,pareja_b_id,ganador_id,fecha,hora,pista,estado,set1_a,set1_b,set2_a,set2_b,set3_a,set3_b,goles_a,goles_b,penaltis_a,penaltis_b,ganador_manual_id,observaciones')
      .order('fecha', { ascending: true, nullsFirst: false })
      .order('hora', { ascending: true, nullsFirst: false }),
    patrocinadoresQuery,
    supabase
      .from('pistas')
      .select('id,torneo_id,nombre,numero,activa,created_at')
      .eq('activa', true)
      .order('numero', { ascending: true }),
  ])

  const [gruposResult, grupoParejasResult, clasificacionesResult] = await Promise.all([
    supabase
      .from('grupos')
      .select('id,categoria_id,nombre,orden')
      .order('categoria_id')
      .order('orden', { ascending: true }),
    supabase
      .from('grupo_parejas')
      .select('id,grupo_id,pareja_id,orden')
      .order('orden', { ascending: true }),
    supabase
      .from('clasificaciones_grupo')
      .select('id,grupo_id,pareja_id,partidos_jugados,partidos_ganados,partidos_empatados,partidos_perdidos,sets_favor,sets_contra,diferencia_sets,juegos_favor,juegos_contra,diferencia_juegos,goles_favor,goles_contra,diferencia_goles,puntos,posicion')
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

  const categorias = categoriasResult.data.map(normalizeCategoria)
  const categoriaMap = new Map(categorias.map((categoria) => [categoria.id, categoria]))
  const categoriaIds = new Set(categorias.map((categoria) => categoria.id))
  const parejas = parejasResult.data
    .filter((pareja) => categoriaIds.has(pareja.categoria_id))
    .map((pareja) => normalizePareja(pareja, categoriaMap))
  const parejaMap = new Map(parejas.map((pareja) => [pareja.id, pareja]))
  const pistaMap = new Map(pistasResult.data.map((pista) => [pista.id, pista]))
  const partidos = partidosResult.data
    .filter((partido) => categoriaIds.has(partido.categoria_id))
    .map((partido) => normalizePartido(partido, categoriaMap, parejaMap, pistaMap))
  const patrocinadores = patrocinadoresResult.data.map(normalizePatrocinador)
  const grupos = gruposResult.data.filter((grupo) => categoriaIds.has(grupo.categoria_id))
  const grupoIds = new Set(grupos.map((grupo) => grupo.id))

  return {
    categorias,
    parejas,
    partidos,
    patrocinadores,
    pistas: pistasResult.data,
    grupos,
    grupoParejas: grupoParejasResult.data.filter((asignacion) => grupoIds.has(asignacion.grupo_id)),
    clasificacionesGrupo: clasificacionesResult.data.filter((fila) => grupoIds.has(fila.grupo_id)),
  }
}
