import { supabase } from './supabaseClient.js'

export async function sendInscriptionEmail(payload) {
  if (!supabase) {
    throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el entorno.')
  }

  const { data, error } = await supabase.functions.invoke('send-inscription-email', {
    body: payload,
  })

  if (error) {
    throw error
  }

  return data
}
