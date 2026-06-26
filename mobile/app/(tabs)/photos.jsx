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
import { useState, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import FONTS from "../../constants/fonts";
import { useCoupleStore } from "../../store/coupleStore";
import api from "../../lib/api";

const { width } = Dimensions.get("window");
const COLS = 3;
const CELL = (width - 18 * 2 - 4 * (COLS - 1)) / COLS;

function formatPhotoDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

// Resolve ImagePicker once so the require only runs once
let _ImagePicker = null;
function getImagePicker() {
  if (_ImagePicker) return _ImagePicker;
  try {
    _ImagePicker = require("expo-image-picker");
    return _ImagePicker;
  } catch {
    return null;
  }
}

export default function Photos() {
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
    }, [isPaired])
  );

  // ── Permission + picker ────────────────────────────────────────────────────
  const handleUpload = async () => {
    const ImagePicker = getImagePicker();

    if (!ImagePicker) {
      Alert.alert(
        "Package not installed",
        'Run  expo install expo-image-picker  inside the mobile folder, then rebuild the app.',
      );
      return;
    }

    // Check existing permission status before requesting
    let currentStatus;
    try {
      const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
      currentStatus = perm.status;
    } catch {
      currentStatus = "undetermined";
    }

    if (currentStatus === "denied") {
      // User previously denied — send them to Settings
      Alert.alert(
        "Photo access required",
        "You've previously denied photo access. Please enable it in your device Settings to upload photos.",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(),
          },
        ],
      );
      return;
    }

    if (currentStatus !== "granted") {
      // Ask for permission
      const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        if (!canAskAgain) {
          Alert.alert(
            "Photo access required",
            "Please enable photo access in your device Settings to upload photos.",
            [
              { text: "Not now", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ],
          );
        } else {
          Alert.alert(
            "Permission needed",
            "Allow access to your photo library to upload shared memories.",
          );
        }
        return;
      }
    }

    // Permission granted — open library
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        // SDK 54 accepts the string form; MediaTypeOptions is deprecated
        mediaTypes: "images",
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setPendingFile(asset);
      setCaption("");
      setCaptionModal(true);
    } catch (err) {
      Alert.alert("Couldn't open photos", err?.message || "Try again.");
    }
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    setCaptionModal(false);
    setUploading(true);

    const formData = new FormData();
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
      Alert.alert("Upload failed", res.data?.message || "Try again.");
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

  // ── Locked state ─────────────────────────────────────────────────────────
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
          <Ionicons name="images-outline" size={64} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
          <Text style={styles.lockTitle}>Shared gallery</Text>
          <Text style={styles.lockSub}>Pair with someone to start sharing memories.</Text>
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
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={uploading}>
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
          <Ionicons name="images-outline" size={64} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
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
              <Image source={{ uri: item.url }} style={styles.thumb} resizeMode="cover" />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 4 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Caption modal */}
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
                onPress={() => { setCaptionModal(false); confirmUpload(); }}
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

      {/* Fullscreen preview */}
      <Modal visible={!!preview} transparent animationType="fade">
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreview(null)}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
          {preview && (
            <>
              <Image source={{ uri: preview.url }} style={styles.previewImage} resizeMode="contain" />
              {preview.caption ? (
                <Text style={styles.previewCaption}>{preview.caption}</Text>
              ) : null}
              <Text style={styles.previewDate}>
                {formatPhotoDate(preview.takenAt || preview.createdAt)}
                {preview.uploadedBy?.name ? `  ·  ${preview.uploadedBy.name}` : ""}
              </Text>
              <TouchableOpacity style={styles.previewDelete} onPress={() => handleDelete(preview)}>
                <Ionicons name="trash-outline" size={22} color={COLORS.white} />
              </TouchableOpacity>
            </>
          )}
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
  uploadBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.darkButton, alignItems: "center", justifyContent: "center",
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  lockTitle: { fontSize: 20, fontWeight: "700", color: COLORS.textColor, fontFamily: FONTS.regular, marginBottom: 6 },
  lockSub: { fontSize: 14, color: COLORS.textMuted, fontFamily: FONTS.regular, textAlign: "center", lineHeight: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textColor, fontFamily: FONTS.regular, marginBottom: 4 },
  emptySub: { fontSize: 14, color: COLORS.textMuted, fontFamily: FONTS.regular, textAlign: "center" },

  grid: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 20 },
  cell: { width: CELL, height: CELL, borderRadius: 8, overflow: "hidden", marginBottom: 4 },
  thumb: { width: "100%", height: "100%" },

  captionOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  captionCard: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  captionTitle: { fontSize: 17, fontWeight: "700", color: COLORS.textColor, fontFamily: FONTS.regular, marginBottom: 14, textAlign: "center" },
  captionInput: {
    backgroundColor: COLORS.inputBackground, borderRadius: 12, padding: 14,
    fontSize: 15, color: COLORS.textColor, fontFamily: FONTS.regular,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 18,
  },
  captionBtns: { flexDirection: "row", gap: 12 },
  captionSkipBtn: { flex: 1, backgroundColor: COLORS.card, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  captionSkipText: { fontSize: 15, fontWeight: "700", color: COLORS.textColor, fontFamily: FONTS.regular },
  captionSaveBtn: { flex: 1, backgroundColor: COLORS.darkButton, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  captionSaveText: { fontSize: 15, fontWeight: "700", color: COLORS.white, fontFamily: FONTS.regular },

  previewOverlay: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  previewClose: { position: "absolute", top: Platform.OS === "ios" ? 54 : 20, left: 20, zIndex: 10, padding: 8 },
  previewImage: { width, height: width * 1.2 },
  previewCaption: {
    position: "absolute", bottom: 80, left: 20, right: 20,
    color: "#fff", fontSize: 15, fontFamily: FONTS.regular, textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  previewDate: {
    position: "absolute", bottom: 54, left: 20, right: 20,
    color: "rgba(255,255,255,0.65)", fontSize: 13, fontFamily: FONTS.regular, textAlign: "center",
  },
  previewDelete: { position: "absolute", top: Platform.OS === "ios" ? 54 : 20, right: 20, padding: 8, zIndex: 10 },
});
