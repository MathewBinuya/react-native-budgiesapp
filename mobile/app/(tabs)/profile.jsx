import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useEffect } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import FONTS from "../../constants/fonts";
import { useAuthStore } from "../../store/authStore";
import { useCoupleStore } from "../../store/coupleStore";

const ACCENT_OPTIONS = ["#88A99E", "#DD8E75", "#D4638D", "#9C8AA5", "#7DA0C4"];

export default function Profile() {
  const { user, logout, setAccent } = useAuthStore();
  const { daysTogether, isPaired, loadCoupleData } = useCoupleStore();
  const myAccent = user?.accentColor || "#88A99E";

  useEffect(() => {
    loadCoupleData();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/welcome");
  };

  const pickColor = async (c) => {
    if (c === myAccent) return;
    await setAccent(c); // saves to backend + updates stored user
  };

  return (
    <View style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.textColor} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.avatar, { backgroundColor: myAccent }]}>
          <Text style={styles.avatarInitial}>
            {user?.name ? user.name.charAt(0).toUpperCase() : "B"}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || "You"}</Text>
        <Text style={styles.email}>{user?.email || ""}</Text>

        {/* Us */}
        <Text style={styles.sectionTitle}>Us</Text>
        {isPaired ? (
          <View style={styles.usCard}>
            <View style={styles.usRow}>
              <View style={[styles.usBubble, { backgroundColor: myAccent }]}>
                <Text style={styles.usInitial}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : "B"}
                </Text>
              </View>
              <Ionicons name="heart" size={20} color={COLORS.darkButton} />
              <View
                style={[styles.usBubble, { backgroundColor: COLORS.darkButton }]}
              >
                <Text style={styles.usInitial}>P</Text>
              </View>
            </View>
            <Text style={styles.usDays}>
              {daysTogether != null
                ? `${daysTogether} days together`
                : "Set your anniversary"}
            </Text>
            <TouchableOpacity style={styles.dateBtn}>
              <Ionicons name="calendar" size={16} color={COLORS.textColor} />
              <Text style={styles.dateBtnText}>Set anniversary date</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.pairCard}
            onPress={() => router.push("/(onBoarding)/pair")}
          >
            <Text style={styles.pairEmoji}>🪺</Text>
            <Text style={styles.pairText}>Pair with your partner</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.darkButton} />
          </TouchableOpacity>
        )}

        {/* Accent color — now saves */}
        <Text style={styles.sectionTitle}>Your color</Text>
        <View style={styles.colorRow}>
          {ACCENT_OPTIONS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => pickColor(c)}
              style={[
                styles.swatch,
                { backgroundColor: c },
                myAccent === c && styles.swatchActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out" size={18} color={COLORS.white} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  topTitle: { fontSize: 18, color: COLORS.textColor, fontFamily: FONTS.regular, fontWeight: "700" },
  scroll: { paddingHorizontal: 18, alignItems: "center" },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  avatarInitial: { fontSize: 36, color: COLORS.white, fontFamily: FONTS.regular, fontWeight: "700" },
  name: { fontSize: 22, color: COLORS.textColor, fontFamily: FONTS.regular, fontWeight: "700" },
  email: { fontSize: 14, color: COLORS.textMuted, fontFamily: FONTS.regular, marginTop: 2, marginBottom: 8 },

  sectionTitle: {
    alignSelf: "flex-start",
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    marginTop: 24,
    marginBottom: 10,
  },

  usCard: { width: "100%", backgroundColor: COLORS.card, borderRadius: 20, padding: 20, alignItems: "center" },
  usRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  usBubble: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  usInitial: { fontSize: 20, color: COLORS.white, fontFamily: FONTS.regular, fontWeight: "700" },
  usDays: { fontSize: 15, fontWeight: "700", color: COLORS.textColor, fontFamily: FONTS.regular, marginBottom: 12 },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dateBtnText: { fontSize: 13, color: COLORS.textColor, fontFamily: FONTS.regular, fontWeight: "600" },

  pairCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
  },
  pairEmoji: { fontSize: 26 },
  pairText: { flex: 1, fontSize: 15, fontWeight: "700", color: COLORS.textColor, fontFamily: FONTS.regular },

  colorRow: { flexDirection: "row", gap: 12, alignSelf: "flex-start" },
  swatch: { width: 38, height: 38, borderRadius: 19 },
  swatchActive: { borderWidth: 3, borderColor: COLORS.textColor },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.darkButton,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 40,
  },
  logoutText: { color: COLORS.white, fontSize: 15, fontWeight: "700", fontFamily: FONTS.regular },
});