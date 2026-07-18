import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  StatusBar
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../store/useStore'
import { PanierItem } from '../../types'
import { router } from 'expo-router'
import { subscribeToPanier } from '../../lib/notifications'

export default function Panier() {
  const [items, setItems] = useState<PanierItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [chariotNom, setChariotNom] = useState<string>('')
  const { clearPanier, setSession, setChariot } = useStore()

  useEffect(() => {
    checkActiveSession()
  }, [])

  // Rafraîchir quand on revient sur la page
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionId) {
        fetchPanier(sessionId)
      } else {
        checkActiveSession()
      }
    }, 2000) // vérifie toutes les 2 secondes

    return () => clearInterval(interval)
  }, [sessionId])

  const checkActiveSession = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: session } = await supabase
      .from('sessions')
      .select('*, chariots(nom)')
      .eq('client_id', user.id)
      .eq('statut', 'active')
      .order('date_debut', { ascending: false })
      .limit(1)
      .single()

    if (session) {
      setSessionId(session.id)
      setSession(session)
      setChariotNom(session.chariots?.nom || '')
      fetchPanier(session.id)
      subscribeRealtime(session.id)
    } else {
      setLoading(false)
    }
  }

  const fetchPanier = async (sid: string) => {
    const { data } = await supabase
      .from('panier')
      .select('*, produits(*)')
      .eq('session_id', sid)
    setItems(data || [])
    setLoading(false)
  }

  const subscribeRealtime = (sid: string) => {
    supabase
      .channel('panier-changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'panier',
        filter: `session_id=eq.${sid}`
      }, () => fetchPanier(sid))
      .subscribe()
  }

  const supprimerItem = async (id: string) => {
    Alert.alert('Supprimer', 'Retirer ce produit ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await supabase.from('panier').delete().eq('id', id)
          if (sessionId) fetchPanier(sessionId)
        }
      }
    ])
  }

  const handleValider = async () => {
    if (items.length === 0) {
      Alert.alert('Panier vide', 'Ajoutez des produits avant de valider !')
      return
    }
    Alert.alert(
      '✅ Valider le panier',
      `${items.length} article(s)\nTotal : ${total.toFixed(3)} TND\n\nVeuillez vous diriger vers la caisse.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider', onPress: async () => {
            await supabase.from('sessions')
              .update({ statut: 'terminée', date_fin: new Date() })
              .eq('id', sessionId)

            const { data: session } = await supabase
              .from('sessions').select('chariot_id').eq('id', sessionId).single()

            await supabase.from('chariots')
              .update({ statut: 'libre' })
              .eq('id', session?.chariot_id)

            clearPanier()
            setSession(null)
            setChariot(null)
            setSessionId(null)
            setItems([])

            Alert.alert('🎉 Panier validé !', 'Dirigez-vous vers la caisse pour payer.', [
              { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
            ])
          }
        }
      ]
    )
  }

  const total = items.reduce((sum, item) =>
    sum + (item.prix_unitaire * item.quantite), 0)

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2ecc71" />
    </View>
  )

  if (!sessionId) return (
    <View style={styles.center}>
      <Text style={styles.emptyEmoji}>🛒</Text>
      <Text style={styles.emptyTitle}>Aucun chariot connecté</Text>
      <Text style={styles.emptySubtitle}>Scannez un chariot pour commencer vos courses</Text>
      <TouchableOpacity style={styles.scanButton}
        onPress={() => router.replace('/(tabs)/home')}>
        <Text style={styles.scanButtonText}>Choisir un chariot</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0faf4" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mon Panier 🛒</Text>
          <Text style={styles.chariotName}>🔗 {chariotNom}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{items.length}</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>Panier vide</Text>
          <Text style={styles.emptySubtitle}>Scannez des produits pour les ajouter</Text>
          <TouchableOpacity style={styles.scanButton}
            onPress={() => router.replace('/(tabs)/scanner')}>
            <Text style={styles.scanButtonText}>📷 Scanner un produit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardEmoji}>
                <Text style={styles.produitEmoji}>🏷️</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.produits?.nom}</Text>
                <Text style={styles.cardCategorie}>{item.produits?.categorie}</Text>
                <Text style={styles.cardPrice}>
                  {item.prix_unitaire.toFixed(3)} TND × {item.quantite}
                </Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardTotal}>
                  {(item.prix_unitaire * item.quantite).toFixed(3)}
                </Text>
                <Text style={styles.cardTotalCurrency}>TND</Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => supprimerItem(item.id)}
                >
                  <Text style={styles.deleteText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 200 }}
        />
      )}

      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total ({items.length} articles)</Text>
            <Text style={styles.totalAmount}>{total.toFixed(3)} TND</Text>
          </View>
          <Text style={styles.payInfo}>💡 Le paiement s'effectue en caisse</Text>
          <TouchableOpacity style={styles.validateButton} onPress={handleValider}>
            <Text style={styles.validateButtonText}>✅ Valider et aller en caisse</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faf4', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 48, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  chariotName: { fontSize: 13, color: '#2ecc71', marginTop: 2 },
  countBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2ecc71', justifyContent: 'center', alignItems: 'center' },
  countText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24 },
  scanButton: { backgroundColor: '#2ecc71', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  scanButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  cardEmoji: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0faf4', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  produitEmoji: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a2e' },
  cardCategorie: { fontSize: 12, color: '#2ecc71', marginTop: 2 },
  cardPrice: { fontSize: 13, color: '#888', marginTop: 4 },
  cardRight: { alignItems: 'flex-end' },
  cardTotal: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  cardTotalCurrency: { fontSize: 11, color: '#888' },
  deleteBtn: { marginTop: 8, padding: 4 },
  deleteText: { fontSize: 18 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 15, color: '#666' },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  payInfo: { textAlign: 'center', color: '#888', fontSize: 13, marginBottom: 12 },
  validateButton: { backgroundColor: '#2ecc71', padding: 16, borderRadius: 14, alignItems: 'center', elevation: 2 },
  validateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})