import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
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
    env: { APP_PASSWORD: '', SESSION_SECRET: '', SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '' }
  }
});
