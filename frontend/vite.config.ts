import { defineConfig, Plugin } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

function spaShellPlugin(): Plugin {
  return {
    name: "spa-shell-plugin",
    closeBundle() {
      // Ensure index.html exists alongside _shell.html in dist/client
      const clientDir = path.resolve(__dirname, "dist/client");
      const shellFile = path.join(clientDir, "_shell.html");
      const indexFile = path.join(clientDir, "index.html");

      setTimeout(() => {
        if (fs.existsSync(shellFile) && !fs.existsSync(indexFile)) {
          fs.copyFileSync(shellFile, indexFile);
        }
      }, 500);
    },
  };
}

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      spa: { enabled: true },
    }),
    viteReact(),
    spaShellPlugin(),
  ],
});
