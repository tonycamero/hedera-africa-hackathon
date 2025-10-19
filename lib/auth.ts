import { magicAdmin } from "./magic-admin";
import { prisma } from "./db";
import { ulid } from "ulid";

export async function getIssuer(req: Request): Promise<string | null> {
  const auth = (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!auth) {
    console.log('[Auth] No auth token found');
    return null;
  }
  
  try {
    console.log('[Auth] Getting metadata from Magic token...');
    const meta = await magicAdmin.users.getMetadataByToken(auth);
    console.log('[Auth] Magic metadata:', { issuer: meta?.issuer ? 'found' : 'not found' });
    return meta?.issuer ?? null;
  } catch (error) {
    console.error('[Auth] Magic token validation failed:', error.message);
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
  try {
    console.log('[Auth] Upserting user with data:', { issuer, ...data });
    const result = await prisma.user.upsert({
      where: { issuer },
      create: { 
        id: ulid(),
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
    console.log('[Auth] User upsert successful:', { id: result.id, ward: result.ward });
    return result;
  } catch (error) {
    console.error('[Auth] Database upsert failed:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
}

export async function getUser(issuer: string) {
  return prisma.user.findUnique({
    where: { issuer }
  });
}

export function isAdmin(issuer?: string): boolean {
  if (!issuer) return false;
  const adminIssuers = (process.env.ADMIN_ISSUERS || "").split(",");
  return adminIssuers.includes(issuer);
}
