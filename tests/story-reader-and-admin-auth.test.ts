import assert from 'assert';
import {
  loadAdminStore,
  verifyAdminCredentials,
  createSessionToken,
  verifySessionToken,
  getRegisteredAdminUsernames,
} from '../lib/game/auth/admin-auth';

async function runTests() {
  console.log('--- TEST SUITE: STORY READER & ADMIN AUTH V2 ---');

  // Test 1: Store loads properly
  const store = loadAdminStore();
  assert(store && typeof store.accounts === 'object', 'Admin store must have accounts object');
  console.log('✓ PASS 01: Admin store loads properly');

  // Test 2: Registered usernames contains at least admin
  const usernames = getRegisteredAdminUsernames();
  assert(usernames.includes('admin'), 'Usernames must include admin');
  console.log('✓ PASS 02: Registered usernames contains admin');

  // Test 3: Account verification fails for non-existent user
  const nonExistentResult = verifyAdminCredentials('ghost_user_999', 'anypassword');
  assert.strictEqual(nonExistentResult.success, false, 'Non-existent user must fail');
  assert.strictEqual(nonExistentResult.errorCode, 'ACCOUNT_NOT_FOUND', 'Must return ACCOUNT_NOT_FOUND');
  console.log('✓ PASS 03: Non-existent account check correctly rejected');

  // Test 4: Account verification fails for incorrect password
  const badPassResult = verifyAdminCredentials('admin', 'WrongPass123!_DefinitelyNotIt');
  assert.strictEqual(badPassResult.success, false, 'Wrong password must fail');
  assert.strictEqual(badPassResult.errorCode, 'INVALID_PASSWORD', 'Must return INVALID_PASSWORD');
  console.log('✓ PASS 04: Invalid password correctly rejected with INVALID_PASSWORD');

  // Test 5: Session creation and verification with role support
  const { cookieValue, csrfToken, expiresAt } = createSessionToken('admin321', 'superadmin');
  assert(cookieValue && cookieValue.includes('.'), 'Session cookie value must be signed string');
  assert(csrfToken && csrfToken.length >= 16, 'CSRF token must be strong string');
  assert(expiresAt > Date.now(), 'Session must expire in the future');

  const verifyResult = verifySessionToken(cookieValue);
  assert.strictEqual(verifyResult.valid, true, 'Created session token must verify successfully');
  assert.strictEqual(verifyResult.user?.username, 'admin321', 'Session username must match');
  assert.strictEqual(verifyResult.user?.role, 'superadmin', 'Session role must match superadmin');
  console.log('✓ PASS 05: Session creation, role propagation (superadmin), and verification passed');

  // Test 6: Environment bootstrap idempotency for admin321
  process.env.STARFRONT_ADMIN_THIRD_PASSWORD = 'TestSuperAdminPass999!';
  const updatedStore = loadAdminStore();
  assert(updatedStore.accounts['admin321'], 'admin321 must be bootstrapped when env is set');
  assert.strictEqual(updatedStore.accounts['admin321'].role, 'superadmin', 'admin321 role must be superadmin');

  const admin321Auth = verifyAdminCredentials('admin321', 'TestSuperAdminPass999!');
  assert.strictEqual(admin321Auth.success, true, 'admin321 must authenticate with env password');
  assert.strictEqual(admin321Auth.user?.role, 'superadmin', 'admin321 role in auth user must be superadmin');
  console.log('✓ PASS 06: admin321 bootstrapped with superadmin role and authenticated successfully');

  // Cleanup test env
  delete process.env.STARFRONT_ADMIN_THIRD_PASSWORD;

  console.log('=== ALL TESTS PASSED SUCCESSFULLY (6/6) ===');
}

runTests().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
