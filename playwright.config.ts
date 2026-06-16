import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    launchOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    ...(isCI && {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    }),
  },
  webServer: {
    command: 'npm run dev -- -p 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    cwd: '/home/allfa/git-projects/static_blog',
  },
});
