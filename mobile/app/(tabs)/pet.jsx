import { View, Text } from "react-native";
import AppHeader from "../../components/AppHeader";
import screen from "../../assets/styles/screen.style";

export default function Pet() {
  return (
    <View style={screen.safe}>
      <AppHeader title="Pet" />
      <View style={screen.body}>
        <Text style={screen.emoji}>🐤</Text>
        <Text style={screen.heading}>Mochi</Text>
        <Text style={screen.sub}>
          Your shared budgie will live here — feed and play together to help it
          grow from egg to budgie.
        </Text>
      </View>
    </View>
  );
}