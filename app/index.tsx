import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { supabase } from '../lib/supabase'
import { router } from 'expo-router'

export default function Index() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/(tabs)/home')
      else router.replace('/(auth)/login')
    })
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#2ecc71" />
    </View>
  )
}
