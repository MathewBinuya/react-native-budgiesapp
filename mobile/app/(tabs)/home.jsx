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
import AppHeader from "../../components/AppHeader";
import COLORS from "../../constants/colors";
import FONTS from "../../constants/fonts";
import { useAuthStore } from "../../store/authStore";
import { useCoupleStore } from "../../store/coupleStore";

export default function Home() {
  const { user } = useAuthStore();
  const { streak, daysTogether, isPaired, loadCoupleData, checkIn } =
    useCoupleStore();

  // Load real couple + streak data when Home mounts
  useEffect(() => {
    loadCoupleData();
  }, []);

  const streakCount = streak?.count ?? 0;
  const checkedInToday = streak?.youCheckedInToday;

  const handleCheckIn = async () => {
    const result = await checkIn();
    // streak state updates inside the store; nothing else needed here
  };

  return (
    <View style={styles.safe}>
      <AppHeader title="Home" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>
          Hi {user?.name?.split(" ")[0] || "there"} 🌿
        </Text>
        <Text style={styles.subGreeting}>here's your nest today</Text>

        {/* Not paired → prompt; everything else stays empty/zero */}
        {!isPaired && (
          <TouchableOpacity
            style={styles.pairPrompt}
            onPress={() => router.push("/(onBoarding)/pair")}
          >
            <Text style={styles.pairEmoji}>🪺</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pairTitle}>Pair with your partner</Text>
              <Text style={styles.pairHint}>
                Link up to start your streak, journal & photos.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkButton} />
          </TouchableOpacity>
        )}

        {/* Streak — real count; 0 until paired & checking in */}
        <View style={styles.streakCard}>
          <View style={styles.streakLeft}>
            <Text style={styles.streakNumber}>{streakCount}</Text>
            <Text style={styles.streakLabel}>
              {streakCount === 1 ? "day streak" : "day streak"}
            </Text>
          </View>
          {isPaired ? (
            <TouchableOpacity
              style={[
                styles.checkInBtn,
                checkedInToday && styles.checkInDone,
              ]}
              onPress={handleCheckIn}
              disabled={checkedInToday}
            >
              <Text style={styles.checkInText}>
                {checkedInToday ? "✓ Checked in" : "Check in"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.flame}>🔥</Text>
          )}
        </View>

        {/* Us card */}
        <Text style={styles.sectionTitle}>Us</Text>
        <View style={styles.usCard}>
          <View style={styles.usAvatars}>
            <View style={styles.usBubble}>
              <Text style={styles.usInitial}>
                {user?.name ? user.name.charAt(0).toUpperCase() : "B"}
              </Text>
            </View>
            <View style={[styles.usBubble, styles.usBubbleOverlap]}>
              <Text style={styles.usInitial}>{isPaired ? "♥" : "?"}</Text>
            </View>
          </View>
          <Text style={styles.usNames}>
            {isPaired
              ? `${user?.name?.split(" ")[0]} & Partner`
              : "You & ..."}
          </Text>
          <View style={styles.usMetaRow}>
            <View style={styles.usMeta}>
              <Text style={styles.usMetaNum}>
                {isPaired && daysTogether != null ? daysTogether : "—"}
              </Text>
              <Text style={styles.usMetaLabel}>days together</Text>
            </View>
            <View style={styles.usDivider} />
            <TouchableOpacity
              style={styles.usMeta}
              onPress={() => router.push("/(tabs)/profile")}
            >
              <Text style={styles.usMetaNum}>🗓️</Text>
              <Text style={styles.usMetaLabel}>set a date</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Photos */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Photos</Text>
          {isPaired && (
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.photoEmpty}>
          <Text style={styles.photoEmptyText}>
            {isPaired
              ? "No memories yet — tap + to add your first 📸"
              : "Your photos will appear here once you pair 📸"}
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 18, paddingBottom: 20 },

  greeting: {
    fontSize: 24,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    fontWeight: "700",
    marginTop: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginBottom: 18,
  },

  pairPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  pairEmoji: { fontSize: 30 },
  pairTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
  },
  pairHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },

  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 22,
  },
  streakLeft: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  streakNumber: {
    fontSize: 38,
    fontWeight: "700",
    color: COLORS.darkButton,
    fontFamily: FONTS.regular,
  },
  streakLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  flame: { fontSize: 38 },
  checkInBtn: {
    backgroundColor: COLORS.darkButton,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  checkInDone: { backgroundColor: COLORS.lightButton },
  checkInText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: FONTS.regular,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    marginBottom: 10,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 10,
  },
  seeAll: {
    fontSize: 13,
    color: COLORS.darkButton,
    fontFamily: FONTS.regular,
    fontWeight: "600",
  },

  usCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  usAvatars: { flexDirection: "row", marginBottom: 10 },
  usBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.lightButton,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  usBubbleOverlap: { marginLeft: -16, backgroundColor: COLORS.darkButton },
  usInitial: {
    fontSize: 22,
    color: COLORS.white,
    fontFamily: FONTS.regular,
    fontWeight: "700",
  },
  usNames: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    marginBottom: 14,
  },
  usMetaRow: { flexDirection: "row", alignItems: "center" },
  usMeta: { alignItems: "center", paddingHorizontal: 20 },
  usMetaNum: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
  },
  usMetaLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  usDivider: { width: 1, height: 34, backgroundColor: COLORS.border },

  photoEmpty: {
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  photoEmptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textAlign: "center",
  },
});