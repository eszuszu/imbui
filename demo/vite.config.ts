import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({

  root: __dirname,
  resolve: {
    alias: {
      '@imbui/core': resolve(__dirname, '../packages/core/src'),
      '@imbui/infuse': resolve(__dirname, '../packages/infuse/src'),
      '@imbui/pulse': resolve(__dirname, '../packages/pulse/src'),
      
    },
  },
});