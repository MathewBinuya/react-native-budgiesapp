import { create } from "zustand";
import api from "../lib/api";

export const useJournalStore = create((set, get) => ({
  myEntries: [],
  partnerEntries: [],
  prompt: "",
  loading: false,

  // Journals are personal — no partner required for my entries.
  // Partner entries fetch silently fails if not paired (returns []).
  loadEntries: async ({ withPartner = false } = {}) => {
    set({ loading: true });
    try {
      const requests = [
        api.get("/journal?author=me"),
        api.get("/journal/prompt"),
      ];
      if (withPartner) {
        requests.splice(1, 0, api.get("/journal?author=partner"));
      }

      if (withPartner) {
        const [mine, partner, prompt] = await Promise.all(requests);
        set({
          myEntries: mine.ok ? mine.data.entries : [],
          partnerEntries: partner.ok ? partner.data.entries : [],
          prompt: prompt.ok ? prompt.data.prompt : "",
        });
      } else {
        const [mine, prompt] = await Promise.all(requests);
        set({
          myEntries: mine.ok ? mine.data.entries : [],
          prompt: prompt.ok ? prompt.data.prompt : "",
        });
      }
    } catch {
      // keep whatever we had
    } finally {
      set({ loading: false });
    }
  },

  addEntry: async (text) => {
    const res = await api.post("/journal", { text });
    if (res.ok) {
      set({ myEntries: [res.data.entry, ...get().myEntries] });
      return { success: true };
    }
    return { success: false, error: res.data?.message || "Could not save" };
  },

  deleteEntry: async (id) => {
    const res = await api.del(`/journal/${id}`);
    if (res.ok) {
      set({ myEntries: get().myEntries.filter((e) => e._id !== id) });
      return { success: true };
    }
    return { success: false, error: res.data?.message || "Could not delete" };
  },
}));
