import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isVercelBuild = Boolean(process.env.VERCEL);

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: isVercelBuild ? "dist" : "../shahira-code/src/main/resources/static",
    emptyOutDir: true
  },
  server: {
    port: 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "unsafe-none"
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true
      }
    }
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "unsafe-none"
    }
  }
});
