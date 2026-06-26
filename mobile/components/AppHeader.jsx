import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import FONTS from "../constants/fonts";
import { useAuthStore } from "../store/authStore";

// Title on the left, then two bubbles together on the right:
// notification bell + profile avatar, side by side (like most apps).
export default function AppHeader({ title }) {
  const { user } = useAuthStore();

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title || "Budgies"}</Text>

      <View style={styles.actions}>
        {/* Notifications */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/notification")}
          style={styles.bubble}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={COLORS.textColor}
          />
        </TouchableOpacity>

        {/* Profile avatar */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile")}
          style={styles.avatarBubble}
        >
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

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 20,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10, // space between the two bubbles
  },
  bubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarInitial: {
    fontSize: 17,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    fontWeight: "700",
  },
});