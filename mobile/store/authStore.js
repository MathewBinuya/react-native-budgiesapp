import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../constants/api";

const TOKEN_KEY = "budgies_token";
const USER_KEY = "budgies_user";
const ONBOARDED_KEY = "budgies_hasOnboarded";

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  hasOnboarded: false,
  isLoading: false,
  isBootstrapping: true,

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
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
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
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
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
      const userJson = await AsyncStorage.getItem(USER_KEY);
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

  // Mark onboarding as seen
  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, "true");
    set({ hasOnboarded: true });
  },

  // --- CREATE COUPLE ---
  createCouple: async () => {
    const { token, user } = get();
    try {
      const res = await fetch(`${API_URL}/couple/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || "Could not create" };
      const updatedUser = { ...user, couple: data.couple._id };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return { success: true, inviteCode: data.inviteCode };
    } catch (err) {
      return { success: false, error: "Network error. Is the server running?" };
    }
  },

  // --- REGENERATE CODE ---
  regenerateCode: async () => {
    const { token } = get();
    try {
      const res = await fetch(`${API_URL}/couple/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || "Could not regenerate" };
      return { success: true, inviteCode: data.inviteCode };
    } catch (err) {
      return { success: false, error: "Network error. Is the server running?" };
    }
  },

  // --- JOIN COUPLE ---
  joinCouple: async (inviteCode) => {
    const { token, user } = get();
    try {
      const res = await fetch(`${API_URL}/couple/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, expired: res.status === 410, error: data.message || "Could not join" };
      }
      const updatedUser = { ...user, couple: data.couple._id };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return { success: true };
    } catch (err) {
      return { success: false, error: "Network error. Is the server running?" };
    }
  },

  // --- UPDATE AVATAR ---
  updateAvatar: async (formData) => {
    const { token } = get();
    try {
      const res = await fetch(`${API_URL}/auth/avatar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        // Do NOT set Content-Type — fetch sets multipart/form-data with boundary
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || "Upload failed" };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      set({ user: data.user });
      return { success: true };
    } catch {
      return { success: false, error: "Network error." };
    }
  },

  // --- UPDATE ACCENT COLOR ---
  setAccent: async (accentColor) => {
    const { token } = get();
    try {
      const res = await fetch(`${API_URL}/auth/accent`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accentColor }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || "Could not save color" };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      set({ user: data.user });
      return { success: true };
    } catch (err) {
      return { success: false, error: "Network error." };
    }
  },

  // --- LOGOUT ---
  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    set({ user: null, token: null });
  },
}));