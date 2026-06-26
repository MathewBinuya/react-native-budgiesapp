import { create } from "zustand";
import api from "../lib/api";

export const useJournalStore = create((set, get) => ({
  myEntries: [],
  partnerEntries: [],
  prompt: "",
  loading: false,

  loadEntries: async () => {
    set({ loading: true });
    try {
      const [mine, partner, prompt] = await Promise.all([
        api.get("/journal?author=me"),
        api.get("/journal?author=partner"),
        api.get("/journal/prompt"),
      ]);
      set({
        myEntries: mine.ok ? mine.data.entries : [],
        partnerEntries: partner.ok ? partner.data.entries : [],
        prompt: prompt.ok ? prompt.data.prompt : "",
      });
    } catch (err) {
      // leave whatever we had
    } finally {
      set({ loading: false });
    }
  },

  addEntry: async (text) => {
    const res = await api.post("/journal", { text });
    if (res.ok) {
      // prepend to my entries
      set({ myEntries: [res.data.entry, ...get().myEntries] });
      return { success: true };
    }
    return { success: false, error: res.data?.message || "Could not save" };
  },
}));