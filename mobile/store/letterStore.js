import { create } from 'zustand';
import api from '../lib/api';

export const useLetterStore = create((set, get) => ({
  inbox: [],
  sent: [],
  unreadCount: 0,

  fetchInbox: async () => {
    const res = await api.get('/letters/inbox');
    if (res.ok) set({ inbox: res.data.letters ?? [] });
  },

  fetchSent: async () => {
    const res = await api.get('/letters/sent');
    if (res.ok) set({ sent: res.data.letters ?? [] });
  },

  fetchUnreadCount: async () => {
    const res = await api.get('/letters/unread-count');
    if (res.ok) set({ unreadCount: res.data.count ?? 0 });
  },

  openLetter: async (id) => {
    const res = await api.get(`/letters/${id}`);
    if (!res.ok) return { success: false };
    const letter = res.data.letter;
    // Mark as read in local inbox
    set((s) => {
      const wasUnread = s.inbox.some((l) => l._id === id && !l.readAt);
      return {
        inbox: s.inbox.map((l) => l._id === id ? { ...l, readAt: letter.readAt } : l),
        unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
      };
    });
    return { success: true, letter };
  },

  sendLetter: async (subject, body) => {
    const res = await api.post('/letters', { subject, body });
    if (res.ok) {
      set((s) => ({ sent: [res.data.letter, ...s.sent] }));
      return { success: true };
    }
    return { success: false, error: res.data?.message };
  },

  deleteLetter: async (id, tab) => {
    const res = await api.del(`/letters/${id}`);
    if (res.ok) {
      set((s) => ({
        inbox: tab === 'inbox' ? s.inbox.filter((l) => l._id !== id) : s.inbox,
        sent: tab === 'sent' ? s.sent.filter((l) => l._id !== id) : s.sent,
      }));
      return { success: true };
    }
    return { success: false };
  },

  reset: () => set({ inbox: [], sent: [], unreadCount: 0 }),
}));
