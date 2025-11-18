import { defineConfig } from "vite";
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ImbuiInfuse',
      formats: ['es'],
      fileName: `index.mjs`,
    },
    rollupOptions: {
      external: ['@imbui/pulse'],
    },
  },
  // resolve: {
  //   alias: {
  //     '@imbui/pulse': path.resolve(__dirname, '../pulse/src'),
  //   }
  // },
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      reportsDirectory: './coverage',
      exclude: ['node_modules', 'dist', '**/demo/**']
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: './dist',
      exclude: ['**/*.test.ts'],
    })
  ]
});