import { test, expect } from '@playwright/test';
import { mkdir, rm, writeFile } from 'node:fs/promises';

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
async function openWorkspace(page) {
  await page.goto('/');
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

test('phone opens directly and API settings remain reachable from bottom navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockData(page);
  await openWorkspace(page);
  await page.getByRole('navigation', { name: 'Navigasi cepat HP' }).getByRole('button', { name: 'API', exact: true }).click();
  await expect(page.getByLabel('Gemini API Key utama')).toBeVisible();
  await expect(page.getByLabel('Password workspace', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Keluar workspace' })).toHaveCount(0);
  await page.getByLabel('1inference API Key', { exact: true }).fill('phone-test-key');
  await overflow(page); await touchTargets(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ruang untuk ide besar Anda.' })).toBeVisible();
  await page.getByRole('banner').getByRole('button', { name: 'Buka pengaturan API' }).click();
  await expect(page.getByLabel('1inference API Key', { exact: true })).toHaveValue('phone-test-key');
});

for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 740 }, { width: 430, height: 932 }, { width: 844, height: 390 }]) {
  test(`phone navigation, long content and product dialogs at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await mockData(page); await openWorkspace(page);
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
    await page.getByRole('button', { name: 'Pengaturan API', exact: true }).click();
    await expect(page.getByLabel('Gemini API Key utama')).toBeVisible();
    await overflow(page); await touchTargets(page);
    if (viewport.width === 320) await page.screenshot({ path: 'test-results/settings-small-phone.png', fullPage: true });
    expect(errors).toEqual([]);
  });
}

test('shrinking visual viewport keeps product form usable above the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockData(page); await openWorkspace(page);
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
