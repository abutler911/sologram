// theme.js - Masculine Blue/Green Theme
export const COLORS = {
  // Primary brand colors
  primaryBlue: "#1A5F7A", // Deep ocean blue
  primaryTeal: "#0D7377", // Rich teal
  primaryGreen: "#2E8B57", // Forest green
  // Accent colors
  accentBlue: "#42BFDD", // Bright blue accent
  accentTeal: "#14FFEC", // Electric teal (use sparingly)
  accentGreen: "#57C84D", // Vibrant green
  // Background colors
  background: "#F5F5F5", // Slightly off-white for less eye strain
  cardBackground: "#FFFFFF", // White cards for contrast
  elevatedBackground: "#E8E8E8", // Slightly darker for elevated elements
  // Text colors
  textPrimary: "#212121", // Near-black text for high contrast
  textSecondary: "#2C3E50", // Deep blue-gray text
  textTertiary: "#546E7A", // Muted blue-gray text
  // Functional colors
  error: "#D32F2F", // Standard red for errors
  success: "#388E3C", // Green for success messages
  warning: "#F57C00", // Amber orange for warnings
  info: "#0277BD", // Deep blue for info
  // UI element colors
  border: "#CFD8DC", // Light blue-gray borders
  divider: "#ECEFF1", // Very light dividers
  buttonHover: "#E1E5E8", // Subtle hover state
  shadow: "rgba(0, 0, 0, 0.1)",
};

export const THEME = {
  header: {
    background: COLORS.primaryBlue,
    text: "#FFFFFF", // White text on dark header
    icon: "#FFFFFF", // White icons for contrast
  },
  banner: {
    background: COLORS.elevatedBackground,
    text: COLORS.textPrimary,
    title: COLORS.primaryTeal,
    icon: COLORS.primaryGreen,
  },
  button: {
    primary: {
      background: COLORS.primaryBlue,
      text: "#FFFFFF",
      hoverBackground: "#14445E", // Darker blue on hover
    },
    secondary: {
      background: COLORS.elevatedBackground,
      text: COLORS.textPrimary,
      hoverBackground: COLORS.buttonHover,
    },
    action: {
      background: COLORS.primaryGreen,
      text: "#FFFFFF",
      hoverBackground: "#1F6E3C", // Darker green on hover
    },
  },
  post: {
    background: COLORS.cardBackground,
    header: COLORS.elevatedBackground,
    footer: COLORS.elevatedBackground,
    border: COLORS.border,
    icon: {
      active: COLORS.primaryTeal,
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
