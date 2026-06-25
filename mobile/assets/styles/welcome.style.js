import { StyleSheet, Dimensions } from "react-native";
import COLORS from "../../constants/colors";
import FONTS from "../../constants/fonts";

const { height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  illustration: {
    width: "80%",
    height: height * 0.32,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    textAlign: "center",
  },
  tagline: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 40,
  },
  buttonGroup: {
    width: "100%",
    gap: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.darkButton,
    borderRadius: 16,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FONTS.regular,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderRadius: 16,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.darkButton,
  },
  secondaryText: {
    color: COLORS.darkButton,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FONTS.regular,
  },
});

export default styles;