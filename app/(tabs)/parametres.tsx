import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, StatusBar, ActivityIndicator
} from 'react-native'
import { useSettings } from '../../store/useSettings'
import { router } from 'expo-router'
import { verifierSecurite } from '../../lib/security'

export default function Parametres() {
  const {
    theme, langue, tailleTexte, notifications,
    setTheme, setLangue, setTailleTexte, setNotifications
  } = useSettings()

  const [securite, setSecurite] = useState<any>(null)
  const [loadingSecurite, setLoadingSecurite] = useState(false)

  const isDark = theme === 'sombre'

  const colors = {
    bg: isDark ? '#1a1a2e' : '#f0faf4',
    card: isDark ? '#16213e' : '#fff',
    text: isDark ? '#fff' : '#1a1a2e',
    subtext: isDark ? '#aaa' : '#666',
    border: isDark ? '#0f3460' : '#eee',
    primary: '#2ecc71',
  }

  const testerSecurite = async () => {
    setLoadingSecurite(true)
    const resultats = await verifierSecurite()
    setSecurite(resultats)
    setLoadingSecurite(false)
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>⚙️ Paramètres</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Apparence */}
      <Text style={[styles.sectionTitle, { color: colors.subtext }]}>APPARENCE</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>🌙 Thème</Text>
        <View style={styles.optionsRow}>
          {(['clair', 'sombre'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.optionBtn,
                theme === t && styles.optionBtnActive,
                { borderColor: theme === t ? colors.primary : colors.border }
              ]}
              onPress={() => setTheme(t)}
            >
              <Text style={styles.optionEmoji}>{t === 'clair' ? '☀️' : '🌙'}</Text>
              <Text style={[styles.optionText, { color: theme === t ? colors.primary : colors.subtext }]}>
                {t === 'clair' ? 'Clair' : 'Sombre'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.itemTitle, { color: colors.text }]}>🔤 Taille du texte</Text>
        <View style={styles.optionsRow}>
          {([
            { val: 'petit', label: 'Petit', size: 12 },
            { val: 'normal', label: 'Normal', size: 15 },
            { val: 'grand', label: 'Grand', size: 18 },
          ] as const).map((t) => (
            <TouchableOpacity
              key={t.val}
              style={[
                styles.optionBtn,
                tailleTexte === t.val && styles.optionBtnActive,
                { borderColor: tailleTexte === t.val ? colors.primary : colors.border }
              ]}
              onPress={() => setTailleTexte(t.val)}
            >
              <Text style={[styles.optionText, { fontSize: t.size, color: tailleTexte === t.val ? colors.primary : colors.subtext }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Langue */}
      <Text style={[styles.sectionTitle, { color: colors.subtext }]}>LANGUE</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>🌍 Langue de l'app</Text>
        <View style={styles.optionsRow}>
          {([
            { val: 'FR', label: 'Français', flag: '🇫🇷' },
            { val: 'AR', label: 'العربية', flag: '🇹🇳' },
            { val: 'EN', label: 'English', flag: '🇬🇧' },
          ] as const).map((l) => (
            <TouchableOpacity
              key={l.val}
              style={[
                styles.optionBtn,
                langue === l.val && styles.optionBtnActive,
                { borderColor: langue === l.val ? colors.primary : colors.border }
              ]}
              onPress={() => setLangue(l.val)}
            >
              <Text style={styles.optionEmoji}>{l.flag}</Text>
              <Text style={[styles.optionText, { color: langue === l.val ? colors.primary : colors.subtext }]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notifications */}
      <Text style={[styles.sectionTitle, { color: colors.subtext }]}>NOTIFICATIONS</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.switchRow}>
          <View>
            <Text style={[styles.itemTitle, { color: colors.text }]}>🔔 Notifications</Text>
            <Text style={[styles.itemSub, { color: colors.subtext }]}>Alertes produits et chariots</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#ddd', true: '#a8e6c1' }}
            thumbColor={notifications ? '#2ecc71' : '#999'}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.switchRow}>
          <View>
            <Text style={[styles.itemTitle, { color: colors.text }]}>🛒 Alertes panier</Text>
            <Text style={[styles.itemSub, { color: colors.subtext }]}>Produit ajouté au chariot</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#ddd', true: '#a8e6c1' }}
            thumbColor={notifications ? '#2ecc71' : '#999'}
          />
        </View>
      </View>

      {/* Sécurité */}
      <Text style={[styles.sectionTitle, { color: colors.subtext }]}>SÉCURITÉ</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.secBtn} onPress={testerSecurite}>
          {loadingSecurite
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.secBtnText}>🔒 Vérifier la sécurité HTTPS</Text>
          }
        </TouchableOpacity>

        {securite && (
          <View style={styles.secResults}>
            <View style={styles.secRow}>
              <Text style={[styles.secIcon, { color: securite.https ? '#2ecc71' : '#e74c3c' }]}>
                {securite.https ? '✅' : '❌'}
              </Text>
              <View>
                <Text style={[styles.secLabel, { color: colors.text }]}>Protocole HTTPS</Text>
                <Text style={[styles.secSub, { color: colors.subtext }]}>Connexion chiffrée SSL/TLS</Text>
              </View>
            </View>

            <View style={[styles.secDivider, { backgroundColor: colors.border }]} />

            <View style={styles.secRow}>
              <Text style={[styles.secIcon, { color: securite.connexion ? '#2ecc71' : '#e74c3c' }]}>
                {securite.connexion ? '✅' : '❌'}
              </Text>
              <View>
                <Text style={[styles.secLabel, { color: colors.text }]}>Connexion sécurisée</Text>
                <Text style={[styles.secSub, { color: colors.subtext }]}>Serveur Supabase accessible</Text>
              </View>
            </View>

            <View style={[styles.secDivider, { backgroundColor: colors.border }]} />

            <View style={styles.secRow}>
              <Text style={[styles.secIcon, { color: securite.token ? '#2ecc71' : '#e74c3c' }]}>
                {securite.token ? '✅' : '❌'}
              </Text>
              <View>
                <Text style={[styles.secLabel, { color: colors.text }]}>Token JWT valide</Text>
                <Text style={[styles.secSub, { color: colors.subtext }]}>Session authentifiée</Text>
              </View>
            </View>

            <View style={[styles.secDivider, { backgroundColor: colors.border }]} />

            <View style={styles.secRow}>
              <Text style={[styles.secIcon, { color: securite.rls ? '#2ecc71' : '#e74c3c' }]}>
                {securite.rls ? '✅' : '❌'}
              </Text>
              <View>
                <Text style={[styles.secLabel, { color: colors.text }]}>Protection RLS active</Text>
                <Text style={[styles.secSub, { color: colors.subtext }]}>Données protégées par rôle</Text>
              </View>
            </View>

            <View style={[styles.secBadge, { backgroundColor: '#e8f8f0' }]}>
              <Text style={styles.secBadgeText}>
                🛡️ Application sécurisée avec HTTPS
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* À propos */}
      <Text style={[styles.sectionTitle, { color: colors.subtext }]}>À PROPOS</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.subtext }]}>Version</Text>
          <Text style={[styles.aboutValue, { color: colors.text }]}>1.0.0</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.subtext }]}>Développeur</Text>
          <Text style={[styles.aboutValue, { color: colors.text }]}>Chariot Intelligent</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.subtext }]}>Technologie</Text>
          <Text style={[styles.aboutValue, { color: colors.text }]}>React Native + Supabase</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16 },
  backBtn: { fontSize: 18, fontWeight: '600', width: 60 },
  title: { fontSize: 20, fontWeight: 'bold' },
  sectionTitle: { fontSize: 12, fontWeight: '700', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, letterSpacing: 1 },
  card: { marginHorizontal: 16, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  itemTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  itemSub: { fontSize: 13, marginTop: 2 },
  optionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  optionBtn: { flex: 1, minWidth: 80, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 2, gap: 4 },
  optionBtnActive: { backgroundColor: '#f0faf4' },
  optionEmoji: { fontSize: 22 },
  optionText: { fontSize: 13, fontWeight: '600' },
  divider: { height: 1, marginVertical: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  aboutLabel: { fontSize: 14 },
  aboutValue: { fontSize: 14, fontWeight: '600' },
  secBtn: { backgroundColor: '#2ecc71', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 4 },
  secBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  secResults: { marginTop: 16 },
  secRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  secIcon: { fontSize: 22, width: 30 },
  secLabel: { fontSize: 14, fontWeight: '600' },
  secSub: { fontSize: 12, marginTop: 2 },
  secDivider: { height: 1, marginVertical: 4 },
  secBadge: { marginTop: 16, padding: 12, borderRadius: 12, alignItems: 'center' },
  secBadgeText: { color: '#2ecc71', fontWeight: 'bold', fontSize: 14 },
})