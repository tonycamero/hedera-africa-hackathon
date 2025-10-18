import { magicAdmin } from "./magic-admin";
import { prisma } from "./db";

export async function getIssuer(req: Request): Promise<string | null> {
  const auth = (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!auth) return null;
  
  try {
    const meta = await magicAdmin.users.getMetadataByToken(auth);
    return meta?.issuer ?? null;
  } catch {
    return null;
  }
}

export async function upsertUser(
  issuer: string, 
  data: { 
    phone?: string; 
    ward?: string; 
    smsOptIn?: boolean 
  }
) {
  return prisma.user.upsert({
    where: { issuer },
    create: { 
      issuer, 
      phone: data.phone, 
      ward: data.ward, 
      smsOptIn: !!data.smsOptIn 
    },
    update: { 
      phone: data.phone ?? undefined, 
      ward: data.ward ?? undefined, 
      smsOptIn: data.smsOptIn ?? undefined 
    },
  });
}

export function isAdmin(issuer?: string): boolean {
  if (!issuer) return false;
  const adminIssuers = (process.env.ADMIN_ISSUERS || "").split(",");
  return adminIssuers.includes(issuer);
}