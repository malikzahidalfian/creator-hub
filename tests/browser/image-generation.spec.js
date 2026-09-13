import { test, expect } from '@playwright/test';

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=';
const brief = 'Foto seekor kucing memakai kacamata hitam di pantai, cahaya sore lembut. Teks persis: "Libur dulu".';

async function openImage(page, { width = 1440, key = true } = {}) {
  await page.setViewportSize({ width, height: 950 });
  await page.route('**/api/database**', route => route.fulfill({ json: [] }));
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  if (key) await page.addInitScript(() => localStorage.setItem('storyboard_api_key', 'test-key'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ruang untuk ide besar Anda.' })).toBeVisible();
  const toggle = page.getByRole('button', { name: 'Buka navigasi' });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByRole('navigation').getByRole('button', { name: 'AI Image', exact: true }).click();
}

for (const width of [390, 1440]) {
  test(`AI Image builds a GPT-5.5 brief before requesting and displaying a GPT image at ${width}px`, async ({ page }) => {
    let concept;
    let render;
    await page.route('**/api/generate', route => { concept = route; });
    await page.route('**/api/generate-image', route => { render = route; });
    await openImage(page, { width });
    await expect(page.getByLabel('Pilih Mesin AI (Model)')).toHaveValue('gpt-5.5-image');
    const prompt = 'Kucing berkacamata hitam di pantai, tulisan "Libur dulu".';
    await page.getByLabel('Deskripsi Gambar (Prompt)').fill(prompt);
    await page.getByRole('button', { name: /Generate Gambar/ }).click();
    await expect(page.getByRole('button', { name: /GPT-5.5 menyusun konsep/ })).toBeDisabled();
    await expect.poll(() => Boolean(concept)).toBe(true);
    expect(render).toBeUndefined();
    const body = concept.request().postDataJSON();
    expect(body.model).toBe('gpt-5.5');
    expect(body.max_completion_tokens).toBe(2048);
    expect(body.messages.find(item => item.role === 'user').content).toBe(prompt);
    expect(concept.request().headers().authorization).toBe('Bearer test-key');
    await concept.fulfill({ json: { choices: [{ message: { content: brief } }] } });
    await expect.poll(() => Boolean(render)).toBe(true);
    expect(render.request().postDataJSON()).toEqual({ model: 'venice-gpt-image-1.5', prompt: brief });
    await expect(page.getByRole('button', { name: /Melukis gambar/ })).toBeDisabled();
    await expect(page.getByLabel('Pilih Mesin AI (Model)')).toBeDisabled();
    await render.fulfill({ json: { data: [{ b64_json: png }] } });
    const image = page.getByRole('img', { name: 'Hasil AI' });
    await expect(image).toHaveAttribute('src', `data:image/png;base64,${png}`);
    await expect.poll(() => image.evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
    await expect(page.getByRole('link', { name: /Download Gambar/ })).toHaveAttribute('href', `data:image/png;base64,${png}`);
    await expect(page.getByRole('button', { name: /Generate Gambar/ })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.screenshot({ path: `test-results/ai-image-${width}.png`, fullPage: true });
  });
}

test('concept failures preserve the description and stop image generation; direct image selection skips the concept', async ({ page }) => {
  let concepts = 0;
  const images = [];
  await page.route('**/api/generate', route => { concepts++; return route.fulfill({ status: 403, json: { error: 'Akses GPT-5.5 belum tersedia.' } }); });
  await page.route('**/api/generate-image', route => {
    images.push(route.request().postDataJSON());
    return route.fulfill({ json: { data: [{ url: 'https://example.com/result.png' }] } });
  });
  await page.route('https://example.com/result.png', route => route.fulfill({ contentType: 'image/png', body: Buffer.from(png, 'base64') }));
  await openImage(page);
  await page.getByLabel('Deskripsi Gambar (Prompt)').fill('Foto kucing di pantai.');
  await page.getByRole('button', { name: /Generate Gambar/ }).click();
  await expect(page.getByRole('status')).toContainText('Akses GPT-5.5 belum tersedia');
  expect(images).toEqual([]);
  await expect(page.getByLabel('Deskripsi Gambar (Prompt)')).toHaveValue('Foto kucing di pantai.');
  await page.getByLabel('Pilih Mesin AI (Model)').selectOption('venice-gpt-image-1.5');
  await page.getByRole('button', { name: /Generate Gambar/ }).click();
  await expect(page.getByRole('img', { name: 'Hasil AI' })).toHaveAttribute('src', 'https://example.com/result.png');
  expect(concepts).toBe(1);
  expect(images).toEqual([{ model: 'venice-gpt-image-1.5', prompt: 'Foto kucing di pantai.' }]);
});

test('image errors and empty results allow retry without changing the selected model', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/generate-image', route => {
    attempts++;
    if (attempts === 1) return route.fulfill({ status: 403, json: { error: 'Saldo gambar tidak cukup.' } });
    if (attempts === 2) return route.fulfill({ json: { data: [] } });
    return route.fulfill({ json: { data: [{ b64_json: png }] } });
  });
  await openImage(page);
  await page.getByLabel('Pilih Mesin AI (Model)').selectOption('venice-gpt-image-1.5');
  await page.getByLabel('Deskripsi Gambar (Prompt)').fill('Foto kucing.');
  await page.getByRole('button', { name: /Generate Gambar/ }).click();
  await expect(page.getByRole('status')).toContainText('Saldo gambar tidak cukup');
  await page.getByRole('button', { name: /Generate Gambar/ }).click();
  await expect(page.getByRole('status')).toContainText('Layanan belum mengembalikan gambar');
  await expect(page.getByRole('img', { name: 'Hasil AI' })).toHaveCount(0);
  await page.getByRole('button', { name: /Generate Gambar/ }).click();
  await expect(page.getByRole('img', { name: 'Hasil AI' })).toBeVisible();
  await expect(page.getByLabel('Pilih Mesin AI (Model)')).toHaveValue('venice-gpt-image-1.5');
  expect(attempts).toBe(3);
});

test('paid image generation requires a key while free models remain selectable', async ({ page }) => {
  await openImage(page, { key: false });
  await page.getByLabel('Deskripsi Gambar (Prompt)').fill('Foto kucing.');
  await expect(page.getByRole('button', { name: /Generate Gambar/ })).toBeDisabled();
  await expect(page.getByText('Isi API Key 1inference di Pengaturan API untuk memakai model ini.')).toBeVisible();
  await page.getByLabel('Pilih Mesin AI (Model)').selectOption('turbo-free');
  await expect(page.getByRole('button', { name: /Generate Gambar/ })).toBeEnabled();
});

test('retrying a payment failure reuses the successful concept and editing the prompt invalidates it', async ({ page }) => {
  let concepts = 0;
  let renders = 0;
  await page.route('**/api/generate', route => {
    concepts++;
    return route.fulfill({ json: { choices: [{ message: { content: brief } }] } });
  });
  await page.route('**/api/generate-image', route => {
    renders++;
    return route.fulfill({ status: 402, json: { error: '1inference menolak permintaan. Jika saldo masih ada, periksa batas API key.', code: 'payment_required', model: 'venice-gpt-image-1.5', providerMessage: 'Payment Required', requestId: 'image-402' } });
  });
  await openImage(page, { width: 390 });
  await page.getByLabel('Deskripsi Gambar (Prompt)').fill('Foto kucing.');
  await page.getByRole('button', { name: /Generate Gambar/ }).click();
  const error = page.getByRole('alert');
  await expect(error).toContainText('Tahap: pembuatan gambar');
  await error.getByText('Detail error', { exact: true }).click();
  await expect(error).toContainText('image-402');
  await expect(error.getByRole('link', { name: /Periksa API key/ })).toHaveAttribute('href', 'https://1inference.com/dashboard/api-keys');
  await page.getByRole('button', { name: /Generate Gambar/ }).click();
  await expect(error).toBeVisible();
  expect(concepts).toBe(1);
  expect(renders).toBe(2);
  await page.getByLabel('Deskripsi Gambar (Prompt)').fill('Foto anjing.');
  await page.getByRole('button', { name: /Generate Gambar/ }).click();
  await expect(error).toBeVisible();
  expect(concepts).toBe(2);
  expect(renders).toBe(3);
});
