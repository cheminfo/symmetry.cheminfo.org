import { defaultExclude, defineConfig } from 'vitest/config';

export default defineConfig({
  // react-cheminfo is linked from the checkout until it is published, and a
  // linked package brings its own node_modules/react. Two copies make every
  // component from the library call hooks against a dispatcher the active
  // renderer never populated, so it dies at mount with
  // `Cannot read properties of null`. vite.config.ts carries the same list.
  resolve: { dedupe: ['react', 'react-dom', '@blueprintjs/core'] },
  test: {
    // e2e/*.spec.ts belongs to playwright, which vitest cannot run.
    exclude: [...defaultExclude, 'e2e/**'],
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
    },
    snapshotFormat: {
      maxOutputLength: Number.MAX_SAFE_INTEGER,
    },
  },
});
