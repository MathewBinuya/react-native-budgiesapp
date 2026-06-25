import { View, Text } from "react-native";
import AppHeader from "../../components/AppHeader";
import screen from "../../assets/styles/screen.style";

export default function Write() {
  return (
    <View style={screen.safe}>
      <AppHeader title="Write" />
      <View style={screen.body}>
        <Text style={screen.emoji}>✍️</Text>
        <Text style={screen.heading}>Your journal</Text>
        <Text style={screen.sub}>
          Write notes back and forth here. Today's prompt and your shared
          entries will appear in this space.
        </Text>
      </View>
    </View>
  );
}