import { useEffect } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../hooks/useColors";
import { useCoupleStore } from "../../store/coupleStore";

export default function TabsLayout() {
  const COLORS = useColors();
  const insets = useSafeAreaInsets();
  const { loadCoupleData } = useCoupleStore();

  useEffect(() => {
    loadCoupleData();
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

      {/* Hidden routes — opened via navigation, not the tab bar */}
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="notification" options={{ href: null }} />
      <Tabs.Screen name="photos" options={{ href: null }} />
    </Tabs>
  );
}
