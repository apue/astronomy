import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          vendor: ['three'],
          utils: ['@tweenjs/tween.js']
        },
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'js/[name].[hash].js',
        entryFileNames: 'js/[name].[hash].js'
      }
    },
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    host: '127.0.0.1',
    open: false,
    cors: true,
    strictPort: true
  },
  optimizeDeps: {
    include: ['three', '@tweenjs/tween.js']
  },
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.hdr']
});