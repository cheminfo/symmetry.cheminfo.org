import { defineConfig, devices } from '@playwright/test';

// The site's own dev port, kept in step with vite.config.ts.
const BASE_URL = `http://localhost:${process.env.PORT ?? 10917}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      // The 3D smoke test needs a real GPU-backed WebGL2 context.
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader'] },
      },
    },
  ],
  webServer: {
    // The build, not the dev server: `preview` serves the prerendered head of
    // each route, which is exactly what the contract spec asserts, and it does
    // not re-transform every module on demand.
    command: 'npm run build && npm run preview',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120_000,
  },
});
