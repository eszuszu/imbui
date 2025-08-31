/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ImbuiCast',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'cjs'],
    },
  },
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
    })
  ]
});