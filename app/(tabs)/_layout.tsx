import { Tabs } from 'expo-router'
import { Home, ScanLine, ShoppingCart, ClipboardList, User } from 'lucide-react-native'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#2ecc71',
      tabBarInactiveTintColor: '#bbb',
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopWidth: 0,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        paddingBottom: 10,
        paddingTop: 8,
        height: 65,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
      }
    }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Home color={color} size={22} strokeWidth={2} />
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, size }) => <ScanLine color={color} size={22} strokeWidth={2} />
        }}
      />
      <Tabs.Screen
        name="panier"
        options={{
          title: 'Panier',
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={22} strokeWidth={2} />
        }}
      />
      <Tabs.Screen
        name="historique"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={22} strokeWidth={2} />
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User color={color} size={22} strokeWidth={2} />
        }}
      />
      <Tabs.Screen
        name="parametres"
        options={{ href: null }}
      />
    </Tabs>
  )
}