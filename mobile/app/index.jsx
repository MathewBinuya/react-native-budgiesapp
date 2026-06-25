import { View, Text, Image, ActivityIndicator, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import COLORS from "../constants/colors";
import FONTS from "../constants/fonts";
import { useAuthStore } from "../store/authStore";

export default function Index() {
  const { token, user, hasOnboarded, bootstrap } = useAuthStore();
  const [ready, setReady] = useState(false);

  // session check + minimum 1.5s logo display, in parallel
  useEffect(() => {
    const init = async () => {
      const minDelay = new Promise((resolve) => setTimeout(resolve, 1500));
      await Promise.all([bootstrap(), minDelay]);
      setReady(true);
    };
    init();
  }, []);

  // once both the check AND the delay are done, route
  useEffect(() => {
    if (!ready) return;

    // logged in?
    if (token && user) {
      // paired with a partner? (couple is set once they pair)
      if (user.couple) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/(onBoarding)/home"); // needs to pair with partner
      }
      return;
    }

    // not logged in — has the user seen onboarding before?
    if (hasOnboarded) {
      router.replace("/(auth)/welcome"); // straight to welcome/login
    } else {
      router.replace("/(onBoarding)/slides"); // first time → intro
    }
  }, [ready, token, user, hasOnboarded]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/login-image.png")} // your Budgies logo here
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.appName}>Budgies</Text>
      <Text style={styles.tagline}>you & me, day by day</Text>
      <ActivityIndicator
        size="small"
        color={COLORS.darkButton}
        style={{ marginTop: 24 }}
      />
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