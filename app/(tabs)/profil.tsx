import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Image
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { Profile } from '../../types'
import { router } from 'expo-router'

export default function Profil() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])


  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data) {
      setProfile(data)
      if (data.avatar_url) {
        // Forcer le rechargement de l'image
        setPhotoUrl(data.avatar_url + '?t=' + Date.now())
      }
    }
    setLoading(false)
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'On a besoin d accès à vos photos')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    })

    if (!result.canceled) {
      const uri = result.assets[0].uri
      setPhotoUrl(uri)
      await uploadPhoto(uri)
    }
  }

  const uploadPhoto = async (uri: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Convertir en base64
    const response = await fetch(uri)
    const arrayBuffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    const fileName = `avatar_${user.id}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, uint8Array, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (uploadError) {
      Alert.alert('Erreur Storage', uploadError.message)
      return
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    const publicUrl = data.publicUrl + '?t=' + Date.now()

    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    setPhotoUrl(publicUrl)
    Alert.alert('✅ Photo mise à jour !')

  } catch (error: any) {
    Alert.alert('Erreur', error.message)
  }
}

  const handleLogout = async () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Oui', onPress: async () => {
          await supabase.auth.signOut()
          router.replace('/(auth)/login')
        }
      }
    ])
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2ecc71" />
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Mon Profil</Text>

      <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.prenom?.charAt(0)}{profile?.nom?.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.editBadge}>
          <Text style={styles.editText}>📷</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.name}>{profile?.prenom} {profile?.nom}</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Nom</Text>
          <Text style={styles.value}>{profile?.nom}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Prénom</Text>
          <Text style={styles.value}>{profile?.prenom}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Rôle</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{profile?.role}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.historiqueButton}
        onPress={() => router.push('/(tabs)/historique')}
      >
        <Text style={styles.historiqueText}>📋 Voir mes achats</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 40, marginBottom: 16 },
  avatarContainer: { alignSelf: 'center', marginBottom: 8 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#2ecc71', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, padding: 4, elevation: 2 },
  editText: { fontSize: 16 },
  name: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#333', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  divider: { height: 1, backgroundColor: '#f0f0f0' },
  label: { fontSize: 15, color: '#666' },
  value: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  badge: { backgroundColor: '#e8f8f0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#2ecc71', fontWeight: 'bold', fontSize: 13 },
  historiqueButton: { backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#2ecc71' },
  historiqueText: { color: '#2ecc71', fontSize: 16, fontWeight: 'bold' },
  logoutButton: { backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e74c3c' },
  logoutText: { color: '#e74c3c', fontSize: 16, fontWeight: 'bold' },
})