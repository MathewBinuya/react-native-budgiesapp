import { useThemeStore } from "../store/themeStore";
import { THEMES } from "../constants/themes";

export function useColors() {
  const themeKey = useThemeStore((s) => s.themeKey);
  return THEMES[themeKey] ?? THEMES.rose;
}
