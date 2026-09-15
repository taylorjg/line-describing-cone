import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/line-describing-cone/",
  plugins: [react()],
  resolve: {
    alias: {
      "@app": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    open: true,
  },
  build: {
    target: "esnext",
  },
});
