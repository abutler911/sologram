// theme.js - SoloGram Dark Theme: Salmon, Khaki, Mint Blue, Blue Gray

export const COLORS = {
  // Brand colors
  primarySalmon: "#e98973",
  primaryKhaki: "#e7d4c0",
  primaryMint: "#88b2cc",
  primaryBlueGray: "#658ea9",

  // Accent tones
  accentSalmon: "#ffad9e",
  accentMint: "#a8cfd8",
  accentBlueGray: "#90aac3",

  // Dark mode background surfaces
  background: "#121212", // Main background
  cardBackground: "#1e1e1e", // Card surfaces
  elevatedBackground: "#2a2a2a", // Raised UI elements

  // Text colors for dark backgrounds
  textPrimary: "#ffffff", // Headings, titles
  textSecondary: "#cccccc", // Captions, body text
  textTertiary: "#999999", // Meta text, timestamps, tags

  // System status
  error: "#ff6b6b",
  success: "#6fcf97",
  warning: "#f2c94c",
  info: "#56ccf2",

  // Borders & UI chrome
  border: "#444444",
  divider: "#3a3a3a",
  buttonHover: "#333333",

  // Effects
  shadow: "0 4px 12px rgba(0, 0, 0, 0.6)",
  heartRed: "#e63946",
  darkAccent: "#40535c",
};

export const THEME = {
  header: {
    background: COLORS.primaryBlueGray,
    text: COLORS.textPrimary,
    icon: COLORS.textPrimary,
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
      text: COLORS.textPrimary,
      hoverBackground: COLORS.accentMint,
    },
    secondary: {
      background: "#2c2c2c",
      text: COLORS.textPrimary,
      hoverBackground: "#3a3a3a",
    },
    action: {
      background: COLORS.primarySalmon,
      text: COLORS.textPrimary,
      hoverBackground: "#cc6e5f", // darker salmon
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
