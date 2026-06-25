import { supabase } from './supabaseClient.js'

const estadoLabels = {
  pendiente: 'Pendiente',
  programado: 'Programado',
  en_juego: 'En juego',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}

const modalidades = new Set(['pareja', 'equipo', 'individual'])

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el entorno.')
  }
}

function formatTime(value) {
  return value ? value.slice(0, 5) : 'Sin hora'
}

function formatDate(value) {
  return value || 'Sin fecha'
}

function formatScore(partido) {
  if (partido.goles_a !== null && partido.goles_b !== null) {
    const base = `${partido.goles_a}-${partido.goles_b}`
    if (partido.penaltis_a !== null && partido.penaltis_b !== null) {
      return `${base} (pen. ${partido.penaltis_a}-${partido.penaltis_b})`
    }

    return base
  }

  const sets = [
    [partido.set1_a, partido.set1_b],
    [partido.set2_a, partido.set2_b],
    [partido.set3_a, partido.set3_b],
  ].filter(([a, b]) => a !== null && b !== null)

  return sets.length ? sets.map(([a, b]) => `${a}-${b}`).join(' / ') : null
}

function normalizeModalidad(value) {
  return modalidades.has(value) ? value : 'pareja'
}

function getParticipantName(participant) {
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

function normalizeCategoria(categoria) {
  return {
    id: categoria.id,
    nombre: categoria.nombre,
    nivel: categoria.tipo,
    modalidad: normalizeModalidad(categoria.modalidad),
    tieneFaseGrupos: Boolean(categoria.tiene_fase_grupos),
    numeroGrupos: categoria.numero_grupos,
    parejasPorGrupo: categoria.parejas_por_grupo,
    clasificanPorGrupo: categoria.clasifican_por_grupo,
    tipoCuadroFinal: categoria.tipo_cuadro_final,
    criteriosClasificacion: categoria.criterios_clasificacion,
    orden: categoria.orden,
  }
}

function normalizePareja(pareja, categoriaMap) {
  const tipo = normalizeModalidad(pareja.tipo_participante)

  return {
    id: pareja.id,
    nombre: getParticipantName(pareja),
    tipo,
    jugadores: Array.isArray(pareja.jugadores) && pareja.jugadores.length
      ? pareja.jugadores
      : [pareja.jugador_1, pareja.jugador_2].filter(Boolean),
    categoriaId: pareja.categoria_id,
    categoria: categoriaMap.get(pareja.categoria_id),
  }
}

function normalizePartido(partido, categoriaMap, parejaMap) {
  const estado = estadoLabels[partido.estado] || partido.estado

  const validSets = [
    [partido.set1_a, partido.set1_b],
    [partido.set2_a, partido.set2_b],
    [partido.set3_a, partido.set3_b],
  ].filter(([a, b]) => a !== null && b !== null)

  return {
    id: partido.id,
    categoriaId: partido.categoria_id,
    fase: partido.fase || 'eliminatoria',
    grupoId: partido.grupo_id,
    cuadroTipo: partido.cuadro_tipo,
    parejaAId: partido.pareja_a_id,
    parejaBId: partido.pareja_b_id,
    ganadorId: partido.ganador_id,
    orden: partido.orden,
    ordenRonda: partido.orden_ronda,
    siguientePartidoId: partido.siguiente_partido_id,
    siguientePosicion: partido.siguiente_posicion,
    fecha: formatDate(partido.fecha),
    hora: formatTime(partido.hora),
    pista: partido.pista || 'Sin pista',
    ronda: partido.ronda,
    estado,
    estadoRaw: partido.estado,
    marcador: formatScore(partido),
    scores: {
      a: validSets.map(([a]) => a),
      b: validSets.map(([, b]) => b),
    },
    goles: {
      a: partido.goles_a,
      b: partido.goles_b,
    },
    penaltis: {
      a: partido.penaltis_a,
      b: partido.penaltis_b,
    },
    observaciones: partido.observaciones,
    categoria: categoriaMap.get(partido.categoria_id),
    parejaA: parejaMap.get(partido.pareja_a_id),
    parejaB: parejaMap.get(partido.pareja_b_id),
    ganador: parejaMap.get(partido.ganador_id),
  }
}

function normalizeGrupo(grupo) {
  return {
    id: grupo.id,
    categoriaId: grupo.categoria_id,
    nombre: grupo.nombre,
    orden: grupo.orden,
  }
}

function normalizeGrupoPareja(asignacion) {
  return {
    id: asignacion.id,
    grupoId: asignacion.grupo_id,
    parejaId: asignacion.pareja_id,
    orden: asignacion.orden,
  }
}

function normalizePatrocinador(patrocinador) {
  return {
    id: patrocinador.id,
    nombre: patrocinador.nombre,
    logoUrl: patrocinador.logo_url,
    web: patrocinador.web_url,
    orden: patrocinador.orden,
  }
}

export async function fetchPublicTournamentData() {
  ensureSupabase()

  const [categoriasResult, parejasResult, partidosResult, gruposResult, grupoParejasResult, patrocinadoresResult] = await Promise.all([
    supabase
      .from('categorias')
      .select('id,nombre,tipo,modalidad,orden,tiene_fase_grupos,numero_grupos,parejas_por_grupo,clasifican_por_grupo,tipo_cuadro_final,criterios_clasificacion')
      .eq('activo', true)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true }),
    supabase
      .from('parejas')
      .select('id,categoria_id,tipo_participante,nombre,jugador_1,jugador_2,nombre_equipo,jugadores')
      .eq('activo', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('partidos')
      .select('id,categoria_id,ronda,fase,grupo_id,cuadro_tipo,orden_ronda,siguiente_partido_id,siguiente_posicion,pareja_a_id,pareja_b_id,ganador_id,fecha,hora,pista,estado,set1_a,set1_b,set2_a,set2_b,set3_a,set3_b,goles_a,goles_b,penaltis_a,penaltis_b,observaciones,orden')
      .order('orden', { ascending: true, nullsFirst: false })
      .order('fecha', { ascending: true, nullsFirst: false })
      .order('hora', { ascending: true, nullsFirst: false }),
    supabase
      .from('grupos')
      .select('id,categoria_id,nombre,orden')
      .order('categoria_id', { ascending: true })
      .order('orden', { ascending: true }),
    supabase
      .from('grupo_parejas')
      .select('id,grupo_id,pareja_id,orden')
      .order('grupo_id', { ascending: true })
      .order('orden', { ascending: true }),
    supabase
      .from('patrocinadores')
      .select('id,nombre,logo_url,web_url,orden')
      .eq('activo', true)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true }),
  ])

  const firstError = [
    categoriasResult.error,
    parejasResult.error,
    partidosResult.error,
    gruposResult.error,
    grupoParejasResult.error,
    patrocinadoresResult.error,
  ].find(Boolean)

  if (firstError) {
    throw firstError
  }

  const categorias = categoriasResult.data.map(normalizeCategoria)
  const categoriaMap = new Map(categorias.map((categoria) => [categoria.id, categoria]))
  const parejas = parejasResult.data.map((pareja) => normalizePareja(pareja, categoriaMap))
  const parejaMap = new Map(parejas.map((pareja) => [pareja.id, pareja]))
  const partidos = partidosResult.data.map((partido) => normalizePartido(partido, categoriaMap, parejaMap))
  const grupos = gruposResult.data.map(normalizeGrupo)
  const grupoParejas = grupoParejasResult.data.map(normalizeGrupoPareja)
  const patrocinadores = patrocinadoresResult.data.map(normalizePatrocinador)

  return {
    categorias,
    parejas,
    partidos,
    grupos,
    grupoParejas,
    patrocinadores,
  }
}
