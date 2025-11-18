import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // VWorld API 프록시 설정
      "/api/vworld": {
        target: "https://api.vworld.kr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vworld/, ""),
        configure: (proxy) => {
          // CORS 헤더 추가
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("Access-Control-Allow-Origin", "*");
          });
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "모두 - 식물 관리",
        short_name: "모두",
        description: "식물을 쉽게 관리하는 모바일 앱",
        theme_color: "#22c55e",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        categories: ["lifestyle", "productivity"],
        lang: "ko",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/apis\.data\.go\.kr\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "kma-weather-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 30, // 30분
              },
              plugins: [
                {
                  cacheKeyWillBeUsed: async ({ request }) => {
                    // API 키는 캐시 키에서 제외 (보안)
                    const url = new URL(request.url);
                    url.searchParams.delete("serviceKey");
                    return url.toString();
                  },
                },
              ],
            },
          },
          {
            urlPattern: /^https:\/\/api\.vworld\.kr\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "vworld-geocoding-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30일
              },
              plugins: [
                {
                  cacheKeyWillBeUsed: async ({ request }) => {
                    // API 키는 캐시 키에서 제외 (보안)
                    const url = new URL(request.url);
                    url.searchParams.delete("key");
                    url.searchParams.delete("apiKey");
                    return url.toString();
                  },
                },
              ],
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
});
