import { create } from "zustand";
import api from "../lib/api";

export const useCoupleStore = create((set, get) => ({
  couple: null,
  streak: null, // { count, completedToday, youCheckedInToday, ... }
  daysTogether: null,
  isPaired: false,
  loading: false,
  loaded: false,

  // Pull couple + streak together. Call this on Home mount.
  loadCoupleData: async () => {
    set({ loading: true });
    try {
      const [coupleRes, streakRes] = await Promise.all([
        api.get("/couple"),
        api.get("/streak"),
      ]);

      // 403 from these means "not paired yet" — that's a valid state, not an error
      if (coupleRes.status === 403) {
        set({
          isPaired: false,
          couple: null,
          streak: null,
          daysTogether: null,
          loaded: true,
        });
        return;
      }

      set({
        couple: coupleRes.ok ? coupleRes.data.couple : null,
        daysTogether: coupleRes.ok ? coupleRes.data.daysTogether : null,
        isPaired: coupleRes.ok ? !!coupleRes.data.isPaired : false,
        streak: streakRes.ok ? streakRes.data.streak : null,
        loaded: true,
      });
    } catch (err) {
      set({ loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  // Daily check-in (advances streak when BOTH partners check in)
  checkIn: async () => {
    const res = await api.post("/streak/checkin");
    if (res.ok) {
      set({ streak: res.data.streak });
      return { success: true, streak: res.data.streak };
    }
    return { success: false, error: res.data?.message || "Could not check in" };
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