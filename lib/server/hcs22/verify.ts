// HCS-22 Signature Verification - EVM signature recovery and validation
// Crypto verification will be added when implementing ethers/viem integration

/**
 * Verify EVM signature and recover signer address
 * 
 * TODO: Implement proper ECDSA signature recovery using ethers or viem
 * For now, this is a stub that rejects all signatures to prevent unsafe operations
 * 
 * @param message - The message that was signed
 * @param signature - The EVM signature (hex string)
 * @returns The recovered EVM address (lowercase, with 0x prefix) or null if invalid
 */
export function verifyEthSig(message: string, signature: string): string | null {
  console.warn('[HCS22 Verify] Signature verification not yet implemented');
  console.warn('[HCS22 Verify] ROTATE/UNBIND operations will be rejected until verification is enabled');
  
  // TODO: Implement using ethers.js or viem:
  // import { verifyMessage } from 'ethers';
  // const recoveredAddress = verifyMessage(message, signature);
  // return recoveredAddress.toLowerCase();
  
  return null; // Reject all signatures until properly implemented
}

/**
 * Verify that a signature was created by the expected EVM address
 * 
 * @param message - The message that was signed
 * @param signature - The EVM signature
 * @param expectedAddress - The expected signer address
 * @returns true if signature is valid and matches expected address
 */
export function verifyEthSigMatch(message: string, signature: string, expectedAddress: string): boolean {
  const recoveredAddress = verifyEthSig(message, signature);
  
  if (!recoveredAddress) {
    return false;
  }
  
  return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
}

/**
 * Create a message to sign for ROTATE operations
 * This ensures the user explicitly approves the rotation
 */
export function createRotateMessage(args: {
  issuer: string;
  fromHederaId: string;
  toHederaId: string;
  timestamp: string;
}): string {
  return `HCS-22 IDENTITY_ROTATE
Issuer: ${args.issuer}
From: ${args.fromHederaId}
To: ${args.toHederaId}
Timestamp: ${args.timestamp}`;
}

/**
 * Create a message to sign for UNBIND operations
 * This ensures the user explicitly approves unbinding their identity
 */
export function createUnbindMessage(args: {
  issuer: string;
  hederaId: string;
  timestamp: string;
}): string {
  return `HCS-22 IDENTITY_UNBIND
Issuer: ${args.issuer}
Hedera ID: ${args.hederaId}
Timestamp: ${args.timestamp}`;
}
