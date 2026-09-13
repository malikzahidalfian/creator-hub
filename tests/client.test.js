import test from 'node:test';
import assert from 'node:assert/strict';
import { assistantText, dashboardSummary, historyParts, parseRecord, readGeminiKeys, safeLink, appFetch, loadAllRecords } from '../src/lib/client.js';
import { uploadGeminiFile } from '../src/lib/gemini.js';

test('malformed saved product JSON cannot crash rendering', () => {
  for (const value of ['null', '[]', '{broken', '42', undefined]) assert.deepEqual(parseRecord(value), {});
  assert.deepEqual(parseRecord('{"name":"Wajan"}'), { name: 'Wajan' });
});
test('Gemini storage always produces ten string keys', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => '{"0":123}' } });
  assert.deepEqual(readGeminiKeys(), Array(10).fill(''));
  globalThis.localStorage.getItem = () => '["key",null,23]';
  assert.deepEqual(readGeminiKeys().slice(0, 4), ['key', '', '', '']);
  delete globalThis.localStorage;
});
test('history supports old Bang Jenggot JSON and new plain-text records', () => {
  const parts = historyParts('[{"angle":"Review","blocks":["Scene 1","Scene 2"]}]');
  assert.equal(parts.length, 2);
  assert.match(parts[0], /Review.*\n\nScene 1/);
  assert.deepEqual(historyParts(' A\n\n---\n\nB '), ['A', 'B']);
  assert.deepEqual(historyParts(null), []);
});
test('dashboard counts real content, excludes product/image records and invalid dates', () => {
  const now = new Date(2026, 7, 15, 12);
  const date = new Date(2026, 7, 15, 9).toISOString();
  const history = [{ type: 'Storyboard', created_at: date }, { type: 'Utas Affiliate', created_at: date }, { type: 'Bank Storyboard', created_at: date }, { type: 'Bank Gambar', created_at: date }, { type: 'Storyboard', created_at: 'bad' }];
  const summary = dashboardSummary(history, now);
  assert.equal(summary.records.length, 3);
  assert.equal(summary.weekly, 2);
  assert.equal(summary.days.at(-1).count, 2);
});
test('AI text validation handles empty/refused and multimodal responses', () => {
  assert.throws(() => assistantText({ choices: [] }), /tidak menghasilkan/);
  assert.equal(assistantText({ choices: [{ message: { content: [{ text: 'Hello' }, { text: 'World' }] } }] }), 'Hello\nWorld');
});
test('unsafe product links are not rendered as actionable URLs', () => {
  assert.equal(safeLink('javascript:alert(1)'), undefined);
  assert.equal(safeLink('data:text/html,test'), undefined);
  assert.equal(safeLink('https://example.com/a'), 'https://example.com/a');
});
test('API errors are readable and HTML fallback cannot masquerade as a working API', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: 'Saldo habis' }), { status: 402, headers: { 'Content-Type': 'application/json' } }));
  await assert.rejects(appFetch('/api/generate'), /Saldo habis/);
  globalThis.fetch = async () => new Response('<html>fallback</html>', { headers: { 'Content-Type': 'text/html' } });
  await assert.rejects(appFetch('/api/generate'), /API tidak tersedia/);
});

test('client retains payment diagnostics so failed requests can be explained in the form', async t => {
  const details = { error: 'Provider menolak pembayaran.', code: 'payment_required', provider: '1inference', model: 'gpt-5.5', providerMessage: 'Payment Required', providerCode: 'insufficient_balance', requestId: 'request-123' };
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(details), { status: 402, headers: { 'Content-Type': 'application/json' } }));
  await assert.rejects(appFetch('/api/generate'), error => {
    assert.equal(error.status, 402);
    for (const key of ['code', 'provider', 'model', 'providerMessage', 'providerCode', 'requestId']) assert.equal(error[key], details[key]);
    return true;
  });
});

test('database loader continues beyond the first page without truncating history', async () => {
  const offsets = [];
  const records = await loadAllRecords('', async url => {
    const offset = Number(new URL(url, 'http://localhost').searchParams.get('offset'));
    offsets.push(offset);
    return new Response(JSON.stringify(Array.from({ length: offset === 0 ? 500 : 1 }, (_, i) => ({ id: offset + i }))));
  });
  assert.deepEqual(offsets, [0, 500]);
  assert.equal(records.length, 501);
});

function geminiMock(states) {
  let calls = 0;
  return async () => {
    calls++;
    if (calls === 1) return new Response('', { headers: { 'x-goog-upload-url': 'https://example.com/upload' } });
    const file = { name: 'files/test', uri: 'https://example.com/file', mimeType: 'video/mp4', state: states.shift() || 'PROCESSING' };
    return new Response(JSON.stringify(calls === 2 ? { file } : file));
  };
}
test('Gemini upload polls until ACTIVE with a bounded retry count', async () => {
  const file = { name: 'clip.mp4', type: 'video/mp4', size: 100 };
  const data = await uploadGeminiFile(file, 'test', () => {}, { request: geminiMock(['PROCESSING', 'ACTIVE']), pause: async () => {}, maxPolls: 2 });
  assert.equal(data.state, 'ACTIVE');
  await assert.rejects(uploadGeminiFile(file, 'test', () => {}, { request: geminiMock([]), pause: async () => {}, maxPolls: 2 }), /terlalu lama/);
  await assert.rejects(uploadGeminiFile(file, 'test', () => {}, { request: geminiMock(['FAILED']) }), /gagal memproses/);
});
