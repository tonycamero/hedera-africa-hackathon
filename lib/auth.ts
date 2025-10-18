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
    email?: string; 
    ward?: string; 
    emailOptIn?: boolean 
  }
) {
  return prisma.user.upsert({
    where: { issuer },
    create: { 
      issuer, 
      email: data.email, 
      ward: data.ward, 
      emailOptIn: !!data.emailOptIn 
    },
    update: { 
      email: data.email ?? undefined, 
      ward: data.ward ?? undefined, 
      emailOptIn: data.emailOptIn ?? undefined 
    },
  });
}

export function isAdmin(issuer?: string): boolean {
  if (!issuer) return false;
  const adminIssuers = (process.env.ADMIN_ISSUERS || "").split(",");
  return adminIssuers.includes(issuer);
}