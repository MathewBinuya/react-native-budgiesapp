import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { useCallback, useState, useMemo } from "react";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../../components/AppHeader";
import FONTS from "../../constants/fonts";
import { useColors } from "../../hooks/useColors";
import { useAuthStore } from "../../store/authStore";
import { useCoupleStore } from "../../store/coupleStore";

// Small avatar bubble used in the Us card
function AvatarBubble({ name, avatar, accentColor, size = 56, style }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const bg = accentColor || "#D4638D";
  return (
    <View style={[{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: bg, alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }, style]}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text style={{ fontSize: size * 0.38, color: "#FFFFFF", fontWeight: "700", fontFamily: FONTS.regular }}>
          {initial}
        </Text>
      )}
    </View>
  );
}

// Avatar with checkmark badge used in the streak card
function CheckInBubble({ name, avatar, accentColor, checked, cardColor }) {
  const COLORS = useColors();
  const bg = accentColor || COLORS.darkButton;
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const size = 46;
  return (
    <View style={{ alignItems: "center", gap: 5 }}>
      <View>
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: checked ? bg : COLORS.border,
          alignItems: "center", justifyContent: "center",
          overflow: "hidden",
          opacity: checked ? 1 : 0.45,
        }}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={{ width: size, height: size }} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: size * 0.38, color: "#FFF", fontWeight: "700", fontFamily: FONTS.regular }}>
              {initial}
            </Text>
          )}
        </View>
        {checked ? (
          <View style={{
            position: "absolute", bottom: -2, right: -2,
            width: 18, height: 18, borderRadius: 9,
            backgroundColor: "#4CAF50",
            alignItems: "center", justifyContent: "center",
            borderWidth: 2, borderColor: cardColor || COLORS.card,
          }}>
            <Ionicons name="checkmark" size={10} color="#FFF" />
          </View>
        ) : (
          <View style={{
            position: "absolute", bottom: -2, right: -2,
            width: 18, height: 18, borderRadius: 9,
            backgroundColor: COLORS.border,
            alignItems: "center", justifyContent: "center",
            borderWidth: 2, borderColor: cardColor || COLORS.card,
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.textMuted }} />
          </View>
        )}
      </View>
      <Text style={{ fontSize: 11, color: checked ? COLORS.textColor : COLORS.textMuted, fontFamily: FONTS.regular, fontWeight: checked ? "600" : "400" }}>
        {name?.split(" ")[0] || "—"}
      </Text>
    </View>
  );
}

export default function Home() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const { user } = useAuthStore();
  const { streak, daysTogether, isPaired, couple, moods, bucketList,
    loaded: coupleLoaded, loadCoupleData, restoreStreak, setMood, fetchBucketList } =
    useCoupleStore();

  const [restoring, setRestoring] = useState(false);
  const [moodModal, setMoodModal] = useState(false);
  const [settingMood, setSettingMood] = useState(false);

  const partner = couple?.members?.find(
    (m) => m._id?.toString() !== user?.id?.toString(),
  );
  const myAccent = user?.accentColor || COLORS.darkButton;

  useFocusEffect(
    useCallback(() => {
      loadCoupleData();
      fetchBucketList();
    }, [])
  );

  const MOODS = [
    { emoji: "🥰", label: "Loved" },
    { emoji: "😊", label: "Happy" },
    { emoji: "🤩", label: "Excited" },
    { emoji: "😴", label: "Tired" },
    { emoji: "😰", label: "Stressed" },
    { emoji: "😔", label: "Sad" },
  ];

  const myMood    = moods?.[user?.id] ?? null;
  const partnerMood = partner ? (moods?.[partner._id?.toString()] ?? null) : null;

  const pickMood = async (emoji, label) => {
    setSettingMood(true);
    await setMood(emoji, label);
    setSettingMood(false);
    setMoodModal(false);
  };

  const previewBucket = bucketList.filter((i) => !i.completedAt).slice(0, 3);

  const streakCount = streak?.count ?? 0;
  const completedToday = streak?.completedToday ?? false;
  const youCheckedIn = streak?.youCheckedInToday ?? false;
  const partnerCheckedIn = streak?.partnerCheckedInToday ?? false;
  const bothOpenedToday = streak?.bothOpenedToday ?? false;

  const canRestore =
    (streak?.brokenCount ?? 0) > 0 &&
    (streak?.restores ?? 0) > 0 &&
    streakCount <= 1;

  const handleRestore = () => {
    Alert.alert(
      "Restore streak?",
      `Bring back your ${streak.brokenCount}-day streak. You have ${streak.restores} restore${streak.restores === 1 ? "" : "s"} left this month.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            setRestoring(true);
            const result = await restoreStreak();
            setRestoring(false);
            if (!result.success) Alert.alert("Couldn't restore", result.error);
          },
        },
      ]
    );
  };

  const streakStatusText = () => {
    if (bothOpenedToday) return "Both of you opened today 💕";
    if (youCheckedIn && !partnerCheckedIn) return "You're in — waiting for partner";
    if (!youCheckedIn && partnerCheckedIn) return "Partner opened — open to continue!";
    return "Open the app to keep your flame alive";
  };

  return (
    <View style={styles.safe}>
      <AppHeader title="Home" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>
          Hi {user?.name?.split(" ")[0] || "there"} 🌿
        </Text>
        <Text style={styles.subGreeting}>here's your nest today</Text>

        {coupleLoaded && !isPaired && (
          <TouchableOpacity style={styles.pairPrompt} onPress={() => router.push("/(onBoarding)/pair")}>
            <Text style={styles.pairEmoji}>🪺</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pairTitle}>Pair with your partner</Text>
              <Text style={styles.pairHint}>Link up to unlock streaks, photos, pet & more.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkButton} />
          </TouchableOpacity>
        )}

        {/* ── Streak ── */}
        <Text style={styles.sectionTitle}>Streak</Text>
        {!coupleLoaded ? (
          <View style={styles.loadingCard}><ActivityIndicator color={COLORS.darkButton} /></View>
        ) : isPaired ? (
          <>
            <View style={styles.streakCard}>
              {/* Top row: flame+count on left, avatar bubbles on right */}
              <View style={styles.streakTopRow}>
                <View style={styles.streakCountWrap}>
                  <Text style={styles.streakFlame}>🔥</Text>
                  <View>
                    <Text style={styles.streakNumber}>{streakCount}</Text>
                    <Text style={styles.streakDayLabel}>{streakCount === 1 ? "day streak" : "day streak"}</Text>
                  </View>
                </View>
                <View style={styles.streakBubbles}>
                  <CheckInBubble
                    name={user?.name}
                    avatar={user?.avatar}
                    accentColor={myAccent}
                    checked={youCheckedIn}
                    cardColor={COLORS.card}
                  />
                  <CheckInBubble
                    name={partner?.name}
                    avatar={partner?.avatar}
                    accentColor={partner?.accentColor || COLORS.lightButton}
                    checked={partnerCheckedIn}
                    cardColor={COLORS.card}
                  />
                </View>
              </View>

              {/* Divider + status */}
              <View style={styles.streakDivider} />
              <Text style={[styles.streakStatus, bothOpenedToday && styles.streakStatusDone]}>
                {streakStatusText()}
              </Text>
            </View>

            {canRestore && (
              <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={restoring}>
                {restoring ? (
                  <ActivityIndicator size="small" color={COLORS.darkButton} />
                ) : (
                  <>
                    <Ionicons name="refresh-circle-outline" size={18} color={COLORS.darkButton} />
                    <Text style={styles.restoreText}>
                      Restore {streak.brokenCount}-day streak · {streak.restores} left this month
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.lockedCard}>
            <Ionicons name="lock-closed" size={20} color={COLORS.textMuted} />
            <Text style={styles.lockedText}>Pair with someone to begin your shared streak.</Text>
          </View>
        )}

        {/* ── Mood ring ── */}
        {isPaired && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Today's vibes</Text>
            <View style={styles.moodCard}>
              {/* My mood */}
              <TouchableOpacity style={styles.moodSlot} onPress={() => setMoodModal(true)} activeOpacity={0.75}>
                <View style={[styles.moodBubble, { backgroundColor: myAccent + "22" }]}>
                  <Text style={styles.moodEmoji}>{myMood?.emoji || "＋"}</Text>
                </View>
                <Text style={styles.moodName}>{user?.name?.split(" ")[0]}</Text>
                <Text style={styles.moodLabel}>{myMood?.label || "Set mood"}</Text>
              </TouchableOpacity>

              <View style={styles.moodDivider} />

              {/* Partner mood */}
              <View style={styles.moodSlot}>
                <View style={[styles.moodBubble, { backgroundColor: (partner?.accentColor || COLORS.lightButton) + "22" }]}>
                  <Text style={styles.moodEmoji}>{partnerMood?.emoji || "•••"}</Text>
                </View>
                <Text style={styles.moodName}>{partner?.name?.split(" ")[0] || "Partner"}</Text>
                <Text style={styles.moodLabel}>{partnerMood?.label || "Not set yet"}</Text>
              </View>
            </View>
          </>
        )}

        {/* ── Us ── */}
        <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Us</Text>
        {!coupleLoaded ? (
          <View style={styles.loadingCard}><ActivityIndicator color={COLORS.darkButton} /></View>
        ) : isPaired ? (
          <View style={styles.usCard}>
            <View style={styles.usAvatars}>
              <AvatarBubble
                name={user?.name}
                avatar={user?.avatar}
                accentColor={myAccent}
                size={58}
              />
              <AvatarBubble
                name={partner?.name}
                avatar={partner?.avatar}
                accentColor={partner?.accentColor || COLORS.lightButton}
                size={58}
                style={styles.partnerOverlap}
              />
            </View>
            <Text style={styles.usNames}>
              {user?.name?.split(" ")[0]} & {partner?.name?.split(" ")[0] || "Partner"}
            </Text>
            <View style={styles.usMetaRow}>
              <View style={styles.usMeta}>
                <Text style={styles.usMetaNum}>{daysTogether != null ? daysTogether : "—"}</Text>
                <Text style={styles.usMetaLabel}>days together</Text>
              </View>
              <View style={styles.usDivider} />
              <TouchableOpacity style={styles.usMeta} onPress={() => router.push("/(tabs)/profile")}>
                <Text style={styles.usMetaNum}>🗓️</Text>
                <Text style={styles.usMetaLabel}>set a date</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.lockedCard}>
            <Ionicons name="lock-closed" size={20} color={COLORS.textMuted} />
            <Text style={styles.lockedText}>Pair with someone to see your shared journey.</Text>
          </View>
        )}

        {/* ── Bucket list preview ── */}
        {isPaired && (
          <>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Bucket list</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/bucket")}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.bucketCard} onPress={() => router.push("/(tabs)/bucket")} activeOpacity={0.85}>
              {previewBucket.length === 0 ? (
                <View style={styles.bucketEmpty}>
                  <Text style={styles.bucketEmptyEmoji}>🌍</Text>
                  <Text style={styles.bucketEmptyText}>Add things you want to do together</Text>
                </View>
              ) : (
                previewBucket.map((item, i) => (
                  <View key={item._id} style={[styles.bucketRow, i < previewBucket.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.border }]}>
                    <View style={styles.bucketDot} />
                    <Text style={styles.bucketItemText} numberOfLines={1}>{item.text}</Text>
                  </View>
                ))
              )}
              {bucketList.filter((i) => !i.completedAt).length > 3 && (
                <Text style={styles.bucketMore}>+{bucketList.filter((i) => !i.completedAt).length - 3} more</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* ── Photos ── */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Photos</Text>
          {isPaired && (
            <TouchableOpacity onPress={() => router.push("/(tabs)/photos")}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          )}
        </View>
        {!coupleLoaded ? (
          <View style={styles.loadingCard}><ActivityIndicator color={COLORS.darkButton} /></View>
        ) : isPaired ? (
          <TouchableOpacity style={styles.photoEmpty} onPress={() => router.push("/(tabs)/photos")}>
            <Ionicons name="images-outline" size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.photoEmptyText}>Open your shared gallery to add memories 📸</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.lockedCard}>
            <Ionicons name="lock-closed" size={20} color={COLORS.textMuted} />
            <Text style={styles.lockedText}>Pair with someone to start sharing memories.</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Mood picker modal */}
      <Modal visible={moodModal} transparent animationType="slide">
        <View style={styles.moodOverlay}>
          <View style={styles.moodSheet}>
            <View style={styles.moodSheetHandle} />
            <Text style={styles.moodSheetTitle}>How are you feeling?</Text>
            {settingMood ? (
              <ActivityIndicator color={COLORS.darkButton} style={{ marginVertical: 32 }} />
            ) : (
              <View style={styles.moodGrid}>
                {MOODS.map((m) => (
                  <TouchableOpacity
                    key={m.emoji}
                    style={[styles.moodOption, myMood?.emoji === m.emoji && { backgroundColor: COLORS.darkButton + "18", borderColor: COLORS.darkButton, borderWidth: 1.5 }]}
                    onPress={() => pickMood(m.emoji, m.label)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.moodOptionEmoji}>{m.emoji}</Text>
                    <Text style={[styles.moodOptionLabel, myMood?.emoji === m.emoji && { color: COLORS.darkButton, fontWeight: "700" }]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.moodCancel} onPress={() => setMoodModal(false)}>
              <Text style={styles.moodCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    scroll: { paddingHorizontal: 18, paddingBottom: 20 },

    greeting: { fontSize: 24, color: C.textColor, fontFamily: FONTS.regular, fontWeight: "700", marginTop: 4 },
    subGreeting: { fontSize: 14, color: C.textMuted, fontFamily: FONTS.regular, marginBottom: 18 },

    pairPrompt: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 18,
    },
    pairEmoji: { fontSize: 30 },
    pairTitle: { fontSize: 15, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular },
    pairHint: { fontSize: 12, color: C.textMuted, fontFamily: FONTS.regular, marginTop: 2 },

    sectionTitle: { fontSize: 17, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular, marginBottom: 10 },
    sectionRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      marginTop: 22, marginBottom: 10,
    },
    seeAll: { fontSize: 13, color: C.darkButton, fontFamily: FONTS.regular, fontWeight: "600" },

    lockedCard: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: C.card, borderRadius: 18, padding: 18,
    },
    lockedText: { flex: 1, fontSize: 14, color: C.textMuted, fontFamily: FONTS.regular, lineHeight: 20 },

    // Streak
    streakCard: {
      backgroundColor: C.card, borderRadius: 20, padding: 20,
    },
    streakTopRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      marginBottom: 16,
    },
    streakCountWrap: { flexDirection: "row", alignItems: "center", gap: 12 },
    streakFlame: { fontSize: 38 },
    streakNumber: { fontSize: 42, fontWeight: "700", color: C.darkButton, fontFamily: FONTS.regular, lineHeight: 48 },
    streakDayLabel: { fontSize: 12, color: C.textMuted, fontFamily: FONTS.regular, marginTop: 1 },
    streakBubbles: { flexDirection: "row", gap: 14 },
    streakDivider: { height: 1, backgroundColor: C.border, marginBottom: 12 },
    streakStatus: { fontSize: 13, color: C.textMuted, fontFamily: FONTS.regular },
    streakStatusDone: { color: C.darkButton, fontWeight: "600" },
    restoreBtn: {
      flexDirection: "row", alignItems: "center", gap: 8,
      marginTop: 10, backgroundColor: C.card, borderRadius: 14,
      paddingVertical: 12, paddingHorizontal: 16,
      borderWidth: 1, borderColor: C.border,
    },
    restoreText: { flex: 1, fontSize: 13, color: C.darkButton, fontFamily: FONTS.regular, fontWeight: "600" },

    // Us card
    usCard: { backgroundColor: C.card, borderRadius: 20, padding: 20, alignItems: "center" },
    usAvatars: { flexDirection: "row", marginBottom: 10 },
    partnerOverlap: { marginLeft: -18, borderWidth: 2, borderColor: C.card },
    usNames: {
      fontSize: 16, fontWeight: "700", color: C.textColor,
      fontFamily: FONTS.regular, marginBottom: 14,
    },
    usMetaRow: { flexDirection: "row", alignItems: "center" },
    usMeta: { alignItems: "center", paddingHorizontal: 20 },
    usMetaNum: { fontSize: 20, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular },
    usMetaLabel: { fontSize: 12, color: C.textMuted, fontFamily: FONTS.regular, marginTop: 2 },
    usDivider: { width: 1, height: 34, backgroundColor: C.border },

    loadingCard: {
      backgroundColor: C.card, borderRadius: 18, paddingVertical: 24,
      alignItems: "center", justifyContent: "center",
    },

    // Mood ring
    moodCard: { flexDirection: "row", backgroundColor: C.card, borderRadius: 20, padding: 20, alignItems: "center" },
    moodSlot: { flex: 1, alignItems: "center", gap: 6 },
    moodBubble: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
    moodEmoji: { fontSize: 28 },
    moodName: { fontSize: 13, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular },
    moodLabel: { fontSize: 11, color: C.textMuted, fontFamily: FONTS.regular },
    moodDivider: { width: 1, height: 60, backgroundColor: C.border, marginHorizontal: 12 },

    // Mood sheet
    moodOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    moodSheet: { backgroundColor: C.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12 },
    moodSheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 18 },
    moodSheetTitle: { fontSize: 17, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular, textAlign: "center", marginBottom: 20 },
    moodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 20 },
    moodOption: { width: "30%", alignItems: "center", gap: 6, paddingVertical: 14, borderRadius: 16, backgroundColor: C.card },
    moodOptionEmoji: { fontSize: 30 },
    moodOptionLabel: { fontSize: 12, color: C.textMuted, fontFamily: FONTS.regular },
    moodCancel: { alignItems: "center", paddingVertical: 14 },
    moodCancelText: { fontSize: 15, color: C.textMuted, fontFamily: FONTS.regular },

    // Bucket list preview
    bucketCard: { backgroundColor: C.card, borderRadius: 20, overflow: "hidden" },
    bucketRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 18, gap: 12 },
    bucketDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.darkButton, flexShrink: 0 },
    bucketItemText: { flex: 1, fontSize: 14, color: C.textColor, fontFamily: FONTS.regular },
    bucketEmpty: { flexDirection: "row", alignItems: "center", gap: 12, padding: 18 },
    bucketEmptyEmoji: { fontSize: 22 },
    bucketEmptyText: { flex: 1, fontSize: 13, color: C.textMuted, fontFamily: FONTS.regular },
    bucketMore: { fontSize: 12, color: C.textMuted, fontFamily: FONTS.regular, textAlign: "center", paddingBottom: 12 },

    photoEmpty: {
      borderRadius: 16, backgroundColor: C.card,
      alignItems: "center", justifyContent: "center",
      paddingHorizontal: 20, paddingVertical: 28,
    },
    photoEmptyText: { fontSize: 13, color: C.textMuted, fontFamily: FONTS.regular, textAlign: "center" },
  });
}
