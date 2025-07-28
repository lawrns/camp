export const themeConfig = {
  default: "system" as const,
  storageKey: "campfire-ui-theme",
  themes: ["light", "dark", "system"] as const,
};

export type Theme = (typeof themeConfig.themes)[number];

export function applyLightModeOverrides(): void {
  if (typeof document !== "undefined") {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    localStorage.setItem(themeConfig.storageKey, "light");
  }
}
