import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { router } from "expo-router";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/pair.style";

export default function Pair() {
  const { createCouple, joinCouple } = useAuthStore();

  const [inviteCode, setInviteCode] = useState(null); // code shown after create
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

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
    const result = await joinCouple(joinCode);
    setJoining(false);
    if (!result.success) {
      Alert.alert("Couldn't join", result.error);
      return;
    }
    router.replace("/(tabs)/home");
  };

  return (
    <View style={styles.container}>
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

        {!inviteCode ? (
          <TouchableOpacity
            style={styles.button}
            onPress={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Create a code</Text>
            )}
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
            onChangeText={setJoinCode}
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
    </View>
  );
}