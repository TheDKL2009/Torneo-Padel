import { supabase } from './supabaseClient.js'

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
  return value ? value.slice(0, 5) : 'Sin hora'
}

function formatDate(value) {
  return value || 'Sin fecha'
}

function formatScore(partido) {
  const sets = [
    [partido.set1_a, partido.set1_b],
    [partido.set2_a, partido.set2_b],
    [partido.set3_a, partido.set3_b],
  ].filter(([a, b]) => a !== null && b !== null)

  return sets.length ? sets.map(([a, b]) => `${a}-${b}`).join(' / ') : null
}

function normalizeCategoria(categoria) {
  return {
    id: categoria.id,
    nombre: categoria.nombre,
    nivel: categoria.tipo,
    descripcion: `Categoria ${categoria.tipo}`,
    orden: categoria.orden,
  }
}

function normalizePareja(pareja, categoriaMap) {
  return {
    id: pareja.id,
    nombre: `${pareja.jugador_1} / ${pareja.jugador_2}`,
    jugadores: [pareja.jugador_1, pareja.jugador_2],
    categoriaId: pareja.categoria_id,
    categoria: categoriaMap.get(pareja.categoria_id),
  }
}

function normalizePartido(partido, categoriaMap, parejaMap) {
  const estado = estadoLabels[partido.estado] || partido.estado

  return {
    id: partido.id,
    categoriaId: partido.categoria_id,
    parejaAId: partido.pareja_a_id,
    parejaBId: partido.pareja_b_id,
    ganadorId: partido.ganador_id,
    fecha: formatDate(partido.fecha),
    hora: formatTime(partido.hora),
    pista: partido.pista || 'Sin pista',
    ronda: partido.ronda,
    estado,
    estadoRaw: partido.estado,
    marcador: formatScore(partido),
    observaciones: partido.observaciones,
    categoria: categoriaMap.get(partido.categoria_id),
    parejaA: parejaMap.get(partido.pareja_a_id),
    parejaB: parejaMap.get(partido.pareja_b_id),
    ganador: parejaMap.get(partido.ganador_id),
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
  }
}

export async function fetchPublicTournamentData() {
  ensureSupabase()

  const [categoriasResult, parejasResult, partidosResult, patrocinadoresResult] = await Promise.all([
    supabase
      .from('categorias')
      .select('id,nombre,tipo,orden')
      .eq('activo', true)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true }),
    supabase
      .from('parejas')
      .select('id,categoria_id,jugador_1,jugador_2')
      .eq('activo', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('partidos')
      .select('id,categoria_id,ronda,pareja_a_id,pareja_b_id,ganador_id,fecha,hora,pista,estado,set1_a,set1_b,set2_a,set2_b,set3_a,set3_b,observaciones')
      .order('fecha', { ascending: true, nullsFirst: false })
      .order('hora', { ascending: true, nullsFirst: false }),
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
  const patrocinadores = patrocinadoresResult.data.map(normalizePatrocinador)

  return {
    categorias,
    parejas,
    partidos,
    patrocinadores,
  }
}
