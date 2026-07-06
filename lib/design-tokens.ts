/** @deprecated Import from `@/lib/tokens` instead. Re-exported for backward compatibility. */
export {
  colors,
  colorVars,
  typography,
  space as WG_SPACING,
  radius as WG_RADIUS,
  shadow as WG_SHADOW,
  shell as DASHBOARD_LAYOUT,
  shellClasses as dashClasses,
  platformChipClass as WG_PLATFORM_CHIP_CLASS,
  typography as WG_TYPOGRAPHY,
} from "@/lib/tokens";

/** @deprecated Use `colors.light` / `colors.dark` from `@/lib/tokens` */
export { colors as WG_COLORS } from "@/lib/tokens/colors";

// Flat legacy alias for code expecting WG_COLORS.primary
import { colors as colorTokens } from "@/lib/tokens/colors";
export const WG_COLORS_FLAT = {
  primary: colorTokens.light.accent,
  primaryHover: colorTokens.light.accentHover,
  background: colorTokens.light.surfacePage,
  surface: colorTokens.light.surfacePrimary,
  border: colorTokens.light.borderDefault,
  text: colorTokens.light.textPrimary,
  secondary: colorTokens.light.textSecondary,
  success: colorTokens.light.success,
  warning: colorTokens.light.warning,
  info: colorTokens.light.info,
} as const;
