import { supabase } from './supabaseClient.js'

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el entorno.')
  }
}

function getAdminEmails() {
  return (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export async function getCurrentUser() {
  ensureSupabase()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return data.user
}

export async function getCurrentSession() {
  ensureSupabase()
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session
}

export async function login(email, password) {
  ensureSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw error
  }

  return data
}

export async function logout() {
  ensureSupabase()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export function isAdmin(user) {
  if (!user) return false

  const roles = [
    user.role,
    user.app_metadata?.role,
    user.user_metadata?.role,
    ...(Array.isArray(user.app_metadata?.roles) ? user.app_metadata.roles : []),
    ...(Array.isArray(user.user_metadata?.roles) ? user.user_metadata.roles : []),
  ]
    .filter(Boolean)
    .map((role) => String(role).toLowerCase())

  const metadataAdmin =
    user.app_metadata?.is_admin === true ||
    user.user_metadata?.is_admin === true ||
    user.app_metadata?.admin === true ||
    user.user_metadata?.admin === true
  const emailAdmin = getAdminEmails().includes(user.email?.toLowerCase())

  return roles.includes('authenticated') || roles.includes('admin') || metadataAdmin || emailAdmin
}
