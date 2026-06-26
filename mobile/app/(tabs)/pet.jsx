import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../../components/AppHeader";
import MochiSprite from "../../components/MochiSprite";
import COLORS from "../../constants/colors";
import FONTS from "../../constants/fonts";
import { useCoupleStore } from "../../store/coupleStore";
import { usePetStore } from "../../store/petStore";
import api from "../../lib/api";

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
            { width: `${Math.round(Math.max(0, Math.min(100, value)))}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.statValue}>{Math.round(value)}%</Text>
    </View>
  );
}

export default function Pet() {
  const { isPaired, loaded: coupleLoaded } = useCoupleStore();
  const { pet, loading, loadPet, feedPet, playWithPet } = usePetStore();

  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Refresh pet data every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isPaired) loadPet();
    }, [isPaired])
  );

  const handleFeed = async () => {
    const result = await feedPet();
    if (!result.success) Alert.alert("Oops", result.error);
  };

  const handlePlay = async () => {
    const result = await playWithPet();
    if (!result.success) Alert.alert("Oops", result.error);
  };

  const openRename = () => {
    setNewName(pet?.name || "Mochi");
    setRenaming(true);
  };

  const handleSaveName = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setRenaming(false);
      return;
    }
    setSavingName(true);
    const res = await api.patch("/couple", { petName: trimmed });
    setSavingName(false);
    if (res.ok) {
      // Reload pet to reflect new name
      await loadPet();
    } else {
      Alert.alert("Couldn't rename", res.data?.message || "Try again.");
    }
    setRenaming(false);
  };

  // Still loading couple status — show spinner to avoid lock screen flash
  if (!coupleLoaded) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Pet" />
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.darkButton} />
        </View>
      </View>
    );
  }

  // Locked state — not paired
  if (!isPaired) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Pet" />
        <View style={styles.center}>
          <Text style={styles.lockEmoji}>🥚</Text>
          <Text style={styles.heading}>Your nest is waiting</Text>
          <Text style={styles.sub}>
            Pair with someone to unlock your shared pet.
          </Text>
        </View>
      </View>
    );
  }

  if (loading && !pet) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Pet" />
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
      <AppHeader title="Pet" />

      <View style={styles.content}>
        <Text style={styles.stageLabel}>{STAGE_LABEL[stage]}</Text>

        {/* Animated budgie sprite */}
        <View style={styles.petCircle}>
          <MochiSprite stage={stage} mood={mood} />
        </View>

        {/* Tappable pet name */}
        <TouchableOpacity style={styles.nameRow} onPress={openRename}>
          <Text style={styles.petName}>{name}</Text>
          <Ionicons name="pencil" size={14} color={COLORS.textMuted} style={{ marginLeft: 6, marginTop: 3 }} />
        </TouchableOpacity>

        {/* Mood badge */}
        <Text style={styles.moodLabel}>{MOOD_EMOJI[mood]} {mood}</Text>

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
          <StatBar label="Fullness" value={fullness} color={COLORS.darkButton} />
          <StatBar label="Happiness" value={happiness} color={COLORS.lightButton} />
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

      {/* Rename modal */}
      <Modal visible={renaming} transparent animationType="fade">
        <View style={styles.renameOverlay}>
          <View style={styles.renameCard}>
            <Text style={styles.renameTitle}>Name your pet</Text>
            <TextInput
              style={styles.renameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Mochi"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
              maxLength={24}
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <View style={styles.renameBtns}>
              <TouchableOpacity
                style={styles.renameCancelBtn}
                onPress={() => setRenaming(false)}
              >
                <Text style={styles.renameCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.renameSaveBtn}
                onPress={handleSaveName}
                disabled={savingName}
              >
                {savingName ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.renameSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  petName: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
  },
  moodLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginBottom: 8,
    textTransform: "capitalize",
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
    textAlign: "center",
  },

  statsCard: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    marginTop: 14,
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

  actions: { flexDirection: "row", gap: 14, marginTop: 18, width: "100%" },
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
    marginTop: 16,
    textAlign: "center",
  },

  lockEmoji: { fontSize: 72, marginBottom: 10 },
  heading: {
    fontSize: 22,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    fontWeight: "700",
    textAlign: "center",
  },
  sub: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
  },

  // Rename modal
  renameOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  renameCard: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 24,
  },
  renameTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    textAlign: "center",
    marginBottom: 16,
  },
  renameInput: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    textAlign: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  renameBtns: { flexDirection: "row", gap: 12 },
  renameCancelBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  renameCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
  },
  renameSaveBtn: {
    flex: 1,
    backgroundColor: COLORS.darkButton,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  renameSaveText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
    fontFamily: FONTS.regular,
  },
});
