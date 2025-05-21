// theme.js - SoloGram New Color Theme: Salmon, Khaki, Mint Blue, Blue Gray

export const COLORS = {
  primarySalmon: "#e98973",
  primaryKhaki: "#e7d4c0",
  primaryMint: "#88b2cc",
  primaryBlueGray: "#658ea9",
  accentSalmon: "#ffad9e", // softer version
  accentMint: "#a8cfd8", // softer version
  accentBlueGray: "#90aac3", // lighter blue-gray
  background: "#f8f5f0", // light khaki/neutral
  cardBackground: "#ffffff", // bright white for card contrast
  elevatedBackground: "#f0f0f0", // slightly elevated sections
  textPrimary: "#1a1a1a", // near-black text
  textSecondary: "#555555", // dark gray text
  textTertiary: "#888888", // lighter gray text
  error: "#d9534f",
  success: "#5cb85c",
  warning: "#f0ad4e",
  info: "#5bc0de",
  border: "#dddddd",
  divider: "#eeeeee",
  buttonHover: "#e2e2e2",
  shadow: "rgba(0, 0, 0, 0.1)",
  heartRed: "#e63946",
  darkAccent: "#40535c",
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
