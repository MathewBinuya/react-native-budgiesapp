import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FONTS from '../../constants/fonts';
import { useColors } from '../../hooks/useColors';
import { useAuthStore } from '../../store/authStore';
import { useCoupleStore } from '../../store/coupleStore';

function AvatarBubble({ name, avatar, accentColor, size = 32 }) {
  const bg = accentColor || '#D4638D';
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {avatar
        ? <Image source={{ uri: avatar }} style={{ width: size, height: size }} resizeMode="cover" />
        : <Text style={{ fontSize: size * 0.4, color: '#FFF', fontWeight: '700', fontFamily: FONTS.regular }}>{initial}</Text>
      }
    </View>
  );
}

export default function Jar() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();

  const { user } = useAuthStore();
  const { loveJar, fetchLoveJar, addJarItem, claimJarItem, deleteJarItem, couple } = useCoupleStore();

  const [addModal, setAddModal] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const partner = couple?.members?.find(
    (m) => m._id?.toString() !== user?.id?.toString()
  );

  useFocusEffect(useCallback(() => { fetchLoveJar(); }, []));

  const unclaimed = loveJar.filter((i) => !i.claimedAt);
  const claimed   = loveJar.filter((i) => !!i.claimedAt);

  const handleAdd = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    const res = await addJarItem(draft.trim());
    setSaving(false);
    if (res.success) { setDraft(''); setAddModal(false); }
    else Alert.alert("Couldn't add", res.error);
  };

  const handleClaim = (item) => {
    const isOwn = item.addedBy?._id === user?.id || item.addedBy?._id?.toString() === user?.id;
    if (isOwn) {
      Alert.alert('This is your gift', 'This is something you left for your partner to claim.');
      return;
    }
    Alert.alert(
      'Claim this? 🎁',
      `"${item.text}"`,
      [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Claim it ❤️', onPress: () => claimJarItem(item._id) },
      ]
    );
  };

  const handleDelete = (item) => {
    Alert.alert('Remove from jar?', `"${item.text}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteJarItem(item._id) },
    ]);
  };

  const renderItem = ({ item, index }) => {
    const isOwn = item.addedBy?._id === user?.id || item.addedBy?._id?.toString() === user?.id;
    const adderColor = item.addedBy?.accentColor || COLORS.darkButton;
    const isClaimed = !!item.claimedAt;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isClaimed && styles.cardClaimed,
          !isClaimed && !isOwn && { borderLeftWidth: 3, borderLeftColor: adderColor },
        ]}
        onPress={() => !isClaimed && handleClaim(item)}
        onLongPress={() => handleDelete(item)}
        activeOpacity={isClaimed ? 1 : 0.75}
      >
        {isClaimed ? (
          // Claimed state
          <View style={styles.cardRow}>
            <Text style={styles.claimedEmoji}>❤️</Text>
            <View style={styles.cardBody}>
              <Text style={styles.claimedText}>{item.text}</Text>
              <Text style={styles.claimedBy}>
                Claimed by {item.claimedBy?.name?.split(' ')[0] || 'partner'}
              </Text>
            </View>
          </View>
        ) : isOwn ? (
          // My gift waiting for partner
          <View style={styles.cardRow}>
            <View style={[styles.giftIcon, { backgroundColor: adderColor + '20' }]}>
              <Text style={{ fontSize: 18 }}>🎁</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.waitingLabel}>Waiting to be claimed</Text>
              <Text style={styles.cardText}>{item.text}</Text>
            </View>
          </View>
        ) : (
          // Partner's gift for me to claim
          <View style={styles.cardRow}>
            <AvatarBubble
              name={item.addedBy?.name}
              avatar={item.addedBy?.avatar}
              accentColor={adderColor}
              size={38}
            />
            <View style={styles.cardBody}>
              <Text style={[styles.fromLabel, { color: adderColor }]}>
                From {item.addedBy?.name?.split(' ')[0] || 'partner'}
              </Text>
              <Text style={styles.cardText}>{item.text}</Text>
            </View>
            <View style={[styles.claimBtn, { backgroundColor: adderColor }]}>
              <Text style={styles.claimBtnText}>Claim</Text>
            </View>
          </View>
        )}
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
        <Text style={styles.topTitle}>Love Jar 🫙</Text>
        <View style={{ width: 44 }} />
      </View>

      {loveJar.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🫙</Text>
          <Text style={styles.emptyTitle}>The jar is empty</Text>
          <Text style={styles.emptySub}>
            Add sweet gestures and acts of love for your partner to claim whenever they want.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setAddModal(true)}>
            <Text style={styles.emptyBtnText}>Add something ✦</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={[...unclaimed, ...claimed]}
          keyExtractor={(i) => i._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            claimed.length > 0 && unclaimed.length > 0 ? (
              <Text style={styles.sectionLabel}>Claimed ({claimed.length})</Text>
            ) : null
          }
          ListFooterComponentStyle={{ marginTop: unclaimed.length > 0 ? 4 : 0 }}
          renderItem={renderItem}
        />
      )}

      {/* FAB */}
      {loveJar.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => { setDraft(''); setAddModal(true); }}>
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Add modal */}
      <Modal visible={addModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add to the jar 🫙</Text>
            <Text style={styles.modalHint}>What's a sweet thing you'll do for your partner?</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. I'll cook your favourite meal…"
              placeholderTextColor={COLORS.textMuted}
              value={draft}
              onChangeText={setDraft}
              maxLength={150}
              autoFocus
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!draft.trim() || saving) && { opacity: 0.4 }]}
                onPress={handleAdd}
                disabled={!draft.trim() || saving}
              >
                {saving
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.saveText}>Add ✦</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },

    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 14, paddingVertical: 12,
    },
    backBtn: { width: 44, height: 44, justifyContent: 'center' },
    topTitle: { fontSize: 18, fontWeight: '700', color: C.textColor, fontFamily: FONTS.regular },

    list: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 100 },

    card: {
      backgroundColor: C.card, borderRadius: 18,
      padding: 16, marginBottom: 10,
    },
    cardClaimed: { opacity: 0.45 },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    giftIcon: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    cardBody: { flex: 1 },
    fromLabel: { fontSize: 11, fontWeight: '700', fontFamily: FONTS.regular, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
    waitingLabel: { fontSize: 11, color: C.textMuted, fontFamily: FONTS.regular, marginBottom: 3 },
    cardText: { fontSize: 15, color: C.textColor, fontFamily: FONTS.regular, lineHeight: 21 },
    claimBtn: {
      borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, flexShrink: 0,
    },
    claimBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF', fontFamily: FONTS.regular },

    claimedEmoji: { fontSize: 22, flexShrink: 0 },
    claimedText: { fontSize: 14, color: C.textMuted, fontFamily: FONTS.regular, lineHeight: 20 },
    claimedBy: { fontSize: 11, color: C.textMuted, fontFamily: FONTS.regular, marginTop: 3 },

    sectionLabel: {
      fontSize: 11, color: C.textMuted, fontFamily: FONTS.regular, fontWeight: '600',
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 12,
    },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
    emptyEmoji: { fontSize: 64, marginBottom: 16 },
    emptyTitle: { fontSize: 22, fontWeight: '700', color: C.textColor, fontFamily: FONTS.regular, marginBottom: 8 },
    emptySub: { fontSize: 14, color: C.textMuted, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
    emptyBtn: {
      backgroundColor: C.darkButton, borderRadius: 22,
      paddingHorizontal: 24, paddingVertical: 14,
    },
    emptyBtnText: { fontSize: 15, fontWeight: '700', color: C.white, fontFamily: FONTS.regular },

    fab: {
      position: 'absolute', right: 22, bottom: 32,
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: C.darkButton,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8,
      elevation: 6,
    },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalCard: {
      backgroundColor: C.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 40,
    },
    modalTitle: { fontSize: 17, fontWeight: '700', color: C.textColor, fontFamily: FONTS.regular, marginBottom: 4 },
    modalHint: { fontSize: 13, color: C.textMuted, fontFamily: FONTS.regular, marginBottom: 16 },
    modalInput: {
      backgroundColor: C.card, borderRadius: 14, padding: 14,
      fontSize: 15, color: C.textColor, fontFamily: FONTS.regular,
      borderWidth: 1, borderColor: C.border, marginBottom: 20,
    },
    modalBtns: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, backgroundColor: C.card, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    cancelText: { fontSize: 15, fontWeight: '700', color: C.textColor, fontFamily: FONTS.regular },
    saveBtn: { flex: 1, backgroundColor: C.darkButton, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    saveText: { fontSize: 15, fontWeight: '700', color: C.white, fontFamily: FONTS.regular },
  });
}
