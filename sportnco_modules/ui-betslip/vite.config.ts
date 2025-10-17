import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

const isStandalone = process.env.BUILD_MODE === 'standalone'

export default defineConfig(() => {
  return {
    plugins: [
      vue({
        customElement: true,
      }),
      vueJsx(),
      vueDevTools(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(isStandalone ? 'production' : process.env.NODE_ENV || 'production'),
    },
    build: isStandalone
      ? {
          // Standalone app bundle (embeddable)
          outDir: 'dist/standalone',
          emptyOutDir: true,
          lib: {
            entry: resolve(__dirname, 'src/standalone.ts'),
            name: 'UiBetslipStandalone',
            fileName: 'ui-betslip-standalone',
            formats: ['iife'],
          },
          rollupOptions: {
            output: {
              // Inline all dependencies for standalone bundle
              inlineDynamicImports: true,
            },
          },
        }
      : {
          // Plugin bundle (for use in other projects)
          outDir: 'dist/plugin',
          emptyOutDir: true,
          lib: {
            entry: resolve(__dirname, 'src/plugin.ts'),
            name: 'UiBetslip',
            fileName: (format) => `ui-betslip.${format}.js`,
            formats: ['es', 'umd'],
          },
          rollupOptions: {
            external: ['vue'],
            output: {
              globals: {
                vue: 'Vue',
              },
            },
          },
        },
  }
})
