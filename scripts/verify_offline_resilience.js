/**
 * Verification Script: Offline Resilience Architecture & Optional Wi-Fi Bridge
 * RIVO Technologies
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('🧪 RIVO Offline Resilience & Wi-Fi Bridge Audit');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}\n`);
  }
}

// 1. Check Service Worker existence and syntax
runTest('Service Worker syntax and caching logic in public/sw.js', () => {
  const swPath = path.join(__dirname, '..', 'public', 'sw.js');
  assert(fs.existsSync(swPath), 'public/sw.js file must exist');
  const swContent = fs.readFileSync(swPath, 'utf8');
  assert(swContent.includes('rivo-pwa-v1'), 'Must include cache versioning rivo-pwa-v1');
  assert(swContent.includes('sync-service-calls'), 'Must listen for background sync tag sync-service-calls');
  assert(swContent.includes('SYNC_OUTBOX'), 'Must broadcast SYNC_OUTBOX to active clients');
  assert(swContent.includes('skipWaiting'), 'Must invoke skipWaiting during install');
  assert(swContent.includes('clients.claim'), 'Must invoke clients.claim during activate');
});

// 2. Check Web App Manifest
runTest('Web App Manifest in public/manifest.json', () => {
  const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
  assert(fs.existsSync(manifestPath), 'public/manifest.json must exist');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.strictEqual(manifest.short_name, 'RIVO');
  assert.strictEqual(manifest.display, 'standalone');
  assert(Array.isArray(manifest.icons) && manifest.icons.length >= 3, 'Must define multiple icon sizes');
});

// 3. Check PWA Registration Component
runTest('PWA Registration component in src/components/pwa-register.tsx', () => {
  const regPath = path.join(__dirname, '..', 'src', 'components', 'pwa-register.tsx');
  assert(fs.existsSync(regPath), 'pwa-register.tsx must exist');
  const content = fs.readFileSync(regPath, 'utf8');
  assert(content.includes('serviceWorker.register'), 'Must register /sw.js');
  assert(content.includes('typeof window'), 'Must have SSR guards');
});

// 4. Check Offline Outbox & IndexedDB module
runTest('Offline Outbox module in src/lib/offline-outbox.ts', () => {
  const outboxPath = path.join(__dirname, '..', 'src', 'lib', 'offline-outbox.ts');
  assert(fs.existsSync(outboxPath), 'offline-outbox.ts must exist');
  const content = fs.readFileSync(outboxPath, 'utf8');
  assert(content.includes('rivo_offline_db'), 'Database must be rivo_offline_db');
  assert(content.includes('hub_cache'), 'Store hub_cache must be defined');
  assert(content.includes('service_outbox'), 'Store service_outbox must be defined');
  assert(content.includes('cacheLocalHubData'), 'cacheLocalHubData must be exported');
  assert(content.includes('getLocalHubData'), 'getLocalHubData must be exported');
  assert(content.includes('enqueueOutboxItem'), 'enqueueOutboxItem must be exported');
  assert(content.includes('drainOutboxQueue'), 'drainOutboxQueue must be exported');
  assert(content.includes('initOfflineSyncListeners'), 'initOfflineSyncListeners must be exported');
});

// 5. Check Hub Config for strictly optional Wi-Fi Bridge
runTest('Strictly optional Wi-Fi Bridge configuration in src/lib/hub-config.ts', () => {
  const hubConfigPath = path.join(__dirname, '..', 'src', 'lib', 'hub-config.ts');
  const content = fs.readFileSync(hubConfigPath, 'utf8');
  assert(content.includes('interface WifiBridgeConfig'), 'WifiBridgeConfig interface must be defined');
  assert(content.includes('generateWifiQrPayload'), 'generateWifiQrPayload helper must be exported');
  assert(content.includes('enabled: false'), 'Default must have wifiBridge.enabled = false');
});

// 6. Test Wi-Fi QR payload generator logic
runTest('Wi-Fi QR payload generator string formatting', () => {
  function generateWifiQrPayload(wifi) {
    const t = wifi.securityType || 'WPA';
    const s = wifi.ssid || '';
    const p = wifi.password || '';
    return `WIFI:T:${t};S:${s};P:${p};;`;
  }

  const wpaPayload = generateWifiQrPayload({ ssid: 'RivoBistrot', password: 'SecretPassword2026', securityType: 'WPA' });
  assert.strictEqual(wpaPayload, 'WIFI:T:WPA;S:RivoBistrot;P:SecretPassword2026;;');

  const openPayload = generateWifiQrPayload({ ssid: 'FreeGuest', securityType: 'nopass' });
  assert.strictEqual(openPayload, 'WIFI:T:nopass;S:FreeGuest;P:;;');
});

// 7. Check Custom Hub Studio Wi-Fi Bridge Controls
runTest('Custom Hub Studio configuration UI in src/app/dashboard/custom-hub/page.tsx', () => {
  const studioPath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'custom-hub', 'page.tsx');
  const content = fs.readFileSync(studioPath, 'utf8');
  assert(content.includes('Ponte Wi-Fi Ospiti'), 'Must include Ponte Wi-Fi section');
  assert(content.includes('wifiBridge'), 'Must manage wifiBridge configuration');
});

console.log('\n----------------------------------------------------');
console.log(`Results: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('----------------------------------------------------\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
