import crypto from 'crypto';

// Copy of getCanonicalDid logic
function hashEmail(email) {
  const salt = process.env.HCS22_DID_SALT || 'trustmesh-default-salt';
  const normalized = email.toLowerCase().trim();
  const hash = crypto
    .createHash('sha256')
    .update(`${salt}:${normalized}`)
    .digest('hex')
    .substring(0, 40);
  return hash;
}

function getCanonicalDid(issuer) {
  if (!issuer) {
    throw new Error('[getCanonicalDid] Issuer required');
  }

  // Handle email: prefix (stable identifier format)
  if (issuer.startsWith('email:')) {
    const email = issuer.replace('email:', '');
    const hash = hashEmail(email);
    return `did:ethr:0x${hash}`;
  }

  // If already a proper did:ethr with hex address, use as-is
  if (issuer.startsWith('did:ethr:0x')) {
    return issuer;
  }

  // If Magic returned a did:ethr with email (UNSAFE for on-chain)
  if (issuer.startsWith('did:ethr:') && issuer.includes('@')) {
    const email = issuer.replace('did:ethr:', '');
    const hash = hashEmail(email);
    return `did:ethr:0x${hash}`;
  }

  // If raw email
  if (issuer.includes('@')) {
    const hash = hashEmail(issuer);
    return `did:ethr:0x${hash}`;
  }

  // Fallback
  const hash = crypto.createHash('sha256').update(issuer).digest('hex').substring(0, 40);
  return `did:ethr:0x${hash}`;
}

// Test the consistency
const testEmail = 'tonycamerobiz+demo04@gmail.com';

console.log('Testing canonical DID generation for:', testEmail);
console.log('Using salt:', process.env.HCS22_DID_SALT ? 'SET' : 'DEFAULT');
console.log('');

// Test different input formats that should all produce the same DID
const inputs = [
  `email:${testEmail}`,
  `did:ethr:${testEmail}`,
  testEmail,
  `email:${testEmail.toUpperCase()}`, // Should normalize to lowercase
];

console.log('Expected behavior: All formats should produce the SAME DID\n');

const results = inputs.map(input => {
  const did = getCanonicalDid(input);
  return { input, did };
});

results.forEach(({ input, did }) => {
  console.log(`Input:  ${input}`);
  console.log(`DID:    ${did}`);
  console.log('');
});

// Check if all DIDs are the same
const allSame = results.every(r => r.did === results[0].did);
console.log('✅ All DIDs match:', allSame);

if (!allSame) {
  console.error('❌ ERROR: DIDs do not match! This will cause duplicate accounts.');
  process.exit(1);
}
