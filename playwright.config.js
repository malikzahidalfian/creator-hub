import { defineConfig, devices } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const authDirectory = process.env.CREATOR_E2E_AUTH_DIR ||= mkdtempSync(join(tmpdir(), 'creator-e2e-'));

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  globalTeardown: './tests/browser/teardown.js',
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'android', testMatch: '**/mobile-security.spec.js', use: { ...devices['Pixel 7'] } },
    { name: 'iphone-webkit', testMatch: '**/mobile-security.spec.js', use: { ...devices['iPhone 13'], browserName: 'webkit' } }
  ],
  use: { baseURL: 'http://127.0.0.1:4175', viewport: { width: 1440, height: 1050 }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    timeout: 120_000,
    reuseExistingServer: false,
    env: { APP_PASSWORD: 'browser-test-password-123', SESSION_SECRET: 'browser-test-secret-longer-than-32-characters', AUTH_STORE: 'file', AUTH_FILE: join(authDirectory, 'credentials.json') }
  }
});
