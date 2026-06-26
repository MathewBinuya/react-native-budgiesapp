import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../../components/AppHeader";
import COLORS from "../../constants/colors";
import FONTS from "../../constants/fonts";
import { useAuthStore } from "../../store/authStore";
import { useCoupleStore } from "../../store/coupleStore";

export default function Home() {
  const { user } = useAuthStore();
  const { streak, daysTogether, isPaired, loaded: coupleLoaded, loadCoupleData, checkIn } =
    useCoupleStore();

  // Refresh couple + streak data every time Home comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCoupleData();
    }, [])
  );

  const streakCount = streak?.count ?? 0;
  const checkedInToday = streak?.youCheckedInToday ?? false;

  const handleCheckIn = async () => {
    await checkIn();
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

        {/* Not paired → prompt to pair (only show after couple status is loaded) */}
        {coupleLoaded && !isPaired && (
          <TouchableOpacity
            style={styles.pairPrompt}
            onPress={() => router.push("/(onBoarding)/pair")}
          >
            <Text style={styles.pairEmoji}>🪺</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pairTitle}>Pair with your partner</Text>
              <Text style={styles.pairHint}>
                Link up to unlock streaks, photos, pet & more.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkButton} />
          </TouchableOpacity>
        )}

        {/* ── Streak ──────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Streak</Text>
        {!coupleLoaded ? (
          <View style={styles.loadingCard}><ActivityIndicator color={COLORS.darkButton} /></View>
        ) : isPaired ? (
          <View style={styles.streakCard}>
            <View style={styles.streakLeft}>
              <Text style={styles.streakNumber}>{streakCount}</Text>
              <Text style={styles.streakLabel}>
                {streakCount === 1 ? "day" : "days"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.checkInBtn, checkedInToday && styles.checkInDone]}
              onPress={handleCheckIn}
              disabled={checkedInToday}
            >
              <Text style={styles.checkInText}>
                {checkedInToday ? "✓ Checked in" : "Check in"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.lockedCard}>
            <Ionicons name="lock-closed" size={20} color={COLORS.textMuted} />
            <Text style={styles.lockedText}>
              Pair with someone to begin your shared streak.
            </Text>
          </View>
        )}

        {/* ── Us ──────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Partner Us</Text>
        {!coupleLoaded ? (
          <View style={styles.loadingCard}><ActivityIndicator color={COLORS.darkButton} /></View>
        ) : isPaired ? (
          <View style={styles.usCard}>
            <View style={styles.usAvatars}>
              <View style={styles.usBubble}>
                <Text style={styles.usInitial}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : "B"}
                </Text>
              </View>
              <View style={[styles.usBubble, styles.usBubbleOverlap]}>
                <Text style={styles.usInitial}>♥</Text>
              </View>
            </View>
            <Text style={styles.usNames}>
              {user?.name?.split(" ")[0]} & Partner
            </Text>
            <View style={styles.usMetaRow}>
              <View style={styles.usMeta}>
                <Text style={styles.usMetaNum}>
                  {daysTogether != null ? daysTogether : "—"}
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
        ) : (
          <View style={styles.lockedCard}>
            <Ionicons name="lock-closed" size={20} color={COLORS.textMuted} />
            <Text style={styles.lockedText}>
              Pair with someone to see your shared journey.
            </Text>
          </View>
        )}

        {/* ── Photos ──────────────────────────────────── */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>
            Photos
          </Text>
          {isPaired && (
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/photos")}
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          )}
        </View>

        {!coupleLoaded ? (
          <View style={styles.loadingCard}><ActivityIndicator color={COLORS.darkButton} /></View>
        ) : isPaired ? (
          <TouchableOpacity
            style={styles.photoEmpty}
            onPress={() => router.push("/(tabs)/photos")}
          >
            <Ionicons name="images-outline" size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.photoEmptyText}>
              Open your shared gallery to add memories 📸
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.lockedCard}>
            <Ionicons name="lock-closed" size={20} color={COLORS.textMuted} />
            <Text style={styles.lockedText}>
              Pair with someone to start sharing memories.
            </Text>
          </View>
        )}

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

  // Locked state shared by streak, us, photos
  lockedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
  },
  lockedText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },

  // Streak
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
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

  // Us card
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

  // Loading placeholder
  loadingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  // Photo section
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
