import { defineConfig, devices } from '@playwright/test';
import { cheminfoPlaywrightConfig } from 'react-cheminfo/playwright';

export default defineConfig(
  cheminfoPlaywrightConfig({
    // The site's own dev port, kept in step with vite.config.ts.
    baseURL: `http://localhost:${process.env.PORT ?? 10917}`,
    device: devices['Desktop Chrome'],
    webServer: {
      // The build, not the dev server: `preview` serves the prerendered head of
      // each route, which is exactly what the contract spec asserts, and it does
      // not re-transform every module on demand.
      command: 'npm run build-only && npm run preview',
    },
    overrides: {
      // The 3D smoke test needs a real GPU-backed WebGL2 context.
      use: {
        launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader'] },
      },
    },
  }),
);
