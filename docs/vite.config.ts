import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({

  root: __dirname,
  //enables the standard decorators for now, idk why esnext doesn't work?
  esbuild: {
    target: 'ES2022'
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@imbui/core': resolve(__dirname, '../packages/core/src'),
      '@imbui/infuse': resolve(__dirname, '../packages/infuse/src'),
      '@imbui/pulse': resolve(__dirname, '../packages/pulse/src'),
      '@imbui/cast': resolve(__dirname, '../packages/cast/src'),
    },
  },
});