import { defineConfig } from "vite";
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ImbuiCore',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['@imbui/pulse', '@imbui/infuse', '@imbui/cast'],
    },
  },
  resolve: {
    alias: {
      '@imbui/pulse': path.resolve(__dirname, '../pulse/src'),
      '@imbui/infuse': path.resolve(__dirname, '../infuse/src'),
      '@imbui/cast': path.resolve(__dirname, '../cast/src'),
    }
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