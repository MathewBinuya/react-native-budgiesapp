import { useEffect } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";
import { useFonts } from "expo-font";
import { useThemeStore } from "../store/themeStore";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "GeneralSans-Variable": require("../assets/fonts/GeneralSans-Variable.ttf"),
  });

  const loadTheme = useThemeStore((s) => s.loadTheme);
  useEffect(() => { loadTheme(); }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SafeScreen>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onBoarding)" />
          <Stack.Screen name="(tabs)" />
          


        </Stack>
      </SafeScreen>
    </SafeAreaProvider>
  );
}