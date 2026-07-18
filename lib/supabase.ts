import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SUPABASE_URL = 'https://dspjfohuyhvcseukdwcy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcGpmb2h1eWh2Y3NldWtkd2N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Nzk5NjUsImV4cCI6MjA4ODQ1NTk2NX0._5ZITyqAxxST7LSkB4WpULrfzMkmLJhZD0MWLFkzFkI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,      // renouvelle le token automatiquement
    persistSession: false,         // garde la session active
    detectSessionInUrl: false,
  },
})

// Fonction pour vérifier si l'utilisateur est connecté
export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// Fonction pour vérifier le rôle
export async function getUserRole(): Promise<string | null> {
  const user = await getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return data?.role || null
}