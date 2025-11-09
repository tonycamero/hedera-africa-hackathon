import fs from "fs";
import path from "path";

// Load phase configuration at startup
const phasePath = path.resolve(process.cwd(), ".env.phases");
if (fs.existsSync(phasePath)) {
  console.log(`[phase] loading ${phasePath}`);
  // Load the phase environment into process.env
  const phaseEnv = fs.readFileSync(phasePath, 'utf8');
  phaseEnv.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#') && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^"(.*)"$/, '$1');
      process.env[key] = value;
    }
  });
} else {
  console.warn("[phase] .env.phases not found; defaulting to BASIC");
}

// Export computed flags
export const ENABLED_LENSES = (process.env.TRUSTMESH_ENABLED_LENSES || "").split(",").filter(Boolean);
export const COMPLIANCE = process.env.COMPLIANCE_LEVEL || "BASIC";
export const CURRENT_PHASE = process.env.TRUSTMESH_CURRENT_PHASE || "none";

// Runtime feature flags
export const USE_V2 = ENABLED_LENSES.length > 0;
export const SHOW_GENZ = ENABLED_LENSES.includes("genz");
export const SHOW_PRO = ENABLED_LENSES.includes("professional");
export const SHOW_CAN = ENABLED_LENSES.includes("cannabis");

// Log active configuration
console.log(`[phase] current=${CURRENT_PHASE} lenses=${ENABLED_LENSES.join(',')} compliance=${COMPLIANCE}`);

// Phase-specific compliance requirements
export const getComplianceRequirements = () => {
  switch (COMPLIANCE) {
    case 'CANNABIS_REGULATORY':
      return {
        kycRequired: true,
        kybRequired: true,
        facilityLicenseRequired: true,
        businessHoursEnforced: true,
        jurisdictionBlocking: true,
        auditTrailRequired: true,
        maxDailyLimit: 10000 // $10k USD equivalent
      };
    case 'CORPORATE_AUDIT':
      return {
        kycRequired: false,
        kybRequired: true,
        facilityLicenseRequired: false,
        businessHoursEnforced: false,
        jurisdictionBlocking: false,
        auditTrailRequired: true,
        maxDailyLimit: 50000 // $50k USD equivalent
      };
    case 'BASIC':
    default:
      return {
        kycRequired: false,
        kybRequired: false,
        facilityLicenseRequired: false,
        businessHoursEnforced: false,
        jurisdictionBlocking: false,
        auditTrailRequired: false,
        maxDailyLimit: 100000 // $100k USD equivalent for dev
      };
  }
};