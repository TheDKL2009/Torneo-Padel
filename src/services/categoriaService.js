import { supabase } from './supabaseClient.js'

export const criteriosPorDefecto = ['puntos', 'diferencia_sets', 'diferencia_juegos', 'juegos_favor']

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

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export async function saveCategoriaGroupConfig(categoriaId, form) {
  ensureSupabase()

  if (!categoriaId) {
    throw new Error('Selecciona una categoria antes de guardar la configuracion.')
  }

  const payload = {
    tiene_fase_grupos: Boolean(form.tiene_fase_grupos),
    numero_grupos: toNumber(form.numero_grupos),
    parejas_por_grupo: toNumber(form.parejas_por_grupo),
    clasifican_por_grupo: toNumber(form.clasifican_por_grupo, 1),
    tipo_cuadro_final: form.tipo_cuadro_final || 'final',
    criterios_clasificacion: form.criterios_clasificacion?.length ? form.criterios_clasificacion : criteriosPorDefecto,
  }

  throwIfError(await supabase.from('categorias').update(payload).eq('id', categoriaId))
}
