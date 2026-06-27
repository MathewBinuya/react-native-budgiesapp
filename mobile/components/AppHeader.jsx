import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useMemo } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FONTS from "../constants/fonts";
import { useColors } from "../hooks/useColors";
import { useAuthStore } from "../store/authStore";

export default function AppHeader({ title }) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const { user } = useAuthStore();

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title || "Budgies"}</Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/notification")} style={styles.bubble}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.textColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} style={styles.avatarBubble}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <Text style={styles.avatarInitial}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "B"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 18, paddingVertical: 12, backgroundColor: C.background,
    },
    title: { fontSize: 20, color: C.textColor, fontFamily: FONTS.regular, fontWeight: "700" },
    actions: { flexDirection: "row", alignItems: "center", gap: 10 },
    bubble: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: "center", justifyContent: "center" },
    avatarBubble: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    avatarInitial: { fontSize: 17, color: C.textColor, fontFamily: FONTS.regular, fontWeight: "700" },
  });
}
