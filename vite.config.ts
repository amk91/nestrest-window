import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      input: './index.html',
    },
  },
  server: {
    port: 9000,
    open: false,
  },
});
