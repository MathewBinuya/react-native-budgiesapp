import {
  View,
  Text,
  Image,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FONTS from '../../constants/fonts';
import { useColors } from '../../hooks/useColors';
import { useAuthStore } from '../../store/authStore';
import { useLetterStore } from '../../store/letterStore';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function AvatarBubble({ name, avatar, accentColor, size = 36 }) {
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
        : <Text style={{ fontSize: size * 0.38, color: '#FFF', fontWeight: '700', fontFamily: FONTS.regular }}>{initial}</Text>
      }
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function Letters() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();

  const { user } = useAuthStore();
  const { inbox, sent, fetchInbox, fetchSent, fetchUnreadCount, openLetter, sendLetter, deleteLetter } = useLetterStore();

  const [activeTab, setActiveTab] = useState('inbox');
  const [composing, setComposing] = useState(false);
  const [openedLetter, setOpenedLetter] = useState(null);
  const [loadingLetter, setLoadingLetter] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useFocusEffect(useCallback(() => {
    fetchInbox();
    fetchSent();
    fetchUnreadCount();
  }, []));

  const handleOpen = async (letter) => {
    setLoadingLetter(true);
    const res = await openLetter(letter._id);
    setLoadingLetter(false);
    if (res.success) setOpenedLetter(res.letter);
  };

  const handleSend = async () => {
    if (!body.trim()) return;
    setSending(true);
    const res = await sendLetter(subject.trim(), body.trim());
    setSending(false);
    if (res.success) {
      setSubject('');
      setBody('');
      setComposing(false);
    } else {
      Alert.alert("Couldn't send", res.error || 'Something went wrong');
    }
  };

  const handleDelete = (letter) => {
    Alert.alert('Delete letter?', 'This will remove it from your ' + activeTab + '.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (openedLetter?._id === letter._id) setOpenedLetter(null);
          await deleteLetter(letter._id, activeTab);
        },
      },
    ]);
  };

  const data = activeTab === 'inbox' ? inbox : sent;

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (openedLetter) {
    const isOwn = openedLetter.from._id === user?.id || openedLetter.from._id?.toString() === user?.id;
    const other = isOwn ? openedLetter.to : openedLetter.from;
    const me = isOwn ? openedLetter.from : openedLetter.to;
    return (
      <View style={styles.safe}>
        <View style={styles.detailHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setOpenedLetter(null)}>
            <Ionicons name="chevron-back" size={26} color={COLORS.textColor} />
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>Letter</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => handleDelete(openedLetter)}>
            <Ionicons name="trash-outline" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
          {/* From / To row */}
          <View style={styles.detailMeta}>
            <View style={styles.detailParty}>
              <AvatarBubble name={openedLetter.from.name} avatar={openedLetter.from.avatar} accentColor={openedLetter.from.accentColor} size={40} />
              <View>
                <Text style={styles.detailPartyLabel}>From</Text>
                <Text style={styles.detailPartyName}>{openedLetter.from.name?.split(' ')[0]}</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={16} color={COLORS.textMuted} />
            <View style={styles.detailParty}>
              <AvatarBubble name={openedLetter.to.name} avatar={openedLetter.to.avatar} accentColor={openedLetter.to.accentColor} size={40} />
              <View>
                <Text style={styles.detailPartyLabel}>To</Text>
                <Text style={styles.detailPartyName}>{openedLetter.to.name?.split(' ')[0]}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.detailDate}>{formatFullDate(openedLetter.createdAt)}</Text>

          {/* Letter paper */}
          <View style={styles.letterPaper}>
            {openedLetter.subject ? (
              <Text style={styles.letterSubject}>{openedLetter.subject}</Text>
            ) : null}
            <Text style={styles.letterBody}>{openedLetter.body}</Text>
          </View>

          {/* Reply button — only if viewing a received letter */}
          {!isOwn && (
            <TouchableOpacity
              style={styles.replyBtn}
              onPress={() => {
                setOpenedLetter(null);
                setActiveTab('inbox');
                setComposing(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="return-up-back-outline" size={18} color={COLORS.white} />
              <Text style={styles.replyBtnText}>Write back</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Letters</Text>
        <TouchableOpacity style={styles.composeBtn} onPress={() => setComposing(true)} activeOpacity={0.8}>
          <Ionicons name="create-outline" size={18} color={COLORS.white} />
          <Text style={styles.composeBtnText}>Write</Text>
        </TouchableOpacity>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'inbox' && styles.tabBtnActive]}
          onPress={() => setActiveTab('inbox')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'inbox' && styles.tabBtnTextActive]}>
            Inbox {inbox.filter((l) => !l.readAt).length > 0 ? `· ${inbox.filter((l) => !l.readAt).length}` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'sent' && styles.tabBtnActive]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'sent' && styles.tabBtnTextActive]}>Sent</Text>
        </TouchableOpacity>
      </View>

      {/* Letter list */}
      {loadingLetter ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.darkButton} />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>{activeTab === 'inbox' ? '📭' : '📬'}</Text>
          <Text style={styles.emptyTitle}>
            {activeTab === 'inbox' ? 'No letters yet' : 'Nothing sent yet'}
          </Text>
          <Text style={styles.emptySub}>
            {activeTab === 'inbox'
              ? 'When your partner writes to you, letters will appear here.'
              : 'Tap Write to send your first letter.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const isUnread = activeTab === 'inbox' && !item.readAt;
            const person = activeTab === 'inbox' ? item.from : item.to;
            const preview = item.body.replace(/\n/g, ' ').slice(0, 80);
            return (
              <TouchableOpacity
                style={styles.letterRow}
                onPress={() => handleOpen(item)}
                onLongPress={() => handleDelete(item)}
                activeOpacity={0.7}
              >
                {/* Unread dot */}
                <View style={[styles.unreadDot, { backgroundColor: isUnread ? COLORS.darkButton : 'transparent' }]} />
                <AvatarBubble name={person?.name} avatar={person?.avatar} accentColor={person?.accentColor} size={44} />
                <View style={styles.letterInfo}>
                  <View style={styles.letterTopRow}>
                    <Text style={[styles.letterFrom, isUnread && styles.letterFromBold]} numberOfLines={1}>
                      {person?.name?.split(' ')[0] || '—'}
                    </Text>
                    <Text style={styles.letterDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                  {item.subject ? (
                    <Text style={[styles.letterSubjectLine, isUnread && styles.letterSubjectBold]} numberOfLines={1}>
                      {item.subject}
                    </Text>
                  ) : null}
                  <Text style={styles.letterPreview} numberOfLines={1}>{preview}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Compose modal */}
      <Modal visible={composing} animationType="slide">
        <KeyboardAvoidingView
          style={[styles.safe, { backgroundColor: COLORS.background, paddingTop: insets.top }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Compose header */}
          <View style={styles.composeHeader}>
            <TouchableOpacity onPress={() => { setComposing(false); setSubject(''); setBody(''); }}>
              <Ionicons name="close" size={26} color={COLORS.textColor} />
            </TouchableOpacity>
            <Text style={styles.composeHeaderTitle}>New Letter</Text>
            <TouchableOpacity
              style={[styles.sendBtn, (!body.trim() || sending) && { opacity: 0.4 }]}
              onPress={handleSend}
              disabled={!body.trim() || sending}
            >
              {sending
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Text style={styles.sendBtnText}>Send ✉️</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.composeScroll} keyboardShouldPersistTaps="handled">
            {/* Subject */}
            <View style={styles.subjectRow}>
              <Text style={styles.fieldLabel}>Subject</Text>
              <TextInput
                style={styles.subjectInput}
                placeholder="What's this about? (optional)"
                placeholderTextColor={COLORS.textMuted}
                value={subject}
                onChangeText={setSubject}
                maxLength={80}
                returnKeyType="next"
              />
            </View>

            <View style={styles.composeDivider} />

            {/* Body */}
            <TextInput
              style={styles.bodyInput}
              placeholder="Write your letter here…"
              placeholderTextColor={COLORS.textMuted}
              value={body}
              onChangeText={setBody}
              maxLength={3000}
              multiline
              autoFocus
              textAlignVertical="top"
            />

            <Text style={styles.charCount}>{body.length}/3000</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },

    // Header
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 18, paddingVertical: 14,
    },
    headerTitle: { fontSize: 22, fontWeight: '700', color: C.textColor, fontFamily: FONTS.regular },
    composeBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: C.darkButton, borderRadius: 20,
      paddingHorizontal: 14, paddingVertical: 8,
    },
    composeBtnText: { fontSize: 13, fontWeight: '700', color: C.white, fontFamily: FONTS.regular },

    // Tabs
    tabRow: {
      flexDirection: 'row', paddingHorizontal: 18, gap: 8, marginBottom: 8,
    },
    tabBtn: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      backgroundColor: C.card,
    },
    tabBtnActive: { backgroundColor: C.darkButton },
    tabBtnText: { fontSize: 13, fontWeight: '600', color: C.textMuted, fontFamily: FONTS.regular },
    tabBtnTextActive: { color: C.white },

    // Letter list
    list: { paddingHorizontal: 18, paddingBottom: 40 },
    separator: { height: 1, backgroundColor: C.border, marginLeft: 68 },
    letterRow: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12,
    },
    unreadDot: { width: 7, height: 7, borderRadius: 3.5, flexShrink: 0 },
    letterInfo: { flex: 1 },
    letterTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
    letterFrom: { fontSize: 14, color: C.textColor, fontFamily: FONTS.regular, flex: 1 },
    letterFromBold: { fontWeight: '700' },
    letterDate: { fontSize: 12, color: C.textMuted, fontFamily: FONTS.regular, marginLeft: 8 },
    letterSubjectLine: { fontSize: 13, color: C.textColor, fontFamily: FONTS.regular, marginBottom: 2 },
    letterSubjectBold: { fontWeight: '700' },
    letterPreview: { fontSize: 13, color: C.textMuted, fontFamily: FONTS.regular },

    // Empty state
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyEmoji: { fontSize: 52, marginBottom: 14 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: C.textColor, fontFamily: FONTS.regular, marginBottom: 6 },
    emptySub: { fontSize: 14, color: C.textMuted, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 20 },

    // Detail view
    detailHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 10, paddingVertical: 12,
    },
    backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    detailHeaderTitle: { fontSize: 17, fontWeight: '700', color: C.textColor, fontFamily: FONTS.regular },
    detailScroll: { paddingHorizontal: 20, paddingBottom: 60 },
    detailMeta: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 12,
    },
    detailParty: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    detailPartyLabel: { fontSize: 10, color: C.textMuted, fontFamily: FONTS.regular, fontWeight: '600', textTransform: 'uppercase' },
    detailPartyName: { fontSize: 15, fontWeight: '700', color: C.textColor, fontFamily: FONTS.regular },
    detailDate: { fontSize: 12, color: C.textMuted, fontFamily: FONTS.regular, textAlign: 'center', marginBottom: 20 },

    // Letter paper
    letterPaper: {
      backgroundColor: C.card, borderRadius: 20, padding: 24, marginBottom: 24,
    },
    letterSubject: {
      fontSize: 18, fontWeight: '700', color: C.textColor,
      fontFamily: FONTS.regular, marginBottom: 16,
    },
    letterBody: {
      fontSize: 16, color: C.textColor, fontFamily: FONTS.regular,
      lineHeight: 26,
    },

    // Reply
    replyBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: C.darkButton, borderRadius: 20,
      paddingVertical: 14, paddingHorizontal: 28,
    },
    replyBtnText: { fontSize: 15, fontWeight: '700', color: C.white, fontFamily: FONTS.regular },

    // Compose modal
    composeHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    composeHeaderTitle: { fontSize: 16, fontWeight: '700', color: C.textColor, fontFamily: FONTS.regular },
    sendBtn: {
      backgroundColor: C.darkButton, borderRadius: 20,
      paddingHorizontal: 16, paddingVertical: 8,
    },
    sendBtnText: { fontSize: 13, fontWeight: '700', color: C.white, fontFamily: FONTS.regular },
    composeScroll: { padding: 20, flexGrow: 1 },
    subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 14 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textMuted, fontFamily: FONTS.regular, width: 56 },
    subjectInput: {
      flex: 1, fontSize: 15, color: C.textColor,
      fontFamily: FONTS.regular,
    },
    composeDivider: { height: 1, backgroundColor: C.border, marginBottom: 16 },
    bodyInput: {
      fontSize: 16, color: C.textColor, fontFamily: FONTS.regular,
      lineHeight: 26, minHeight: 300,
    },
    charCount: { fontSize: 11, color: C.textMuted, fontFamily: FONTS.regular, textAlign: 'right', marginTop: 8 },
  });
}
