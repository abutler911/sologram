// theme.js - Modern Twilight Color Palette

// Primary Colors
export const COLORS = {
  // Primary colors
  primaryPurple: "#5E35B1",
  primaryBlue: "#1E88E5",
  primaryGreen: "#43A047",

  // Accent colors
  accentPurple: "#9575CD",
  accentBlue: "#64B5F6",
  accentGreen: "#81C784",

  // Background colors
  background: "#121212",
  cardBackground: "#1E1E1E",
  elevatedBackground: "#2A2A2A",

  // Text colors
  textPrimary: "#FFFFFF",
  textSecondary: "#DDDDDD",
  textTertiary: "#AAAAAA",

  // Functional colors
  error: "#F44336",
  success: "#43A047",
  warning: "#FFA000",
  info: "#64B5F6",

  // UI element colors
  border: "#444444",
  divider: "#333333",
  buttonHover: "#333333",
  shadow: "rgba(0, 0, 0, 0.2)",
};

// You can add theme presets for different UI components
export const THEME = {
  header: {
    background: COLORS.primaryPurple,
    text: COLORS.textPrimary,
    icon: COLORS.textPrimary,
  },
  banner: {
    background: COLORS.elevatedBackground,
    text: COLORS.textSecondary,
    title: COLORS.primaryBlue,
    icon: COLORS.primaryGreen,
  },
  button: {
    primary: {
      background: COLORS.primaryPurple,
      text: COLORS.textPrimary,
      hoverBackground: "#4527A0", // Darker purple on hover
    },
    secondary: {
      background: COLORS.elevatedBackground,
      text: COLORS.textSecondary,
      hoverBackground: COLORS.buttonHover,
    },
    action: {
      background: COLORS.primaryBlue,
      text: COLORS.textPrimary,
      hoverBackground: "#1565C0", // Darker blue on hover
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
    background: COLORS.elevatedBackground,
  },
};

export default THEME;
