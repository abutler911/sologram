// theme.js - Masculine SoloGram Theme with Flat Colors
export const COLORS = {
  primaryTeal: "#00838F", // Primary brand color - deep teal
  primaryBlue: "#0D47A1", // Secondary brand color - navy blue
  primaryGreen: "#006064", // Tertiary brand color - forest green
  accentTeal: "#00ACC1", // Brighter version of primary
  accentBlue: "#1976D2", // Brighter version of primary
  accentGreen: "#00897B", // Brighter version of primary
  background: "#121212", // Dark background for contrast
  cardBackground: "#1E1E1E", // Dark cards for a sleek look
  elevatedBackground: "#252525", // Slightly lighter than background
  textPrimary: "#FFFFFF", // White text for dark background
  textSecondary: "#E0E0E0", // Light text
  textTertiary: "#B0B0B0", // Medium light text
  error: "#CF6679", // Modern error color
  success: "#009688", // Teal success color
  warning: "#FFA000", // Bold amber warning color
  info: "#0277BD", // Deep blue info color
  border: "#333333", // Darker border color
  divider: "#2C2C2C", // Subtle divider
  buttonHover: "#303030", // Darker hover state
  shadow: "rgba(0, 0, 0, 0.3)", // Slightly stronger shadow
  darkAccent: "#0A1929", // Very dark blue for accents
  heartRed: "#E63946",
};

export const THEME = {
  header: {
    background: COLORS.primaryBlue, // Solid color instead of gradient
    text: "#FFFFFF",
    icon: "#FFFFFF",
  },
  banner: {
    background: COLORS.darkAccent,
    text: COLORS.textPrimary,
    title: COLORS.accentTeal,
    icon: COLORS.accentBlue,
  },
  button: {
    primary: {
      background: COLORS.primaryTeal,
      text: "#FFFFFF",
      hoverBackground: "#006064",
    },
    secondary: {
      background: COLORS.elevatedBackground,
      text: COLORS.textPrimary,
      hoverBackground: COLORS.buttonHover,
    },
    action: {
      background: COLORS.accentBlue,
      text: "#FFFFFF",
      hoverBackground: "#0D47A1",
    },
  },
  post: {
    background: COLORS.cardBackground,
    header: COLORS.elevatedBackground,
    footer: COLORS.elevatedBackground,
    border: COLORS.border,
    icon: {
      active: COLORS.accentTeal,
      inactive: COLORS.textTertiary,
    },
  },
  story: {
    border: {
      active: COLORS.primaryTeal, // Solid color instead of gradient
      inactive: COLORS.border,
    },
    background: COLORS.cardBackground,
  },
};

export default THEME;
