// theme.js - SoloGram Updated Color Theme: Vintage Soft Palette

export const COLORS = {
  primaryPeach: "#EAB8A1",
  primaryTaupe: "#D6C6B8",
  primaryWarmGray: "#B8A99D",
  primaryCoolGray: "#A4A6B0",
  primarySlate: "#7D7F8D",
  accentPeach: "#f3cbb5", // lighter peach
  accentTaupe: "#e2d8cd", // lighter taupe
  background: "#f9f7f6", // very light background
  cardBackground: "#ffffff", // bright white cards
  elevatedBackground: "#f1efed", // elevated section
  textPrimary: "#1a1a1a", // near-black
  textSecondary: "#555555",
  textTertiary: "#888888",
  error: "#c94c4c",
  success: "#5cb85c",
  warning: "#f0ad4e",
  info: "#5bc0de",
  border: "#dddddd",
  divider: "#eeeeee",
  buttonHover: "#e2e2e2",
  shadow: "rgba(0, 0, 0, 0.1)",
  heartRed: "#e63946",
  darkAccent: "#5a5c6b", // adjusted for this palette
};

export const THEME = {
  header: {
    background: COLORS.primarySlate,
    text: "#FFFFFF",
    icon: "#FFFFFF",
  },
  banner: {
    background: COLORS.accentTaupe,
    text: COLORS.textPrimary,
    title: COLORS.primaryPeach,
    icon: COLORS.primarySlate,
  },
  button: {
    primary: {
      background: COLORS.primaryCoolGray,
      text: "#FFFFFF",
      hoverBackground: COLORS.primarySlate,
    },
    secondary: {
      background: COLORS.elevatedBackground,
      text: COLORS.textPrimary,
      hoverBackground: COLORS.buttonHover,
    },
    action: {
      background: COLORS.primaryPeach,
      text: "#FFFFFF",
      hoverBackground: "#d89b83", // slightly darker peach
    },
  },
  post: {
    background: COLORS.cardBackground,
    header: COLORS.elevatedBackground,
    footer: COLORS.elevatedBackground,
    border: COLORS.border,
    icon: {
      active: COLORS.primaryPeach,
      inactive: COLORS.textTertiary,
    },
  },
  story: {
    border: {
      active: COLORS.primaryCoolGray,
      inactive: COLORS.border,
    },
    background: COLORS.cardBackground,
  },
};

export default THEME;
