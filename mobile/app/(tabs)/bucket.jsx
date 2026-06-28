import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FONTS from "../../constants/fonts";
import { useColors } from "../../hooks/useColors";
import { useAuthStore } from "../../store/authStore";
import { useCoupleStore } from "../../store/coupleStore";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch { return ""; }
}

export default function Bucket() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const { user } = useAuthStore();
  const { bucketList, fetchBucketList, addBucketItem, toggleBucketItem, deleteBucketItem } = useCoupleStore();

  const [addModal, setAddModal] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => { fetchBucketList(); }, []));

  const incomplete = bucketList.filter((i) => !i.completedAt);
  const completed  = bucketList.filter((i) => !!i.completedAt);

  const handleAdd = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    const res = await addBucketItem(draft.trim());
    setSaving(false);
    if (res.success) { setDraft(""); setAddModal(false); }
    else Alert.alert("Couldn't add", res.error);
  };

  const handleToggle = async (id) => {
    await toggleBucketItem(id);
  };

  const handleDelete = (id, text) => {
    Alert.alert("Remove item?", `"${text}" will be removed from your list.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteBucketItem(id) },
    ]);
  };

  const renderItem = ({ item }) => {
    const done = !!item.completedAt;
    const mine = item.addedBy?._id === user?.id || item.addedBy?._id?.toString() === user?.id;
    const adderColor = item.addedBy?.accentColor || COLORS.darkButton;
    const adderInitial = item.addedBy?.name ? item.addedBy.name.charAt(0).toUpperCase() : "?";

    return (
      <TouchableOpacity
        style={[styles.item, done && styles.itemDone]}
        onPress={() => handleToggle(item._id)}
        onLongPress={() => handleDelete(item._id, item.text)}
        activeOpacity={0.75}
      >
        <View style={[styles.checkbox, done && { backgroundColor: COLORS.darkButton, borderColor: COLORS.darkButton }]}>
          {done && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
        <View style={styles.itemBody}>
          <Text style={[styles.itemText, done && styles.itemTextDone]} numberOfLines={2}>
            {item.text}
          </Text>
          {done ? (
            <Text style={styles.itemMeta}>
              Completed {formatDate(item.completedAt)}
              {item.completedBy?.name ? ` · ${item.completedBy.name.split(" ")[0]}` : ""}
            </Text>
          ) : (
            <View style={styles.adderRow}>
              <View style={[styles.adderDot, { backgroundColor: adderColor }]}>
                <Text style={styles.adderInitial}>{adderInitial}</Text>
              </View>
              <Text style={styles.itemMeta}>{mine ? "You" : item.addedBy?.name?.split(" ")[0] || "Partner"}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.safe}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.textColor} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Bucket List</Text>
        <View style={{ width: 40 }} />
      </View>

      {bucketList.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🌍</Text>
          <Text style={styles.emptyTitle}>Your list is empty</Text>
          <Text style={styles.emptySub}>Add things you want to do together — big or small.</Text>
        </View>
      ) : (
        <FlatList
          data={[...incomplete, ...completed]}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={completed.length > 0 && incomplete.length > 0 ? (
            <Text style={styles.sectionLabel}>Completed ({completed.length})</Text>
          ) : null}
          ListFooterComponentStyle={{ marginTop: -completed.length > 0 ? 0 : 0 }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => { setDraft(""); setAddModal(true); }}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Add modal */}
      <Modal visible={addModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add to bucket list</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Watch the Northern Lights…"
              placeholderTextColor={COLORS.textMuted}
              value={draft}
              onChangeText={setDraft}
              maxLength={120}
              autoFocus
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setAddModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAdd} disabled={saving || !draft.trim()}>
                {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalSaveText}>Add</Text>}
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
    topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 },
    backBtn: { width: 40, height: 40, justifyContent: "center" },
    topTitle: { fontSize: 18, color: C.textColor, fontFamily: FONTS.regular, fontWeight: "700" },

    empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
    emptyEmoji: { fontSize: 52, marginBottom: 12 },
    emptyTitle: { fontSize: 20, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular, marginBottom: 6 },
    emptySub: { fontSize: 14, color: C.textMuted, fontFamily: FONTS.regular, textAlign: "center", lineHeight: 20 },

    list: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 100 },
    separator: { height: 1, backgroundColor: C.border, marginLeft: 52 },

    sectionLabel: { fontSize: 12, color: C.textMuted, fontFamily: FONTS.regular, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginTop: 20, marginBottom: 8, paddingHorizontal: 18 },

    item: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 14, gap: 14 },
    itemDone: { opacity: 0.55 },
    checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 },
    itemBody: { flex: 1 },
    itemText: { fontSize: 15, color: C.textColor, fontFamily: FONTS.regular, lineHeight: 22 },
    itemTextDone: { textDecorationLine: "line-through", color: C.textMuted },
    itemMeta: { fontSize: 11, color: C.textMuted, fontFamily: FONTS.regular, marginTop: 3 },
    adderRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
    adderDot: { width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center" },
    adderInitial: { fontSize: 8, color: "#FFF", fontWeight: "700" },

    fab: { position: "absolute", right: 22, bottom: 32, width: 56, height: 56, borderRadius: 28, backgroundColor: C.darkButton, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 6 },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    modalCard: { backgroundColor: C.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 17, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular, marginBottom: 16, textAlign: "center" },
    modalInput: { backgroundColor: C.inputBackground, borderRadius: 14, padding: 14, fontSize: 15, color: C.textColor, fontFamily: FONTS.regular, borderWidth: 1, borderColor: C.border, marginBottom: 20 },
    modalBtns: { flexDirection: "row", gap: 12 },
    modalCancelBtn: { flex: 1, backgroundColor: C.card, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
    modalCancelText: { fontSize: 15, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular },
    modalSaveBtn: { flex: 1, backgroundColor: C.darkButton, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
    modalSaveText: { fontSize: 15, fontWeight: "700", color: C.white, fontFamily: FONTS.regular },
  });
}
