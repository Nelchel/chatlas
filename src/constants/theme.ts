export const colors = {
  primary: "#4F6244",
  secondary: "#FFD166",
  accent: "#06D6A0",
  background: "#FFF9F0",
  surface: "#f9cb8f",
  text: "#2D2D2D",
  textSecondary: "#6B6B6B",
  border: "#E8E0D8",
  error: "#EF476F",
  favorite: "#FF4D6D",
  success: "#06D6A0",
  mapCluster: "#FF8C5A",
  badgeGold: "#FFD700",
  badgeSilver: "#C0C0C0",
  badgeBronze: "#CD7F32",
  badgePlatinum: "#E5E4E2",
  badgeSecret: "#7B2D8E",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
};

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    color: colors.text,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: colors.textSecondary,
  },
};
