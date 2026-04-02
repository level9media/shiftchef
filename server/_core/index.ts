import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeWebhook } from "../webhooks/stripe";
import { startAutoReleaseJob } from "../jobs/autoReleasePayments";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.warn("[Migration] No DATABASE_URL — skipping migrations");
    return;
  }
  try {
    console.log("[Migration] Running database migrations...");
    const { drizzle } = await import("drizzle-orm/mysql2");
    const { migrate } = await import("drizzle-orm/mysql2/migrator");
    const db = drizzle(process.env.DATABASE_URL);
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[Migration] Migrations complete");
  } catch (err: any) {
    // Log but don't crash — tables may already exist
    console.warn("[Migration] Migration warning:", err?.message ?? err);
  }
}

async function startServer() {
  // Run migrations before starting the server
  await runMigrations();

  const app = express();
  const server = createServer(app);

  // CORS — allow Capacitor WebView and web origins
  app.use(
    cors({
      origin: (origin, callback) => {
        if (
          !origin ||
          origin === "capacitor://localhost" ||
          origin === "http://localhost" ||
          origin.startsWith("http://localhost:") ||
          origin === "https://www.shiftchef.co" ||
          origin === "https://shiftchef.co" ||
          origin === "https://shiftchef-production.up.railway.app" ||
          origin.endsWith(".manus.computer") ||
          origin.endsWith(".manus.space")
        ) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    })
  );

  // Redirect non-www to www
  app.use((req, res, next) => {
    const host = req.headers.host || "";
    if (host === "shiftchef.co") {
      return res.redirect(301, `https://www.shiftchef.co${req.originalUrl}`);
    }
    next();
  });

  // Stripe webhook MUST be before express.json()
  registerStripeWebhook(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // OAuth callback
  registerOAuthRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    startAutoReleaseJob();
  });
}

startServer().catch(console.error);
