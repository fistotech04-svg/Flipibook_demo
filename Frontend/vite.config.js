import process from "node:process";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const emptyNodeModulesPlugin = () => {
  const emptyModuleId = '\0virtual:empty-node-module';
  return {
    name: 'vite-plugin-empty-node-modules',
    enforce: 'pre',
    resolveId(id) {
      if (['path', 'crypto', 'node:fs', 'fs', 'module'].includes(id)) {
        return emptyModuleId;
      }
    },
    load(id) {
      if (id === emptyModuleId) {
        return 'export default {}; export const promises = {};';
      }
    }
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5000';

  return {
    plugins: [emptyNodeModulesPlugin(), react(), tailwindcss()],
    optimizeDeps: {
      include: ["fabric"],
      exclude: ["mupdf"],
    },
    build: {
      chunkSizeWarningLimit: 2000,
      sourcemap: false,
      minify: "esbuild",
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
