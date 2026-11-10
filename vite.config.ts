// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";
import { readFile } from "node:fs/promises";

export default defineConfig({
  plugins: [
    {
      name: "legacy-static-homepage",
      configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
          if (request.url?.split('?')[0] !== '/index.html') return next();
          try {
            const html = await readFile(new URL('./public/index.html', import.meta.url), 'utf8');
            response.statusCode = 200;
            response.setHeader('Content-Type', 'text/html; charset=utf-8');
            response.end(request.method === 'HEAD' ? '' : html);
          } catch (error) {
            next(error);
          }
        });
      },
    },
    mcpPlugin({ path: "/api/public/mcp", metadataPath: "/api/public/.well-known/oauth-protected-resource" }),
  ],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
