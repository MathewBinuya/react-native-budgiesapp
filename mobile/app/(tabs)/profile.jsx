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
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import FONTS from "../../constants/fonts";
import { useAuthStore } from "../../store/authStore";
import { useCoupleStore } from "../../store/coupleStore";
import api from "../../lib/api";

const ACCENT_OPTIONS = ["#88A99E", "#DD8E75", "#D4638D", "#9C8AA5", "#7DA0C4"];

// ── Date picker constants ────────────────────────────────────────────────────
const ITEM_H = 48;
const VISIBLE = 5; // rows shown in the wheel
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const NOW    = new Date().getFullYear();
const YEARS  = Array.from({ length: 80 }, (_, i) => String(NOW - i));

function Wheel({ data, initialIndex = 0, onSelect }) {
  const ref = useRef(null);
  const [active, setActive] = useState(initialIndex);

  useEffect(() => {
    // Scroll to initial position after mount
    const timer = setTimeout(() => {
      ref.current?.scrollToIndex({ index: initialIndex, animated: false });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const onMomentumEnd = (e) => {
    const idx = Math.min(
      data.length - 1,
      Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ITEM_H))
    );
    setActive(idx);
    onSelect(idx);
  };

  return (
    <View style={wheel.container}>
      {/* Selection highlight */}
      <View
        pointerEvents="none"
        style={[
          wheel.highlight,
          { top: ITEM_H * Math.floor(VISIBLE / 2) },
        ]}
      />
      <FlatList
        ref={ref}
        data={data}
        keyExtractor={(_, i) => String(i)}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, index) => ({
          length: ITEM_H,
          offset: ITEM_H * index,
          index,
        })}
        contentContainerStyle={{ paddingVertical: ITEM_H * Math.floor(VISIBLE / 2) }}
        style={{ height: ITEM_H * VISIBLE }}
        renderItem={({ item, index }) => (
          <View style={wheel.item}>
            <Text
              style={[
                wheel.label,
                active === index && wheel.labelActive,
              ]}
            >
              {item}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const wheel = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  highlight: {
    position: "absolute",
    left: 0,
    right: 0,
    height: ITEM_H,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    zIndex: 0,
  },
  item: {
    height: ITEM_H,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  labelActive: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textColor,
  },
});

// ── Main component ───────────────────────────────────────────────────────────
export default function Profile() {
  const { user, logout, setAccent } = useAuthStore();
  const { daysTogether, isPaired, couple, loadCoupleData } = useCoupleStore();
  const myAccent = user?.accentColor || "#88A99E";

  const [datePicker, setDatePicker] = useState(false);
  const [savingDate, setSavingDate] = useState(false);

  // Initialise picker to today or existing anniversary
  const initDate = () => {
    const d = couple?.anniversary ? new Date(couple.anniversary) : new Date();
    return {
      monthIdx: d.getMonth(),
      dayIdx: d.getDate() - 1,
      yearIdx: YEARS.indexOf(String(d.getFullYear())) < 0 ? 0 : YEARS.indexOf(String(d.getFullYear())),
    };
  };
  const [picked, setPicked] = useState(initDate);

  useEffect(() => {
    loadCoupleData();
  }, []);

  // Re-sync picker when couple data arrives
  useEffect(() => {
    setPicked(initDate());
  }, [couple?.anniversary]);

  const openPicker = () => {
    setPicked(initDate());
    setDatePicker(true);
  };

  const handleSaveDate = async () => {
    const month = picked.monthIdx + 1;
    const day   = picked.dayIdx + 1;
    const year  = parseInt(YEARS[picked.yearIdx], 10);

    // Basic validity (e.g. Feb 30 → clamp)
    const date = new Date(year, month - 1, day);
    if (date > new Date()) {
      Alert.alert("Invalid date", "Your anniversary can't be in the future.");
      return;
    }

    setSavingDate(true);
    const res = await api.patch("/couple", { anniversary: date.toISOString() });
    setSavingDate(false);

    if (res.ok) {
      await loadCoupleData();
      setDatePicker(false);
    } else {
      Alert.alert("Couldn't save", res.data?.message || "Try again.");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/welcome");
  };

  const pickColor = async (c) => {
    if (c === myAccent) return;
    await setAccent(c);
  };

  const anniversaryLabel = () => {
    if (daysTogether == null) return "Set your anniversary";
    if (couple?.anniversary) {
      const d = new Date(couple.anniversary);
      return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
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

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.avatar, { backgroundColor: myAccent }]}>
          <Text style={styles.avatarInitial}>
            {user?.name ? user.name.charAt(0).toUpperCase() : "B"}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || "You"}</Text>
        <Text style={styles.email}>{user?.email || ""}</Text>

        {/* Us */}
        <Text style={styles.sectionTitle}>Us</Text>
        {isPaired ? (
          <View style={styles.usCard}>
            <View style={styles.usRow}>
              <View style={[styles.usBubble, { backgroundColor: myAccent }]}>
                <Text style={styles.usInitial}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : "B"}
                </Text>
              </View>
              <Ionicons name="heart" size={20} color={COLORS.darkButton} />
              <View style={[styles.usBubble, { backgroundColor: COLORS.darkButton }]}>
                <Text style={styles.usInitial}>P</Text>
              </View>
            </View>
            <Text style={styles.usDays}>{anniversaryLabel()}</Text>
            {daysTogether != null && (
              <Text style={styles.dayCount}>{daysTogether} days together 🌿</Text>
            )}
            <TouchableOpacity style={styles.dateBtn} onPress={openPicker}>
              <Ionicons name="calendar" size={16} color={COLORS.textColor} />
              <Text style={styles.dateBtnText}>
                {couple?.anniversary ? "Change anniversary" : "Set anniversary date"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.pairCard}
            onPress={() => router.push("/(onBoarding)/pair")}
          >
            <Text style={styles.pairEmoji}>🪺</Text>
            <Text style={styles.pairText}>Pair with your partner</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.darkButton} />
          </TouchableOpacity>
        )}

        {/* Accent color */}
        <Text style={styles.sectionTitle}>Your color</Text>
        <View style={styles.colorRow}>
          {ACCENT_OPTIONS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => pickColor(c)}
              style={[styles.swatch, { backgroundColor: c }, myAccent === c && styles.swatchActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out" size={18} color={COLORS.white} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── Anniversary date picker modal ──────────────────────────── */}
      <Modal visible={datePicker} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            {/* Header */}
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setDatePicker(false)}>
                <Text style={styles.pickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Anniversary</Text>
              <TouchableOpacity onPress={handleSaveDate} disabled={savingDate}>
                {savingDate ? (
                  <ActivityIndicator color={COLORS.darkButton} />
                ) : (
                  <Text style={[styles.pickerSave, { color: COLORS.darkButton }]}>Done</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Column labels */}
            <View style={styles.pickerCols}>
              <Text style={styles.colLabel}>Month</Text>
              <Text style={styles.colLabel}>Day</Text>
              <Text style={styles.colLabel}>Year</Text>
            </View>

            {/* Scroll wheels */}
            <View style={styles.wheelsRow}>
              <Wheel
                data={MONTHS}
                initialIndex={picked.monthIdx}
                onSelect={(i) => setPicked((p) => ({ ...p, monthIdx: i }))}
              />
              <View style={styles.wheelDivider} />
              <Wheel
                data={DAYS}
                initialIndex={picked.dayIdx}
                onSelect={(i) => setPicked((p) => ({ ...p, dayIdx: i }))}
              />
              <View style={styles.wheelDivider} />
              <Wheel
                data={YEARS}
                initialIndex={picked.yearIdx}
                onSelect={(i) => setPicked((p) => ({ ...p, yearIdx: i }))}
              />
            </View>

            {/* Preview */}
            <Text style={styles.pickerPreview}>
              {MONTHS[picked.monthIdx]} {DAYS[picked.dayIdx]}, {YEARS[picked.yearIdx]}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  topTitle: { fontSize: 18, color: COLORS.textColor, fontFamily: FONTS.regular, fontWeight: "700" },
  scroll: { paddingHorizontal: 18, alignItems: "center" },

  avatar: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: "center", justifyContent: "center", marginTop: 10, marginBottom: 12,
  },
  avatarInitial: { fontSize: 36, color: COLORS.white, fontFamily: FONTS.regular, fontWeight: "700" },
  name: { fontSize: 22, color: COLORS.textColor, fontFamily: FONTS.regular, fontWeight: "700" },
  email: { fontSize: 14, color: COLORS.textMuted, fontFamily: FONTS.regular, marginTop: 2, marginBottom: 8 },

  sectionTitle: {
    alignSelf: "flex-start", fontSize: 16, fontWeight: "700",
    color: COLORS.textColor, fontFamily: FONTS.regular, marginTop: 24, marginBottom: 10,
  },

  usCard: { width: "100%", backgroundColor: COLORS.card, borderRadius: 20, padding: 20, alignItems: "center" },
  usRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  usBubble: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  usInitial: { fontSize: 20, color: COLORS.white, fontFamily: FONTS.regular, fontWeight: "700" },
  usDays: { fontSize: 15, fontWeight: "700", color: COLORS.textColor, fontFamily: FONTS.regular, marginBottom: 4 },
  dayCount: { fontSize: 13, color: COLORS.textMuted, fontFamily: FONTS.regular, marginBottom: 12 },
  dateBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.inputBackground, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16,
  },
  dateBtnText: { fontSize: 13, color: COLORS.textColor, fontFamily: FONTS.regular, fontWeight: "600" },

  pairCard: {
    width: "100%", flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.card, borderRadius: 18, padding: 16,
  },
  pairEmoji: { fontSize: 26 },
  pairText: { flex: 1, fontSize: 15, fontWeight: "700", color: COLORS.textColor, fontFamily: FONTS.regular },

  colorRow: { flexDirection: "row", gap: 12, alignSelf: "flex-start" },
  swatch: { width: 38, height: 38, borderRadius: 19 },
  swatchActive: { borderWidth: 3, borderColor: COLORS.textColor },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.darkButton, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 28, marginTop: 40,
  },
  logoutText: { color: COLORS.white, fontSize: 15, fontWeight: "700", fontFamily: FONTS.regular },

  // Date picker modal
  pickerOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end",
  },
  pickerCard: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 8, paddingBottom: 32, paddingHorizontal: 20,
  },
  pickerHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 16,
  },
  pickerCancel: { fontSize: 15, color: COLORS.textMuted, fontFamily: FONTS.regular },
  pickerTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textColor, fontFamily: FONTS.regular },
  pickerSave: { fontSize: 15, fontWeight: "700", fontFamily: FONTS.regular },

  pickerCols: { flexDirection: "row", justifyContent: "space-around", marginBottom: 4 },
  colLabel: { flex: 1, textAlign: "center", fontSize: 12, color: COLORS.textMuted, fontFamily: FONTS.regular, fontWeight: "600", letterSpacing: 0.5 },

  wheelsRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, overflow: "hidden",
    backgroundColor: COLORS.inputBackground,
  },
  wheelDivider: { width: 1, height: ITEM_H * VISIBLE, backgroundColor: COLORS.border },

  pickerPreview: {
    textAlign: "center", fontSize: 14, color: COLORS.textMuted,
    fontFamily: FONTS.regular, marginTop: 16,
  },
});
