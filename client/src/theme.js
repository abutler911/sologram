// theme.js - Light Mode with SoloGram Color Palette
export const COLORS = {
  // Primary brand colors
  primaryPurple: "#7B53DB",
  primaryBlue: "#1E88E5",
  primaryGreen: "#43A047",

  // Accent colors
  accentPurple: "#A387E5",
  accentBlue: "#64B5F6",
  accentGreen: "#81C784",

  // Background colors
  background: "#FFFFFF",
  cardBackground: "#F9F9F9",
  elevatedBackground: "#F0F0F0",

  // Text colors
  textPrimary: "#212121", // Dark text for light backgrounds
  textSecondary: "#424242",
  textTertiary: "#757575",

  // Functional colors
  error: "#D32F2F",
  success: "#388E3C",
  warning: "#FBC02D",
  info: "#1976D2",

  // UI element colors
  border: "#E0E0E0",
  divider: "#E0E0E0",
  buttonHover: "#E8E8E8",
  shadow: "rgba(0, 0, 0, 0.1)",
};

export const THEME = {
  header: {
    background: COLORS.primaryPurple,
    text: COLORS.textPrimary,
    icon: COLORS.textPrimary,
  },
  banner: {
    background: COLORS.elevatedBackground,
    text: COLORS.textPrimary,
    title: COLORS.primaryBlue,
    icon: COLORS.primaryGreen,
  },
  button: {
    primary: {
      background: COLORS.primaryPurple,
      text: "#FFFFFF",
      hoverBackground: "#6437C8",
    },
    secondary: {
      background: COLORS.elevatedBackground,
      text: COLORS.textPrimary,
      hoverBackground: COLORS.buttonHover,
    },
    action: {
      background: COLORS.primaryGreen,
      text: "#FFFFFF",
      hoverBackground: "#2E7D32",
    },
  },
  post: {
    background: COLORS.cardBackground,
    header: COLORS.elevatedBackground,
    footer: COLORS.elevatedBackground,
    border: COLORS.border,
    icon: {
      active: COLORS.primaryPurple,
      inactive: COLORS.textTertiary,
    },
  },
  story: {
    border: {
      active: `linear-gradient(45deg, ${COLORS.primaryPurple}, ${COLORS.primaryBlue}, ${COLORS.primaryGreen})`,
      inactive: COLORS.border,
    },
    background: COLORS.cardBackground,
  },
};

export default THEME;
