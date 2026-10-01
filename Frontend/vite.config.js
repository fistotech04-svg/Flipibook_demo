import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5000';

  return {
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      include: ["fabric"],
      exclude: ["mupdf"],
    },
    define: {
      global: "window",
    },
    server: {
      host: "0.0.0.0",
      allowedHosts: true,
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
        },
        "/uploads": {
          target: backendUrl,
          changeOrigin: true,
        },
        "/textures": {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
