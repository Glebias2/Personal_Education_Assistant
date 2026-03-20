import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    // NEW FUNCTIONALITY: avoid conflict with Weaviate (8080)
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // ваш бэкенд
        changeOrigin: true,
        secure: false,
      },
      '/teachers': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/students': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
