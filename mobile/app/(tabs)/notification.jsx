import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import FONTS from "../../constants/fonts";
import api from "../../lib/api";

const TYPE_META = {
  check_in: { icon: "checkmark-circle", color: "#7DB348", label: "checked in today" },
  pet_fed: { icon: "restaurant", color: COLORS.darkButton, label: "fed your pet" },
  pet_played: { icon: "game-controller", color: COLORS.lightButton, label: "played with your pet" },
  journal_written: { icon: "book", color: "#9C8AA5", label: "wrote in their journal" },
  pet_named: { icon: "pencil", color: "#7DA0C4", label: "renamed your pet" },
};

function timeAgo(iso) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "just now";
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  } catch {
    return "";
  }
}

function NotifItem({ item }) {
  const meta = TYPE_META[item.type] || {
    icon: "notifications",
    color: COLORS.darkButton,
    label: "did something",
  };
  const actorName = item.actor?.name?.split(" ")[0] || "Partner";

  return (
    <View style={[styles.item, !item.read && styles.itemUnread]}>
      <View style={[styles.iconWrap, { backgroundColor: meta.color + "22" }]}>
        <Ionicons name={meta.icon} size={22} color={meta.color} />
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemText}>
          <Text style={styles.actorName}>{actorName}</Text>
          {" "}{meta.label}
          {item.type === "pet_named" && item.meta?.petName
            ? ` "${item.meta.petName}"`
            : ""}
        </Text>
        <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </View>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await api.get("/notifications");
    setLoading(false);
    if (res.ok) {
      setNotifications(res.data.notifications || []);
      // Mark all as read after viewing
      api.post("/notifications/read");
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  return (
    <View style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.textColor} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.body}>
          <ActivityIndicator color={COLORS.darkButton} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.body}>
          <Text style={styles.emoji}>🔔</Text>
          <Text style={styles.heading}>All caught up</Text>
          <Text style={styles.sub}>
            Your partner's activity will show up here.
          </Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  topTitle: {
    fontSize: 18,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    fontWeight: "700",
  },

  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  emoji: { fontSize: 52, marginBottom: 6 },
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
  },

  list: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 30 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemUnread: { backgroundColor: COLORS.card + "88" },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemBody: { flex: 1 },
  itemText: {
    fontSize: 14,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  actorName: { fontWeight: "700" },
  itemTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.darkButton,
    flexShrink: 0,
  },
});
