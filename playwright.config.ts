import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3211',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command:
      "HOSTNAME=127.0.0.1 PORT=3211 NODE_ENV=production SESSION_SECRET='playwright-session-secret-32-bytes' AUTH_SECRET='playwright-auth-secret-32-bytes' NEXTAUTH_SECRET='playwright-nextauth-secret-32-bytes' NEXTAUTH_URL='http://127.0.0.1:3211' npm start",
    url: 'http://127.0.0.1:3211/api/health/live',
    timeout: 60_000,
    reuseExistingServer: false,
  },
});
