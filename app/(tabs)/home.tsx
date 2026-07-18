import { useEffect, useState } from 'react'
import { requireAuth } from '../../lib/auth-guard'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
  RefreshControl, StatusBar, Image
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { Chariot, Profile } from '../../types'
import { router } from 'expo-router'
import { useTheme } from '../../lib/theme'
import { User } from 'lucide-react-native'

export default function Home() {
  const [chariots, setChariots] = useState<Chariot[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { colors, fontSize, isDark } = useTheme()

  // useEffect(() => { fetchData() }, [])
  useEffect(() => {
  const check = async () => {
    const ok = await requireAuth()
    if (!ok) return
    fetchData()
  }
  check()
  }, [])

  const fetchData = async () => {
    await Promise.all([fetchChariots(), fetchProfile()])
    setLoading(false)
  }

  const fetchChariots = async () => {
    const { data } = await supabase.from('chariots').select('*').order('nom')
    setChariots(data || [])
  }

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) setProfile(data)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchChariots()
    setRefreshing(false)
  }

  const getStatutColor = (statut: string) => {
    if (statut === 'libre') return '#2ecc71'
    if (statut === 'occupé') return '#e74c3c'
    return '#f39c12'
  }

  const getStatutBg = (statut: string) => {
    if (statut === 'libre') return isDark ? '#1a3a2a' : '#e8f8f0'
    if (statut === 'occupé') return isDark ? '#3a1a1a' : '#fdecea'
    return isDark ? '#3a2a1a' : '#fef9e7'
  }

  const getBatterieColor = (b: number) => b > 50 ? '#2ecc71' : b > 20 ? '#f39c12' : '#e74c3c'

  const libres = chariots.filter(c => c.statut === 'libre').length
  const occupes = chariots.filter(c => c.statut === 'occupé').length

  if (loading) return (
    <View style={[styles.center, { backgroundColor: colors.bg }]}>
      <ActivityIndicator size="large" color="#2ecc71" />
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.subtext, fontSize: fontSize.small }]}>Bonjour 👋</Text>
          <Text style={[styles.name, { color: colors.text, fontSize: fontSize.title }]}>{profile?.prenom} {profile?.nom}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={[styles.profileBtn, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(tabs)/parametres')}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.profileBtn, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(tabs)/profil')}
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={{ width: 44, height: 44, borderRadius: 22 }} />
            ) : (
              <User color="#2ecc71" size={22} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: isDark ? '#1a3a2a' : '#e8f8f0' }]}>
          <Text style={[styles.statNumber, { color: colors.text, fontSize: fontSize.large }]}>{libres}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext, fontSize: fontSize.small }]}>🟢 Libres</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? '#3a1a1a' : '#fdecea' }]}>
          <Text style={[styles.statNumber, { color: colors.text, fontSize: fontSize.large }]}>{occupes}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext, fontSize: fontSize.small }]}>🔴 Occupés</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? '#1a1a3a' : '#f0f0f0' }]}>
          <Text style={[styles.statNumber, { color: colors.text, fontSize: fontSize.large }]}>{chariots.length}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext, fontSize: fontSize.small }]}>🛒 Total</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.large }]}>Chariots disponibles</Text>

      <FlatList
        data={chariots}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2ecc71']} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card }, item.statut !== 'libre' && styles.cardDisabled]}
            disabled={item.statut !== 'libre'}
            onPress={() => router.push('/(tabs)/scanner')}
          >
            <View style={styles.cardLeft}>
              <View style={styles.cardTitleRow}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>🛒</Text>
                <Text style={[styles.cardTitle, { color: colors.text, fontSize: fontSize.normal }]}>{item.nom}</Text>
              </View>
              <Text style={[styles.cardPos, { color: colors.subtext, fontSize: fontSize.small }]}>📍 {item.position}</Text>
              <View style={styles.batterieRow}>
                <View style={[styles.batterieBar, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}>
                  <View style={[styles.baterieFill, { width: `${item.batterie}%` as any, backgroundColor: getBatterieColor(item.batterie) }]} />
                </View>
                <Text style={[styles.baterieTxt, { color: getBatterieColor(item.batterie), fontSize: fontSize.small }]}>{item.batterie}%</Text>
              </View>
            </View>
            <View style={[styles.badge, { backgroundColor: getStatutBg(item.statut) }]}>
              <Text style={[styles.badgeText, { color: getStatutColor(item.statut), fontSize: fontSize.small }]}>{item.statut}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 48, marginBottom: 24 },
  greeting: { color: '#666' },
  name: { fontWeight: 'bold' },
  profileBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  statNumber: { fontWeight: 'bold' },
  statLabel: { marginTop: 4 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 12 },
  card: { borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  cardDisabled: { opacity: 0.6 },
  cardLeft: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontWeight: 'bold' },
  cardPos: { marginBottom: 8 },
  batterieRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  batterieBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  baterieFill: { height: '100%', borderRadius: 3 },
  baterieTxt: { fontWeight: 'bold', width: 35 },
  badge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  badgeText: { fontWeight: 'bold' },
})