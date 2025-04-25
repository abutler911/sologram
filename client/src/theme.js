// theme.js - SoloGram-Inspired Theme
export const COLORS = {
  primaryPink: "#FF5B8D", // Left side of the gradient
  primaryPurple: "#B04BDF", // Middle of the gradient
  primaryBlue: "#6A5ACD", // Right side of the gradient
  accentPink: "#FF4D94", // Brighter version of primary
  accentPurple: "#C776FF", // Brighter version of primary
  accentBlue: "#7B68EE", // Brighter version of primary
  background: "#1A1A1A", // Dark background for contrast
  cardBackground: "#FFFFFF", // Kept white for maximum contrast
  elevatedBackground: "#2D2D2D", // Slightly lighter than background
  textPrimary: "#FFFFFF", // White text for dark background
  textSecondary: "#E0E0E0", // Light text
  textTertiary: "#B0B0B0", // Medium light text
  error: "#FF5252", // Keeping your error color
  success: "#4CAF50", // Keeping your success color
  warning: "#FFB74D", // Keeping your warning color
  info: "#29B6F6", // Keeping your info color
  border: "#444444", // Darker border color
  divider: "#333333", // Darker divider
  buttonHover: "#444444", // Darker hover state
  shadow: "rgba(0, 0, 0, 0.2)", // Same shadow
};

export const THEME = {
  header: {
    background: `linear-gradient(to right, ${COLORS.primaryPink}, ${COLORS.primaryPurple}, ${COLORS.primaryBlue})`,
    text: "#FFFFFF",
    icon: "#FFFFFF",
  },
  banner: {
    background: COLORS.elevatedBackground,
    text: COLORS.textPrimary,
    title: COLORS.accentPink,
    icon: COLORS.accentPurple,
  },
  button: {
    primary: {
      background: COLORS.primaryPurple,
      text: "#FFFFFF",
      hoverBackground: "#9039C8",
    },
    secondary: {
      background: COLORS.elevatedBackground,
      text: COLORS.textPrimary,
      hoverBackground: COLORS.buttonHover,
    },
    action: {
      background: COLORS.primaryPink,
      text: "#FFFFFF",
      hoverBackground: "#E54A7B",
    },
  },
  post: {
    background: COLORS.cardBackground,
    header: COLORS.elevatedBackground,
    footer: COLORS.elevatedBackground,
    border: COLORS.border,
    icon: {
      active: COLORS.accentPurple,
      inactive: COLORS.textTertiary,
    },
  },
  story: {
    border: {
      active: `linear-gradient(45deg, ${COLORS.primaryPink}, ${COLORS.primaryPurple}, ${COLORS.primaryBlue})`,
      inactive: COLORS.border,
    },
    background: COLORS.cardBackground,
  },
};

export default THEME;
