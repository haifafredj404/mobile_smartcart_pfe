import { supabase, getUserRole } from './supabase'
import { router } from 'expo-router'

// Protéger une page — redirige si non connecté
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    router.replace('/(auth)/login')
    return false
  }
  return true
}

// Protéger une page admin — redirige si pas admin
export async function requireAdmin() {
  const role = await getUserRole()
  if (role !== 'admin' && role !== 'employe') {
    router.replace('/(tabs)/home')
    return false
  }
  return true
}

// Vérifier si session active existe
export async function checkActiveSession(userId: string) {
  const { data } = await supabase
    .from('sessions')
    .select('id')
    .eq('client_id', userId)
    .eq('statut', 'active')
    .single()
  return data
}