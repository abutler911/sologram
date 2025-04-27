// theme.js - SoloGram New Color Theme: Salmon, Khaki, Mint Blue, Blue Gray

export const COLORS = {
  primaryBlueGray: "#658ea9", // Main blue-gray
  primaryMint: "#88b2cc", // Mint blue
  primarySalmon: "#e98973", // Salmon
  primaryKhaki: "#e7d4c0", // Khaki

  accentSalmon: "#e98973", // Use for likes, hearts, emphasis
  accentMint: "#88b2cc", // For hover states, secondary buttons
  accentBlueGray: "#658ea9", // For headers, icons, accents

  background: "#e7d4c0", // Light khaki background
  cardBackground: "#f4ede5", // Even lighter khaki for cards
  elevatedBackground: "#e0d6cc", // Slightly darker elevated background

  textPrimary: "#333333", // Dark text on light background
  textSecondary: "#555555", // Medium dark
  textTertiary: "#777777", // Light text

  error: "#e74c3c", // Strong red error
  success: "#2ecc71", // Fresh green success
  warning: "#f39c12", // Strong orange warning
  info: "#3498db", // Blue info

  border: "#d0c7bd", // Soft border
  divider: "#c0b8ae", // Divider
  buttonHover: "#d9cfc5", // Button hover color

  shadow: "rgba(0, 0, 0, 0.15)", // Softer shadow for light theme

  heartRed: "#e63946", // Keep heart vibrant
};

export const THEME = {
  header: {
    background: COLORS.primaryBlueGray,
    text: "#FFFFFF",
    icon: "#FFFFFF",
  },
  banner: {
    background: COLORS.accentMint,
    text: COLORS.textPrimary,
    title: COLORS.accentSalmon,
    icon: COLORS.primaryBlueGray,
  },
  button: {
    primary: {
      background: COLORS.primaryBlueGray,
      text: "#FFFFFF",
      hoverBackground: COLORS.accentMint,
    },
    secondary: {
      background: COLORS.elevatedBackground,
      text: COLORS.textPrimary,
      hoverBackground: COLORS.buttonHover,
    },
    action: {
      background: COLORS.primarySalmon,
      text: "#FFFFFF",
      hoverBackground: "#cc6e5f", // Darker salmon on hover
    },
  },
  post: {
    background: COLORS.cardBackground,
    header: COLORS.elevatedBackground,
    footer: COLORS.elevatedBackground,
    border: COLORS.border,
    icon: {
      active: COLORS.accentSalmon,
      inactive: COLORS.textTertiary,
    },
  },
  story: {
    border: {
      active: COLORS.primaryBlueGray,
      inactive: COLORS.border,
    },
    background: COLORS.cardBackground,
  },
};

export default THEME;
