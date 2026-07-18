import { supabase } from './supabase'

export async function requestNotificationPermission() {
  return true
}

export async function sendLocalNotification(title: string, body: string) {
  console.log(`Notification: ${title} - ${body}`)
}

export function subscribeToPanier(sessionId: string, onUpdate: () => void) {
  return supabase
    .channel('panier-notif-' + sessionId)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'panier',
      filter: `session_id=eq.${sessionId}`
    }, () => { onUpdate() })
    .subscribe()
}