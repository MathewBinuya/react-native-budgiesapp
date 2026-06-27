import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  NativeModules,
} from "react-native";
import { useEffect, useRef, useState, useMemo } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FONTS from "../../constants/fonts";
import { useColors } from "../../hooks/useColors";
import { useThemeStore } from "../../store/themeStore";
import { THEME_LIST } from "../../constants/themes";
import { useAuthStore } from "../../store/authStore";
import { useCoupleStore } from "../../store/coupleStore";
import api from "../../lib/api";

const ACCENT_OPTIONS = ["#88A99E", "#DD8E75", "#D4638D", "#9C8AA5", "#7DA0C4"];

// ── Native picker check ───────────────────────────────────────────────────────
function isPickerAvailable() {
  try {
    if (NativeModules.ExponentImagePicker) return true;
    if (typeof global.__turboModuleProxy === "function") {
      return global.__turboModuleProxy("ExponentImagePicker") != null;
    }
    return false;
  } catch { return false; }
}

// ── Avatar bubble ─────────────────────────────────────────────────────────────
function AvatarBubble({ name, avatar, accentColor, size = 50, style }) {
  const bg = accentColor || "#D4638D";
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center", overflow: "hidden" }, style]}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />
      ) : (
        <Text style={{ fontSize: size * 0.38, color: "#FFFFFF", fontWeight: "700", fontFamily: FONTS.regular }}>{initial}</Text>
      )}
    </View>
  );
}

// ── Date picker wheel ─────────────────────────────────────────────────────────
const ITEM_H = 48;
const VISIBLE = 5;
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const NOW    = new Date().getFullYear();
const YEARS  = Array.from({ length: 80 }, (_, i) => String(NOW - i));

function Wheel({ data, initialIndex = 0, onSelect }) {
  const C = useColors();
  const ref = useRef(null);
  const [active, setActive] = useState(initialIndex);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollToIndex({ index: initialIndex, animated: false }), 50);
    return () => clearTimeout(t);
  }, []);

  const onMomentumEnd = (e) => {
    const idx = Math.min(data.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ITEM_H)));
    setActive(idx);
    onSelect(idx);
  };

  return (
    <View style={{ flex: 1, overflow: "hidden" }}>
      <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, height: ITEM_H, backgroundColor: C.card, borderRadius: 10, zIndex: 0, top: ITEM_H * Math.floor(VISIBLE / 2) }} />
      <FlatList
        ref={ref}
        data={data}
        keyExtractor={(_, i) => String(i)}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
        contentContainerStyle={{ paddingVertical: ITEM_H * Math.floor(VISIBLE / 2) }}
        style={{ height: ITEM_H * VISIBLE }}
        renderItem={({ item, index }) => (
          <View style={{ height: ITEM_H, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: active === index ? 18 : 16, fontWeight: active === index ? "700" : "400", color: active === index ? C.textColor : C.textMuted, fontFamily: FONTS.regular }}>
              {item}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Profile() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const { themeKey, setTheme } = useThemeStore();
  const { user, logout, setAccent, updateAvatar } = useAuthStore();
  const { daysTogether, isPaired, couple, loadCoupleData, leavePartner } = useCoupleStore();
  const myAccent = user?.accentColor || "#88A99E";

  const partner = couple?.members?.find(
    (m) => m._id?.toString() !== user?.id?.toString(),
  );

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [datePicker, setDatePicker] = useState(false);
  const [savingDate, setSavingDate] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const initDate = () => {
    const d = couple?.anniversary ? new Date(couple.anniversary) : new Date();
    return {
      monthIdx: d.getMonth(),
      dayIdx: d.getDate() - 1,
      yearIdx: YEARS.indexOf(String(d.getFullYear())) < 0 ? 0 : YEARS.indexOf(String(d.getFullYear())),
    };
  };
  const [picked, setPicked] = useState(initDate);

  useEffect(() => { loadCoupleData(); }, []);
  useEffect(() => { setPicked(initDate()); }, [couple?.anniversary]);

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarUpload = async () => {
    if (!isPickerAvailable()) {
      Alert.alert("Rebuild required", "Avatar upload needs a new development build with expo-image-picker compiled in.\n\nRun: eas build --profile development");
      return;
    }
    const ImagePicker = require("expo-image-picker");
    const { status, canAskAgain } = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      const { status: next } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (next !== "granted") {
        Alert.alert("Permission needed", "Allow photo access to update your profile picture.",
          canAskAgain
            ? [{ text: "OK" }]
            : [{ text: "Not now", style: "cancel" }, { text: "Open Settings", onPress: () => { const { Linking } = require("react-native"); Linking.openSettings(); } }]
        );
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", { uri: asset.uri, type: asset.mimeType || "image/jpeg", name: asset.fileName || "avatar.jpg" });
    const res = await updateAvatar(formData);
    setUploadingAvatar(false);
    if (!res.success) Alert.alert("Upload failed", res.error);
  };

  // ── Anniversary ────────────────────────────────────────────────────────────
  const openPicker = () => { setPicked(initDate()); setDatePicker(true); };

  const handleSaveDate = async () => {
    const date = new Date(parseInt(YEARS[picked.yearIdx], 10), picked.monthIdx, picked.dayIdx + 1);
    if (date > new Date()) { Alert.alert("Invalid date", "Your anniversary can't be in the future."); return; }
    setSavingDate(true);
    const res = await api.patch("/couple", { anniversary: date.toISOString() });
    setSavingDate(false);
    if (res.ok) { await loadCoupleData(); setDatePicker(false); }
    else Alert.alert("Couldn't save", res.data?.message || "Try again.");
  };

  // ── Leave partner ──────────────────────────────────────────────────────────
  const handleLeavePartner = async () => {
    setLeaving(true);
    const result = await leavePartner();
    setLeaving(false);
    setLeaveModal(false);
    if (result.success) {
      Alert.alert("Partnership ended", "All shared data has been permanently removed.", [{ text: "OK", onPress: () => router.replace("/(tabs)/home") }]);
    } else {
      Alert.alert("Couldn't leave", result.error);
    }
  };

  const handleLogout = async () => { await logout(); router.replace("/(auth)/welcome"); };
  const pickColor = async (c) => { if (c !== myAccent) await setAccent(c); };

  const anniversaryLabel = () => {
    if (couple?.anniversary) {
      return new Date(couple.anniversary).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    }
    return "Set your anniversary";
  };

  return (
    <View style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.textColor} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Own avatar */}
        <TouchableOpacity onPress={handleAvatarUpload} style={styles.avatarWrap} activeOpacity={0.8}>
          <AvatarBubble name={user?.name} avatar={user?.avatar} accentColor={myAccent} size={90} />
          <View style={styles.cameraBadge}>
            {uploadingAvatar ? <ActivityIndicator size={12} color={COLORS.white} /> : <Ionicons name="camera" size={14} color={COLORS.white} />}
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{user?.name || "You"}</Text>
        <Text style={styles.email}>{user?.email || ""}</Text>

        {/* Us section */}
        <Text style={styles.sectionTitle}>Us</Text>
        {isPaired ? (
          <View style={styles.usCard}>
            <View style={styles.usRow}>
              <AvatarBubble name={user?.name} avatar={user?.avatar} accentColor={myAccent} size={54} />
              <Ionicons name="heart" size={22} color={COLORS.darkButton} />
              <AvatarBubble name={partner?.name} avatar={partner?.avatar} accentColor={partner?.accentColor || COLORS.lightButton} size={54} />
            </View>
            {partner?.name && <Text style={styles.partnerName}>{partner.name}</Text>}
            <Text style={styles.usDays}>{anniversaryLabel()}</Text>
            {daysTogether != null && <Text style={styles.dayCount}>{daysTogether} days together 🌿</Text>}
            <TouchableOpacity style={styles.dateBtn} onPress={openPicker}>
              <Ionicons name="calendar" size={16} color={COLORS.textColor} />
              <Text style={styles.dateBtnText}>{couple?.anniversary ? "Change anniversary" : "Set anniversary date"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.pairCard} onPress={() => router.push("/(onBoarding)/pair")}>
            <Text style={styles.pairEmoji}>🪺</Text>
            <Text style={styles.pairText}>Pair with your partner</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.darkButton} />
          </TouchableOpacity>
        )}

        {/* Accent color */}
        <Text style={styles.sectionTitle}>Your color</Text>
        <View style={styles.colorRow}>
          {ACCENT_OPTIONS.map((c) => (
            <TouchableOpacity key={c} onPress={() => pickColor(c)} style={[styles.swatch, { backgroundColor: c }, myAccent === c && styles.swatchActive]} />
          ))}
        </View>

        {/* App theme */}
        <Text style={styles.sectionTitle}>App theme</Text>
        <View style={styles.themeRow}>
          {THEME_LIST.map((t) => (
            <TouchableOpacity key={t.key} onPress={() => setTheme(t.key)} style={styles.themeCard} activeOpacity={0.8}>
              <View style={[styles.themePreview, { backgroundColor: t.background, borderColor: themeKey === t.key ? t.darkButton : t.border, borderWidth: themeKey === t.key ? 2.5 : 1 }]}>
                <View style={[styles.themePreviewCard, { backgroundColor: t.card }]} />
                <View style={[styles.themePreviewDot, { backgroundColor: t.darkButton }]} />
              </View>
              <Text style={[styles.themeLabel, themeKey === t.key && { color: COLORS.darkButton, fontWeight: "700" }]}>
                {t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out" size={18} color={COLORS.white} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        {isPaired && (
          <TouchableOpacity style={styles.leaveBtn} onPress={() => setLeaveModal(true)}>
            <Ionicons name="heart-dislike-outline" size={18} color="#C0392B" />
            <Text style={styles.leaveText}>Leave partner</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Anniversary picker */}
      <Modal visible={datePicker} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setDatePicker(false)}>
                <Text style={styles.pickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Anniversary</Text>
              <TouchableOpacity onPress={handleSaveDate} disabled={savingDate}>
                {savingDate ? <ActivityIndicator color={COLORS.darkButton} /> : <Text style={[styles.pickerSave, { color: COLORS.darkButton }]}>Done</Text>}
              </TouchableOpacity>
            </View>
            <View style={styles.pickerCols}>
              <Text style={styles.colLabel}>Month</Text>
              <Text style={styles.colLabel}>Day</Text>
              <Text style={styles.colLabel}>Year</Text>
            </View>
            <View style={styles.wheelsRow}>
              <Wheel data={MONTHS} initialIndex={picked.monthIdx} onSelect={(i) => setPicked((p) => ({ ...p, monthIdx: i }))} />
              <View style={styles.wheelDivider} />
              <Wheel data={DAYS}   initialIndex={picked.dayIdx}   onSelect={(i) => setPicked((p) => ({ ...p, dayIdx: i }))} />
              <View style={styles.wheelDivider} />
              <Wheel data={YEARS}  initialIndex={picked.yearIdx}  onSelect={(i) => setPicked((p) => ({ ...p, yearIdx: i }))} />
            </View>
            <Text style={styles.pickerPreview}>
              {MONTHS[picked.monthIdx]} {DAYS[picked.dayIdx]}, {YEARS[picked.yearIdx]}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Leave partner confirmation */}
      <Modal visible={leaveModal} transparent animationType="fade">
        <View style={styles.leaveOverlay}>
          <View style={styles.leaveCard}>
            <View style={styles.leaveIconWrap}>
              <Ionicons name="heart-dislike" size={32} color="#C0392B" />
            </View>
            <Text style={styles.leaveTitle}>Leave Partner?</Text>
            <Text style={styles.leaveMessage}>
              This action cannot be undone. Leaving your partner will permanently remove all shared progress, including your streak, virtual pet, shared journals, memories, and any other relationship-related data.
            </Text>
            <View style={styles.leaveBtns}>
              <TouchableOpacity style={styles.leaveCancelBtn} onPress={() => setLeaveModal(false)} disabled={leaving}>
                <Text style={styles.leaveCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.leaveConfirmBtn} onPress={handleLeavePartner} disabled={leaving}>
                {leaving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.leaveConfirmText}>Leave Partner</Text>}
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
    scroll: { paddingHorizontal: 18, alignItems: "center" },

    avatarWrap: { marginTop: 10, marginBottom: 12 },
    cameraBadge: { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: C.darkButton, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.background },

    name: { fontSize: 22, color: C.textColor, fontFamily: FONTS.regular, fontWeight: "700" },
    email: { fontSize: 14, color: C.textMuted, fontFamily: FONTS.regular, marginTop: 2, marginBottom: 8 },

    sectionTitle: { alignSelf: "flex-start", fontSize: 16, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular, marginTop: 24, marginBottom: 10 },

    usCard: { width: "100%", backgroundColor: C.card, borderRadius: 20, padding: 20, alignItems: "center" },
    usRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 10 },
    partnerName: { fontSize: 13, color: C.textMuted, fontFamily: FONTS.regular, marginBottom: 6 },
    usDays: { fontSize: 15, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular, marginBottom: 4 },
    dayCount: { fontSize: 13, color: C.textMuted, fontFamily: FONTS.regular, marginBottom: 12 },
    dateBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.inputBackground, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
    dateBtnText: { fontSize: 13, color: C.textColor, fontFamily: FONTS.regular, fontWeight: "600" },

    pairCard: { width: "100%", flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderRadius: 18, padding: 16 },
    pairEmoji: { fontSize: 26 },
    pairText: { flex: 1, fontSize: 15, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular },

    colorRow: { flexDirection: "row", gap: 12, alignSelf: "flex-start" },
    swatch: { width: 38, height: 38, borderRadius: 19 },
    swatchActive: { borderWidth: 3, borderColor: C.textColor },

    // Theme picker
    themeRow: { flexDirection: "row", gap: 12, alignSelf: "flex-start" },
    themeCard: { alignItems: "center", gap: 6 },
    themePreview: { width: 60, height: 60, borderRadius: 14, padding: 8, justifyContent: "space-between" },
    themePreviewCard: { width: "100%", height: 22, borderRadius: 6 },
    themePreviewDot: { width: 20, height: 20, borderRadius: 10, alignSelf: "flex-end" },
    themeLabel: { fontSize: 11, color: C.textMuted, fontFamily: FONTS.regular },

    logoutBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.darkButton, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, marginTop: 40 },
    logoutText: { color: C.white, fontSize: 15, fontWeight: "700", fontFamily: FONTS.regular },

    leaveBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderColor: "#C0392B", borderRadius: 14, paddingVertical: 13, paddingHorizontal: 28, marginTop: 12 },
    leaveText: { color: "#C0392B", fontSize: 15, fontWeight: "700", fontFamily: FONTS.regular },

    leaveOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
    leaveCard: { width: "100%", backgroundColor: C.background, borderRadius: 24, padding: 28, alignItems: "center" },
    leaveIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#FDECEA", alignItems: "center", justifyContent: "center", marginBottom: 16 },
    leaveTitle: { fontSize: 20, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular, marginBottom: 12, textAlign: "center" },
    leaveMessage: { fontSize: 14, color: C.textMuted, fontFamily: FONTS.regular, textAlign: "center", lineHeight: 21, marginBottom: 28 },
    leaveBtns: { flexDirection: "row", gap: 12, width: "100%" },
    leaveCancelBtn: { flex: 1, backgroundColor: C.card, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
    leaveCancelText: { fontSize: 15, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular },
    leaveConfirmBtn: { flex: 1, backgroundColor: "#C0392B", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
    leaveConfirmText: { fontSize: 15, fontWeight: "700", color: C.white, fontFamily: FONTS.regular },

    pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    pickerCard: { backgroundColor: C.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 8, paddingBottom: 32, paddingHorizontal: 20 },
    pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 },
    pickerCancel: { fontSize: 15, color: C.textMuted, fontFamily: FONTS.regular },
    pickerTitle: { fontSize: 16, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular },
    pickerSave: { fontSize: 15, fontWeight: "700", fontFamily: FONTS.regular },
    pickerCols: { flexDirection: "row", justifyContent: "space-around", marginBottom: 4 },
    colLabel: { flex: 1, textAlign: "center", fontSize: 12, color: C.textMuted, fontFamily: FONTS.regular, fontWeight: "600", letterSpacing: 0.5 },
    wheelsRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: "hidden", backgroundColor: C.inputBackground },
    wheelDivider: { width: 1, height: ITEM_H * VISIBLE, backgroundColor: C.border },
    pickerPreview: { textAlign: "center", fontSize: 14, color: C.textMuted, fontFamily: FONTS.regular, marginTop: 16 },
  });
}
