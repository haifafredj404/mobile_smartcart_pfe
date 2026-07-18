// Valider email
export function validateEmail(email: string): string | null {
  if (!email) return 'Email requis'
  const regex = /^.+@.+\..+$/
  if (!regex.test(email.trim())) return 'Format email invalide'
  return null
}

// Valider mot de passe
export function validatePassword(password: string): string | null {
  if (!password) return 'Mot de passe requis'
  if (password.length < 6) return 'Minimum 6 caractères'
  return null
}

// Valider nom/prénom
export function validateName(name: string, field: string): string | null {
  if (!name) return `${field} requis`
  if (name.length < 2) return `${field} trop court`
  if (/[0-9!@#$%^&*]/.test(name)) return `${field} invalide`
  return null
}

// Valider code-barre produit
export function validateBarcode(code: string): string | null {
  if (!code) return 'Code-barre requis'
  if (code.length < 8) return 'Code-barre trop court'
  return null
}