import { test, expect } from '@playwright/test';
import { mkdir, rm, writeFile } from 'node:fs/promises';

const password = 'browser-test-password-123';
const changedPassword = 'new-browser-test-password-456';
const product = { id: 'phone-product', type: 'Bank Storyboard', product_desc: 'Perlengkapan Dapur', created_at: new Date().toISOString(), result: JSON.stringify({ name: 'Wajan Granit untuk Dapur Keluarga', desc: 'Deskripsi produk yang cukup panjang untuk menguji pembungkusan teks pada layar kecil. '.repeat(12) }) };
const history = { id: 'phone-history', type: 'Storyboard', product_desc: 'Storyboard dari HP', created_at: new Date().toISOString(), result: `Scene pertama\n${'https://example.com/'.repeat(25)}\n\n---\n\nScene kedua` };
async function mockData(page) {
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.route('**/api/database**', route => {
    const type = new URL(route.request().url()).searchParams.get('type')?.slice(3);
    return route.fulfill({ json: [product, history].filter(item => !type || item.type === type) });
  });
}
async function login(page, value = password) {
  await page.goto('/');
  await page.getByLabel('Password workspace', { exact: true }).fill(value);
  await page.getByRole('button', { name: 'Masuk ke workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Ruang untuk ide besar Anda.' })).toBeVisible();
}
async function overflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(await page.locator('main, .content-panel, .dialog-shell > .glass-panel').evaluateAll(elements => elements.filter(el => el.getBoundingClientRect().width).every(el => el.scrollWidth <= el.clientWidth + 1))).toBe(true);
}
async function touchTargets(page) {
  const small = await page.locator('button:visible').evaluateAll(buttons => buttons.filter(button => {
    const r = button.getBoundingClientRect();
    return r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight && (r.width < 43.5 || r.height < 43.5);
  }).map(button => button.getAttribute('aria-label') || button.textContent.trim()));
  expect(small).toEqual([]);
}

test('change password from phone, validate fields, rotate sessions and login with the new password', async ({ page, browser }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockData(page);
  await login(page);
  const other = await browser.newContext();
  try {
    await other.addCookies(await page.context().cookies());
    await page.getByRole('navigation', { name: 'Navigasi cepat HP' }).getByRole('button', { name: 'Akun', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Akun & Keamanan' })).toBeVisible();
    const current = page.getByLabel('Password saat ini', { exact: true });
    const fresh = page.getByLabel('Password baru', { exact: true });
    const confirm = page.getByLabel('Konfirmasi password baru', { exact: true });
    const save = page.getByRole('button', { name: 'Simpan password baru' });
    await current.fill('wrong-password'); await fresh.fill('short'); await confirm.fill('different');
    await expect(save).toBeDisabled();
    await expect(page.getByText('Konfirmasi password belum sama.', { exact: true })).toBeVisible();
    await fresh.fill(changedPassword); await confirm.fill(changedPassword);
    await page.getByRole('button', { name: 'Tampilkan password baru', exact: true }).click();
    await expect(fresh).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Sembunyikan password baru', exact: true }).click();
    await save.click();
    await expect(page.getByRole('alert')).toContainText('Password saat ini tidak sesuai');
    await expect(fresh).toHaveValue(changedPassword);
    await current.fill(password);
    await save.click();
    await expect(page.getByRole('status')).toContainText('Password berhasil diganti');
    await expect(fresh).toHaveValue('');
    await overflow(page); await touchTargets(page);
    await page.screenshot({ path: 'test-results/account-mobile.png', fullPage: true });
    expect((await other.request.get('http://127.0.0.1:4175/api/database')).status()).toBe(401);
    const oldLogin = await other.request.post('http://127.0.0.1:4175/api/auth', { data: { password } });
    expect(oldLogin.status()).toBe(401);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Ruang untuk ide besar Anda.' })).toBeVisible();
    await page.request.delete('/api/auth');
    await login(page, changedPassword);
  } finally {
    // Never mutate the user's real credential file. Restore the isolated test account.
    const loggedIn = await page.request.post('/api/auth', { data: { password: changedPassword } });
    if (loggedIn.ok()) {
      const restored = await page.request.patch('/api/auth', { data: { currentPassword: changedPassword, newPassword: password, confirmPassword: password } });
      expect(restored.status()).toBe(200);
    }
    await other.close();
  }
});

test('failed password persistence retains the form and does not claim success', async ({ page }) => {
  await mockData(page); await login(page);
  await page.getByRole('button', { name: 'Pengaturan akun' }).click();
  await page.getByLabel('Password saat ini', { exact: true }).fill(password);
  await page.getByLabel('Password baru', { exact: true }).fill(changedPassword);
  await page.getByLabel('Konfirmasi password baru', { exact: true }).fill(changedPassword);
  await page.route('**/api/auth', route => route.request().method() === 'PATCH' ? route.fulfill({ status: 503, json: { error: 'Penyimpanan password tidak tersedia.' } }) : route.continue());
  await page.getByRole('button', { name: 'Simpan password baru' }).click();
  await expect(page.getByRole('alert')).toContainText('Penyimpanan password tidak tersedia');
  await expect(page.getByLabel('Password baru', { exact: true })).toHaveValue(changedPassword);
  await expect(page.getByRole('button', { name: 'Simpan password baru' })).toBeEnabled();
});

for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 740 }, { width: 430, height: 932 }, { width: 844, height: 390 }]) {
  test(`phone navigation, long content and product dialogs at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await mockData(page); await login(page);
    const bottom = page.getByRole('navigation', { name: 'Navigasi cepat HP' });
    await expect(bottom).toBeVisible(); await overflow(page); await touchTargets(page);
    await bottom.getByRole('button', { name: 'Produk', exact: true }).click();
    await page.getByRole('button', { name: 'Tambah Produk', exact: false }).click();
    const dialog = page.getByRole('dialog', { name: 'Tambah produk' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Nama Produk', { exact: true }).fill('Produk dari HP');
    await dialog.getByLabel('Kategori Produk').fill('Dapur');
    await overflow(page); await touchTargets(page);
    await dialog.getByRole('button', { name: /Simpan ke Bank/ }).click();
    await expect(dialog).not.toBeVisible();
    await bottom.getByRole('button', { name: 'Riwayat', exact: true }).click();
    await page.getByRole('button', { name: /Storyboard dari HP/ }).click();
    await overflow(page); await touchTargets(page);
    await expect(page.getByRole('button', { name: 'Simpan Gambar' }).first()).toBeVisible();
    await bottom.getByRole('button', { name: 'Buat', exact: true }).click();
    await page.getByRole('button', { name: /Pilih dari Bank Produk/ }).click();
    const picker = page.getByRole('dialog', { name: 'Pilih produk storyboard' });
    await picker.getByText('Perlengkapan Dapur', { exact: true }).click();
    await overflow(page);
    await picker.getByText('Wajan Granit untuk Dapur Keluarga', { exact: true }).click();
    await expect(picker).not.toBeVisible();
    await page.getByRole('button', { name: 'Buka navigasi' }).click();
    await expect(page.getByRole('button', { name: 'Tutup navigasi' })).toBeVisible();
    await page.getByRole('button', { name: 'Akun & Keamanan', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Ganti password', exact: true })).toBeVisible();
    await overflow(page); await touchTargets(page);
    if (viewport.width === 320) await page.screenshot({ path: 'test-results/account-small-phone.png', fullPage: true });
    expect(errors).toEqual([]);
  });
}

test('shrinking visual viewport keeps product form usable above the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockData(page); await login(page);
  await page.getByRole('navigation', { name: 'Navigasi cepat HP' }).getByRole('button', { name: 'Produk', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah Produk', exact: false }).click();
  const dialog = page.getByRole('dialog', { name: 'Tambah produk' });
  const category = dialog.getByLabel('Kategori Produk');
  await category.fill('Dapur');
  // Native device keyboards are not available in Playwright. Simulate the visual
  // viewport resize event to verify our layout/scroll handler separately.
  await page.evaluate(() => {
    Object.defineProperty(window.visualViewport, 'height', { configurable: true, get: () => 490 });
    window.visualViewport.dispatchEvent(new Event('resize'));
  });
  await expect(page.locator('body')).toHaveClass(/keyboard-open/);
  await expect.poll(() => category.evaluate(el => { const rect = el.getBoundingClientRect(); return rect.top >= 0 && rect.bottom <= 490; })).toBe(true);
  await overflow(page);
  await page.evaluate(() => { delete window.visualViewport.height; window.visualViewport.dispatchEvent(new Event('resize')); });
  await dialog.getByRole('button', { name: 'Tutup form produk' }).click();
  await expect(page.getByRole('navigation', { name: 'Navigasi cepat HP' })).toBeVisible();
});

test('private credential storage is not served as a static file', async ({ request }) => {
  await mkdir('.private', { recursive: true });
  const path = '.private/http-test-fixture.txt';
  try {
    await writeFile(path, 'private-test-fixture-not-a-real-secret');
    const response = await request.get('/.private/http-test-fixture.txt');
    expect(response.status()).toBe(403);
    expect(await response.text()).not.toContain('private-test-fixture-not-a-real-secret');
  } finally { await rm(path, { force: true }); }
});
