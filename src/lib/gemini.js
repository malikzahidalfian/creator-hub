import { appFetch } from './client.js';

export async function uploadGeminiFile(file, key, onProgress, { request = appFetch, pause = ms => new Promise(resolve => setTimeout(resolve, ms)), maxPolls = 40 } = {}) {
  if (!file || !/^(image|video)\//.test(file.type)) throw new Error('Pilih gambar atau video yang valid.');
  if (file.size > 100 * 1024 * 1024) throw new Error('Ukuran file maksimal 100 MB.');
  onProgress('Mengunggah file ke Google...');
  const start = await request('https://generativelanguage.googleapis.com/upload/v1beta/files', {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start', 'X-Goog-Upload-Header-Content-Length': String(file.size), 'X-Goog-Upload-Header-Content-Type': file.type, 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: { display_name: file.name } })
  });
  if (!start.ok) throw new Error(`Gagal memulai unggahan (${start.status}). Periksa Gemini API Key.`);
  const uploadUrl = start.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('Google tidak memberikan URL unggahan. Periksa dukungan CORS layanan.');
  const upload = await request(uploadUrl, {
    method: 'POST', headers: { 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize', 'Content-Type': file.type }, body: file
  });
  if (!upload.ok) throw new Error(`Gagal mengunggah file (${upload.status}).`);
  let data = (await upload.json()).file;
  if (!data?.uri || !data?.name) throw new Error('Respons unggahan Google tidak valid.');
  for (let count = 0; data.state === 'PROCESSING'; count++) {
    if (count >= maxPolls) throw new Error('Pemrosesan video terlalu lama. Coba video yang lebih pendek.');
    onProgress('Menunggu Google memproses video...');
    await pause(3000);
    const status = await request(`https://generativelanguage.googleapis.com/v1beta/${data.name}`, { headers: { 'x-goog-api-key': key } });
    if (!status.ok) throw new Error(`Gagal memeriksa status video (${status.status}).`);
    data = await status.json();
  }
  if (data.state !== 'ACTIVE' || !data.uri || !data.mimeType) throw new Error('Google gagal memproses file.');
  return data;
}
