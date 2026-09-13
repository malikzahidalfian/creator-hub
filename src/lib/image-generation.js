import { appFetch, assistantText, safeLink } from './client.js';
import { TEXT_CHAT_OPTIONS, IMAGE_MODEL, GPT_IMAGE_WORKFLOW } from './ai-model.js';

const imageBriefPrompt = `Susun satu prompt gambar siap pakai dari deskripsi pengguna. Pertahankan subjek, jumlah objek, warna, gaya, dan semua batasan eksplisit. Tambahkan komposisi, pencahayaan, sudut pandang, dan detail visual secukupnya jika belum ditentukan; jangan mengubah maksud pengguna.
Pertahankan teks yang diminta muncul pada gambar persis seperti aslinya, termasuk bahasa dan ejaannya. Jangan menambahkan tulisan, logo, atau watermark yang tidak diminta. Hindari klaim produk rekaan. Jika deskripsi sudah lengkap, rapikan tanpa memperluas konsep.
Keluarkan hanya satu prompt, maksimal 180 kata, tanpa pengantar, penjelasan, judul, atau daftar alternatif.`;

export async function generatePaidImage({ prompt, model, apiKey, onStatus, briefCache }) {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, 'X-Provider': '1inference' };
  let imagePrompt = prompt.trim();
  let imageModel = model;

  if (model === GPT_IMAGE_WORKFLOW) {
    const cached = briefCache?.current;
    if (cached?.prompt === imagePrompt && cached?.apiKey === apiKey) {
      imagePrompt = cached.brief;
    } else {
      onStatus('GPT-5.5 menyusun konsep...');
      const response = await appFetch('/api/generate', {
        method: 'POST', headers,
        body: JSON.stringify({ ...TEXT_CHAT_OPTIONS, max_completion_tokens: 2048, messages: [
          { role: 'system', content: imageBriefPrompt },
          { role: 'user', content: imagePrompt }
        ] })
      }).catch(error => { throw Object.assign(error, { stage: 'konsep gambar' }); });
      const brief = assistantText(await response.json());
      if (briefCache) briefCache.current = { prompt: imagePrompt, apiKey, brief };
      imagePrompt = brief;
    }
    imageModel = IMAGE_MODEL;
  }

  onStatus('Melukis gambar...');
  const response = await appFetch('/api/generate-image', {
    method: 'POST', headers, signal: AbortSignal.timeout(180_000),
    body: JSON.stringify({ model: imageModel, prompt: imagePrompt })
  }).catch(error => { throw Object.assign(error, { stage: 'pembuatan gambar' }); });
  const data = await response.json();
  const image = data?.data?.[0];
  if (typeof image?.b64_json === 'string' && image.b64_json.trim()) {
    return `data:image/png;base64,${image.b64_json.trim()}`;
  }
  const url = image?.url || data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (typeof url === 'string' && (safeLink(url) || /^data:image\/(png|jpeg|webp);base64,/i.test(url))) return url;
  throw new Error('Layanan belum mengembalikan gambar. Coba lagi atau pilih model gambar lain.');
}
