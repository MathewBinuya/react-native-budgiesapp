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
  StatusBar,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../../components/AppHeader";
import COLORS from "../../constants/colors";
import FONTS from "../../constants/fonts";
import { useAuthStore } from "../../store/authStore";
import { useCoupleStore } from "../../store/coupleStore";
import { useJournalStore } from "../../store/journalStore";

function tint(hex, alpha = "1A") {
  if (!hex || hex.length < 7) return COLORS.card;
  return hex + alpha;
}

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
  const { isPaired, loaded: coupleLoaded } = useCoupleStore();
  const { myEntries, partnerEntries, prompt, loading, loadEntries, addEntry, deleteEntry } =
    useJournalStore();

  const insets = useSafeAreaInsets();
  const myAccent = user?.accentColor || COLORS.darkButton;

  const [tab, setTab] = useState("mine");
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    loadEntries({ withPartner: isPaired });
  }, [isPaired]);

  const viewingMine = tab === "mine";
  const entries = viewingMine ? myEntries : partnerEntries;
  const partnerAccent = partnerEntries[0]?.author?.accentColor || COLORS.lightButton;
  const accent = viewingMine ? myAccent : partnerAccent;

  const openCompose = () => {
    setDraft("");
    setComposing(true);
  };

  const closeCompose = () => {
    setComposing(false);
    setDraft("");
  };

  const handleSave = async () => {
    if (!draft.trim()) {
      closeCompose();
      return;
    }
    setSaving(true);
    const result = await addEntry(draft.trim());
    setSaving(false);
    if (!result.success) {
      Alert.alert("Couldn't save", result.error);
      return;
    }
    closeCompose();
    setTab("mine");
  };

  const handleLongPress = (entry) => {
    if (!viewingMine) return;
    setDeleteTarget(entry);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteEntry(deleteTarget._id);
    setDeleting(false);
    setDeleteTarget(null);
    if (!result.success) Alert.alert("Couldn't delete", result.error);
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
        {coupleLoaded && isPaired && (
          <TouchableOpacity
            style={[styles.toggleBtn, !viewingMine && { backgroundColor: partnerAccent }]}
            onPress={() => setTab("partner")}
          >
            <Text style={[styles.toggleText, !viewingMine && styles.toggleActive]}>
              Partner's
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {entries.map((e) => (
            <TouchableOpacity
              key={e._id}
              onLongPress={() => handleLongPress(e)}
              delayLongPress={400}
              activeOpacity={0.85}
            >
              <View style={[styles.page, { backgroundColor: tint(accent) }]}>
                <View style={styles.pageHead}>
                  <View style={[styles.dot, { backgroundColor: accent }]} />
                  <Text style={[styles.date, { color: accent }]}>
                    {formatDate(e.createdAt)}
                  </Text>
                  {viewingMine && (
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={16}
                      color={accent}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </View>
                <Text style={styles.entryText}>{e.text}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {entries.length === 0 && (
            <Text style={styles.empty}>
              {viewingMine
                ? "Your first page is waiting. Tap + to begin."
                : "Nothing here yet — your partner hasn't written."}
            </Text>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {viewingMine && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: myAccent }]}
          onPress={openCompose}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* ── Full-screen compose editor ─────────────────────────────── */}
      <Modal
        visible={composing}
        animationType="slide"
        presentationStyle="fullScreen"
        onShow={() => setTimeout(() => inputRef.current?.focus(), 100)}
      >
        <KeyboardAvoidingView
          style={[styles.editorWrap, { paddingTop: insets.top || (Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 44) }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {/* Top bar */}
          <View style={styles.editorBar}>
            <TouchableOpacity onPress={closeCompose} style={styles.editorBarBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.editorCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>New entry</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.editorBarBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              {saving ? (
                <ActivityIndicator color={myAccent} />
              ) : (
                <Text style={[styles.editorSave, { color: myAccent }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Date / prompt */}
          {prompt ? (
            <Text style={styles.editorPrompt}>💭 {prompt}</Text>
          ) : (
            <Text style={styles.editorDate}>
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          )}

          <View style={styles.editorDivider} />

          {/* Writing area — fills all remaining space */}
          <ScrollView
            style={styles.editorScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <TextInput
              ref={inputRef}
              style={styles.editorInput}
              placeholder="Dear journal…"
              placeholderTextColor={COLORS.textMuted}
              value={draft}
              onChangeText={setDraft}
              multiline
              textAlignVertical="top"
              scrollEnabled={false}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Delete confirmation ────────────────────────────────────── */}
      <Modal visible={!!deleteTarget} transparent animationType="fade">
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteCard}>
            <Text style={styles.deleteTitle}>Delete entry?</Text>
            <Text style={styles.deleteHint}>
              This journal entry will be permanently removed.
            </Text>
            <View style={styles.deleteBtns}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.deleteConfirmText}>Delete</Text>
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
    fontSize: 14, color: COLORS.textMuted, fontFamily: FONTS.regular,
    textAlign: "center", marginTop: 40, paddingHorizontal: 30, lineHeight: 21,
  },

  fab: {
    position: "absolute", right: 22, bottom: 26,
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 5,
  },

  // Full-screen editor
  editorWrap: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  editorBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  editorBarBtn: { minWidth: 60 },
  editorCancel: {
    fontSize: 15, color: COLORS.textMuted, fontFamily: FONTS.regular,
  },
  editorTitle: {
    fontSize: 16, fontWeight: "700", color: COLORS.textColor, fontFamily: FONTS.regular,
  },
  editorSave: {
    fontSize: 15, fontWeight: "700", fontFamily: FONTS.regular, textAlign: "right",
  },
  editorDate: {
    fontSize: 13, color: COLORS.textMuted, fontFamily: FONTS.regular, marginTop: 4, marginBottom: 12,
  },
  editorPrompt: {
    fontSize: 14, color: COLORS.textMuted, fontFamily: FONTS.regular,
    fontStyle: "italic", lineHeight: 20, marginTop: 4, marginBottom: 12,
  },
  editorDivider: { height: 1, backgroundColor: COLORS.border, marginBottom: 16 },
  editorScroll: { flex: 1 },
  editorInput: {
    flex: 1,
    fontSize: 17,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    lineHeight: 28,
    minHeight: 300,
  },

  // Delete modal
  deleteOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center", alignItems: "center", paddingHorizontal: 28,
  },
  deleteCard: { width: "100%", backgroundColor: COLORS.background, borderRadius: 20, padding: 24 },
  deleteTitle: {
    fontSize: 18, fontWeight: "700", color: COLORS.textColor,
    fontFamily: FONTS.regular, marginBottom: 8, textAlign: "center",
  },
  deleteHint: {
    fontSize: 14, color: COLORS.textMuted, fontFamily: FONTS.regular,
    textAlign: "center", lineHeight: 20, marginBottom: 24,
  },
  deleteBtns: { flexDirection: "row", gap: 12 },
  deleteCancelBtn: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
  },
  deleteCancelText: { fontSize: 15, fontWeight: "700", color: COLORS.textColor, fontFamily: FONTS.regular },
  deleteConfirmBtn: {
    flex: 1, backgroundColor: COLORS.darkButton, borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
  },
  deleteConfirmText: { fontSize: 15, fontWeight: "700", color: COLORS.white, fontFamily: FONTS.regular },
});
