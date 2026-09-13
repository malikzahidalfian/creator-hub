import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArticleStyleRecommendation } from '../src/lib/article-thread.js';

test('article recommendations accept supported styles and normalize plain or fenced JSON', () => {
  for (const styleId of ['santai', 'formal', 'humoris', 'nyinyir', 'storytelling']) {
    const json = JSON.stringify({ styleId, reason: '  Artikel menyoroti dampak tarif bagi pekerja.  ', ignored: true });
    for (const text of [json, '```json\n' + json + '\n```']) {
      assert.deepEqual(parseArticleStyleRecommendation(text), { styleId, reason: 'Artikel menyoroti dampak tarif bagi pekerja.' });
    }
  }
});

test('unusable AI recommendations cannot silently select a default or inject an unsupported style', () => {
  for (const text of [undefined, '', 'Saya memilih formal.', '{"styleId":', 'null', '[]',
    JSON.stringify({ styleId: 'gaya-rekaan', reason: 'Alasan.' }),
    JSON.stringify({ styleId: 'Formal (Baku, Profesional)', reason: 'Alasan.' }),
    JSON.stringify({ styleId: 'formal', reason: {} }),
    JSON.stringify({ styleId: 'formal', reason: '   ' }),
    JSON.stringify({ styleId: 'formal', reason: 'a'.repeat(601) })]) {
    assert.throws(() => parseArticleStyleRecommendation(text), /Rekomendasi AI belum valid/);
  }
});
