// twilightTheme.js
// A twilight-themed color scheme for UI components
import { keyframes } from "styled-components";

// Twilight color palette
export const TWILIGHT_COLORS = {
  // Base colors
  cardBackground: "#1a1a2e", // Deep blue-purple background
  border: "#262649", // Slightly lighter border
  shadow: "rgba(10, 10, 30, 0.4)", // Deep shadow
  divider: "#31315b", // Divider line

  // Text colors
  textPrimary: "#e6e6fa", // Light lavender
  textSecondary: "#9d9dc6", // Muted lavender
  textTertiary: "#7575a3", // Even more muted

  // Accent colors
  primaryAccent: "#ff6e7f", // Sunset pink
  secondaryAccent: "#946ff6", // Twilight purple
  highlightAccent: "#2afadf", // Cyber teal for rare highlights

  // UI elements
  elevatedBackground: "rgba(49, 49, 91, 0.5)", // Slightly lighter than background
  buttonHover: "rgba(59, 59, 101, 0.7)", // Button hover state
  error: "#ff5252", // Error red
};

// Animation keyframes
export const TWILIGHT_ANIMATIONS = {
  fadeIn: keyframes`
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  `,

  float: keyframes`
    0% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
    100% { transform: translateY(0px); }
  `,

  pulse: keyframes`
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  `,

  glow: keyframes`
    0% { box-shadow: 0 0 5px ${TWILIGHT_COLORS.primaryAccent}; }
    50% { box-shadow: 0 0 15px ${TWILIGHT_COLORS.primaryAccent}, 0 0 30px ${TWILIGHT_COLORS.primaryAccent}; }
    100% { box-shadow: 0 0 5px ${TWILIGHT_COLORS.primaryAccent}; }
  `,
};

// Common style mixins
export const TWILIGHT_MIXINS = {
  cardBase: `
    background: ${TWILIGHT_COLORS.cardBackground};
    border-radius: 12px;
    border: 1px solid ${TWILIGHT_COLORS.border};
    box-shadow: 0 4px 12px ${TWILIGHT_COLORS.shadow};
    color: ${TWILIGHT_COLORS.textPrimary};
  `,

  hoverLift: `
    transition: all 0.3s ease;
    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 18px ${TWILIGHT_COLORS.shadow};
    }
  `,

  textGlow: `
    text-shadow: 0 0 8px rgba(230, 230, 250, 0.2);
  `,

  accentGradient: `
    background: linear-gradient(135deg, ${TWILIGHT_COLORS.secondaryAccent}, ${TWILIGHT_COLORS.primaryAccent});
  `,

  subtleInteractive: `
    cursor: pointer;
    transition: all 0.2s ease;
    &:hover {
      background-color: ${TWILIGHT_COLORS.elevatedBackground};
      transform: translateY(-2px);
    }
  `,
};

// Export the complete theme
const twilightTheme = {
  colors: TWILIGHT_COLORS,
  animations: TWILIGHT_ANIMATIONS,
  mixins: TWILIGHT_MIXINS,
};

export default twilightTheme;
