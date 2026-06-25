import { View, Text } from "react-native";
import AppHeader from "../../components/AppHeader";
import screen from "../../assets/styles/screen.style";

export default function Home() {
  return (
    <View style={screen.safe}>
      <AppHeader title="Home" />
      <View style={screen.body}>
        <Text style={screen.emoji}>🏡</Text>
        <Text style={screen.heading}>Your nest</Text>
        <Text style={screen.sub}>
          Dashboard coming soon — streak, today's prompt, a peek at your
          budgie, and recent photos will live here.
        </Text>
      </View>
    </View>
  );
}