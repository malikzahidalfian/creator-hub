import { test, expect } from '@playwright/test';

const product = { id: 'prod-1', type: 'Bank Storyboard', product_desc: 'Dapur', created_at: new Date().toISOString(), result: JSON.stringify({ name: 'Wajan Granit', desc: 'Wajan anti lengket untuk memasak', link: 'https://example.com/wajan' }) };
const content = { id: 'story-1', type: 'Bang Jenggot', product_desc: 'Review Wajan', created_at: new Date().toISOString(), result: JSON.stringify([{ angle: 'Review', blocks: ['Scene pertama yang lengkap', 'Scene kedua yang lengkap'] }]) };

async function mockData(page, records = [product, content]) {
  await page.route('**/api/database**', async route => {
    const type = new URL(route.request().url()).searchParams.get('type')?.slice(3);
    await route.fulfill({ json: records.filter(item => !type || item.type === type) });
  });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
}
async function openWorkspace(page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ruang untuk ide besar Anda.' })).toBeVisible();
}
async function navigate(page, name) {
  const toggle = page.getByRole('button', { name: 'Buka navigasi' });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
}

test('fresh visits open the dashboard without an auth request, password or cookie', async ({ page, request }) => {
  await mockData(page);
  const authRequests = [];
  await page.route('**/api/auth', route => { authRequests.push(route.request().method()); return route.fulfill({ status: 503, json: { error: 'Session secret is missing' } }); });
  await openWorkspace(page);
  await expect(page.getByLabel('Password workspace', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Keluar workspace' })).toHaveCount(0);
  expect(authRequests).toEqual([]);
  expect((await page.context().cookies()).filter(cookie => cookie.name === 'creator_session')).toEqual([]);
  const response = await request.get('/api/auth');
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ authenticated: true, configured: true, access: 'public' });
});

test('dashboard uses real counts and old Bang Jenggot records render as readable scenes', async ({ page }) => {
  await mockData(page);
  await openWorkspace(page);
  await expect(page.getByRole('button', { name: /Konten tersimpan/ }).locator('strong')).toHaveText('1');
  await expect(page.getByRole('button', { name: /Produk di workspace/ }).locator('strong')).toHaveText('1');
  await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true });
  await page.getByRole('button', { name: /Review Wajan/ }).click();
  await expect(page.getByText('Scene pertama yang lengkap', { exact: false })).toBeVisible();
  await expect(page.getByText('Scene kedua yang lengkap', { exact: false })).toBeVisible();
  await expect(page.getByText('Bagian 2', { exact: true })).toBeVisible();
});

test('failed product saves retain draft; successful save closes modal; editing preserves ID', async ({ page }) => {
  await mockData(page);
  let succeed = false;
  let saved;
  await page.route('**/api/database', async route => {
    if (route.request().method() === 'POST') {
      saved = route.request().postDataJSON();
      return route.fulfill({ status: succeed ? 201 : 500, json: succeed ? [{ ...saved, id: 'prod-new' }] : { error: 'Database sedang tidak tersedia' } });
    }
    await route.fallback();
  });
  await openWorkspace(page);
  await page.getByRole('button', { name: /Tambah produk Lengkapi/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Tambah produk' });
  await dialog.getByLabel('Nama Produk', { exact: true }).fill('Produk percobaan');
  await dialog.getByLabel('Kategori Produk').fill('Dapur');
  await dialog.getByRole('button', { name: /Simpan ke Bank/ }).click();
  await expect(page.getByRole('status')).toContainText('Database sedang tidak tersedia');
  await expect(dialog.getByLabel('Nama Produk', { exact: true })).toHaveValue('Produk percobaan');
  succeed = true;
  await dialog.getByRole('button', { name: /Simpan ke Bank/ }).click();
  await expect(dialog).not.toBeVisible();
  expect(JSON.parse(saved.result).name).toBe('Produk percobaan');
  await page.getByRole('button', { name: /Edit/ }).first().click();
  const edit = page.getByRole('dialog', { name: 'Edit produk' });
  await expect(edit.getByLabel('Nama Produk', { exact: true })).toHaveValue('Wajan Granit');
  let id;
  await page.route('**/api/database?id=*', route => {
    id = new URL(route.request().url()).searchParams.get('id');
    return route.fulfill({ json: [] });
  });
  await edit.getByRole('button', { name: /Simpan Perubahan/ }).click();
  await expect(edit).not.toBeVisible();
  expect(id).toBe('eq.prod-1');
});

test('product data is available in affiliate picker and generation/copy handle errors', async ({ page }) => {
  await mockData(page);
  await page.addInitScript(() => localStorage.setItem('storyboard_api_key', 'test-key'));
  await page.route('**/api/generate', route => route.fulfill({ json: { choices: [{ message: { content: 'Hook pertama\n\n---\n\nTweet kedua' } }] } }));
  await openWorkspace(page);
  await navigate(page, 'Threads Affiliate');
  await page.locator('select').first().selectOption('prod-1');
  await expect(page.getByPlaceholder('Contoh: Sepatu Lari Lokal Kualitas Dunia')).toHaveValue('Wajan Granit');
  await page.getByRole('button', { name: /Generate Utas Affiliate/ }).click();
  await expect(page.getByText('Hook pertama', { exact: true })).toBeVisible();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Denied')) } }));
  await page.getByRole('button', { name: '📋 Copy', exact: true }).first().click();
  await expect(page.getByRole('status')).toContainText('Teks gagal disalin');
});

const articleStyleCases = [
  { width: 390, style: 'santai', label: 'Santai (Gue-Elu, Gaul)', tone: 'penasaran', toneLabel: 'Misterius/Penasaran', direction: 'Gunakan gue/lo' },
  { width: 1440, style: 'formal', label: 'Formal (Baku, Profesional)', tone: 'inspiratif', toneLabel: 'Inspiratif & Motivasi', direction: 'bahasa Indonesia baku dengan verba aktif' },
  { width: 390, style: 'humoris', label: 'Humoris (Banyak Candaan)', tone: 'lucu', toneLabel: 'Santai & Lucu', direction: 'Bangun setup singkat lalu punchline' },
  { width: 1440, style: 'nyinyir', label: 'Nyinyir (Julid, Pedas)', tone: 'debat', toneLabel: 'Kontroversial (Bikin Debat)', direction: 'Benturkan janji dengan pelaksanaan', withAffiliate: true },
  { width: 1440, style: 'storytelling', label: 'Storytelling Emosional', tone: 'emosional', toneLabel: 'Sangat Emosional/Baper', direction: 'Pencerita yang hangat dan dekat dengan manusia' }
];

for (const { width, style, label, tone, toneLabel, direction, withAffiliate = false } of articleStyleCases) {
  test(`article threads read the source and send the ${style} writing profile at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await mockData(page);
    await page.addInitScript(() => localStorage.setItem('storyboard_api_key', 'test-key'));
    const source = 'https://example.com/article';
    const article = 'Dinas Perhubungan akan menguji bus malam di dua rute mulai Oktober. Uji coba berlangsung tiga bulan dan menyasar pekerja yang pulang setelah pukul 22.00. Tarif belum diputuskan.';
    const blocks = [
      'Pulang kerja lewat pukul 22.00? Dua rute bus akan menguji layanan malam mulai Oktober.',
      'Uji coba direncanakan berlangsung tiga bulan untuk menjangkau pekerja malam.',
      `Tarifnya belum diputuskan. Sumber: ${source}`,
      ...(withAffiliate ? ['Wajan Granit untuk memasak. https://example.com/wajan'] : [])
    ];
    let extractionRoute;
    const generations = [];
    await page.route('**/api/scrape-article', route => { extractionRoute = route; });
    await page.route('**/api/generate', route => {
      generations.push(route.request().postDataJSON());
      return route.fulfill({ json: { choices: [{ message: { content: blocks.join('\n---\n') } }] } });
    });
    await openWorkspace(page);
    await navigate(page, 'Threads Artikel');
    const styleSelect = page.getByLabel('Gaya Bahasa (Diksi)', { exact: true });
    const toneSelect = page.getByLabel('Tema Emosi (Tone)', { exact: true });
    await expect(styleSelect).toHaveValue('santai');
    await expect(toneSelect).toHaveValue('penasaran');
    await expect(styleSelect.locator('option')).toHaveCount(5);
    await expect(toneSelect.locator('option')).toHaveCount(5);
    await styleSelect.selectOption(style);
    await toneSelect.selectOption(tone);
    await page.getByPlaceholder('Masukkan URL berita', { exact: false }).fill(source);
    await page.getByRole('spinbutton').fill('3');
    if (withAffiliate) {
      await page.getByPlaceholder('Contoh: Fokus pada dampaknya', { exact: false }).fill('Fokus pada pekerja malam.');
      await page.getByRole('button', { name: /Pilih Produk Affiliate/ }).click();
      await page.getByRole('button', { name: /Wajan Granit/ }).click();
    }
    await page.getByRole('button', { name: /Generate Utas Berita/ }).click();
    await expect.poll(() => Boolean(extractionRoute)).toBe(true);
    expect(extractionRoute.request().postDataJSON()).toEqual({ url: source });
    await expect(page.getByRole('button', { name: /Membaca Artikel/ })).toBeDisabled();
    expect(generations).toHaveLength(0);
    await extractionRoute.fulfill({ json: { content: article } });
    await expect(page.locator('.prompt-card')).toHaveCount(blocks.length);
    await expect(page.getByRole('heading', { name: 'Hook (Tweet 1)' })).toBeVisible();
    await expect(page.locator('.prompt-content')).toHaveText(blocks);
    expect(generations).toHaveLength(1);
    const system = generations[0].messages.find(message => message.role === 'system').content;
    const user = generations[0].messages.find(message => message.role === 'user').content;
    expect(user).toContain(article);
    expect(user).toContain(source);
    expect(system).toContain(`GAYA BAHASA PILIHAN: ${label}`);
    expect(system).toContain(`TEMA EMOSI PILIHAN: ${toneLabel}`);
    expect(system).toContain(direction);
    for (const other of articleStyleCases.filter(item => item.style !== style)) {
      expect(system).not.toContain(other.direction);
    }
    expect(system).toContain('HOOK PEMBUKA ADALAH PRIORITAS');
    expect(system).toContain('Jangan mengarang angka, kutipan');
    expect(system).toContain('Buat tepat 3 tweet berita');
    expect(system).toContain(`Cantumkan link sumber di akhir tweet berita terakhir: ${source}`);
    if (withAffiliate) {
      expect(system).toContain('total 4 tweet');
      expect(system).toContain('Nama Produk: Wajan Granit');
      expect(system).toContain('https://example.com/wajan');
      expect(user).toContain('Fokus pada pekerja malam.');
    } else {
      expect(system).toContain('Tidak ada unsur jualan sama sekali.');
      expect(user).not.toContain('INSTRUKSI KHUSUS DARI USER');
    }
  });
}

test('failed article extraction stops generation instead of inventing news', async ({ page }) => {
  await mockData(page);
  await page.addInitScript(() => localStorage.setItem('storyboard_api_key', 'test-key'));
  let generated = false;
  await page.route('**/api/scrape-article', route => route.fulfill({ status: 422, json: { error: 'Artikel tidak tersedia' } }));
  await page.route('**/api/generate', route => { generated = true; return route.fulfill({ json: {} }); });
  await openWorkspace(page);
  await navigate(page, 'Threads Artikel');
  await page.getByPlaceholder('Masukkan URL berita', { exact: false }).fill('https://example.com/article');
  await page.getByRole('button', { name: /Generate Utas Berita/ }).click();
  await expect(page.getByRole('status')).toContainText('agar tidak mengarang');
  expect(generated).toBe(false);
});

for (const width of [390, 768, 1440]) {
  test(`all menu pages work without runtime errors or horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await mockData(page, [product, { ...product, id: 'bad', result: 'null' }]);
    await page.addInitScript(() => localStorage.setItem('gemini_api_keys', '{"broken":true}'));
    await openWorkspace(page);
    for (const name of ['Bang Jenggot AI', 'Storyboard Veo', 'Konten Masak', 'UGC Studio', 'Threads Affiliate', 'Threads Artikel', 'Script Video', 'AI Image', 'Bank Gambar', 'Text to Speech', 'TikTok Scraper', 'Data Produk']) {
      await navigate(page, name);
      await expect(page.locator('.content-panel')).toBeVisible();
      const overflow = await page.evaluate(() => { const main = document.querySelector('main'); return main.scrollWidth > main.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth; });
      expect(overflow, name).toBe(false);
    }
    const toggle = page.getByRole('button', { name: 'Buka navigasi' });
    if (await toggle.isVisible()) await toggle.click();
    await page.getByRole('button', { name: 'Pengaturan API', exact: true }).click();
    await expect(page.getByLabel('Gemini API Key utama')).toBeVisible();
    await page.getByLabel('1inference API Key', { exact: true }).fill('test-key');
    expect(await page.evaluate(() => localStorage.getItem('storyboard_api_key'))).toBe('test-key');
    expect(errors).toEqual([]);
    await navigate(page, 'Dashboard');
    if (width === 390) {
      await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true });
      await toggle.click();
      await page.screenshot({ path: 'test-results/navigation-mobile.png', fullPage: true, animations: 'disabled' });
      await page.keyboard.press('Escape');
      await expect(toggle).toBeFocused();
    }
  });
}

test('UGC generate and copy works; saved-image storyboard analysis is enabled', async ({ page }) => {
  const withImage = { ...product, result: JSON.stringify({ ...JSON.parse(product.result), imgUrl: 'https://example.com/product.png' }) };
  await mockData(page, [withImage]);
  await page.addInitScript(() => localStorage.setItem('storyboard_api_key', 'test-key'));
  await page.route('https://example.com/product.png', route => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64') }));
  await page.route('**/api/generate', route => route.fulfill({ json: { choices: [{ message: { content: 'Hook produk. Isi konten. CTA belanja.' } }] } }));
  await openWorkspace(page);
  await navigate(page, 'UGC Studio');
  await page.locator('select').first().selectOption('prod-1');
  await page.getByRole('button', { name: /Generate/ }).click();
  await expect(page.getByRole('button', { name: /Copy Semua/ })).toBeVisible();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.resolve() } }));
  await page.getByRole('button', { name: /Copy Semua/ }).click();
  await expect(page.getByRole('button', { name: /Tersalin!/ })).toBeVisible();
  await navigate(page, 'Storyboard Veo');
  await page.locator('select').first().selectOption('prod-1');
  await expect(page.getByRole('button', { name: '🔍 Temukan Poin Selling', exact: true })).toBeEnabled();
  await page.screenshot({ path: 'test-results/storyboard-desktop.png', fullPage: true });
});

test('reload with a stale session cookie still opens the dashboard directly', async ({ page }) => {
  await mockData(page);
  await page.context().addCookies([{ name: 'creator_session', value: 'expired.invalid.cookie', url: 'http://127.0.0.1:4175' }]);
  await openWorkspace(page);
  await page.getByRole('banner').getByRole('button', { name: 'Buka pengaturan API' }).click();
  await expect(page.getByLabel('Gemini API Key utama')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Simpan password baru' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ruang untuk ide besar Anda.' })).toBeVisible();
  await expect(page.getByLabel('Password workspace', { exact: true })).toHaveCount(0);
});
