import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  TextInput,
  Platform,
  Linking,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState, useCallback, useMemo } from "react";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FONTS from "../../constants/fonts";
import { useColors } from "../../hooks/useColors";
import { useCoupleStore } from "../../store/coupleStore";
import api from "../../lib/api";

const { width } = Dimensions.get("window");
const COLS = 3;
const CELL = (width - 18 * 2 - 4 * (COLS - 1)) / COLS;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — matches backend multer limit

function formatPhotoDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// ── Permission helpers ────────────────────────────────────────────────────────

async function ensureMediaPermission(ImagePicker) {
  const { status: current, canAskAgain } =
    await ImagePicker.getMediaLibraryPermissionsAsync();

  if (current === "granted") return true;

  if (!canAskAgain) {
    Alert.alert(
      "Photo access required",
      "You've denied photo access. Enable it in Settings to upload memories.",
      [
        { text: "Not now", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ],
    );
    return false;
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status === "granted") return true;

  Alert.alert(
    "Permission needed",
    "Allow Budgies to access your photos to upload shared memories.",
    [
      { text: "Not now", style: "cancel" },
      { text: "Open Settings", onPress: () => Linking.openSettings() },
    ],
  );
  return false;
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function Photos() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const { isPaired } = useCoupleStore();

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [preview, setPreview] = useState(null);
  const [captionModal, setCaptionModal] = useState(false);
  const [caption, setCaption] = useState("");
  const [pendingFile, setPendingFile] = useState(null);

  const loadPhotos = async () => {
    if (!isPaired) return;
    setLoading(true);
    const res = await api.get("/photos?limit=60");
    setLoading(false);
    if (res.ok) setPhotos(res.data.photos || []);
  };

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [isPaired]),
  );

  // ── Upload flow ───────────────────────────────────────────────────────────

  const handleUpload = async () => {
    const ok = await ensureMediaPermission(ImagePicker);
    if (!ok) return;

    let result;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        // String form required for expo-image-picker SDK 16 / Expo SDK 54
        mediaTypes: "images",
        allowsEditing: true,
        quality: 0.85,
      });
    } catch (err) {
      Alert.alert("Couldn't open photos", err?.message || "Try again.");
      return;
    }

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];

    // Client-side file-size guard (matches 8 MB backend limit)
    if (asset.fileSize && asset.fileSize > MAX_BYTES) {
      Alert.alert(
        "Image too large",
        "Please choose an image under 8 MB.",
      );
      return;
    }

    setPendingFile(asset);
    setCaption("");
    setCaptionModal(true);
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    setCaptionModal(false);
    setUploading(true);

    const formData = new FormData();
    // React Native FormData expects { uri, type, name } for file fields
    formData.append("image", {
      uri: pendingFile.uri,
      type: pendingFile.mimeType || "image/jpeg",
      name: pendingFile.fileName || "photo.jpg",
    });
    if (caption.trim()) formData.append("caption", caption.trim());

    const res = await api.upload("/photos", formData);
    setUploading(false);

    if (res.ok) {
      setPhotos((prev) => [res.data.photo, ...prev]);
    } else {
      Alert.alert("Upload failed", res.data?.message || "Something went wrong. Try again.");
    }

    setPendingFile(null);
    setCaption("");
  };

  const handleDelete = (photo) => {
    Alert.alert("Delete photo?", "This will permanently remove the photo.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await api.del(`/photos/${photo._id}`);
          if (res.ok) {
            setPhotos((prev) => prev.filter((p) => p._id !== photo._id));
            setPreview(null);
          } else {
            Alert.alert("Couldn't delete", res.data?.message || "Try again.");
          }
        },
      },
    ]);
  };

  // ── Locked state (not paired) ─────────────────────────────────────────────

  if (!isPaired) {
    return (
      <View style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={COLORS.textColor} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Photos</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Ionicons
            name="images-outline"
            size={64}
            color={COLORS.textMuted}
            style={{ marginBottom: 12 }}
          />
          <Text style={styles.lockTitle}>Shared gallery</Text>
          <Text style={styles.lockSub}>
            Pair with someone to start sharing memories.
          </Text>
        </View>
      </View>
    );
  }

  // ── Gallery ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.textColor} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Photos</Text>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="add" size={22} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.darkButton} />
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="images-outline"
            size={64}
            color={COLORS.textMuted}
            style={{ marginBottom: 12 }}
          />
          <Text style={styles.emptyTitle}>No memories yet</Text>
          <Text style={styles.emptySub}>Tap + to add your first photo 📸</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(p) => p._id}
          numColumns={COLS}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setPreview(item)} style={styles.cell}>
              <Image
                source={{ uri: item.url }}
                style={styles.thumb}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 4 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Caption modal ──────────────────────────────────────────── */}
      <Modal visible={captionModal} transparent animationType="slide">
        <View style={styles.captionOverlay}>
          <View style={styles.captionCard}>
            <Text style={styles.captionTitle}>Add a caption</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Optional caption…"
              placeholderTextColor={COLORS.textMuted}
              value={caption}
              onChangeText={setCaption}
              maxLength={200}
              autoFocus
            />
            <View style={styles.captionBtns}>
              <TouchableOpacity
                style={styles.captionSkipBtn}
                onPress={() => {
                  setCaptionModal(false);
                  confirmUpload();
                }}
              >
                <Text style={styles.captionSkipText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.captionSaveBtn} onPress={confirmUpload}>
                <Text style={styles.captionSaveText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Fullscreen preview ─────────────────────────────────────── */}
      <Modal visible={!!preview} transparent animationType="fade">
        <View style={styles.previewOverlay}>
          <TouchableOpacity
            style={styles.previewClose}
            onPress={() => setPreview(null)}
          >
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>

          {preview && (
            <>
              <Image
                source={{ uri: preview.url }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              {!!preview.caption && (
                <Text style={styles.previewCaption}>{preview.caption}</Text>
              )}
              <Text style={styles.previewDate}>
                {formatPhotoDate(preview.takenAt || preview.createdAt)}
                {preview.uploadedBy?.name
                  ? `  ·  ${preview.uploadedBy.name}`
                  : ""}
              </Text>
              <TouchableOpacity
                style={styles.previewDelete}
                onPress={() => handleDelete(preview)}
              >
                <Ionicons name="trash-outline" size={22} color={COLORS.white} />
              </TouchableOpacity>
            </>
          )}
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
    uploadBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.darkButton, alignItems: "center", justifyContent: "center" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
    lockTitle: { fontSize: 20, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular, marginBottom: 6 },
    lockSub: { fontSize: 14, color: C.textMuted, fontFamily: FONTS.regular, textAlign: "center", lineHeight: 20 },
    emptyTitle: { fontSize: 18, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular, marginBottom: 4 },
    emptySub: { fontSize: 14, color: C.textMuted, fontFamily: FONTS.regular, textAlign: "center" },
    grid: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 20 },
    cell: { width: CELL, height: CELL, borderRadius: 8, overflow: "hidden", marginBottom: 4 },
    thumb: { width: "100%", height: "100%" },
    captionOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    captionCard: { backgroundColor: C.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24 },
    captionTitle: { fontSize: 17, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular, marginBottom: 14, textAlign: "center" },
    captionInput: { backgroundColor: C.inputBackground, borderRadius: 12, padding: 14, fontSize: 15, color: C.textColor, fontFamily: FONTS.regular, borderWidth: 1, borderColor: C.border, marginBottom: 18 },
    captionBtns: { flexDirection: "row", gap: 12 },
    captionSkipBtn: { flex: 1, backgroundColor: C.card, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
    captionSkipText: { fontSize: 15, fontWeight: "700", color: C.textColor, fontFamily: FONTS.regular },
    captionSaveBtn: { flex: 1, backgroundColor: C.darkButton, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
    captionSaveText: { fontSize: 15, fontWeight: "700", color: C.white, fontFamily: FONTS.regular },
    previewOverlay: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
    previewClose: { position: "absolute", top: Platform.OS === "ios" ? 54 : 20, left: 20, zIndex: 10, padding: 8 },
    previewImage: { width, height: width * 1.2 },
    previewCaption: { position: "absolute", bottom: 80, left: 20, right: 20, color: "#fff", fontSize: 15, fontFamily: FONTS.regular, textAlign: "center", textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
    previewDate: { position: "absolute", bottom: 54, left: 20, right: 20, color: "rgba(255,255,255,0.65)", fontSize: 13, fontFamily: FONTS.regular, textAlign: "center" },
    previewDelete: { position: "absolute", top: Platform.OS === "ios" ? 54 : 20, right: 20, padding: 8, zIndex: 10 },
  });
}
