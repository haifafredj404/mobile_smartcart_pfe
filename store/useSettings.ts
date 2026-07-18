import { create } from 'zustand'

type Settings = {
  theme: 'clair' | 'sombre'
  langue: 'FR' | 'AR' | 'EN'
  tailleTexte: 'petit' | 'normal' | 'grand'
  notifications: boolean
  setTheme: (theme: 'clair' | 'sombre') => void
  setLangue: (langue: 'FR' | 'AR' | 'EN') => void
  setTailleTexte: (taille: 'petit' | 'normal' | 'grand') => void
  setNotifications: (val: boolean) => void
}

export const useSettings = create<Settings>((set) => ({
  theme: 'clair',
  langue: 'FR',
  tailleTexte: 'normal',
  notifications: true,
  setTheme: (theme) => set({ theme }),
  setLangue: (langue) => set({ langue }),
  setTailleTexte: (tailleTexte) => set({ tailleTexte }),
  setNotifications: (notifications) => set({ notifications }),
}))