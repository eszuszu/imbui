import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'src'),
  esbuild: {
    target: 'ES2022'
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});