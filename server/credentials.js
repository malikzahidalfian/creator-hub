import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const derive = promisify(scrypt);
const HASH_PATTERN = /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/;
const VERSION_PATTERN = /^[a-f0-9-]{36}$/;
export class CredentialError extends Error {
  constructor(message, status = 503) { super(message); this.status = status; }
}
export function validPassword(value) {
  return typeof value === 'string' && value.length >= 12 && value.length <= 128 && value.trim().length > 0;
}
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${salt}$${hash.toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || password.length > 1024 || !HASH_PATTERN.test(encoded || '')) return false;
  const [, salt, expected] = encoded.split('$');
  const actual = await derive(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
function validateRecord(value) {
  if (value?.id !== 'owner' || !HASH_PATTERN.test(value.password_hash || '') || !VERSION_PATTERN.test(value.version || '')) {
    throw new CredentialError('Data keamanan tidak valid. Pulihkan penyimpanan password dari backup; password awal tidak digunakan sebagai fallback.');
  }
  return value;
}
async function newRecord(password) {
  return { id: 'owner', password_hash: await hashPassword(password), version: randomUUID(), updated_at: new Date().toISOString() };
}

// Atomic file replacement + exclusive lock also protects concurrent local server processes.
async function withFileLock(file, action) {
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  const lock = `${file}.lock`;
  let acquired = false;
  for (let i = 0; i < 100; i++) {
    try { await mkdir(lock); acquired = true; break; } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  if (!acquired) throw new CredentialError('Penyimpanan keamanan sedang dipakai. Coba lagi sebentar.');
  try { return await action(); } finally { await rm(lock, { recursive: true, force: true }); }
}
async function readLocal(file) {
  try { return validateRecord(JSON.parse(await readFile(file, 'utf8'))); } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw new CredentialError('Penyimpanan password tidak dapat dibaca. Password awal tidak digunakan sebagai fallback.');
  }
}
async function writeLocal(file, record) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(record)}\n`, { mode: 0o600, flag: 'wx' });
    await rename(temporary, file);
  } finally { await rm(temporary, { force: true }); }
}

export function createCredentialStore({ mode, file, url, key, bootstrapPassword, request = globalThis.fetch }) {
  async function remote(query = '', options = {}) {
    if (!url || !key) throw new CredentialError('Penyimpanan password belum disiapkan. Isi kredensial Supabase dan jalankan migrasi workspace_credentials sesuai README.');
    let response;
    try {
      response = await request(`${url.replace(/\/$/, '')}/rest/v1/workspace_credentials${query}`, {
        ...options,
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...options.headers },
        signal: AbortSignal.timeout(10_000)
      });
    } catch { throw new CredentialError('Penyimpanan password tidak merespons. Silakan coba lagi; password awal tidak digunakan sebagai fallback.'); }
    if (!response.ok) throw new CredentialError('Penyimpanan password tidak tersedia. Periksa migrasi workspace_credentials dan izin server Supabase.');
    const data = await response.json().catch(() => null);
    if (!Array.isArray(data)) throw new CredentialError('Respons penyimpanan password tidak valid.');
    return data.map(validateRecord);
  }
  async function read() {
    if (mode === 'file') {
      const existing = await readLocal(file);
      if (existing) return existing;
    } else {
      const existing = await remote('?id=eq.owner&select=*');
      if (existing[0]) return existing[0];
    }
    if (!validPassword(bootstrapPassword)) throw new CredentialError('Atur APP_PASSWORD awal sepanjang 12–128 karakter untuk menyiapkan login.');
    const initial = await newRecord(bootstrapPassword);
    if (mode === 'file') return withFileLock(file, async () => {
      const existing = await readLocal(file);
      if (existing) return existing;
      await writeLocal(file, initial);
      return initial;
    });
    // A simultaneous cold start must never overwrite an already initialized password.
    await remote('?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' }, body: JSON.stringify(initial) });
    const [stored] = await remote('?id=eq.owner&select=*');
    if (!stored) throw new CredentialError('Password awal tidak berhasil disimpan.');
    return stored;
  }
  async function change(expectedVersion, password) {
    if (!validPassword(password)) throw new CredentialError('Password baru harus 12–128 karakter.', 400);
    const replacement = await newRecord(password);
    if (mode === 'file') return withFileLock(file, async () => {
      const current = await readLocal(file);
      if (!current || current.version !== expectedVersion) throw new CredentialError('Password sudah berubah di sesi lain. Silakan masuk kembali.', 409);
      await writeLocal(file, replacement);
      return replacement;
    });
    const [updated] = await remote(`?id=eq.owner&version=eq.${encodeURIComponent(expectedVersion)}`, { method: 'PATCH', body: JSON.stringify(replacement) });
    if (!updated) throw new CredentialError('Password sudah berubah di sesi lain. Silakan masuk kembali.', 409);
    return updated;
  }
  return { read, change };
}

export function credentialStore() {
  const hosted = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  const mode = process.env.AUTH_STORE || (hosted ? 'supabase' : 'file');
  if (!['file', 'supabase'].includes(mode) || (hosted && mode === 'file')) throw new CredentialError('Production harus menggunakan AUTH_STORE=supabase agar password tetap tersimpan lintas server dan deployment.');
  return createCredentialStore({ mode, file: resolve(process.env.AUTH_FILE || '.private/workspace-auth.json'), url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY, bootstrapPassword: process.env.APP_PASSWORD });
}
export async function readCredentials() {
  if (process.env.SESSION_SECRET?.length < 32 || !process.env.SESSION_SECRET) throw new CredentialError('Atur SESSION_SECRET minimal 32 karakter di server.');
  return credentialStore().read();
}
