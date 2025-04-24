// theme.js - Masculine Blue/Green Theme
export const COLORS = {
  primaryBlue: "#1A5F7A",
  primaryTeal: "#0D7377",
  primaryGreen: "#2E8B57",

  accentBlue: "#42BFDD",
  accentTeal: "#14FFEC",
  accentGreen: "#57C84D",

  background: "#E5E9ED",
  cardBackground: "#FFFFFF",
  elevatedBackground: "#DBE0E4",

  textPrimary: "#212121",
  textSecondary: "#2C3E50",
  textTertiary: "#546E7A",

  error: "#D32F2F",
  success: "#388E3C",
  warning: "#F57C00",
  info: "#0277BD",

  border: "#CFD8DC",
  divider: "#ECEFF1",
  buttonHover: "#E1E5E8",
  shadow: "rgba(0, 0, 0, 0.1)",
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
    title: COLORS.primaryTeal,
    icon: COLORS.primaryGreen,
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
