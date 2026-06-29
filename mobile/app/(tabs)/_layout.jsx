import { useEffect } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../hooks/useColors";
import { useCoupleStore } from "../../store/coupleStore";
import { useLetterStore } from "../../store/letterStore";

export default function TabsLayout() {
  const COLORS = useColors();
  const insets = useSafeAreaInsets();
  const { loadCoupleData } = useCoupleStore();
  const { fetchUnreadCount, unreadCount } = useLetterStore();

  useEffect(() => {
    loadCoupleData();
    fetchUnreadCount();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.darkButton,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontFamily: "GeneralSans-Variable", fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pet"
        options={{
          title: "Pet",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="egg" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="write"
        options={{
          title: "Write",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="letters"
        options={{
          title: "Letters",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mail" size={size} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.darkButton, fontSize: 10 },
        }}
      />

      {/* Hidden routes — opened via navigation, not the tab bar */}
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="notification" options={{ href: null }} />
      <Tabs.Screen name="photos" options={{ href: null }} />
      <Tabs.Screen name="bucket" options={{ href: null }} />
    </Tabs>
  );
}
