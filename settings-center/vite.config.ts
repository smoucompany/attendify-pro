import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'SettingsCenterV2',
      formats: ['iife'],
      fileName: () => 'settings-center.js',
    },
    rollupOptions: {
      output: {
        // Single predictable CSS filename for the host page to <link> against.
        assetFileNames: (asset) => (asset.name === 'style.css' ? 'settings-center.css' : 'assets/[name][extname]'),
      },
    },
  },
});
