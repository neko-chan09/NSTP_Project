// vite.config.js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/main.tsx',
            ],
            refresh: [
                'resources/views/**',
                'routes/**',
            ],
        }),
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: null,
            outDir: 'public',
            filename: 'sw.js',
            manifest: false,
            scope: '/',
            base: '/',
            includeAssets: [
                'favicon.ico',
                'icons/*.png',
                'manifest.webmanifest',
            ],
            workbox: {
                globPatterns: [
                    'build/**/*.{js,css,html,ico,png,svg,woff2}',
                ],
                navigateFallback: null,
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
                maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
                globIgnores: [
                    '**/scribe*.js',
                    '**/scribe*.wasm',
                    '**/tesseract*.wasm',
                    '**/tesseract*.js',
                    '**/*.node',
                ],
                runtimeCaching: [
                    {
                        urlPattern: ({ url, request }) => {
                            if (request.method !== 'GET') return false;
                            return /\/api\/(dashboard|admin\/students|admin\/classes|bulletin|activities|options|attendance\/sessions|admin\/grades|admin\/certificates|student\/profile|student\/documents|student\/certificates|student\/announcements|student\/notifications)/i.test(
                                url.pathname,
                            );
                        },
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'nstp-api-get',
                            expiration: {
                                maxEntries: 300,
                                maxAgeSeconds: 60 * 60 * 24,
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'nstp-assets',
                            expiration: {
                                maxEntries: 300,
                                maxAgeSeconds: 60 * 60 * 24 * 30,
                            },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*tessdata.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'scribe-tessdata',
                            expiration: {
                                maxEntries: 20,
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                            },
                        },
                    },
                ],
            },
            devOptions: {
                enabled: false,
            },
        }),
    ],
    resolve: {
        alias: [
            // Stub @scribe.js/canvas (and any subpath) — it ships native
            // .node binaries that cannot be bundled for the browser.
            {
                find: /^@scribe\.js\/canvas(\/.*)?$/,
                replacement: path.resolve(
                    __dirname,
                    'resources/js/lib/stubs/scribe-canvas-stub.js',
                ),
            },
            // '@/foo' -> <project>/resources/js/foo
            {
                find: /^@\//,
                replacement: path.resolve(__dirname, 'resources/js') + '/',
            },
        ],
    },
    worker: {
        format: 'es',
    },
    optimizeDeps: {
        exclude: ['scribe.js-ocr', '@scribe.js/canvas'],
    },
    build: {
        minify: false,
    sourcemap: true,
        chunkSizeWarningLimit: 5000,
        rollupOptions: {
            external: [],
            output: {
                // Put scribe in its own chunk named "scribe-*.js" so the
                // PWA globIgnores rules above can skip precaching it.
                manualChunks(id) {
                    if (id.includes('node_modules/scribe.js-ocr')) {
                        return 'scribe';
                    }
                },
            },
        },
    },
    server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    hmr: { host: 'localhost' },
    watch: {
        ignored: ['**/storage/framework/views/**'],
    },
},
});