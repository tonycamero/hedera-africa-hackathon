/**
 * Feature flags for Fairfield Voice vs legacy TrustMesh modes
 */

export const isFairfieldVoice = () =>
  (process.env.NEXT_PUBLIC_APP_MODE || "").toLowerCase() === "fairfield";

export const isLegacyTrustMesh = () => !isFairfieldVoice();

export const shouldDisableLegacyHCS = () => 
  isFairfieldVoice() || process.env.NEXT_PUBLIC_HCS_ENABLED === "false";