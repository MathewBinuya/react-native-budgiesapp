import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useCallback, useEffect, useState, useMemo } from "react";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FONTS from "../../constants/fonts";
import { useColors } from "../../hooks/useColors";
import api from "../../lib/api";

function timeAgo(iso) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "just now";
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  } catch { return ""; }
}

function getTypeMeta(C) {
  return {
    check_in:        { icon: "checkmark-circle", color: "#7DB348",   label: "checked in today" },
    pet_fed:         { icon: "restaurant",        color: C.darkButton, label: "fed your pet" },
    pet_played:      { icon: "game-controller",   color: C.lightButton,label: "played with your pet" },
    journal_written: { icon: "book",              color: "#9C8AA5",   label: "wrote in their journal" },
    pet_named:       { icon: "pencil",            color: "#7DA0C4",   label: "renamed your pet" },
  };
}

function NotifItem({ item }) {
  const COLORS = useColors();
  const TYPE_META = getTypeMeta(COLORS);
  const meta = TYPE_META[item.type] || { icon: "notifications", color: COLORS.darkButton, label: "did something" };
  const actorName = item.actor?.name?.split(" ")[0] || "Partner";

  return (
    <View style={[{
      flexDirection: "row", alignItems: "center", gap: 14,
      paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    }, !item.read && { backgroundColor: COLORS.card + "88" }]}>
      <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: meta.color + "22" }}>
        <Ionicons name={meta.icon} size={22} color={meta.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: COLORS.textColor, fontFamily: FONTS.regular, lineHeight: 20 }}>
          <Text style={{ fontWeight: "700" }}>{actorName}</Text>
          {" "}{meta.label}
          {item.type === "pet_named" && item.meta?.petName ? ` "${item.meta.petName}"` : ""}
        </Text>
        <Text style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: FONTS.regular, marginTop: 2 }}>
          {timeAgo(item.createdAt)}
        </Text>
      </View>
      {!item.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.darkButton, flexShrink: 0 }} />}
    </View>
  );
}

function PermissionBanner({ status, onRequest }) {
  const COLORS = useColors();
  if (status === "granted" || status === "loading") return null;
  return (
    <TouchableOpacity
      style={{ flexDirection: "row", alignItems: "center", backgroundColor: COLORS.darkButton, marginHorizontal: 18, marginBottom: 4, borderRadius: 14, padding: 14 }}
      onPress={onRequest}
      activeOpacity={0.8}
    >
      <Ionicons name="notifications" size={18} color={COLORS.white} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.white, fontFamily: FONTS.regular }}>
          Enable push notifications
        </Text>
        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontFamily: FONTS.regular, marginTop: 2 }}>
          Get notified when your partner checks in or cares for your pet.
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
    </TouchableOpacity>
  );
}

export default function Notifications() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permStatus, setPermStatus] = useState("loading");

  const requestPermission = async () => {
    try {
      const Notifications = require("expo-notifications");
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", { name: "Budgies", importance: Notifications.AndroidImportance?.MAX ?? 4, vibrationPattern: [0, 250, 250, 250] });
      }
      const { status } = await Notifications.requestPermissionsAsync();
      setPermStatus(status);
    } catch { setPermStatus("unavailable"); }
  };

  const checkPermission = async () => {
    try {
      const Notifications = require("expo-notifications");
      const { status } = await Notifications.getPermissionsAsync();
      setPermStatus(status);
      if (status === "undetermined") await requestPermission();
    } catch { setPermStatus("unavailable"); }
  };

  const load = async () => {
    setLoading(true);
    const res = await api.get("/notifications");
    setLoading(false);
    if (res.ok) { setNotifications(res.data.notifications || []); api.post("/notifications/read"); }
  };

  useEffect(() => { checkPermission(); }, []);
  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <View style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.textColor} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <PermissionBanner status={permStatus} onRequest={requestPermission} />

      {loading ? (
        <View style={styles.body}><ActivityIndicator color={COLORS.darkButton} /></View>
      ) : notifications.length === 0 ? (
        <View style={styles.body}>
          <Text style={styles.emoji}>🔔</Text>
          <Text style={styles.heading}>All caught up</Text>
          <Text style={styles.sub}>Your partner's activity will show up here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n._id}
          renderItem={({ item }) => <NotifItem item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 },
    backBtn: { width: 40, height: 40, justifyContent: "center" },
    topTitle: { fontSize: 18, color: C.textColor, fontFamily: FONTS.regular, fontWeight: "700" },
    body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 8 },
    emoji: { fontSize: 52, marginBottom: 6 },
    heading: { fontSize: 22, color: C.textColor, fontFamily: FONTS.regular, fontWeight: "700" },
    sub: { fontSize: 14, color: C.textMuted, fontFamily: FONTS.regular, textAlign: "center", lineHeight: 20 },
    list: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 30 },
  });
}
