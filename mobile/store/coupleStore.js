import { create } from "zustand";
import api from "../lib/api";
import { useAuthStore } from "./authStore";

export const useCoupleStore = create((set, get) => ({
  couple: null,
  streak: null,
  moods: {},        // { [userId]: { emoji, label, date } }
  bucketList: [],
  loveJar: [],
  daysTogether: null,
  isPaired: false,
  loading: false,
  loaded: false,

  // Pull couple + streak together, then auto check-in if not done yet today.
  // Call this on every Home/focus mount.
  loadCoupleData: async () => {
    set({ loading: true });
    try {
      const [coupleRes, streakRes] = await Promise.all([
        api.get("/couple"),
        api.get("/streak"),
      ]);

      // 403 means "not paired yet" — valid state, not an error
      if (coupleRes.status === 403) {
        set({ isPaired: false, couple: null, streak: null, daysTogether: null, loaded: true });
        return;
      }

      const isPaired = coupleRes.ok ? !!coupleRes.data.isPaired : false;
      let streakData = streakRes.ok ? streakRes.data.streak : null;

      set({
        couple: coupleRes.ok ? coupleRes.data.couple : null,
        daysTogether: coupleRes.ok ? coupleRes.data.daysTogether : null,
        moods: coupleRes.ok ? (coupleRes.data.moods ?? {}) : {},
        isPaired,
        streak: streakData,
        loaded: true,
      });

      // Auto check-in when app opens — both partners just need to open the app.
      // The backend is idempotent so calling this multiple times per day is safe.
      if (isPaired && !streakData?.youCheckedInToday) {
        const checkInRes = await api.post("/streak/checkin");
        if (checkInRes.ok) set({ streak: checkInRes.data.streak });
      }
    } catch {
      set({ loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  // Kept for manual use if needed, but primary check-in is now via loadCoupleData.
  checkIn: async () => {
    const res = await api.post("/streak/checkin");
    if (res.ok) {
      set({ streak: res.data.streak });
      return { success: true, streak: res.data.streak };
    }
    return { success: false, error: res.data?.message || "Could not check in" };
  },

  // Spend one monthly restore to recover the last broken streak.
  restoreStreak: async () => {
    const res = await api.post("/streak/restore");
    if (res.ok) {
      set({ streak: res.data.streak });
      return { success: true, message: res.data.message };
    }
    return { success: false, error: res.data?.message || "Could not restore streak" };
  },

  // Permanently dissolve the partnership. Deletes all shared data on the server
  // (photos, journals, notifications, pet, streak) for BOTH partners, then
  // resets this client's state so the user appears unpaired immediately.
  leavePartner: async () => {
    const res = await api.del("/couple/leave");
    if (res.ok) {
      // Clear couple ID from the cached user so bootstrap doesn't see stale data
      await useAuthStore.getState().clearCouple();
      set({
        couple: null,
        streak: null,
        daysTogether: null,
        isPaired: false,
        loaded: true,
      });
      return { success: true };
    }
    return {
      success: false,
      error: res.data?.message || "Could not leave the partnership. Try again.",
    };
  },

  // ── Mood ring ────────────────────────────────────────────────────────────────
  setMood: async (emoji, label) => {
    const res = await api.patch('/couple/mood', { emoji, label });
    if (res.ok) set({ moods: res.data.moods ?? {} });
    return res.ok ? { success: true } : { success: false, error: res.data?.message };
  },

  // ── Bucket list ───────────────────────────────────────────────────────────
  fetchBucketList: async () => {
    const res = await api.get('/couple/bucket');
    if (res.ok) set({ bucketList: res.data.items ?? [] });
  },

  addBucketItem: async (text) => {
    const res = await api.post('/couple/bucket', { text });
    if (res.ok) set((s) => ({ bucketList: [...s.bucketList, res.data.item] }));
    return res.ok ? { success: true } : { success: false, error: res.data?.message };
  },

  toggleBucketItem: async (id) => {
    const res = await api.patch(`/couple/bucket/${id}`, {});
    if (res.ok) {
      set((s) => ({
        bucketList: s.bucketList.map((item) =>
          item._id === id ? { ...item, ...res.data.item } : item
        ),
      }));
    }
    return res.ok ? { success: true } : { success: false, error: res.data?.message };
  },

  deleteBucketItem: async (id) => {
    const res = await api.del(`/couple/bucket/${id}`);
    if (res.ok) set((s) => ({ bucketList: s.bucketList.filter((i) => i._id !== id) }));
    return res.ok ? { success: true } : { success: false, error: res.data?.message };
  },

  // ── Love Jar ───────────────────────────────────────────────────────────────
  fetchLoveJar: async () => {
    const res = await api.get('/couple/jar');
    if (res.ok) set({ loveJar: res.data.items ?? [] });
  },

  addJarItem: async (text) => {
    const res = await api.post('/couple/jar', { text });
    if (res.ok) set((s) => ({ loveJar: [...s.loveJar, res.data.item] }));
    return res.ok ? { success: true } : { success: false, error: res.data?.message };
  },

  claimJarItem: async (id) => {
    const res = await api.patch(`/couple/jar/${id}`, {});
    if (res.ok) {
      set((s) => ({
        loveJar: s.loveJar.map((item) =>
          item._id === id ? { ...item, ...res.data.item } : item
        ),
      }));
    }
    return res.ok ? { success: true } : { success: false, error: res.data?.message };
  },

  deleteJarItem: async (id) => {
    const res = await api.del(`/couple/jar/${id}`);
    if (res.ok) set((s) => ({ loveJar: s.loveJar.filter((i) => i._id !== id) }));
    return res.ok ? { success: true } : { success: false, error: res.data?.message };
  },

  // call after pairing or logout to reset
  reset: () =>
    set({
      couple: null,
      streak: null,
      moods: {},
      bucketList: [],
      loveJar: [],
      daysTogether: null,
      isPaired: false,
      loaded: false,
    }),
}));