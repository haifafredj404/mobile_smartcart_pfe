export type Profile = {
  id: string
  nom: string
  prenom: string
  telephone: string
  role: 'client' | 'employe' | 'admin'
  avatar_url?: string
}

export type Produit = {
  id: string
  nom: string
  description: string
  prix: number
  stock: number
  code_barre: string
  image_url: string
  categorie: string
}

export type Chariot = {
  id: string
  nom: string
  qr_code: string
  statut: 'libre' | 'occupé' | 'maintenance'
  batterie: number
  position: string
}

export type Session = {
  id: string
  client_id: string
  chariot_id: string
  statut: 'active' | 'terminée' | 'payée'
  montant_total: number
}

export type PanierItem = {
  id: string
  session_id: string
  produit_id: string
  quantite: number
  prix_unitaire: number
  produits?: Produit
}
