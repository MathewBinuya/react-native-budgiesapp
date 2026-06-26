import { View, Text, Image, ActivityIndicator, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import COLORS from "../constants/colors";
import FONTS from "../constants/fonts";
import { useAuthStore } from "../store/authStore";

export default function Index() {
  const { token, user, hasOnboarded, isBootstrapping, bootstrap } = useAuthStore();
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    bootstrap();
    const t = setTimeout(() => setMinTimePassed(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isBootstrapping || !minTimePassed) return;

    if (token && user) {
      if (user.couple) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/(onBoarding)/pair");
      }
      return;
    }

    if (hasOnboarded) {
      router.replace("/(auth)/welcome");
    } else {
      router.replace("/(onBoarding)/slides");
    }
  }, [isBootstrapping, minTimePassed, token, user, hasOnboarded]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/login-image.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.appName}>Budgies</Text>
      <Text style={styles.tagline}>you & me, day by day</Text>
      <ActivityIndicator size="small" color={COLORS.darkButton} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  logo: { width: 120, height: 120, marginBottom: 16 },
  appName: {
    fontSize: 28,
    fontWeight: "600",
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
});