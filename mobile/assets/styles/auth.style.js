import { StyleSheet, Dimensions } from "react-native";
import { COLORS } from "../../constants/colors";
import { FONTS } from "../../constants/fonts"

const { height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  topIllustration: {
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  illustrationImage: {
    width: "78%",
    height: height * 0.26,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textColor,
    textAlign: "center",
    fontFamily: FONTS.regular,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
    fontFamily: FONTS.regular,
  },
  formContainer: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textColor,
    marginLeft: 2,
    fontFamily: FONTS.regular,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: COLORS.textColor,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    backgroundColor: COLORS.darkButton,
    borderRadius: 16,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FONTS.regular,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
    gap: 5,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  link: {
    color: COLORS.darkButton,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: FONTS.regular,
  },
});

export default styles;