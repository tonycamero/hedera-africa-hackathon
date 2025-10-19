/**
 * Feature flags for Fairfield Voice vs legacy TrustMesh modes
 */

export const isFairfieldVoice = () => {
  // Check both server and client environment variables
  const appMode = process.env.NEXT_PUBLIC_APP_MODE || process.env.APP_MODE || "";
  return appMode.toLowerCase() === "fairfield";
};

export const isLegacyTrustMesh = () => !isFairfieldVoice();

export const shouldDisableLegacyHCS = () => 
  isFairfieldVoice() || process.env.NEXT_PUBLIC_HCS_ENABLED === "false";