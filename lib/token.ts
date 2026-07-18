import { supabase } from './supabase'
import { router } from 'expo-router'

// Récupérer le token actuel
export async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

// Vérifier si le token est encore valide
export async function isTokenValid(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false

  // Vérifier l'expiration
  const expiresAt = session.expires_at || 0
  const now = Math.floor(Date.now() / 1000)
  return expiresAt > now
}

// Écouter les changements de session (token expiré, déconnexion)
export function listenAuthChanges() {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      if (!session) {
        router.replace('/(auth)/login')
      }
    }
    if (event === 'SIGNED_IN') {
      router.replace('/(tabs)/home')
    }
  })
}