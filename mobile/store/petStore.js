import { create } from "zustand";
import api from "../lib/api";

export const usePetStore = create((set, get) => ({
  pet: null,
  loading: false,

  loadPet: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/pet");
      if (res.ok) set({ pet: res.data.pet });
    } catch {}
    finally {
      set({ loading: false });
    }
  },

  feedPet: async () => {
    const res = await api.post("/pet/feed");
    if (res.ok) {
      set({ pet: res.data.pet });
      return { success: true, pet: res.data.pet };
    }
    return { success: false, error: res.data?.message || "Could not feed" };
  },

  playWithPet: async () => {
    const res = await api.post("/pet/play");
    if (res.ok) {
      set({ pet: res.data.pet });
      return { success: true, pet: res.data.pet };
    }
    return { success: false, error: res.data?.message || "Could not play" };
  },
}));
