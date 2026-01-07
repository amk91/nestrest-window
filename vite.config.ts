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
    host: '0.0.0.0',
    port: 5173,
    open: false,
  },
});
