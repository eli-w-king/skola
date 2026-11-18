import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import Checker from "vite-plugin-checker";
import { VitePWA } from "vite-plugin-pwa";
import viteTsconfigPaths from "vite-tsconfig-paths";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));

function localContentPolicy(dev: boolean) {
  return [
    "default-src 'self'",
    `script-src 'self'${dev ? " 'unsafe-inline'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' data: blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
}

export default defineConfig({
  base: "./",
  css: {
    modules: {},
  },
  define: {
    ENABLE_FIREBASE: process.env.ENABLE_FIREBASE || true,
    PUBLIC_URL: JSON.stringify(process.env.PUBLIC_URL || "/"),
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    {
      name: "local-content-policy",
      transformIndexHtml(html, { server }) {
        return html.replace(
          "<head>",
          `<head>\n    <meta http-equiv="Content-Security-Policy" content="${localContentPolicy(Boolean(server))}">`
        );
      },
    },
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
    viteTsconfigPaths(),
    Checker({ typescript: true }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.svg", "logo256.png", "logo512.png", "fonts/**/*"],
      manifest: {
        name: "Skola Cards",
        short_name: "Skola",
        description: "Skola is a free and open source flash card app.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "fullscreen",
        orientation: "portrait-primary",
        start_url: "./",
        scope: "./",
        icons: [
          {
            src: "logo256.png",
            sizes: "256x256",
            type: "image/png",
          },
          {
            src: "logo512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "logo512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
      },
    }),
  ],
  clearScreen: false,
  server: {
    strictPort: true,
  },
  envPrefix: [
    "VITE_",
    "TAURI_PLATFORM",
    "TAURI_ARCH",
    "TAURI_FAMILY",
    "TAURI_PLATFORM_VERSION",
    "TAURI_PLATFORM_TYPE",
    "TAURI_DEBUG",
  ],
  build: {
    outDir: "dist",
    target: process.env.TAURI_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
