import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity
} from 'react-native'

import { CameraView, useCameraPermissions } from 'expo-camera'
import { supabase } from '../../lib/supabase'
import { router } from 'expo-router'

export default function Scanner() {

  const [scanned, setScanned] = useState(false)

  const [mode, setMode] = useState<'chariot' | 'produit'>('chariot')

  const [permission, requestPermission] =
    useCameraPermissions()

  const [sessionId, setSessionId] =
    useState<string | null>(null)

  // =========================
  // Vérifier session existante
  // =========================
  useEffect(() => {
    checkExistingSession()
  }, [])

  // =========================
  // REALTIME SUPABASE
  // =========================
  useEffect(() => {

    if (!sessionId) return

    const channel = supabase
      .channel('panier-realtime')

      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'panier',
          filter: `session_id=eq.${sessionId}`
        },

        async (payload) => {

          console.log(
            'Nouveau produit :',
            payload
          )

          const produitId =
            payload.new.produit_id

          const { data: produit } =
            await supabase
              .from('produits')
              .select('*')
              .eq('id', produitId)
              .single()

          if (produit) {

            Alert.alert(
              '🛒 Produit scanné',
              `${produit.nom}\n${produit.prix.toFixed(3)} TND`
            )

          }

        }
      )

      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }

  }, [sessionId])

  // =========================
  // Vérifier session active
  // =========================
  const checkExistingSession = async () => {

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: session } =
      await supabase
        .from('sessions')
        .select('*')
        .eq('client_id', user.id)
        .eq('statut', 'active')
        .single()

    if (session) {

      setSessionId(session.id)

      setMode('produit')

    }

  }

  // =========================
  // Permissions caméra
  // =========================
  if (!permission) return <View />

  if (!permission.granted) {

    return (

      <View style={styles.center}>

        <Text style={styles.text}>
          On a besoin de la caméra
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
        >

          <Text style={styles.buttonText}>
            Autoriser
          </Text>

        </TouchableOpacity>

      </View>

    )

  }

  // =========================
  // SCAN
  // =========================
  const handleScan = async (
    { data }: { data: string }
  ) => {

    if (scanned) return

    setScanned(true)

    if (mode === 'chariot') {

      await scanChariot(data)

    } else {

      await scanProduit(data)

    }

  }

  // =========================
  // SCAN CHARIOT
  // =========================
  const scanChariot = async (
    qrCode: string
  ) => {

    const { data: chariot } =
      await supabase
        .from('chariots')
        .select('*')
        .eq('qr_code', qrCode)
        .single()

    if (!chariot) {

      Alert.alert(
        'Erreur',
        'Chariot non reconnu !'
      )

      setScanned(false)

      return

    }

    if (chariot.statut !== 'libre') {

      Alert.alert(
        'Indisponible',
        'Ce chariot est déjà occupé !'
      )

      setScanned(false)

      return

    }

    const {
      data: { user }
    } = await supabase.auth.getUser()
    

    // Fermer anciennes sessions
    await supabase
      .from('sessions')
      .update({
        statut: 'terminée'
      })
      .eq('client_id', user?.id)
      .eq('statut', 'active')

    // Créer nouvelle session
    const { data: session } =
      await supabase
        .from('sessions')
        .insert({
          client_id: user?.id,
          chariot_id: chariot.id,
          statut: 'active',
          montant_total: 0
        })
        .select()
        .single()

    // Chariot occupé
    await supabase
      .from('chariots')
      .update({
        statut: 'occupé'
      })
      .eq('id', chariot.id)

    setSessionId(session.id)

    setMode('produit')

    Alert.alert(
      '✅ Chariot connecté',
      `${chariot.nom}\nVous pouvez scanner les produits RFID`,
      [
        {
          text: 'OK',
          onPress: () => setScanned(false)
        }
      ]
    )

  }

  // =========================
  // SCAN PRODUIT APP
  // =========================
  const scanProduit = async (
    barcode: string
  ) => {

    if (!sessionId) {

      Alert.alert(
        'Erreur',
        'Scannez d abord un chariot'
      )

      setScanned(false)

      return

    }

    const { data: produit } =
      await supabase
        .from('produits')
        .select('*')
        .or(
          `code_barre.eq.${barcode},tag_rfid.eq.${barcode}`
        )
        .single()

    if (!produit) {

      Alert.alert(
        'Produit introuvable',
        barcode
      )

      setScanned(false)

      return

    }

    const { data: existing } =
      await supabase
        .from('panier')
        .select('*')
        .eq('session_id', sessionId)
        .eq('produit_id', produit.id)
        .single()

    if (existing) {

      await supabase
        .from('panier')
        .update({
          quantite:
            existing.quantite + 1
        })
        .eq('id', existing.id)

    } else {

      await supabase
        .from('panier')
        .insert({
          session_id: sessionId,
          produit_id: produit.id,
          quantite: 1,
          prix_unitaire: produit.prix
        })

    }

    // =========================
    // Calculer total
    // =========================
    const { data: panier } =
      await supabase
        .from('panier')
        .select('*')
        .eq('session_id', sessionId)

    let total = 0

    panier?.forEach(item => {

      total +=
        item.prix_unitaire *
        item.quantite

    })

    await supabase
      .from('sessions')
      .update({
        montant_total: total
      })
      .eq('id', sessionId)

    // =========================
    // Envoyer données à ESP32
    // =========================
    try {

      await fetch(
        'http://192.168.100.197:5000/api/esp32/update',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({

            chariot_id: 'CART-01',

            produit: produit.nom,

            prix: produit.prix,

            poids: 500,

            total: total,

          }),
        }
      )

    } catch (error) {

      console.log(
        'Erreur ESP32:',
        error
      )

    }
    try {

  const userData =
    await supabase.auth.getUser()

  const email =
    userData.data.user?.email

  await fetch(
    'http://192.168.100.197:5000/api/sync/panier',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json'
      },

      body: JSON.stringify({

        client_email:email,

        chariot_code: 'CART-01',

        produit: produit.nom,

        prix: produit.prix,
        quantite: 1,

        total: total

      })
    }
  )

}
catch (error) {

  console.log(
    'Erreur Sync:',
    error
  )

}

    Alert.alert(
      '✅ Produit ajouté',
      `${produit.nom}\n${produit.prix.toFixed(3)} TND`,
      [
        {
          text: 'Scanner autre',
          onPress: () => setScanned(false)
        },
        {
          text: 'Voir panier',
          onPress: () =>
            router.replace('/(tabs)/panier')
        }
      ]
    )

  }

  return (

    <View style={styles.container}>

      <Text style={styles.title}>

        {
          mode === 'chariot'
            ? '📷 Scanner QR du chariot'
            : '📦 Scanner produit'
        }

      </Text>

      {
        mode === 'produit' && (

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() =>
              router.replace('/(tabs)/panier')
            }
          >

            <Text style={styles.switchText}>
              🛒 Voir panier
            </Text>

          </TouchableOpacity>

        )
      }

      <CameraView
        style={styles.camera}
        onBarcodeScanned={handleScan}
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr',
            'ean13',
            'ean8',
            'code128',
            'code39'
          ]
        }}
      />

      {
        scanned && (

          <TouchableOpacity
            style={styles.button}
            onPress={() => setScanned(false)}
          >

            <Text style={styles.buttonText}>
              Scanner à nouveau
            </Text>

          </TouchableOpacity>

        )
      }

    </View>

  )

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#000'
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },

  title: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    padding: 16,
    marginTop: 40,
    backgroundColor:
      'rgba(0,0,0,0.5)'
  },

  switchButton: {
    backgroundColor: '#2ecc71',
    padding: 12,
    margin: 8,
    borderRadius: 8,
    alignItems: 'center'
  },

  switchText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },

  camera: {
    flex: 1
  },

  text: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    color: '#333'
  },

  button: {
    backgroundColor: '#2ecc71',
    padding: 16,
    margin: 16,
    borderRadius: 10,
    alignItems: 'center'
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }

})