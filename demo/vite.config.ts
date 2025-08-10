import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({

  root: __dirname,
  resolve: {
    alias: {
      '@imbui/core': resolve(__dirname, '../core/src'),
      '@imbui/infuse': resolve(__dirname, '../infuse/src'),
      '@imbui/pulse': resolve(__dirname, '../pulse/src'),
      
    },
  },
});