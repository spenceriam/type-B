  import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react-swc";
  import path from "path";
  import { componentTagger } from "lovable-tagger";

  // https://vitejs.dev/config/
  export default defineConfig(({ mode }) => ({
    server: {
      host: "::",
      port: 3000,
      hmr: false, // Disabled HMR
      allowedHosts: [
        '.modal.host'  // This will match any subdomain of modal.host
      ],
      timeout: 120000, // 2 minutes
      watch: {
        usePolling: true,
        interval: 4000
      }
    },
    build: {
    sourcemap: 'inline',
    minify: 'esbuild',
    outDir: 'dist'
   },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }));
