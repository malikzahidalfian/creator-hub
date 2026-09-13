import test, { after } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readCredentials } from '../server/credentials.js';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import https from 'node:https';
import auth from '../api/auth.js';
import database from '../api/database.js';
import generate from '../api/generate.js';
import generateImage from '../api/generate-image.js';
import scrapeArticle from '../api/scrape-article.js';
import scrapeTiktok from '../api/scrape-tiktok.js';
import tts from '../api/tts.js';
import { hasSession, sessionCookie } from '../server/session.js';
import { fetchPublicText, htmlToText, isPublicAddress, isSite, parsePublicUrl } from '../server/safe-url.js';

process.env.APP_PASSWORD = 'test-only-password-123';
process.env.SESSION_SECRET = 'test-only-session-secret-with-more-than-32-characters';
const directory = await mkdtemp(join(tmpdir(), 'creator-api-'));
process.env.AUTH_STORE = 'file';
process.env.AUTH_FILE = join(directory, 'credentials.json');
const credential = await readCredentials();
after(() => rm(directory, { recursive: true, force: true }));
function response() {
  return { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; }, send(value) { this.body = value; return this; } };
}
function request(body = {}, method = 'POST') { return { body, method, headers: { cookie: sessionCookie(false, credential).split(';')[0], authorization: 'Bearer test-key', 'content-type': 'application/json' }, url: '/api/database', socket: { remoteAddress: 'test' } }; }

test('all sensitive APIs reject requests without a valid session', async () => {
  for (const handler of [database, generate, generateImage, scrapeArticle, scrapeTiktok, tts]) {
    const res = response();
    await handler({ method: 'POST', headers: {}, body: {} }, res);
    assert.equal(res.statusCode, 401);
  }
});
test('login creates HttpOnly session, rejects tampering, logout clears cookie', async () => {
  let res = response();
  await auth(request({ password: 'wrong' }), res);
  assert.equal(res.statusCode, 401);
  res = response();
  await auth(request({ password: process.env.APP_PASSWORD }), res);
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['Set-Cookie'], /HttpOnly; SameSite=Strict/);
  const cookie = res.headers['Set-Cookie'];
  assert.ok(hasSession({ headers: { cookie } }, credential));
  assert.equal(hasSession({ headers: { cookie: cookie.replace(/\d/, '0') } }, credential), false);
  res = response();
  await auth(request({}, 'DELETE'), res);
  assert.match(res.headers['Set-Cookie'], /Max-Age=0/);
});
test('bootstrap environment no longer overrides stored credentials; missing session secret fails closed', async () => {
  const old = process.env.APP_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  try {
    process.env.APP_PASSWORD = 'a-different-test-password';
    assert.equal((await readCredentials()).version, credential.version);
    const req = request({ password: old });
    delete process.env.SESSION_SECRET;
    const res = response();
    await auth(req, res);
    assert.equal(res.statusCode, 503);
  } finally { process.env.APP_PASSWORD = old; process.env.SESSION_SECRET = secret; }
});
test('expired cookies do not authenticate', t => {
  const now = Date.now();
  t.mock.method(Date, 'now', () => now - 9 * 60 * 60 * 1000);
  const cookie = sessionCookie(false, credential);
  Date.now.mock.restore();
  assert.equal(hasSession({ headers: { cookie } }, credential), false);
});
test('proxy validates provider, missing body and missing key before contacting provider', async () => {
  for (const req of [{ ...request(), headers: { ...request().headers, 'x-provider': 'toString' } }, request(undefined), { ...request({ messages: [{}] }), headers: { cookie: sessionCookie(false, credential) } }]) {
    const res = response(); await generate(req, res); assert.equal(res.statusCode, 400);
  }
  const res = response(); await generate(request({}, 'GET'), res); assert.equal(res.statusCode, 405);
});
test('chat proxy respects selected OpenRouter model and maps non-JSON upstream responses to 502', async t => {
  let payload;
  t.mock.method(globalThis, 'fetch', async (_url, options) => { payload = JSON.parse(options.body); return new Response(JSON.stringify({ choices: [] }), { headers: { 'Content-Type': 'application/json' } }); });
  const req = request({ model: 'chosen/model', messages: [{ role: 'user', content: 'hello' }] });
  req.headers['x-provider'] = 'openrouter';
  let res = response(); await generate(req, res);
  assert.equal(payload.model, 'chosen/model'); assert.equal(payload.stream, false);
  globalThis.fetch = async () => new Response('<html>bad gateway</html>');
  res = response(); await generate(req, res); assert.equal(res.statusCode, 502);
});
test('OpenRouter image generation uses chat multimodal endpoint', async t => {
  let captured;
  t.mock.method(globalThis, 'fetch', async (url, options) => { captured = { url, body: JSON.parse(options.body) }; return new Response('{}'); });
  const req = request({ prompt: 'Product photo', model: 'image-model' }); req.headers['x-provider'] = 'openrouter';
  const res = response(); await generateImage(req, res);
  assert.match(captured.url, /chat\/completions$/);
  assert.deepEqual(captured.body.modalities, ['image', 'text']);
});
test('database requires a scoped ID before deletion and never uses client-supplied credentials', async t => {
  process.env.SUPABASE_URL = 'https://database.example.com'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-test-key';
  t.after(() => { delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY; });
  let res = response(); await database(request({}, 'DELETE'), res); assert.equal(res.statusCode, 400);
  let captured;
  t.mock.method(globalThis, 'fetch', async (url, options) => { captured = { url, options }; return new Response('[]'); });
  const req = request({}, 'DELETE'); req.url += '?id=eq.123';
  res = response(); await database(req, res);
  assert.equal(captured.options.headers.Authorization, 'Bearer server-test-key');
  assert.match(captured.url, /prompts\?id=eq.123$/);
});
test('TTS rejects oversized text and invalid speed', async () => {
  for (const body of [{ input: 'x'.repeat(4097) }, { input: 'hello', speed: 0 }, { input: 'hello', speed: '1' }]) {
    const res = response(); await tts(request(body), res); assert.equal(res.statusCode, 400);
  }
});
test('SSRF validation blocks loopback, private, metadata, mapped IPv6, non-http and userinfo', () => {
  for (const url of ['http://localhost', 'http://127.0.0.1', 'http://2130706433', 'http://10.0.0.1', 'http://169.254.169.254/latest', 'http://[::1]', 'http://[::ffff:127.0.0.1]', 'http://[fc00::1]', 'file:///etc/passwd', 'ftp://example.com', 'http://user:pass@example.com', 'http://example.com:8080']) assert.throws(() => parsePublicUrl(url), undefined, url);
  assert.equal(isPublicAddress('8.8.8.8'), true);
  assert.equal(isPublicAddress('100.64.0.1'), false);
  assert.equal(parsePublicUrl('https://example.com/article').hostname, 'example.com');
  assert.equal(isSite('tokopedia.com.evil.example', 'tokopedia.com'), false);
  assert.equal(isSite('vt.tokopedia.com', 'tokopedia.com'), true);
});
test('DNS answers containing private addresses are blocked before any connection', async () => {
  await assert.rejects(fetchPublicText('https://example.com', { resolve: async () => [{ address: '127.0.0.1', family: 4 }] }), /privat/);
  await assert.rejects(fetchPublicText('https://example.com', { resolve: async () => [{ address: '8.8.8.8', family: 4 }, { address: '10.1.1.1', family: 4 }] }), /privat/);
});
test('redirects to internal networks are revalidated', async t => {
  t.mock.method(https, 'get', (_url, _options, callback) => {
    const req = new EventEmitter(); req.destroy = error => req.emit('error', error);
    queueMicrotask(() => { callback({ statusCode: 302, headers: { location: 'http://127.0.0.1/admin' }, destroy() {} }); req.emit('close'); });
    return req;
  });
  await assert.rejects(fetchPublicText('https://example.com', { resolve: async () => [{ address: '8.8.8.8', family: 4 }] }), /privat/);
});
test('article extractor removes script/style content and normalizes entities', () => {
  assert.equal(htmlToText('<style>bad</style><script>bad</script><h1>Halo &amp; dunia</h1>'), 'Halo & dunia');
});
