import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { router } from 'expo-router'
import { validateEmail, validatePassword, validateName } from '../../lib/validation'

export default function Register() {
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = async () => {
    // Validation avant envoi
    const nomError = validateName(nom, 'Nom')
    const prenomError = validateName(prenom, 'Prénom')
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)

    if (nomError) return Alert.alert('Erreur', nomError)
    if (prenomError) return Alert.alert('Erreur', prenomError)
    if (emailError) return Alert.alert('Erreur', emailError)
    if (passwordError) return Alert.alert('Erreur', passwordError)

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { nom, prenom } }
    })

    if (error) {
      Alert.alert('Erreur', error.message)
    } else if (data.user) {
      Alert.alert('✅ Compte créé !', 'Connectez-vous maintenant.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ])
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🛒</Text>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez-nous !</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Nom</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nom"
                  placeholderTextColor="#aaa"
                  value={nom}
                  onChangeText={setNom}
                />
              </View>
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Prénom</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Prénom"
                  placeholderTextColor="#aaa"
                  value={prenom}
                  onChangeText={setPrenom}
                />
              </View>
            </View>
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>📧</Text>
            <TextInput
              style={styles.input}
              placeholder="votre@email.com"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="minimum 6 caractères"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.inputIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>S'inscrire</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginText}>Déjà un compte ? Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faf4' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#666' },
  form: { backgroundColor: '#fff', borderRadius: 24, padding: 24, elevation: 4 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#eee' },
  inputIcon: { fontSize: 18, marginRight: 8 },
  input: { flex: 1, padding: 14, fontSize: 15, color: '#333' },
  button: { backgroundColor: '#2ecc71', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, elevation: 2 },
  buttonDisabled: { backgroundColor: '#a8e6c1' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loginButton: { padding: 16, alignItems: 'center', marginTop: 8 },
  loginText: { color: '#2ecc71', fontSize: 15, fontWeight: '600' },
})