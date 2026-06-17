import { siteConfig } from '../config/site.js'

export const torneo = siteConfig

export const categorias = [
  {
    id: 'cat-masculina-a',
    nombre: 'Masculina A',
    nivel: 'Avanzado',
    descripcion: 'Cuadro principal para parejas con experiencia competitiva.',
  },
  {
    id: 'cat-masculina-b',
    nombre: 'Masculina B',
    nivel: 'Intermedio',
    descripcion: 'Categoria equilibrada para parejas habituales de club.',
  },
  {
    id: 'cat-femenina',
    nombre: 'Femenina',
    nivel: 'Abierta',
    descripcion: 'Competicion femenina con fase de grupos y cuadro final.',
  },
  {
    id: 'cat-mixta',
    nombre: 'Mixta',
    nivel: 'Abierta',
    descripcion: 'Parejas mixtas en formato de eliminatorias directas.',
  },
]

export const parejas = [
  { id: 'pareja-1', nombre: 'Vibora Norte', jugadores: ['Ana Ruiz', 'Lucia Gomez'], categoriaId: 'cat-femenina' },
  { id: 'pareja-2', nombre: 'Las Globos', jugadores: ['Carla Ortiz', 'Marta Blanco'], categoriaId: 'cat-femenina' },
  { id: 'pareja-3', nombre: 'Punto de Oro', jugadores: ['Miguel Soto', 'Hugo Diaz'], categoriaId: 'cat-masculina-a' },
  { id: 'pareja-4', nombre: 'Smash Central', jugadores: ['Javier Cano', 'Pablo Marin'], categoriaId: 'cat-masculina-a' },
  { id: 'pareja-5', nombre: 'Drive & Bandeja', jugadores: ['Sergio Vidal', 'Mario Leon'], categoriaId: 'cat-masculina-b' },
  { id: 'pareja-6', nombre: 'Cristal Sur', jugadores: ['Alvaro Nieto', 'Ivan Molina'], categoriaId: 'cat-masculina-b' },
  { id: 'pareja-7', nombre: 'Fuerza Mixta', jugadores: ['Laura Perez', 'David Martin'], categoriaId: 'cat-mixta' },
  { id: 'pareja-8', nombre: 'Red Vibra', jugadores: ['Sofia Ramos', 'Diego Torres'], categoriaId: 'cat-mixta' },
]

export const partidos = [
  {
    id: 'partido-1',
    categoriaId: 'cat-masculina-a',
    parejaAId: 'pareja-3',
    parejaBId: 'pareja-4',
    fecha: '2026-06-10',
    hora: '18:00',
    pista: 'Pista 1',
    ronda: 'Semifinal',
    estado: 'Finalizado',
    marcador: '6-4 / 7-5',
  },
  {
    id: 'partido-2',
    categoriaId: 'cat-femenina',
    parejaAId: 'pareja-1',
    parejaBId: 'pareja-2',
    fecha: '2026-06-10',
    hora: '19:30',
    pista: 'Pista 2',
    ronda: 'Grupo A',
    estado: 'Finalizado',
    marcador: '4-6 / 6-3 / 10-8',
  },
  {
    id: 'partido-3',
    categoriaId: 'cat-masculina-b',
    parejaAId: 'pareja-5',
    parejaBId: 'pareja-6',
    fecha: '2026-06-11',
    hora: '18:00',
    pista: 'Pista 3',
    ronda: 'Grupo B',
    estado: 'Programado',
    marcador: null,
  },
  {
    id: 'partido-4',
    categoriaId: 'cat-mixta',
    parejaAId: 'pareja-7',
    parejaBId: 'pareja-8',
    fecha: '2026-06-11',
    hora: '20:00',
    pista: 'Pista 1',
    ronda: 'Cuartos',
    estado: 'Programado',
    marcador: null,
  },
  {
    id: 'partido-5',
    categoriaId: 'cat-masculina-a',
    parejaAId: 'pareja-3',
    parejaBId: 'pareja-1',
    fecha: '2026-06-12',
    hora: '17:30',
    pista: 'Pista Central',
    ronda: 'Final',
    estado: 'En juego',
    marcador: '3-2',
  },
]

export const patrocinadores = [
  {
    id: 'patro-1',
    nombre: 'Club Padel Central',
    categoria: 'Patrocinador principal',
    descripcion: 'Sede oficial y soporte logistico del torneo.',
    web: 'https://example.com',
  },
  {
    id: 'patro-2',
    nombre: 'Sport Energy',
    categoria: 'Bebida oficial',
    descripcion: 'Hidratacion para jugadores durante toda la semana.',
    web: 'https://example.com',
  },
  {
    id: 'patro-3',
    nombre: 'Power Racquets',
    categoria: 'Material deportivo',
    descripcion: 'Premios y material tecnico para finalistas.',
    web: 'https://example.com',
  },
]

export function getCategoria(id) {
  return categorias.find((categoria) => categoria.id === id)
}

export function getPareja(id) {
  return parejas.find((pareja) => pareja.id === id)
}

export function getPartidoConDetalle(partido) {
  return {
    ...partido,
    categoria: getCategoria(partido.categoriaId),
    parejaA: getPareja(partido.parejaAId),
    parejaB: getPareja(partido.parejaBId),
  }
}
