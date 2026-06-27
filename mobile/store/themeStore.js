import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "budgies_theme";

export const useThemeStore = create((set) => ({
  themeKey: "rose", // default

  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved) set({ themeKey: saved });
    } catch {}
  },

  setTheme: async (key) => {
    set({ themeKey: key });
    try {
      await AsyncStorage.setItem(THEME_KEY, key);
    } catch {}
  },
}));
