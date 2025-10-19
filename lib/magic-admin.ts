import { Magic } from "@magic-sdk/admin";

const SECRET_KEY = process.env.MAGIC_SECRET_KEY;

if (!SECRET_KEY) {
  console.error('[Magic Admin] MAGIC_SECRET_KEY environment variable is not set');
  throw new Error('MAGIC_SECRET_KEY is required but not provided');
}

console.log('[Magic Admin] Initializing with key:', SECRET_KEY.substring(0, 8) + '...');
export const magicAdmin = new Magic(SECRET_KEY);
