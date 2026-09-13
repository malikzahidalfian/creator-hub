import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createCredentialStore, credentialStore, hashPassword, readCredentials, verifyPassword } from '../server/credentials.js';
import { hasSession, sessionCookie } from '../server/session.js';
import auth from '../api/auth.js';

const directory = await mkdtemp(join(tmpdir(), 'creator-credentials-'));
after(() => rm(directory, { recursive: true, force: true }));
const bootstrap = 'initial-test-password-123';
const replacement = 'replacement-test-password-456';
process.env.APP_PASSWORD = bootstrap;
process.env.SESSION_SECRET = 'credential-test-secret-longer-than-32-characters';
process.env.AUTH_STORE = 'file';
process.env.AUTH_FILE = join(directory, 'api.json');
const local = (name, password = bootstrap) => createCredentialStore({ mode: 'file', file: join(directory, name), bootstrapPassword: password });
function res() { return { code: 200, headers: {}, status(code) { this.code = code; return this; }, setHeader(key, value) { this.headers[key] = value; }, json(data) { this.data = data; return this; } }; }
async function call(method, body = {}, cookie = '', headers = {}) {
  const response = res();
  await auth({ method, body, headers: { 'content-type': 'application/json', cookie, ...headers }, socket: { remoteAddress: 'test-owner' } }, response);
  return response;
}

test('password hashes use unique salts and verify without storing plaintext', async () => {
  const first = await hashPassword(bootstrap), second = await hashPassword(bootstrap);
  assert.notEqual(first, second);
  assert.equal(first.includes(bootstrap), false);
  assert.equal(await verifyPassword(bootstrap, first), true);
  assert.equal(await verifyPassword('wrong', first), false);
});
test('password changes survive a fresh store instance and cannot fall back to APP_PASSWORD', async () => {
  const store = local('persistent.json');
  const initial = await store.read();
  const next = await store.change(initial.version, replacement);
  const restarted = await local('persistent.json', 'different-env-password-999').read();
  assert.equal(restarted.version, next.version);
  assert.equal(await verifyPassword(replacement, restarted.password_hash), true);
  assert.equal(await verifyPassword(bootstrap, restarted.password_hash), false);
  assert.equal((await readFile(join(directory, 'persistent.json'), 'utf8')).includes(replacement), false);
});
test('concurrent bootstrap never overwrites credentials, concurrent changes reject the stale version', async () => {
  const store = local('concurrent.json');
  const [first, second] = await Promise.all([store.read(), store.read()]);
  assert.equal(first.version, second.version);
  const outcomes = await Promise.allSettled([store.change(first.version, replacement), store.change(first.version, 'another-new-password-789')]);
  assert.equal(outcomes.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(outcomes.find(result => result.status === 'rejected').reason.status, 409);
});
test('malformed private file fails closed rather than resetting password', async () => {
  await writeFile(join(directory, 'broken.json'), '{bad json');
  await assert.rejects(local('broken.json').read(), /tidak dapat dibaca/);
  assert.equal(await readFile(join(directory, 'broken.json'), 'utf8'), '{bad json');
});
test('production rejects ephemeral file storage', () => {
  const old = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try { assert.throws(() => credentialStore(), /Production harus/); }
  finally { if (old === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = old; }
});
test('Supabase persistence is shared across server instances, version scoped and never returned as a public field', async () => {
  let stored;
  const requests = [];
  const options = { mode: 'supabase', url: 'https://db.example', key: 'server-key', bootstrapPassword: bootstrap,
    request: async (url, options) => {
      requests.push({ url, options });
      if (options.method === 'POST') { stored ||= JSON.parse(options.body); return new Response('[]'); }
      if (options.method === 'PATCH') {
        if (!url.includes(`version=eq.${stored.version}`)) return new Response('[]');
        stored = JSON.parse(options.body);
      }
      return new Response(JSON.stringify(stored ? [stored] : []));
    }
  };
  const initial = await createCredentialStore(options).read();
  const next = await createCredentialStore(options).change(initial.version, replacement);
  assert.equal((await createCredentialStore(options).read()).version, next.version);
  await assert.rejects(createCredentialStore(options).change(initial.version, bootstrap), error => error.status === 409);
  assert.ok(requests.every(req => req.options.headers.Authorization === 'Bearer server-key'));
  assert.match(requests.find(req => req.options.method === 'POST').options.headers.Prefer, /ignore-duplicates/);
});
test('Supabase outage and missing migration never fall back to bootstrap or local files', async () => {
  for (const status of [404, 403, 500]) {
    const store = createCredentialStore({ mode: 'supabase', url: 'https://db.example', key: 'key', bootstrapPassword: bootstrap, request: async () => new Response('{}', { status }) });
    await assert.rejects(store.read(), /Penyimpanan password tidak tersedia/);
  }
});
test('password endpoint requires session, current password, confirmation and adequate new length', async () => {
  const initial = await readCredentials();
  const cookie = sessionCookie(false, initial).split(';')[0];
  assert.equal((await call('PATCH', { newPassword: replacement, confirmPassword: replacement, currentPassword: bootstrap })).code, 401);
  for (const body of [
    { newPassword: 'short', confirmPassword: 'short', currentPassword: bootstrap },
    { newPassword: replacement, confirmPassword: 'different', currentPassword: bootstrap },
    { newPassword: replacement, confirmPassword: replacement, currentPassword: 'wrong' },
    { newPassword: bootstrap, confirmPassword: bootstrap, currentPassword: bootstrap }
  ]) assert.equal((await call('PATCH', body, cookie)).code, 400);
  assert.equal((await readCredentials()).version, initial.version);
});
test('successful change rotates the current session, invalidates old sessions and rejects the old password', async () => {
  const before = await readCredentials();
  const oldCookie = sessionCookie(false, before).split(';')[0];
  const result = await call('PATCH', { currentPassword: bootstrap, newPassword: replacement, confirmPassword: replacement }, oldCookie);
  assert.equal(result.code, 200);
  assert.equal(JSON.stringify(result.data).includes('password_hash'), false);
  const updated = await readCredentials();
  assert.equal(hasSession({ headers: { cookie: oldCookie } }, updated), false);
  assert.equal(hasSession({ headers: { cookie: result.headers['Set-Cookie'] } }, updated), true);
  assert.equal((await call('POST', { password: bootstrap })).code, 401);
  assert.equal((await call('POST', { password: replacement })).code, 200);
  const stale = await call('PATCH', { currentPassword: replacement, newPassword: bootstrap, confirmPassword: bootstrap }, oldCookie);
  assert.equal(stale.code, 401); assert.equal(stale.data.code, 'SESSION_EXPIRED');
});
test('failed persistent write never issues a replacement session or reports success', async t => {
  const saved = await local('write-failure.json').read();
  const cookie = sessionCookie(false, saved).split(';')[0];
  const previous = { AUTH_STORE: process.env.AUTH_STORE, SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY };
  t.mock.method(globalThis, 'fetch', async (_url, options) => options.method === 'PATCH' ? new Response('{}', { status: 500 }) : new Response(JSON.stringify([saved])));
  process.env.AUTH_STORE = 'supabase'; process.env.SUPABASE_URL = 'https://db.example'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-server-key';
  try {
    const result = await call('PATCH', { currentPassword: bootstrap, newPassword: replacement, confirmPassword: replacement }, cookie);
    assert.equal(result.code, 503);
    assert.equal(result.headers['Set-Cookie'], undefined);
    assert.equal(hasSession({ headers: { cookie } }, await readCredentials()), true);
  } finally {
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

test('cross-site/form password mutations are rejected and guesses are throttled', async () => {
  assert.equal((await call('POST', { password: replacement }, '', { 'sec-fetch-site': 'cross-site' })).code, 403);
  assert.equal((await call('PATCH', {}, '', { 'content-type': 'text/plain' })).code, 403);
  let result;
  for (let i = 0; i < 11; i++) result = await call('POST', { password: 'wrong' }, '', { 'x-real-ip': 'rate-limit-test' });
  assert.equal(result.code, 429); assert.ok(Number(result.headers['Retry-After']) > 0);
});
