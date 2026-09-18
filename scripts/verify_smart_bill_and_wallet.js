const { createPkpassBundle } = require('../src/lib/wallet/apple-pass.ts');
const { generateGoogleWalletSaveUrl } = require('../src/lib/wallet/google-pass.ts');

async function verifyAll() {
  console.log('=== VERIFYING AGENT DELIVERABLES ===');

  // Test 1: Apple Wallet Pass generation
  console.log('\n[Test 1] Generating Apple Wallet .pkpass bundle...');
  const pkpassBuffer = await createPkpassBundle({
    passToken: 'RIVO-TEST-123456',
    customerName: 'Mario Rossi',
    stampsCount: 4,
    maxStamps: 10,
    rewardText: 'Pizza Margherita Omaggio',
    organizationName: 'Pizzeria Da Michele',
  });
  console.log(`✓ Apple .pkpass generated successfully! Size: ${pkpassBuffer.length} bytes`);
  if (pkpassBuffer.length < 500) {
    throw new Error('pkpass buffer too small');
  }

  // Test 2: Google Wallet Pass generation
  console.log('\n[Test 2] Generating Google Wallet Pass JWT & Save URL...');
  const googleResult = generateGoogleWalletSaveUrl({
    passId: 'card-uuid-1234',
    passToken: 'RIVO-TEST-123456',
    organizationName: 'Pizzeria Da Michele',
    customerName: 'Mario Rossi',
    stampsCount: 4,
    maxStamps: 10,
    rewardText: 'Pizza Margherita Omaggio',
  });
  console.log('✓ Google Wallet Save URL generated:', googleResult.saveUrl.slice(0, 70) + '...');
  console.log('✓ Sandbox flag:', googleResult.isSandbox);
  if (!googleResult.saveUrl.startsWith('https://pay.google.com/gp/v/save/')) {
    throw new Error('Invalid Google Wallet Save URL');
  }

  console.log('\n=== ALL AGENT VALIDATIONS PASSED! ===');
}

verifyAll().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
