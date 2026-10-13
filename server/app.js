import express from "express";
import { z } from "zod";
import { AppError } from "./store.js";

const text = (max) => z.string().trim().min(1).max(max);
const profileSchema = z.object({
  name: text(32),
  color: z.enum(["sage", "clay", "sky", "lavender", "gold"]),
});
const sessionSchema = z.object({
  title: text(80),
  room: text(40),
  duration: z.number().int().min(15).max(240),
  note: z.string().trim().max(240).default(""),
});
const taskSchema = z.object({ title: text(160) });
const updateSchema = z
  .object({
    title: text(160).optional(),
    status: z.enum(["todo", "doing", "advanced", "done", "blocked"]).optional(),
  })
  .refine((v) => v.title !== undefined || v.status !== undefined);

export function createApp(store, { publicOrigin, secureCookies = false } = {}) {
  const app = express();
  app.disable("x-powered-by");
  const streams = new Map();
  const limits = new Map();
  function publish(sid) {
    for (const res of streams.get(sid) ?? [])
      res.write("event: changed\ndata: {}\n\n");
  }
  const ticker = setInterval(() => {
    for (const sid of streams.keys()) publish(sid);
    for (const [key, v] of limits) if (v.until < Date.now()) limits.delete(key);
  }, 15000);
  ticker.unref();
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "DENY");
    next();
  });
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const expected = publicOrigin ?? `${req.protocol}://${req.get("host")}`;
      if (req.get("origin") && req.get("origin") !== expected)
        return res
          .status(403)
          .json({ error: "Origine de la requête non autorisée." });
      if (!req.is("application/json"))
        return res
          .status(415)
          .json({ error: "Le contenu doit être au format JSON." });
      const key = req.socket.remoteAddress ?? "local";
      const at = Date.now();
      const limit = limits.get(key) ?? { count: 0, until: at + 60000 };
      if (limit.until < at) {
        limit.count = 0;
        limit.until = at + 60000;
      }
      limit.count++;
      limits.set(key, limit);
      if (limit.count > 180)
        return res
          .status(429)
          .json({ error: "Trop de demandes. Réessayez dans une minute." });
    }
    next();
  });
  app.use(express.json({ limit: "12kb" }));
  app.use("/api", (req, _res, next) => {
    const token = (req.headers.cookie ?? "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("study_session="))
      ?.slice(14);
    req.user = store.authenticate(token);
    next();
  });
  const auth = (req, _res, next) => {
    if (!req.user)
      throw new AppError("Choisissez un pseudo pour continuer.", 401);
    next();
  };
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/bootstrap", (req, res) =>
    res.json(store.bootstrap(req.user?.id)),
  );
  app.post("/api/profile", (req, res) => {
    const { name, color } = profileSchema.parse(req.body);
    if (req.user)
      return res.json(store.updateProfile(req.user.id, name, color));
    const profile = store.createProfile(name, color);
    res.cookie("study_session", profile.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookies,
      maxAge: 365 * 86400000,
      path: "/",
    });
    res.status(201).json(profile.user);
  });
  app.post("/api/sessions", auth, (req, res) =>
    res
      .status(201)
      .json(store.createSession(req.user.id, sessionSchema.parse(req.body))),
  );
  app.get("/api/sessions/:id", (req, res) =>
    res.json(store.snapshot(req.params.id, req.user?.id)),
  );
  app.get("/api/sessions/:id/events", auth, (req, res) => {
    const s = store.snapshot(req.params.id, req.user.id);
    if (s.preview)
      throw new AppError(
        "Rejoignez la session avant de suivre ses objectifs.",
        403,
      );
    const set = streams.get(s.id) ?? new Set();
    if (set.size >= 80) throw new AppError("Trop de connexions actives.", 429);
    streams.set(s.id, set);
    set.add(res);
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write("retry: 3000\nevent: changed\ndata: {}\n\n");
    res.on("close", () => {
      set.delete(res);
      if (!set.size) streams.delete(s.id);
    });
  });
  app.post("/api/sessions/:id/join", auth, (req, res) => {
    const result = store.join(req.user.id, req.params.id);
    publish(req.params.id);
    res.json(result);
  });
  app.post("/api/sessions/:id/tasks", auth, (req, res) => {
    const result = store.addTask(
      req.user.id,
      req.params.id,
      taskSchema.parse(req.body).title,
    );
    publish(req.params.id);
    res.status(201).json(result);
  });
  app.patch("/api/sessions/:id/tasks/:taskId", auth, (req, res) => {
    const result = store.updateTask(
      req.user.id,
      req.params.id,
      req.params.taskId,
      updateSchema.parse(req.body),
    );
    publish(req.params.id);
    res.json(result);
  });
  app.delete("/api/sessions/:id/tasks/:taskId", auth, (req, res) => {
    store.deleteTask(req.user.id, req.params.id, req.params.taskId);
    publish(req.params.id);
    res.json({ ok: true });
  });
  app.post("/api/sessions/:id/finish", auth, (req, res) => {
    const result = store.finish(req.user.id, req.params.id);
    publish(req.params.id);
    res.json(result);
  });
  app.post("/api/sessions/:id/extend", auth, (req, res) => {
    const { minutes } = z
      .object({ minutes: z.number().int().min(5).max(60) })
      .parse(req.body);
    const result = store.extend(req.user.id, req.params.id, minutes);
    publish(req.params.id);
    res.json(result);
  });
  app.post("/api/sessions/:id/review", auth, (req, res) => {
    const { reflection } = z
      .object({ reflection: z.string().trim().max(500).default("") })
      .parse(req.body);
    const result = store.review(req.user.id, req.params.id, reflection);
    publish(req.params.id);
    res.json(result);
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "Cette action est introuvable." }),
  );
  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof z.ZodError)
      return res
        .status(400)
        .json({
          error: "Vérifiez les champs : une valeur est manquante ou invalide.",
        });
    if (error instanceof AppError)
      return res.status(error.status).json({ error: error.message });
    if (error.type === "entity.parse.failed")
      return res.status(400).json({ error: "La demande est mal formée." });
    if (error.type === "entity.too.large")
      return res.status(413).json({ error: "Le contenu est trop volumineux." });
    console.error(error);
    res
      .status(500)
      .json({ error: "Un problème est survenu. Réessayez dans un instant." });
  });
  return {
    app,
    dispose() {
      clearInterval(ticker);
      for (const set of streams.values()) for (const res of set) res.end();
      streams.clear();
    },
  };
}
