import { StyleSheet, Dimensions } from "react-native";
import COLORS from "../../constants/colors";
import FONTS from "../../constants/fonts";


const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingBottom: 36,
  },
  skip: {
    alignSelf: "flex-end",
    padding: 18,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    fontWeight: "600",
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  emoji: { fontSize: 90, marginBottom: 30 },
  title: {
    fontSize: 26,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textAlign: "center",
    lineHeight: 22,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.darkButton,
    width: 22,
  },
  button: {
    backgroundColor: COLORS.darkButton,
    borderRadius: 16,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 28,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FONTS.regular,
  },
});
 

export default styles;