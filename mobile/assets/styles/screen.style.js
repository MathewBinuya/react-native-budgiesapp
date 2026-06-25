import { StyleSheet } from "react-native";
import COLORS from "../../constants/colors";
import FONTS from "../../constants/fonts";

const screen = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  emoji: { fontSize: 52, marginBottom: 6 },
  heading: {
    fontSize: 22,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    fontWeight: "700",
  },
  sub: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default screen;