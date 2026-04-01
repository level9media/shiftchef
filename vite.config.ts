import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

// =============================================================================
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6); // Trim to 60% to avoid constant re-trimming

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }

    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;

    // Keep newest lines (from end) that fit within 60% of maxSize
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }

    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;

  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);

  // Format entries with timestamps
  const lines = entries.map((entry) => {
    const ts = new Date().toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });

  // Append to log file
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");

  // Trim if exceeds max size
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

/**
 * Vite plugin to collect browser debug logs
 * - POST /__manus__/logs: Browser sends logs, written directly to files
 * - Files: browserConsole.log, networkRequests.log, sessionReplay.log
 * - Auto-trimmed when exceeding 1MB (keeps newest entries)
 */
function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",

    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true,
            },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server: ViteDevServer) {
      // POST /__manus__/logs: Browser sends logs (written directly to files)
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        const handlePayload = (payload: any) => {
          // Write logs directly to files
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };

        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}

// =============================================================================
// React Singleton Patch Plugin
// @trpc/react-query (and @tanstack/react-query) use CJS-to-ESM interop that
// calls __toESM(require_react(), 1) multiple times, creating separate React
// namespace objects. When react-dom initializes its dispatcher on one object
// but TRPCProvider calls useState on another, we get:
//   "Cannot read properties of null (reading 'useState')"
// Fix: replace all duplicate React var declarations with references to the first.
// =============================================================================
function vitePluginReactSingleton(): Plugin {
  let projectRoot = '';

  function patchDepsFile(filePath: string) {
    if (!fs.existsSync(filePath)) return false;
    const code = fs.readFileSync(filePath, 'utf8');
    if (!code.includes('__toESM(require_react(), 1)')) return false;

    let patchCount = 0;
    const patched = code.replace(
      /var (React[\w$]*) = __toESM\(require_react\(\), 1\);/g,
      (_match: string, varName: string) => {
        patchCount++;
        if (patchCount === 1) {
          return `var __sharedReact = __toESM(require_react(), 1);\nvar ${varName} = __sharedReact;`;
        }
        return `var ${varName} = __sharedReact;`;
      }
    );

    if (patchCount > 1) {
      fs.writeFileSync(filePath, patched, 'utf8');
      console.log(`[react-singleton] Patched ${path.basename(filePath)}: ${patchCount} React vars -> 1 shared instance`);
      return true;
    }
    return false;
  }

  return {
    name: 'react-singleton-patch',
    enforce: 'post',
    configResolved(config) {
      projectRoot = config.root;
    },
    configureServer(server) {
      const depsDir = path.resolve(projectRoot, '..', 'node_modules', '.vite', 'deps');
      let watcher: ReturnType<typeof fs.watch> | null = null;
      let reloadTimer: ReturnType<typeof setTimeout> | null = null;
      let patchedFiles = new Set<string>();

      function startWatcher() {
        // Ensure deps dir exists before watching
        if (!fs.existsSync(depsDir)) {
          fs.mkdirSync(depsDir, { recursive: true });
        }
        watcher = fs.watch(depsDir, { persistent: false }, (event, filename) => {
          if (!filename || !filename.endsWith('.js') || filename.endsWith('.map')) return;
          const filePath = path.join(depsDir, filename);
          if (patchedFiles.has(filePath)) return;
          // Small delay to ensure file write is complete
          setTimeout(() => {
            if (patchDepsFile(filePath)) {
              patchedFiles.add(filePath);
              // Debounce the reload
              if (reloadTimer) clearTimeout(reloadTimer);
              reloadTimer = setTimeout(() => {
                console.log('[react-singleton] Triggering HMR reload after patching React deps');
                server.ws.send({ type: 'full-reload' });
              }, 500);
            }
          }, 100);
        });
      }

      server.httpServer?.once('listening', () => {
        startWatcher();
      });

      server.httpServer?.once('close', () => {
        watcher?.close();
      });
    },
  };
}

const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector(), vitePluginReactSingleton()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      // Force all packages to use the exact same React instance
      // This prevents the "Cannot read properties of null (reading 'useState')" crash
      // caused by @trpc/react-query importing React multiple times as separate namespaces
      "react": path.resolve(import.meta.dirname, "node_modules/react"),
      "react-dom": path.resolve(import.meta.dirname, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(import.meta.dirname, "node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(import.meta.dirname, "node_modules/react/jsx-dev-runtime"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  optimizeDeps: {
    // Exclude @trpc/react-query and @tanstack/react-query from pre-bundling.
    // When Vite pre-bundles these CJS packages it emits multiple __toESM(require_react(), 1)
    // wrappers that are not referentially equal — causing TRPCProvider to call useState on a
    // different React namespace than the one react-dom initialized its dispatcher on.
    // Excluding them forces Vite to transform them through the standard ESM pipeline instead,
    // which shares the same React instance as the rest of the app.
    exclude: ["@trpc/react-query", "@tanstack/react-query"],
    include: ["react", "react-dom", "react-dom/client"],
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    hmr: {
      clientPort: 443,
      protocol: 'wss',
    },
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
