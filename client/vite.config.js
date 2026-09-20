import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The dev server forwards "/api" calls straight to the backend process.
// Defaults to port 5000 (the backend's default); override with
// VITE_DEV_SERVER_PORT in client/.env if your backend runs elsewhere
// (e.g. because 5000 was already taken by something else on your machine).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiPort = env.VITE_DEV_SERVER_PORT || 5000;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
