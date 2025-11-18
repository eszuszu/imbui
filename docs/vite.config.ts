import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({

  root: resolve(__dirname, 'src'),
  //enables the standard decorators for now, idk why esnext doesn't work?
  esbuild: {
    target: 'ES2022'
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, './src/pages/index.html'),
        pages: resolve(__dirname, './src/pages/index.html'),
        essentials: resolve(__dirname, './src/pages/essentials/index.html')
      },
    },
  },
});