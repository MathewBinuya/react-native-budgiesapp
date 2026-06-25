import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/api";

const TOKEN_KEY = "budgies_token";
const USER_KEY = "budgies_user";
const ONBOARDED_KEY = "budgies_hasOnboarded";

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  hasOnboarded: false,
  isLoading: false,        // true during a login/register request
  isBootstrapping: true,   // true on startup until we've read storage

  // --- REGISTER ---
  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || "Could not sign up" };
      }
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
      set({ user: data.user, token: data.token });
      return { success: true };
    } catch (err) {
      return { success: false, error: "Network error. Is the server running?" };
    } finally {
      set({ isLoading: false });
    }
  },

  // --- LOGIN ---
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || "Could not log in" };
      }
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
      set({ user: data.user, token: data.token });
      return { success: true };
    } catch (err) {
      return { success: false, error: "Network error. Is the server running?" };
    } finally {
      set({ isLoading: false });
    }
  },

  // --- BOOTSTRAP (run once on app startup) ---
  bootstrap: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      const onboarded = await AsyncStorage.getItem(ONBOARDED_KEY);
      set({
        token: token || null,
        user: userJson ? JSON.parse(userJson) : null,
        hasOnboarded: onboarded === "true",
      });
    } catch (err) {
      set({ token: null, user: null, hasOnboarded: false });
    } finally {
      set({ isBootstrapping: false });
    }
  },

  // Mark onboarding as seen (called when the user finishes the intro slides)
  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, "true");
    set({ hasOnboarded: true });
  },

  // --- CREATE COUPLE (first partner) ---
  createCouple: async () => {
    const { token, user } = get();
    try {
      const res = await fetch(`${API_URL}/couple/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || "Could not create" };
      }
      const updatedUser = { ...user, couple: data.couple._id };
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return { success: true, inviteCode: data.inviteCode };
    } catch (err) {
      return { success: false, error: "Network error. Is the server running?" };
    }
  },

  // --- REGENERATE CODE (creating partner, when the old one expired) ---
  regenerateCode: async () => {
    const { token } = get();
    try {
      const res = await fetch(`${API_URL}/couple/regenerate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || "Could not regenerate" };
      }
      return { success: true, inviteCode: data.inviteCode };
    } catch (err) {
      return { success: false, error: "Network error. Is the server running?" };
    }
  },

  // --- JOIN COUPLE (second partner) ---
  joinCouple: async (inviteCode) => {
    const { token, user } = get();
    try {
      const res = await fetch(`${API_URL}/couple/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        // 410 = expired code (silent expiry — partner needs a fresh one)
        return {
          success: false,
          expired: res.status === 410,
          error: data.message || "Could not join",
        };
      }
      const updatedUser = { ...user, couple: data.couple._id };
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return { success: true };
    } catch (err) {
      return { success: false, error: "Network error. Is the server running?" };
    }
  },

  // --- LOGOUT ---
  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    // NOTE: we keep hasOnboarded = true so returning users skip the slides
    set({ user: null, token: null });
  },
}));