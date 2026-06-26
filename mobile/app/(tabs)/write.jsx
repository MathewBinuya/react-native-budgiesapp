import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../../components/AppHeader";
import COLORS from "../../constants/colors";
import FONTS from "../../constants/fonts";
import { useAuthStore } from "../../store/authStore";
import { useJournalStore } from "../../store/journalStore";

function tint(hex, alpha = "1A") {
  if (!hex || hex.length < 7) return COLORS.card;
  return hex + alpha;
}

// "2026-06-26T..." → "Friday, June 26"
function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function Write() {
  const { user } = useAuthStore();
  const { myEntries, partnerEntries, prompt, loading, loadEntries, addEntry } =
    useJournalStore();

  const isPaired = !!user?.couple;
  const myAccent = user?.accentColor || "#88A99E";

  const [tab, setTab] = useState("mine");
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isPaired) loadEntries();
  }, [isPaired]);

  if (!isPaired) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Journal" />
        <View style={styles.lockWrap}>
          <Text style={styles.lockEmoji}>📔</Text>
          <Text style={styles.lockTitle}>Pair to open your journal</Text>
          <Text style={styles.lockHint}>
            You'll each keep your own diary — and get to peek at each other's.
          </Text>
        </View>
      </View>
    );
  }

  const viewingMine = tab === "mine";
  const entries = viewingMine ? myEntries : partnerEntries;
  // partner accent comes from their entries (populated author.accentColor)
  const partnerAccent =
    partnerEntries[0]?.author?.accentColor || "#DD8E75";
  const accent = viewingMine ? myAccent : partnerAccent;

  const handleSave = async () => {
    if (!draft.trim()) {
      setComposing(false);
      return;
    }
    setSaving(true);
    const result = await addEntry(draft.trim());
    setSaving(false);
    if (!result.success) {
      Alert.alert("Couldn't save", result.error);
      return;
    }
    setDraft("");
    setComposing(false);
    setTab("mine"); // jump to your journal to see it
  };

  return (
    <View style={styles.safe}>
      <AppHeader title="Journal" />

      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewingMine && { backgroundColor: myAccent }]}
          onPress={() => setTab("mine")}
        >
          <Text style={[styles.toggleText, viewingMine && styles.toggleActive]}>
            My journal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            !viewingMine && { backgroundColor: partnerAccent },
          ]}
          onPress={() => setTab("partner")}
        >
          <Text style={[styles.toggleText, !viewingMine && styles.toggleActive]}>
            Partner's
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {entries.map((e) => (
            <View
              key={e._id}
              style={[styles.page, { backgroundColor: tint(accent) }]}
            >
              <View style={styles.pageHead}>
                <View style={[styles.dot, { backgroundColor: accent }]} />
                <Text style={[styles.date, { color: accent }]}>
                  {formatDate(e.createdAt)}
                </Text>
              </View>
              <Text style={styles.entryText}>{e.text}</Text>
            </View>
          ))}

          {entries.length === 0 && (
            <Text style={styles.empty}>
              {viewingMine
                ? "Your first page is waiting. Tap + to begin."
                : "Nothing here yet — your partner hasn't written."}
            </Text>
          )}

          <View style={{ height: 90 }} />
        </ScrollView>
      )}

      {viewingMine && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: myAccent }]}
          onPress={() => setComposing(true)}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

      <Modal visible={composing} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalWrap}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <TouchableOpacity onPress={() => setComposing(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New entry</Text>
              <TouchableOpacity onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={myAccent} />
                ) : (
                  <Text style={[styles.modalSave, { color: myAccent }]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
            {prompt ? (
              <Text style={styles.promptHint}>💭 {prompt}</Text>
            ) : (
              <Text style={styles.modalDate}>Today</Text>
            )}
            <TextInput
              style={styles.modalInput}
              placeholder="Dear journal…"
              placeholderTextColor={COLORS.textMuted}
              value={draft}
              onChangeText={setDraft}
              multiline
              autoFocus
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  lockWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  lockEmoji: { fontSize: 52, marginBottom: 10 },
  lockTitle: { fontSize: 20, fontWeight: "700", color: COLORS.textColor, fontFamily: FONTS.regular },
  lockHint: { fontSize: 14, color: COLORS.textMuted, fontFamily: FONTS.regular, textAlign: "center", marginTop: 6, lineHeight: 20 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },

  toggle: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 18,
    marginBottom: 6,
  },
  toggleBtn: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: "center" },
  toggleText: { fontSize: 13, color: COLORS.textMuted, fontFamily: FONTS.regular, fontWeight: "600" },
  toggleActive: { color: COLORS.white },

  list: { paddingHorizontal: 18, paddingTop: 8, gap: 14 },
  page: { borderRadius: 16, padding: 18 },
  pageHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  date: { fontSize: 15, fontWeight: "700", fontFamily: FONTS.regular },
  entryText: { fontSize: 15, color: COLORS.textColor, fontFamily: FONTS.regular, lineHeight: 26 },
  empty: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textAlign: "center",
    marginTop: 40,
    paddingHorizontal: 30,
    lineHeight: 21,
  },

  fab: {
    position: "absolute",
    right: 22,
    bottom: 26,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
  },

  modalWrap: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.3)" },
  modalCard: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: "70%",
  },
  modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalCancel: { fontSize: 15, color: COLORS.textMuted, fontFamily: FONTS.regular },
  modalTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textColor, fontFamily: FONTS.regular },
  modalSave: { fontSize: 15, fontWeight: "700", fontFamily: FONTS.regular },
  modalDate: { fontSize: 13, color: COLORS.textMuted, fontFamily: FONTS.regular, marginTop: 16, marginBottom: 8 },
  promptHint: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginTop: 16,
    marginBottom: 8,
    fontStyle: "italic",
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    lineHeight: 26,
    textAlignVertical: "top",
  },
});