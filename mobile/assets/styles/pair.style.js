import { StyleSheet } from "react-native";
import COLORS from "../../constants/colors";
import FONTS from "../../constants/fonts";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  emoji: { fontSize: 52, marginBottom: 8 },
  title: {
    fontSize: 26,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  // Card shared by both options
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginBottom: 14,
  },
  // Primary button
  button: {
    backgroundColor: COLORS.darkButton,
    borderRadius: 14,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: FONTS.regular,
  },
  // Code display (after create)
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.inputBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  codeText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    letterSpacing: 2,
  },
  codeWaiting: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textAlign: "center",
    marginTop: 12,
  },
  // Join input
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: 48,
    color: COLORS.textColor,
    fontSize: 16,
    fontFamily: FONTS.regular,
    letterSpacing: 1,
  },
  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  regenLink: {
    fontSize: 13,
    color: COLORS.darkButton,
    fontFamily: FONTS.regular,
    textAlign: "center",
    marginTop: 12,
    fontWeight: "600",
  },
  headerImage: {
    width: 90,
    height: 90,
    marginBottom: 8,
},
});

export default styles;