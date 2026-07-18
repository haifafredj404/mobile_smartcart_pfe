import { useSettings } from '../store/useSettings'

export function useTheme() {
  const { theme, tailleTexte } = useSettings()
  const isDark = theme === 'sombre'

  return {
    isDark,
    colors: {
      bg: isDark ? '#1a1a2e' : '#f0faf4',
      card: isDark ? '#16213e' : '#fff',
      text: isDark ? '#fff' : '#1a1a2e',
      subtext: isDark ? '#aaa' : '#666',
      border: isDark ? '#0f3460' : '#eee',
      primary: '#2ecc71',
    },
    fontSize: {
      small: tailleTexte === 'petit' ? 11 : tailleTexte === 'grand' ? 14 : 12,
      normal: tailleTexte === 'petit' ? 13 : tailleTexte === 'grand' ? 17 : 15,
      large: tailleTexte === 'petit' ? 16 : tailleTexte === 'grand' ? 22 : 18,
      title: tailleTexte === 'petit' ? 18 : tailleTexte === 'grand' ? 26 : 22,
    }
  }
}