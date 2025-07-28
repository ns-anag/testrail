import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      plugins: [react()],
      root: '.',
      build: {
        outDir: 'dist/public',
        emptyOutDir: true,
        sourcemap: !isProduction, // Only generate sourcemaps in development
        minify: isProduction ? 'esbuild' : false,
        target: 'esnext',
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html')
          },
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              // Separate chunk for large dependencies
            },
            chunkFileNames: isProduction 
              ? 'assets/[name]-[hash].js'
              : 'assets/[name].js',
            assetFileNames: isProduction 
              ? 'assets/[name]-[hash].[ext]'
              : 'assets/[name].[ext]'
          }
        }
      },
      server: {
        port: 5173,
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false
          }
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
