// theme.js - Masculine Blue/Green Theme with Darker Background
export const COLORS = {
  primaryBlue: "#1A5F7A",
  primaryTeal: "#0D7377",
  primaryGreen: "#2E8B57",
  accentBlue: "#42BFDD",
  accentTeal: "#14FFEC",
  accentGreen: "#57C84D",
  background: "#263238", // Changed to dark slate blue/gray
  cardBackground: "#FFFFFF", // Kept white for maximum contrast
  elevatedBackground: "#37474F", // Slightly lighter than background
  textPrimary: "#E1E6EB", // Lighter text for dark background
  textSecondary: "#B0BEC5", // Medium light text
  textTertiary: "#78909C", // Darker light text
  error: "#FF5252", // Brighter for dark background
  success: "#4CAF50", // Brighter for dark background
  warning: "#FFB74D", // Brighter for dark background
  info: "#29B6F6", // Brighter for dark background
  border: "#546E7A", // Darker border color
  divider: "#455A64", // Darker divider
  buttonHover: "#455A64", // Darker hover state
  shadow: "rgba(0, 0, 0, 0.2)", // Slightly more pronounced shadow
};

export const THEME = {
  header: {
    background: COLORS.primaryBlue,
    text: "#FFFFFF",
    icon: "#FFFFFF",
  },
  banner: {
    background: COLORS.elevatedBackground,
    text: COLORS.textPrimary,
    title: COLORS.accentTeal, // Using accent color for better visibility
    icon: COLORS.accentGreen, // Using accent color for better visibility
  },
  button: {
    primary: {
      background: COLORS.primaryBlue,
      text: "#FFFFFF",
      hoverBackground: "#14445E",
    },
    secondary: {
      background: COLORS.elevatedBackground,
      text: COLORS.textPrimary,
      hoverBackground: COLORS.buttonHover,
    },
    action: {
      background: COLORS.primaryGreen,
      text: "#FFFFFF",
      hoverBackground: "#1F6E3C",
    },
  },
  post: {
    background: COLORS.cardBackground,
    header: COLORS.elevatedBackground,
    footer: COLORS.elevatedBackground,
    border: COLORS.border,
    icon: {
      active: COLORS.accentTeal, // Using accent for better visibility
      inactive: COLORS.textTertiary,
    },
  },
  story: {
    border: {
      active: `linear-gradient(45deg, ${COLORS.primaryBlue}, ${COLORS.primaryTeal}, ${COLORS.primaryGreen})`,
      inactive: COLORS.border,
    },
    background: COLORS.cardBackground,
  },
};

export default THEME;
