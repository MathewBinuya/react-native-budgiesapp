import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useEffect } from "react";
import AppHeader from "../../components/AppHeader";
import COLORS from "../../constants/colors";
import FONTS from "../../constants/fonts";
import { useAuthStore } from "../../store/authStore";
import { usePetStore } from "../../store/petStore";

const STAGE_EMOJI = { egg: "🥚", chick: "🐣", budgie: "🦜" };
const STAGE_LABEL = { egg: "Egg", chick: "Chick", budgie: "Budgie" };
const MOOD_EMOJI = { happy: "😊", content: "😌", sad: "😢" };

const EVOLVE_HINT = {
  egg: "Care together every day to hatch the egg!",
  chick: "Almost a budgie — keep it up!",
  budgie: "Mochi is fully grown 🌿",
};

function StatBar({ label, value, color }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.round(value)}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.statValue}>{Math.round(value)}%</Text>
    </View>
  );
}

export default function Pet() {
  const { user } = useAuthStore();
  const { pet, loading, loadPet, feedPet, playWithPet } = usePetStore();
  const isPaired = !!user?.couple;

  useEffect(() => {
    if (isPaired) loadPet();
  }, [isPaired]);

  const handleFeed = async () => {
    const result = await feedPet();
    if (!result.success) Alert.alert("Oops", result.error);
  };

  const handlePlay = async () => {
    const result = await playWithPet();
    if (!result.success) Alert.alert("Oops", result.error);
  };

  if (!isPaired) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Mochi" />
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>🥚</Text>
          <Text style={styles.heading}>Pair to meet Mochi</Text>
          <Text style={styles.sub}>
            Link up with your partner to hatch and raise your shared budgie
            together.
          </Text>
        </View>
      </View>
    );
  }

  if (loading && !pet) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Mochi" />
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.darkButton} />
        </View>
      </View>
    );
  }

  const stage = pet?.stage ?? "egg";
  const mood = pet?.mood ?? "content";
  const fullness = pet?.fullness ?? 70;
  const happiness = pet?.happiness ?? 70;
  const bothCaredToday = pet?.bothCaredToday ?? false;
  const name = pet?.name ?? "Mochi";

  return (
    <View style={styles.safe}>
      <AppHeader title="Mochi" />

      <View style={styles.content}>
        <Text style={styles.stageLabel}>{STAGE_LABEL[stage]}</Text>

        <View style={styles.petCircle}>
          <Text style={styles.petEmoji}>{STAGE_EMOJI[stage]}</Text>
          <Text style={styles.moodBadge}>{MOOD_EMOJI[mood]}</Text>
        </View>

        <Text style={styles.petName}>{name}</Text>

        {bothCaredToday ? (
          <View style={styles.togetherBadge}>
            <Text style={styles.togetherText}>Both cared today ✨</Text>
          </View>
        ) : (
          <Text style={styles.partnerHint}>
            Care together daily to help {name} grow
          </Text>
        )}

        <View style={styles.statsCard}>
          <StatBar
            label="Fullness"
            value={fullness}
            color={COLORS.darkButton}
          />
          <StatBar
            label="Happiness"
            value={happiness}
            color={COLORS.lightButton}
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.darkButton }]}
            onPress={handleFeed}
          >
            <Text style={styles.actionEmoji}>🌾</Text>
            <Text style={styles.actionText}>Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.lightButton }]}
            onPress={handlePlay}
          >
            <Text style={styles.actionEmoji}>🎾</Text>
            <Text style={styles.actionText}>Play</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.evolveHint}>{EVOLVE_HINT[stage]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
  },

  stageLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 14,
  },

  petCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  petEmoji: { fontSize: 76 },
  moodBadge: {
    fontSize: 26,
    position: "absolute",
    bottom: 8,
    right: 8,
  },

  petName: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    marginBottom: 8,
  },

  togetherBadge: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  togetherText: {
    fontSize: 13,
    color: COLORS.darkButton,
    fontFamily: FONTS.regular,
    fontWeight: "600",
  },
  partnerHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },

  statsCard: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    gap: 14,
  },
  statRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statLabel: {
    width: 78,
    fontSize: 13,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    fontWeight: "600",
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 5,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 5 },
  statValue: {
    width: 38,
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textAlign: "right",
  },

  actions: { flexDirection: "row", gap: 14, marginTop: 20, width: "100%" },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
  },
  actionEmoji: { fontSize: 22 },
  actionText: {
    fontSize: 16,
    color: COLORS.white,
    fontFamily: FONTS.regular,
    fontWeight: "700",
  },

  evolveHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginTop: 18,
    textAlign: "center",
  },

  bigEmoji: { fontSize: 72, marginBottom: 10 },
  heading: {
    fontSize: 22,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    fontWeight: "700",
  },
  sub: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
  },
});
