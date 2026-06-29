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
import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../../components/AppHeader";
import FONTS from "../../constants/fonts";
import { useColors } from "../../hooks/useColors";
import { useAuthStore } from "../../store/authStore";
import { useCoupleStore } from "../../store/coupleStore";

// ─── Shared avatar bubble ────────────────────────────────────────────────────

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

// ─── Check-in bubble for streak card ────────────────────────────────────────

function CheckInBubble({ name, avatar, accentColor, checked, cardColor }) {
  const COLORS = useColors();
  const bg = accentColor || COLORS.darkButton;
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const size = 44;
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <View>
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: checked ? bg : COLORS.border,
          alignItems: "center", justifyContent: "center",
          overflow: "hidden",
          opacity: checked ? 1 : 0.4,
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
            width: 17, height: 17, borderRadius: 9,
            backgroundColor: "#4CAF50",
            alignItems: "center", justifyContent: "center",
            borderWidth: 2, borderColor: cardColor || COLORS.card,
          }}>
            <Ionicons name="checkmark" size={9} color="#FFF" />
          </View>
        ) : (
          <View style={{
            position: "absolute", bottom: -2, right: -2,
            width: 17, height: 17, borderRadius: 9,
            backgroundColor: COLORS.border,
            alignItems: "center", justifyContent: "center",
            borderWidth: 2, borderColor: cardColor || COLORS.card,
          }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.textMuted }} />
          </View>
        )}
      </View>
      <Text style={{
        fontSize: 11,
        color: checked ? COLORS.textColor : COLORS.textMuted,
        fontFamily: FONTS.regular,
        fontWeight: checked ? "600" : "400",
      }}>
        {name?.split(" ")[0] || "—"}
      </Text>
    </View>
  );
}

// ─── Hero card ───────────────────────────────────────────────────────────────

function HeroCard({ user, partner, daysTogether }) {
  const COLORS = useColors();
  const myAccent = user?.accentColor || COLORS.darkButton;
  const partnerAccent = partner?.accentColor || COLORS.lightButton;
  return (
    <View style={{
      backgroundColor: COLORS.card, borderRadius: 24, padding: 26,
      alignItems: "center", marginBottom: 14,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <AvatarBubble name={user?.name} avatar={user?.avatar} accentColor={myAccent} size={70} />
        <Text style={{ fontSize: 22 }}>❤️</Text>
        <AvatarBubble name={partner?.name} avatar={partner?.avatar} accentColor={partnerAccent} size={70} />
      </View>
      <Text style={{
        fontSize: 20, fontWeight: "700",
        color: COLORS.textColor, fontFamily: FONTS.regular,
        marginBottom: 10,
      }}>
        {user?.name?.split(" ")[0]} & {partner?.name?.split(" ")[0] || "Partner"}
      </Text>
      {daysTogether != null && (
        <View style={{
          backgroundColor: COLORS.darkButton + "16",
          borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
        }}>
          <Text style={{
            fontSize: 13, fontWeight: "600",
            color: COLORS.darkButton, fontFamily: FONTS.regular,
          }}>
            ✨ {daysTogether} days together
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── 7-day streak heatmap helper ─────────────────────────────────────────────

function computeHeatmap(streak) {
  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = streak?.count ?? 0;

  let lastMs = null;
  if (streak?.lastCheckIn) {
    const [y, m, d] = streak.lastCheckIn.split("-").map(Number);
    lastMs = new Date(y, m - 1, d).getTime();
  }

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dMs = d.getTime();
    let filled = false;
    if (lastMs !== null && count > 0) {
      const diff = Math.round((lastMs - dMs) / 86400000);
      filled = diff >= 0 && diff < count;
    }
    return { label: DAY_LABELS[d.getDay()], filled, isToday: i === 6 };
  });
}

// ─── Constants outside component ─────────────────────────────────────────────

const MOODS = [
  { emoji: "🥰", label: "Loved" },
  { emoji: "😊", label: "Happy" },
  { emoji: "🤩", label: "Excited" },
  { emoji: "😴", label: "Tired" },
  { emoji: "😰", label: "Stressed" },
  { emoji: "😔", label: "Sad" },
];

const QUICK_ACTIONS = [
  { icon: "images-outline", label: "Photos", route: "/(tabs)/photos" },
  { icon: "create-outline", label: "Write", route: "/(tabs)/write" },
  { icon: "egg-outline", label: "Pet", route: "/(tabs)/pet" },
  { icon: "gift-outline", label: "Jar", route: "/(tabs)/jar" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getDateStr() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function Home() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const { user } = useAuthStore();
  const {
    streak, daysTogether, isPaired, couple, moods, bucketList, loveJar,
    loaded: coupleLoaded, loadCoupleData, restoreStreak, setMood, fetchBucketList, fetchLoveJar,
  } = useCoupleStore();

  const [restoring, setRestoring] = useState(false);
  const [moodModal, setMoodModal] = useState(false);
  const [settingMood, setSettingMood] = useState(false);

  const partner = couple?.members?.find(
    (m) => m._id?.toString() !== user?.id?.toString()
  );
  const myAccent = user?.accentColor || COLORS.darkButton;

  useFocusEffect(
    useCallback(() => {
      loadCoupleData();
      fetchBucketList();
      fetchLoveJar();
    }, [])
  );

  const myMood = moods?.[user?.id] ?? null;
  const partnerMood = partner ? (moods?.[partner._id?.toString()] ?? null) : null;

  const pickMood = async (emoji, label) => {
    setSettingMood(true);
    await setMood(emoji, label);
    setSettingMood(false);
    setMoodModal(false);
  };

  const previewBucket = bucketList.filter((i) => !i.completedAt).slice(0, 3);
  const remainingBucket = bucketList.filter((i) => !i.completedAt).length;

  const streakCount = streak?.count ?? 0;
  const youCheckedIn = streak?.youCheckedInToday ?? false;
  const partnerCheckedIn = streak?.partnerCheckedInToday ?? false;
  const bothOpenedToday = streak?.bothOpenedToday ?? false;
  const heatmap = computeHeatmap(streak);

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
    if (youCheckedIn && !partnerCheckedIn) return "You're in — waiting for your partner";
    if (!youCheckedIn && partnerCheckedIn) return "Your partner opened — now it's your turn";
    return "Open the app together to keep your flame alive";
  };

  return (
    <View style={styles.safe}>
      <AppHeader title="Home" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Greeting */}
        <Text style={styles.greeting}>
          {getGreeting()}, {user?.name?.split(" ")[0] || "there"} 🌿
        </Text>
        <Text style={styles.greetingDate}>{getDateStr()}</Text>

        {/* Pair prompt */}
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

        {/* Hero card */}
        {coupleLoaded && isPaired && (
          <HeroCard user={user} partner={partner} daysTogether={daysTogether} />
        )}

        {/* Quick actions */}
        {isPaired && (
          <View style={styles.quickRow}>
            {QUICK_ACTIONS.map(({ icon, label, route }) => (
              <TouchableOpacity
                key={label}
                style={styles.quickBtn}
                onPress={() => router.push(route)}
                activeOpacity={0.75}
              >
                <Ionicons name={icon} size={20} color={COLORS.darkButton} />
                <Text style={styles.quickLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Streak card */}
        {!coupleLoaded ? (
          <View style={styles.loadingCard}><ActivityIndicator color={COLORS.darkButton} /></View>
        ) : isPaired ? (
          <>
            <View style={styles.streakCard}>
              <View style={styles.streakTopRow}>
                <View style={styles.streakCountWrap}>
                  <Text style={styles.streakFlame}>🔥</Text>
                  <View>
                    <Text style={styles.streakNumber}>{streakCount}</Text>
                    <Text style={styles.streakDayLabel}>day streak</Text>
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

              {/* 7-day heatmap */}
              <View style={styles.heatmapRow}>
                {heatmap.map((dot, i) => (
                  <View key={i} style={styles.heatmapDot}>
                    <View style={[
                      styles.heatmapCircle,
                      {
                        backgroundColor: dot.filled
                          ? COLORS.darkButton
                          : dot.isToday
                            ? COLORS.darkButton + "28"
                            : COLORS.border,
                        borderWidth: dot.isToday && !dot.filled ? 1.5 : 0,
                        borderColor: COLORS.darkButton + "55",
                      },
                    ]} />
                    <Text style={[
                      styles.heatmapLabel,
                      dot.isToday && { color: COLORS.darkButton, fontWeight: "700" },
                    ]}>
                      {dot.label}
                    </Text>
                  </View>
                ))}
              </View>

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

        {/* Mood ring */}
        {isPaired && (
          <>
            <Text style={styles.miniLabel}>Today's vibes</Text>
            <View style={styles.moodCard}>
              <TouchableOpacity style={styles.moodSlot} onPress={() => setMoodModal(true)} activeOpacity={0.75}>
                <View style={[styles.moodBubble, { backgroundColor: myAccent + "22" }]}>
                  <Text style={styles.moodEmoji}>{myMood?.emoji || "＋"}</Text>
                </View>
                <Text style={styles.moodName}>{user?.name?.split(" ")[0]}</Text>
                <Text style={styles.moodLabel}>{myMood?.label || "Set mood"}</Text>
              </TouchableOpacity>

              <View style={styles.moodDivider} />

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

        {/* Bucket list preview */}
        {isPaired && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Bucket list</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/bucket")}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.bucketCard}
              onPress={() => router.push("/(tabs)/bucket")}
              activeOpacity={0.85}
            >
              {previewBucket.length === 0 ? (
                <View style={styles.bucketEmpty}>
                  <Text style={styles.bucketEmptyEmoji}>🌍</Text>
                  <Text style={styles.bucketEmptyText}>Add things you want to do together</Text>
                </View>
              ) : (
                previewBucket.map((item, i) => (
                  <View
                    key={item._id}
                    style={[styles.bucketRow, i < previewBucket.length - 1 && styles.bucketRowBorder]}
                  >
                    <View style={styles.bucketDot} />
                    <Text style={styles.bucketItemText} numberOfLines={1}>{item.text}</Text>
                  </View>
                ))
              )}
              {remainingBucket > 3 && (
                <Text style={styles.bucketMore}>+{remainingBucket - 3} more</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Love Jar preview */}
        {isPaired && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Love Jar 🫙</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/jar")}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.bucketCard}
              onPress={() => router.push("/(tabs)/jar")}
              activeOpacity={0.85}
            >
              {loveJar.filter((i) => !i.claimedAt).length === 0 ? (
                <View style={styles.bucketEmpty}>
                  <Text style={styles.bucketEmptyEmoji}>🫙</Text>
                  <Text style={styles.bucketEmptyText}>Add sweet acts of love for each other</Text>
                </View>
              ) : (
                loveJar.filter((i) => !i.claimedAt).slice(0, 3).map((item, i, arr) => (
                  <View
                    key={item._id}
                    style={[styles.bucketRow, i < arr.length - 1 && styles.bucketRowBorder]}
                  >
                    <Text style={{ fontSize: 14 }}>🎁</Text>
                    <Text style={styles.bucketItemText} numberOfLines={1}>{item.text}</Text>
                  </View>
                ))
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
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
                    style={[
                      styles.moodOption,
                      myMood?.emoji === m.emoji && {
                        backgroundColor: COLORS.darkButton + "18",
                        borderColor: COLORS.darkButton,
                        borderWidth: 1.5,
                      },
                    ]}
                    onPress={() => pickMood(m.emoji, m.label)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.moodOptionEmoji}>{m.emoji}</Text>
                    <Text style={[
                      styles.moodOptionLabel,
                      myMood?.emoji === m.emoji && { color: COLORS.darkButton, fontWeight: "700" },
                    ]}>
                      {m.label}
                    </Text>
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

    greeting: {
      fontSize: 26, color: C.textColor, fontFamily: FONTS.regular,
      fontWeight: "700", marginTop: 6,
    },
    greetingDate: {
      fontSize: 13, color: C.textMuted, fontFamily: FONTS.regular,
      marginBottom: 20,
    },

    pairPrompt: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: C.card, borderRadius: 20, padding: 18, marginBottom: 16,
    },
    pairEmoji: { fontSize: 30 },
    pairTitle: { fontSize: 15, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular },
    pairHint: { fontSize: 12, color: C.textMuted, fontFamily: FONTS.regular, marginTop: 2 },

    quickRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    quickBtn: {
      flex: 1, backgroundColor: C.card, borderRadius: 18,
      paddingVertical: 14, alignItems: "center", gap: 7,
    },
    quickLabel: {
      fontSize: 11, color: C.textMuted, fontFamily: FONTS.regular, fontWeight: "600",
    },

    miniLabel: {
      fontSize: 12, color: C.textMuted, fontFamily: FONTS.regular,
      fontWeight: "600", marginBottom: 8, marginTop: 6,
    },
    sectionTitle: {
      fontSize: 17, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular,
    },
    sectionRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      marginBottom: 10, marginTop: 6,
    },
    seeAll: { fontSize: 13, color: C.darkButton, fontFamily: FONTS.regular, fontWeight: "600" },

    lockedCard: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: C.card, borderRadius: 18, padding: 18, marginBottom: 16,
    },
    lockedText: {
      flex: 1, fontSize: 14, color: C.textMuted, fontFamily: FONTS.regular, lineHeight: 20,
    },

    streakCard: { backgroundColor: C.card, borderRadius: 22, padding: 20, marginBottom: 12 },
    streakTopRow: {
      flexDirection: "row", alignItems: "center",
      justifyContent: "space-between", marginBottom: 18,
    },
    streakCountWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
    streakFlame: { fontSize: 36 },
    streakNumber: {
      fontSize: 44, fontWeight: "700", color: C.darkButton,
      fontFamily: FONTS.regular, lineHeight: 50,
    },
    streakDayLabel: { fontSize: 11, color: C.textMuted, fontFamily: FONTS.regular },
    streakBubbles: { flexDirection: "row", gap: 12 },

    heatmapRow: {
      flexDirection: "row", justifyContent: "space-between",
      marginBottom: 16, paddingHorizontal: 2,
    },
    heatmapDot: { alignItems: "center", gap: 5, flex: 1 },
    heatmapCircle: { width: 28, height: 28, borderRadius: 14 },
    heatmapLabel: {
      fontSize: 10, color: C.textMuted, fontFamily: FONTS.regular, fontWeight: "500",
    },

    streakDivider: { height: 1, backgroundColor: C.border, marginBottom: 12 },
    streakStatus: { fontSize: 13, color: C.textMuted, fontFamily: FONTS.regular },
    streakStatusDone: { color: C.darkButton, fontWeight: "600" },

    restoreBtn: {
      flexDirection: "row", alignItems: "center", gap: 8,
      marginBottom: 12, backgroundColor: C.card, borderRadius: 14,
      paddingVertical: 12, paddingHorizontal: 16,
      borderWidth: 1, borderColor: C.border,
    },
    restoreText: {
      flex: 1, fontSize: 13, color: C.darkButton, fontFamily: FONTS.regular, fontWeight: "600",
    },

    moodCard: {
      flexDirection: "row", backgroundColor: C.card, borderRadius: 20,
      padding: 20, alignItems: "center", marginBottom: 16,
    },
    moodSlot: { flex: 1, alignItems: "center", gap: 6 },
    moodBubble: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
    moodEmoji: { fontSize: 28 },
    moodName: { fontSize: 13, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular },
    moodLabel: { fontSize: 11, color: C.textMuted, fontFamily: FONTS.regular },
    moodDivider: { width: 1, height: 60, backgroundColor: C.border, marginHorizontal: 12 },

    moodOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    moodSheet: {
      backgroundColor: C.background, borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
    },
    moodSheetHandle: {
      width: 36, height: 4, borderRadius: 2, backgroundColor: C.border,
      alignSelf: "center", marginBottom: 18,
    },
    moodSheetTitle: {
      fontSize: 17, fontWeight: "700", color: C.textColor,
      fontFamily: FONTS.regular, textAlign: "center", marginBottom: 20,
    },
    moodGrid: {
      flexDirection: "row", flexWrap: "wrap", gap: 10,
      justifyContent: "center", marginBottom: 20,
    },
    moodOption: {
      width: "30%", alignItems: "center", gap: 6,
      paddingVertical: 14, borderRadius: 16, backgroundColor: C.card,
    },
    moodOptionEmoji: { fontSize: 30 },
    moodOptionLabel: { fontSize: 12, color: C.textMuted, fontFamily: FONTS.regular },
    moodCancel: { alignItems: "center", paddingVertical: 14 },
    moodCancelText: { fontSize: 15, color: C.textMuted, fontFamily: FONTS.regular },

    bucketCard: { backgroundColor: C.card, borderRadius: 20, overflow: "hidden", marginBottom: 16 },
    bucketRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 18, gap: 12 },
    bucketRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    bucketDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.darkButton, flexShrink: 0 },
    bucketItemText: { flex: 1, fontSize: 14, color: C.textColor, fontFamily: FONTS.regular },
    bucketEmpty: { flexDirection: "row", alignItems: "center", gap: 12, padding: 18 },
    bucketEmptyEmoji: { fontSize: 22 },
    bucketEmptyText: { flex: 1, fontSize: 13, color: C.textMuted, fontFamily: FONTS.regular },
    bucketMore: {
      fontSize: 12, color: C.textMuted, fontFamily: FONTS.regular,
      textAlign: "center", paddingBottom: 12,
    },

    loadingCard: {
      backgroundColor: C.card, borderRadius: 18, paddingVertical: 24,
      alignItems: "center", justifyContent: "center", marginBottom: 16,
    },
  });
}
