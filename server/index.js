import express from "express";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createStore } from "./store.js";
import { createApp } from "./app.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (existsSync(resolve(root, ".env")))
  process.loadEnvFile(resolve(root, ".env"));
const filename = resolve(
  root,
  process.env.DATABASE_PATH ?? "data/study-group.sqlite",
);
mkdirSync(dirname(filename), { recursive: true });
const store = createStore({ filename });
const { app, dispose } = createApp(store, {
  publicOrigin: process.env.PUBLIC_ORIGIN,
  secureCookies: process.env.SECURE_COOKIES === "1",
});
let vite;
if (process.argv.includes("--dev")) {
  const { createServer } = await import("vite");
  vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  if (!existsSync(resolve(root, "dist/index.html")))
    throw new Error("Lancez npm run build avant npm start.");
  app.use(express.static(resolve(root, "dist")));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(resolve(root, "dist/index.html")),
  );
}
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";
const server = app.listen(port, host, () =>
  console.log(`Study Group disponible sur http://${host}:${port}`),
);
async function stop() {
  dispose();
  await vite?.close();
  server.close(() => {
    store.close();
    process.exit(0);
  });
  server.closeIdleConnections();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
