import test from 'node:test';
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
import { fetchPublicText, htmlToText, isPublicAddress, isSite, parsePublicUrl } from '../server/safe-url.js';

function response() {
  return { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; }, send(value) { this.body = value; return this; } };
}
function request(body = {}, method = 'POST') { return { body, method, headers: { authorization: 'Bearer test-key', 'content-type': 'application/json' }, url: '/api/database', socket: { remoteAddress: 'test' } }; }

function environment(t, values) {
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  const apply = entries => {
    for (const [key, value] of Object.entries(entries)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  };
  t.after(() => apply(previous));
  apply(values);
}

test('public workspace status works without password, secret or credential storage in production', async t => {
  environment(t, { NODE_ENV: 'production', VERCEL: '1', APP_PASSWORD: undefined, SESSION_SECRET: undefined, AUTH_STORE: 'supabase', SUPABASE_URL: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined });
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Auth must not access credential storage'); });
  for (const method of ['GET', 'POST', 'DELETE']) {
    const res = response();
    await auth(request({}, method), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { authenticated: true, configured: true, access: 'public' });
    assert.equal(res.headers['Cache-Control'], 'no-store');
    assert.equal(res.headers['Set-Cookie'], undefined);
  }
  const res = response();
  await auth(request({ newPassword: 'unused-password' }, 'PATCH'), res);
  assert.equal(res.statusCode, 405);
});

test('public database reads and writes work without a session or auth configuration in production', async t => {
  environment(t, { NODE_ENV: 'production', VERCEL: '1', APP_PASSWORD: undefined, SESSION_SECRET: undefined, SUPABASE_URL: 'https://database.example.com', SUPABASE_SERVICE_ROLE_KEY: 'server-test-key' });
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify([{ id: 'record-123', type: 'Storyboard', result: 'Saved content' }]), { headers: { 'Content-Type': 'application/json' } });
  });
  for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) {
    const req = request({ type: 'Storyboard', result: 'Saved content' }, method);
    req.headers = { 'content-type': 'application/json' };
    if (['PATCH', 'DELETE'].includes(method)) req.url += '?id=eq.record-123';
    const res = response();
    await database(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body[0].id, 'record-123');
    assert.equal(res.headers['Cache-Control'], 'no-store');
  }
  assert.deepEqual(calls.map(call => call.options.method), ['GET', 'POST', 'PATCH', 'DELETE']);
  assert.ok(calls.every(call => call.url.includes('/rest/v1/prompts?') && call.options.headers.Authorization === 'Bearer server-test-key'));
});

test('generation APIs still require a provider key and POST without requiring a workspace session', async () => {
  for (const handler of [generate, generateImage, tts]) {
    const res = response();
    await handler({ ...request(), headers: {} }, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /API Key/);
  }
  for (const handler of [generate, generateImage, scrapeArticle, scrapeTiktok, tts]) {
    const res = response();
    await handler(request({}, 'GET'), res);
    assert.equal(res.statusCode, 405);
  }
});

test('proxy validates provider, missing body and missing key before contacting provider', async () => {
  for (const req of [{ ...request(), headers: { ...request().headers, 'x-provider': 'toString' } }, request(undefined), { ...request({ messages: [{}] }), headers: {} }]) {
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
