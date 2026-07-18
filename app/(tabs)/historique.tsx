import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { router } from 'expo-router'

type Session = {
  id: string
  date_debut: string
  montant_total: number
  statut: string
  chariots: { nom: string }
  panier: { 
    quantite: number
    prix_unitaire: number
    produits: { nom: string }
  }[]
}

export default function Historique() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetchHistorique()
    
    // Rafraîchir quand on revient sur la page
    const unsubscribe = supabase
      .channel('sessions-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sessions'
      }, () => fetchHistorique())
      .subscribe()

    return () => { supabase.removeChannel(unsubscribe) }
  }, [])

  const fetchHistorique = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('sessions')
      .select('*, chariots(nom), panier(quantite, prix_unitaire, produits(nom))')
      .eq('client_id', user.id)
      .in('statut', ['payée', 'terminée'])
      .order('date_debut', { ascending: false })

    setSessions(data || [])
    setLoading(false)
  }

  const getDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-TN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const getTotal = (session: Session) => {
    if (session.montant_total && session.montant_total > 0) {
      return session.montant_total
    }
    return session.panier?.reduce((sum, item) =>
      sum + (item.prix_unitaire * item.quantite), 0) || 0
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2ecc71" />
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Historique des achats</Text>

      {sessions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Aucun achat</Text>
          <Text style={styles.emptySub}>Vos achats apparaîtront ici</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text style={styles.btnText}>Commencer les courses</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setExpanded(expanded === item.id ? null : item.id)}
            >
              {/* Header */}
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.chariotNom}>
                    🛒 {item.chariots?.nom || 'Chariot'}
                  </Text>
                  <Text style={styles.date}>{getDate(item.date_debut)}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.total}>
                    {getTotal(item).toFixed(3)} TND
                  </Text>
                  <View style={[styles.badge,
                    item.statut === 'payée'
                      ? styles.badgePaye
                      : styles.badgeTermine
                  ]}>
                    <Text style={styles.badgeText}>
                      {item.statut === 'payée' ? '✅ Payé' : '⬛ Terminé'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Détail produits */}
              {expanded === item.id && item.panier && item.panier.length > 0 && (
                <View style={styles.detail}>
                  <Text style={styles.detailTitle}>
                    📦 {item.panier.length} article(s)
                  </Text>
                  {item.panier.map((p, i) => (
                    <View key={i} style={styles.produitRow}>
                      <Text style={styles.produitNom}>
                        {p.produits?.nom || 'Produit'}
                      </Text>
                      <Text style={styles.produitPrix}>
                        {p.prix_unitaire.toFixed(3)} × {p.quantite}
                      </Text>
                      <Text style={styles.produitTotal}>
                        {(p.prix_unitaire * p.quantite).toFixed(3)} TND
                      </Text>
                    </View>
                  ))}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>
                      {getTotal(item).toFixed(3)} TND
                    </Text>
                  </View>
                </View>
              )}

              {/* Flèche */}
              <Text style={styles.arrow}>
                {expanded === item.id ? '▲ Masquer' : '▼ Voir détails'}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faf4', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e', marginTop: 48, marginBottom: 16 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#888', marginBottom: 24 },
  btn: { backgroundColor: '#2ecc71', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chariotNom: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  date: { fontSize: 12, color: '#888', marginTop: 4 },
  right: { alignItems: 'flex-end' },
  total: { fontSize: 18, fontWeight: 'bold', color: '#2ecc71' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, marginTop: 4 },
  badgePaye: { backgroundColor: '#e8f8f0' },
  badgeTermine: { backgroundColor: '#f0f0f0' },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: '#555' },
  detail: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  detailTitle: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 8 },
  produitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  produitNom: { flex: 1, fontSize: 13, color: '#333' },
  produitPrix: { fontSize: 12, color: '#888', marginHorizontal: 8 },
  produitTotal: { fontSize: 13, fontWeight: 'bold', color: '#2ecc71' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8 },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 15, fontWeight: 'bold', color: '#2ecc71' },
  arrow: { textAlign: 'center', color: '#2ecc71', fontSize: 12, marginTop: 12 },
})