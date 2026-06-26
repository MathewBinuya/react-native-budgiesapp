import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/pair.style";

export default function Pair() {
  const { user, createCouple, joinCouple } = useAuthStore();

  const [inviteCode, setInviteCode] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  // If user already has a solo couple, auto-load a fresh invite code
  useEffect(() => {
    if (user?.couple) {
      loadCode();
    }
  }, []);

  const loadCode = async () => {
    setCreating(true);
    // createCouple is now smart: if solo couple exists, it regenerates the code
    const result = await createCouple();
    setCreating(false);
    if (result.success) {
      setInviteCode(result.inviteCode);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    const result = await createCouple();
    setCreating(false);
    if (!result.success) {
      Alert.alert("Couldn't create", result.error);
      return;
    }
    setInviteCode(result.inviteCode);
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert("Copied", "Invite code copied — send it to your partner.");
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      Alert.alert("Enter a code", "Paste the code your partner shared.");
      return;
    }
    setJoining(true);
    const result = await joinCouple(joinCode.trim().toUpperCase());
    setJoining(false);
    if (!result.success) {
      if (result.expired) {
        Alert.alert(
          "Code expired",
          "Ask your partner to generate a new code."
        );
      } else {
        Alert.alert("Couldn't join", result.error);
      }
      return;
    }
    router.replace("/(tabs)/home");
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/pair-image.png")}
          style={styles.headerImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>Pair with your partner</Text>
        <Text style={styles.subtitle}>
          One of you creates the nest and shares the code.{"\n"}The other joins
          with it.
        </Text>
      </View>

      {/* CREATE */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Start a nest</Text>
        <Text style={styles.cardHint}>
          Create a code and send it to your partner.
        </Text>

        {creating ? (
          <View style={[styles.button, { justifyContent: "center" }]}>
            <ActivityIndicator color={COLORS.white} />
          </View>
        ) : !inviteCode ? (
          <TouchableOpacity style={styles.button} onPress={handleCreate}>
            <Text style={styles.buttonText}>Create a code</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.codeBox} onPress={handleCopy}>
              <Text style={styles.codeText}>{inviteCode}</Text>
              <Ionicons name="copy-outline" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
            <Text style={styles.codeWaiting}>
              Waiting for your partner to join…
            </Text>
            <TouchableOpacity onPress={loadCode} style={{ marginTop: 8 }}>
              <Text style={styles.regenLink}>Generate new code</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* JOIN */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Join a nest</Text>
        <Text style={styles.cardHint}>
          Got a code from your partner? Enter it here.
        </Text>

        <View style={styles.inputRow}>
          <Ionicons
            name="key-outline"
            size={20}
            color={COLORS.textMuted}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.input}
            placeholder="BUDGIE-XXXX"
            placeholderTextColor={COLORS.textMuted}
            value={joinCode}
            onChangeText={(t) => setJoinCode(t.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleJoin}
          disabled={joining}
        >
          {joining ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Join nest</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
