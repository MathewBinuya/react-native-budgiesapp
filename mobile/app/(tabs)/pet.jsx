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
import { useState, useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../../components/AppHeader";
import MochiSprite from "../../components/MochiSprite";
import FONTS from "../../constants/fonts";
import { useColors } from "../../hooks/useColors";
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

function StatBar({ label, value, color, trackColor }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Text style={{ width: 78, fontSize: 13, color: trackColor, fontFamily: FONTS.regular, fontWeight: "600" }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 10, backgroundColor: trackColor + "44", borderRadius: 5, overflow: "hidden" }}>
        <View style={{ height: "100%", borderRadius: 5, width: `${Math.round(Math.max(0, Math.min(100, value)))}%`, backgroundColor: color }} />
      </View>
      <Text style={{ width: 38, fontSize: 12, color: trackColor, fontFamily: FONTS.regular, textAlign: "right" }}>
        {Math.round(value)}%
      </Text>
    </View>
  );
}

export default function Pet() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const { isPaired, loaded: coupleLoaded } = useCoupleStore();
  const { pet, loading, loadPet, feedPet, playWithPet } = usePetStore();

  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);

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

  const openRename = () => { setNewName(pet?.name || "Mochi"); setRenaming(true); };

  const handleSaveName = async () => {
    const trimmed = newName.trim();
    if (!trimmed) { setRenaming(false); return; }
    setSavingName(true);
    const res = await api.patch("/couple", { petName: trimmed });
    setSavingName(false);
    if (res.ok) await loadPet();
    else Alert.alert("Couldn't rename", res.data?.message || "Try again.");
    setRenaming(false);
  };

  if (!coupleLoaded) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Pet" />
        <View style={styles.center}><ActivityIndicator color={COLORS.darkButton} /></View>
      </View>
    );
  }

  if (!isPaired) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Pet" />
        <View style={styles.center}>
          <Text style={styles.lockEmoji}>🥚</Text>
          <Text style={styles.heading}>Your nest is waiting</Text>
          <Text style={styles.sub}>Pair with someone to unlock your shared pet.</Text>
        </View>
      </View>
    );
  }

  if (loading && !pet) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Pet" />
        <View style={styles.center}><ActivityIndicator color={COLORS.darkButton} /></View>
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

        <View style={styles.petCircle}>
          <MochiSprite stage={stage} mood={mood} />
        </View>

        <TouchableOpacity style={styles.nameRow} onPress={openRename}>
          <Text style={styles.petName}>{name}</Text>
          <Ionicons name="pencil" size={14} color={COLORS.textMuted} style={{ marginLeft: 6, marginTop: 3 }} />
        </TouchableOpacity>

        <Text style={styles.moodLabel}>{MOOD_EMOJI[mood]} {mood}</Text>

        {bothCaredToday ? (
          <View style={styles.togetherBadge}>
            <Text style={styles.togetherText}>Both cared today ✨</Text>
          </View>
        ) : (
          <Text style={styles.partnerHint}>Care together daily to help {name} grow</Text>
        )}

        <View style={styles.statsCard}>
          <StatBar label="Fullness" value={fullness} color={COLORS.darkButton} trackColor={COLORS.textMuted} />
          <View style={{ height: 14 }} />
          <StatBar label="Happiness" value={happiness} color={COLORS.lightButton} trackColor={COLORS.textMuted} />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.darkButton }]} onPress={handleFeed}>
            <Text style={styles.actionEmoji}>🌾</Text>
            <Text style={styles.actionText}>Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.lightButton }]} onPress={handlePlay}>
            <Text style={styles.actionEmoji}>🎾</Text>
            <Text style={styles.actionText}>Play</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.evolveHint}>{EVOLVE_HINT[stage]}</Text>
      </View>

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
              <TouchableOpacity style={styles.renameCancelBtn} onPress={() => setRenaming(false)}>
                <Text style={styles.renameCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.renameSaveBtn} onPress={handleSaveName} disabled={savingName}>
                {savingName ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.renameSaveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 8 },
    content: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 10 },

    stageLabel: {
      fontSize: 12, color: C.textMuted, fontFamily: FONTS.regular, fontWeight: "600",
      letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14,
    },
    petCircle: {
      width: 170, height: 170, borderRadius: 85,
      backgroundColor: C.card, alignItems: "center", justifyContent: "center", marginBottom: 12,
    },
    nameRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
    petName: { fontSize: 26, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular },
    moodLabel: { fontSize: 14, color: C.textMuted, fontFamily: FONTS.regular, marginBottom: 8, textTransform: "capitalize" },

    togetherBadge: { backgroundColor: C.card, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 16, marginBottom: 4 },
    togetherText: { fontSize: 13, color: C.darkButton, fontFamily: FONTS.regular, fontWeight: "600" },
    partnerHint: { fontSize: 13, color: C.textMuted, fontFamily: FONTS.regular, marginBottom: 4, textAlign: "center" },

    statsCard: { width: "100%", backgroundColor: C.card, borderRadius: 18, padding: 18, marginTop: 14 },

    actions: { flexDirection: "row", gap: 14, marginTop: 18, width: "100%" },
    actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 16 },
    actionEmoji: { fontSize: 22 },
    actionText: { fontSize: 16, color: C.white, fontFamily: FONTS.regular, fontWeight: "700" },

    evolveHint: { fontSize: 13, color: C.textMuted, fontFamily: FONTS.regular, marginTop: 16, textAlign: "center" },

    lockEmoji: { fontSize: 72, marginBottom: 10 },
    heading: { fontSize: 22, color: C.textColor, fontFamily: FONTS.regular, fontWeight: "700", textAlign: "center" },
    sub: { fontSize: 14, color: C.textMuted, fontFamily: FONTS.regular, textAlign: "center", lineHeight: 20, marginTop: 4 },

    renameOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", paddingHorizontal: 28 },
    renameCard: { width: "100%", backgroundColor: C.background, borderRadius: 20, padding: 24 },
    renameTitle: { fontSize: 18, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular, textAlign: "center", marginBottom: 16 },
    renameInput: {
      backgroundColor: C.inputBackground, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
      fontSize: 18, color: C.textColor, fontFamily: FONTS.regular, textAlign: "center",
      borderWidth: 1, borderColor: C.border, marginBottom: 20,
    },
    renameBtns: { flexDirection: "row", gap: 12 },
    renameCancelBtn: { flex: 1, backgroundColor: C.card, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
    renameCancelText: { fontSize: 15, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular },
    renameSaveBtn: { flex: 1, backgroundColor: C.darkButton, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
    renameSaveText: { fontSize: 15, fontWeight: "700", color: C.white, fontFamily: FONTS.regular },
  });
}
