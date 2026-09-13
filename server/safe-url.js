import { lookup } from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import ipaddr from 'ipaddr.js';

export function parsePublicUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('URL tidak valid. Gunakan URL http atau https lengkap.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || (url.port && !['80', '443'].includes(url.port))) {
    throw new Error('Hanya URL http/https publik tanpa kredensial dan port khusus yang diizinkan.');
  }
  const host = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || !host.includes('.') && !host.includes(':')) {
    throw new Error('Alamat lokal tidak diizinkan.');
  }
  if (ipaddr.isValid(host) && !isPublicAddress(host)) throw new Error('Alamat jaringan privat tidak diizinkan.');
  return url;
}

export function isPublicAddress(address) {
  try { return ipaddr.process(address).range() === 'unicast'; } catch { return false; }
}

export function isSite(host, domain) {
  const normalized = host.toLowerCase().replace(/\.$/, '');
  return normalized === domain || normalized.endsWith(`.${domain}`);
}

// Resolve, validate, and pin the connection to that address (including every redirect).
// Native request avoids a second DNS lookup / DNS-rebinding vulnerability.
export async function fetchPublicText(value, { resolve = lookup, maxBytes = 2_000_000, deadline = Date.now() + 20_000, redirects = 0 } = {}) {
  const url = parsePublicUrl(value);
  if (redirects > 4) throw new Error('Terlalu banyak pengalihan URL.');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new Error('Waktu pengambilan artikel habis.');
  let timer;
  const addresses = await Promise.race([
    resolve(host, { all: true }),
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('DNS tidak merespons.')), remaining); })
  ]).finally(() => clearTimeout(timer));
  if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) throw new Error('Alamat jaringan privat tidak diizinkan.');
  const address = addresses[0];
  return new Promise((resolveResult, reject) => {
    const transport = url.protocol === 'https:' ? https : http;
    const request = transport.get(url, {
      headers: { 'User-Agent': 'CreatorHub/1.0', Accept: 'text/html, text/plain' },
      lookup: (_hostname, options, callback) => options.all ? callback(null, [address]) : callback(null, address.address, address.family)
    }, response => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        const location = response.headers.location;
        response.destroy();
        if (!location) return reject(new Error('Pengalihan URL tidak valid.'));
        let target;
        try { target = new URL(location, url).href; } catch { return reject(new Error('Pengalihan URL tidak valid.')); }
        resolveResult(fetchPublicText(target, { resolve, maxBytes, deadline, redirects: redirects + 1 }));
        return;
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.destroy();
        return reject(new Error(`Sumber artikel menolak permintaan (${response.statusCode}).`));
      }
      if (!/^(text\/html|text\/plain|application\/xhtml\+xml)/i.test(response.headers['content-type'] || '')) {
        response.destroy();
        return reject(new Error('URL bukan halaman artikel atau teks.'));
      }
      const chunks = [];
      let length = 0;
      response.on('data', chunk => {
        length += chunk.length;
        if (length > maxBytes) response.destroy(new Error('Halaman terlalu besar (maksimal 2 MB).'));
        else chunks.push(chunk);
      });
      response.on('end', () => resolveResult(Buffer.concat(chunks).toString('utf8')));
      response.on('error', reject);
    });
    const timeout = setTimeout(() => request.destroy(new Error('Waktu pengambilan artikel habis.')), Math.max(1, deadline - Date.now()));
    request.on('close', () => clearTimeout(timeout));
    request.on('error', reject);
  });
}

export function htmlToText(html) {
  return html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(nbsp|amp|quot|apos|lt|gt);/g, (_, entity) => ({ nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' })[entity])
    .replace(/\s+/g, ' ').trim().slice(0, 25000);
}
