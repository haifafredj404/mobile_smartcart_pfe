import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack } from 'expo-router'
import { supabase } from '../lib/supabase'
import { listenAuthChanges } from '../lib/token'

export default function RootLayout() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    listenAuthChanges()
    supabase.auth.onAuthStateChange(() => {
      setReady(true)
    })
    setReady(true)
  }, [])

  if (!ready) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#2ecc71" />
    </View>
  )

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}