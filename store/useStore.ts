import { create } from 'zustand'
import { Session, PanierItem, Chariot } from '../types'

type Store = {
  session: Session | null
  panier: PanierItem[]
  chariot: Chariot | null
  setSession: (session: Session | null) => void
  setPanier: (panier: PanierItem[]) => void
  setChariot: (chariot: Chariot | null) => void
  addItem: (item: PanierItem) => void
  removeItem: (id: string) => void
  clearPanier: () => void
}

export const useStore = create<Store>((set) => ({
  session: null,
  panier: [],
  chariot: null,
  setSession: (session) => set({ session }),
  setPanier: (panier) => set({ panier }),
  setChariot: (chariot) => set({ chariot }),
  addItem: (item) => set((state) => ({ panier: [...state.panier, item] })),
  removeItem: (id) => set((state) => ({
    panier: state.panier.filter((i) => i.id !== id)
  })),
  clearPanier: () => set({ panier: [] }),
}))