import { create } from "zustand";
import api from "../lib/api";

export const useCoupleStore = create((set, get) => ({
  couple: null,
  streak: null, // { count, completedToday, youCheckedInToday, ... }
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

  // call after pairing or logout to reset
  reset: () =>
    set({
      couple: null,
      streak: null,
      daysTogether: null,
      isPaired: false,
      loaded: false,
    }),
}));