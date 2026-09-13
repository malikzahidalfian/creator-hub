import { test, expect } from '@playwright/test';

const firstSource = 'https://example.com/news-one';
const secondSource = 'https://example.com/news-two';
const firstArticle = 'Dinas Perhubungan akan menguji bus malam di dua rute mulai Oktober. Uji coba berlangsung tiga bulan untuk pekerja shift malam. Tarif belum diputuskan.';
const secondArticle = 'Perpustakaan kota membuka kelas membaca gratis setiap Sabtu. Program ini mengajak orang tua mendampingi anak belajar membaca bersama relawan.';
const recommendation = { styleId: 'nyinyir', reason: 'Uji coba bus malam sudah diumumkan, tetapi tarif bagi pekerja belum diputuskan. Kontras ini cocok untuk kritik yang tajam.' };
const reply = (route, text) => route.fulfill({ json: { choices: [{ message: { content: text } }] } });

async function openArticle(page) {
  await page.route('**/api/database**', route => route.fulfill({ json: [] }));
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.addInitScript(() => localStorage.setItem('storyboard_api_key', 'test-key'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ruang untuk ide besar Anda.' })).toBeVisible();
  const toggle = page.getByRole('button', { name: 'Buka navigasi' });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByRole('navigation').getByRole('button', { name: 'Threads Artikel', exact: true }).click();
}

for (const width of [390, 1440]) {
  test(`article recommendations preserve manual choices and reuse the analyzed source at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    let extractionRoute;
    let reads = 0;
    const requests = [];
    await page.route('**/api/scrape-article', route => { reads++; extractionRoute = route; });
    await page.route('**/api/generate', route => {
      requests.push(route.request().postDataJSON());
      return reply(route, requests.length === 1 ? JSON.stringify(recommendation) : `Hook berita.\n---\nIsi berita.\n---\nSumber: ${firstSource}`);
    });
    await openArticle(page);
    const url = page.getByPlaceholder('Masukkan URL berita', { exact: false });
    const recommend = page.getByRole('button', { name: /Rekomendasikan Gaya/ });
    const style = page.getByLabel('Gaya Bahasa (Diksi)', { exact: true });
    const tone = page.getByLabel('Tema Emosi (Tone)', { exact: true });
    const card = page.getByRole('region', { name: 'Rekomendasi gaya bahasa' });
    await expect(recommend).toBeDisabled();
    await url.fill('bukan-link');
    await expect(recommend).toBeDisabled();
    await url.fill(firstSource);
    await style.selectOption('humoris');
    await tone.selectOption('lucu');
    await recommend.click();
    await expect.poll(() => Boolean(extractionRoute)).toBe(true);
    expect(requests).toHaveLength(0);
    await expect(page.getByRole('button', { name: 'Membaca artikel...', exact: true })).toBeDisabled();
    await extractionRoute.fulfill({ json: { content: firstArticle } });
    await expect(card).toContainText(recommendation.reason);
    await expect(card.getByRole('heading')).toHaveText('Nyinyir (Julid, Pedas)');
    expect(requests[0].model).toBe('gpt-5.5');
    expect(requests[0].reasoning_effort).toBe('none');
    expect(requests[0].max_completion_tokens).toBe(400);
    expect(requests[0]).not.toHaveProperty('max_tokens');
    expect(requests[0]).not.toHaveProperty('temperature');
    expect(requests[0].messages.find(message => message.role === 'user').content).toContain(firstArticle);
    expect(requests[0].messages.find(message => message.role === 'user').content).toContain(firstSource);
    for (const id of ['santai', 'formal', 'humoris', 'nyinyir', 'storytelling']) {
      expect(requests[0].messages[0].content).toContain(`- ${id}:`);
    }
    await expect(style).toHaveValue('humoris');
    await expect(tone).toHaveValue('lucu');
    await card.getByRole('button', { name: 'Pakai gaya ini' }).click();
    await expect(style).toHaveValue('nyinyir');
    await expect(tone).toHaveValue('lucu');
    await expect(card.getByRole('button', { name: 'Gaya ini dipakai' })).toBeDisabled();
    await style.selectOption('formal');
    await card.getByRole('button', { name: 'Pakai gaya ini' }).click();
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/article-recommendation-${width}.png`, animations: 'disabled' });
    await page.getByRole('spinbutton').fill('3');
    await page.getByRole('button', { name: /Generate Utas Berita/ }).click();
    await expect(page.locator('.prompt-card')).toHaveCount(3);
    expect(reads).toBe(1);
    expect(requests).toHaveLength(2);
    expect(requests[1].model).toBe('gpt-5.5');
    expect(requests[1].max_completion_tokens).toBe(4096);
    expect(requests[1].reasoning_effort).toBe('low');
    expect(requests[1].messages[0].content).toContain('GAYA BAHASA PILIHAN: Nyinyir (Julid, Pedas)');
    expect(requests[1].messages[1].content).toContain(firstArticle);

    await url.fill(secondSource);
    await expect(card).toHaveCount(0);
    await page.getByRole('button', { name: /Generate Utas Berita/ }).click();
    await expect.poll(() => reads).toBe(2);
    expect(extractionRoute.request().postDataJSON()).toEqual({ url: secondSource });
    await extractionRoute.fulfill({ json: { content: secondArticle } });
    await expect(page.locator('.prompt-card')).toHaveCount(3);
    expect(requests[2].messages[1].content).toContain(secondArticle);
    expect(requests[2].messages[1].content).not.toContain(firstArticle);
  });
}

test('article payment failures show provider details and preserve the URL and style', async ({ page }) => {
  const requests = [];
  await page.route('**/api/scrape-article', route => route.fulfill({ json: { content: firstArticle } }));
  await page.route('**/api/generate', route => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ status: 402, json: { error: '1inference menolak pembayaran. Jika saldo masih ada, periksa API key.', code: 'payment_required', model: 'gpt-5.5', providerMessage: 'Payment Required', requestId: 'article-402' } });
  });
  await openArticle(page);
  await page.getByPlaceholder('Masukkan URL berita', { exact: false }).fill(firstSource);
  await page.getByLabel('Gaya Bahasa (Diksi)', { exact: true }).selectOption('humoris');
  await page.getByRole('button', { name: /Generate Utas Berita/ }).click();
  const error = page.getByRole('alert');
  await expect(error).toContainText('Permintaan ditolak provider (402)');
  await error.getByText('Detail error', { exact: true }).click();
  await expect(error).toContainText('article-402');
  await expect(error).toContainText('gpt-5.5');
  await expect(page.getByPlaceholder('Masukkan URL berita', { exact: false })).toHaveValue(firstSource);
  await expect(page.getByLabel('Gaya Bahasa (Diksi)', { exact: true })).toHaveValue('humoris');
  expect(requests).toHaveLength(1);
  expect(requests[0].max_completion_tokens).toBe(4096);
  await expect(page.getByRole('button', { name: /Generate Utas Berita/ })).toBeEnabled();
});

test('a late recommendation for an old URL cannot replace the new article recommendation', async ({ page }) => {
  let oldRequest;
  let newRequest;
  await page.route('**/api/scrape-article', route => route.fulfill({ json: { content: route.request().postDataJSON().url === firstSource ? firstArticle : secondArticle } }));
  await page.route('**/api/generate', route => {
    if (route.request().postDataJSON().messages[1].content.includes(firstSource)) oldRequest = route;
    else newRequest = route;
  });
  await openArticle(page);
  const url = page.getByPlaceholder('Masukkan URL berita', { exact: false });
  const recommend = page.getByRole('button', { name: /Rekomendasikan Gaya/ });
  const card = page.getByRole('region', { name: 'Rekomendasi gaya bahasa' });
  await url.fill(firstSource);
  await recommend.click();
  await expect.poll(() => Boolean(oldRequest)).toBe(true);
  await url.fill(secondSource);
  await recommend.click();
  await expect.poll(() => Boolean(newRequest)).toBe(true);
  const next = { styleId: 'storytelling', reason: 'Kelas membaca memperlihatkan keterlibatan orang tua dan relawan dalam mendampingi anak.' };
  await reply(newRequest, JSON.stringify(next));
  await expect(card).toContainText(next.reason);
  await reply(oldRequest, JSON.stringify(recommendation)).catch(() => {}); // The browser has already aborted this request.
  await expect(card.getByRole('heading')).toHaveText('Storytelling Emosional');
  await expect(card).not.toContainText(recommendation.reason);
  await expect(page.getByLabel('Gaya Bahasa (Diksi)', { exact: true })).toHaveValue('santai');
});

for (const failure of ['unreadable article', 'invalid AI response']) {
  test(`article recommendation can retry after ${failure} without changing the selected style`, async ({ page }) => {
    let failing = true;
    let aiCalls = 0;
    await page.route('**/api/scrape-article', route => failing && failure === 'unreadable article'
      ? route.fulfill({ status: 422, json: { error: 'Artikel tidak tersedia' } })
      : route.fulfill({ json: { content: firstArticle } }));
    await page.route('**/api/generate', route => {
      aiCalls++;
      return reply(route, JSON.stringify(failing ? { styleId: 'unknown', reason: 'Tidak valid.' } : recommendation));
    });
    await openArticle(page);
    await page.getByPlaceholder('Masukkan URL berita', { exact: false }).fill(firstSource);
    await page.getByLabel('Gaya Bahasa (Diksi)', { exact: true }).selectOption('formal');
    const recommend = page.getByRole('button', { name: /Rekomendasikan Gaya/ });
    await recommend.click();
    await expect(page.getByRole('alert')).toContainText(failure === 'unreadable article' ? 'Artikel tidak dapat dibaca' : 'Rekomendasi AI belum valid');
    expect(aiCalls).toBe(failure === 'unreadable article' ? 0 : 1);
    await expect(page.getByLabel('Gaya Bahasa (Diksi)', { exact: true })).toHaveValue('formal');
    await expect(page.getByRole('region', { name: 'Rekomendasi gaya bahasa' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Generate Utas Berita/ })).toBeEnabled();
    failing = false;
    await recommend.click();
    await expect(page.getByRole('region', { name: 'Rekomendasi gaya bahasa' })).toContainText(recommendation.reason);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByLabel('Gaya Bahasa (Diksi)', { exact: true })).toHaveValue('formal');
  });
}
