import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes, randomUUID } from "node:crypto";

export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const hash = (token) => createHash("sha256").update(token).digest("hex");
const cleanUser = (row) =>
  row ? { id: row.id, name: row.name, color: row.color } : null;

export function createStore({ filename = ":memory:", now = Date.now } = {}) {
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, name TEXT NOT NULL, color TEXT NOT NULL, discord_id TEXT UNIQUE, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, title TEXT NOT NULL, room TEXT NOT NULL, duration INTEGER NOT NULL, note TEXT NOT NULL, owner_id TEXT NOT NULL REFERENCES users(id), created_at INTEGER NOT NULL, ends_at INTEGER NOT NULL, ended_at INTEGER, discord_channel_id TEXT);
    CREATE TABLE IF NOT EXISTS participants (session_id TEXT REFERENCES sessions(id), user_id TEXT REFERENCES users(id), joined_at INTEGER NOT NULL, reviewed_at INTEGER, reflection TEXT, earned INTEGER NOT NULL DEFAULT 0, minutes INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(session_id,user_id));
    CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id), user_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'todo', created_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS tasks_session ON tasks(session_id,user_id);
    CREATE INDEX IF NOT EXISTS participants_user ON participants(user_id);
  `);
  const get = (sql, ...args) => db.prepare(sql).get(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const user = (id) => cleanUser(get("SELECT * FROM users WHERE id=?", id));
  function session(id) {
    const s = get("SELECT * FROM sessions WHERE id=?", id);
    if (!s) throw new AppError("Cette invitation est introuvable.", 404);
    if (s.ended_at === null && now() >= s.ends_at) {
      s.ended_at = s.ends_at;
      run(
        "UPDATE sessions SET ended_at=? WHERE id=? AND ended_at IS NULL",
        s.ends_at,
        id,
      );
    }
    return s;
  }
  function member(id, sid, editable = false) {
    const p = get(
      "SELECT * FROM participants WHERE session_id=? AND user_id=?",
      sid,
      id,
    );
    if (!p) throw new AppError("Vous devez rejoindre cette session.", 403);
    if (editable && p.reviewed_at !== null)
      throw new AppError("Votre bilan a déjà été enregistré.");
    return p;
  }
  function ownedTask(uid, sid, tid) {
    member(uid, sid, true);
    const task = get(
      "SELECT * FROM tasks WHERE id=? AND session_id=?",
      tid,
      sid,
    );
    if (!task || task.user_id !== uid)
      throw new AppError(
        "Vous n’êtes pas autorisé à modifier cet objectif.",
        403,
      );
    return task;
  }
  function summary(s) {
    return {
      id: s.id,
      title: s.title,
      room: s.room,
      duration: s.duration,
      note: s.note,
      ownerId: s.owner_id,
      createdAt: s.created_at,
      endsAt: s.ends_at,
      endedAt: s.ended_at,
      status: s.ended_at === null ? "active" : "ended",
      participantCount: get(
        "SELECT COUNT(*) AS n FROM participants WHERE session_id=?",
        s.id,
      ).n,
      serverNow: now(),
    };
  }
  const store = {
    close: () => db.close(),
    authenticate: (token) =>
      typeof token === "string"
        ? cleanUser(get("SELECT * FROM users WHERE token_hash=?", hash(token)))
        : null,
    createProfile(name, color) {
      const token = randomBytes(32).toString("hex");
      const id = randomUUID();
      run(
        "INSERT INTO users(id,token_hash,name,color,created_at) VALUES(?,?,?,?,?)",
        id,
        hash(token),
        name,
        color,
        now(),
      );
      return { user: user(id), token };
    },
    updateProfile(uid, name, color) {
      run("UPDATE users SET name=?,color=? WHERE id=?", name, color, uid);
      return user(uid);
    },
    createSession(uid, { title, room, duration, note = "" }) {
      if (
        get(
          "SELECT COUNT(*) AS n FROM sessions WHERE owner_id=? AND ended_at IS NULL AND ends_at>?",
          uid,
          now(),
        ).n >= 5
      )
        throw new AppError(
          "Terminez une session avant d’en créer une nouvelle.",
        );
      const id = randomBytes(12).toString("base64url");
      const at = now();
      run(
        "INSERT INTO sessions(id,title,room,duration,note,owner_id,created_at,ends_at) VALUES(?,?,?,?,?,?,?,?)",
        id,
        title,
        room,
        duration,
        note,
        uid,
        at,
        at + duration * 60000,
      );
      run(
        "INSERT INTO participants(session_id,user_id,joined_at) VALUES(?,?,?)",
        id,
        uid,
        at,
      );
      return store.snapshot(id, uid);
    },
    join(uid, sid) {
      const s = session(sid);
      if (
        get(
          "SELECT 1 FROM participants WHERE session_id=? AND user_id=?",
          sid,
          uid,
        )
      )
        return store.snapshot(sid, uid);
      if (s.ended_at !== null)
        throw new AppError("Cette session est terminée.");
      if (
        get("SELECT COUNT(*) AS n FROM participants WHERE session_id=?", sid)
          .n >= 20
      )
        throw new AppError("Cette session est complète (20 participants).");
      run(
        "INSERT INTO participants(session_id,user_id,joined_at) VALUES(?,?,?)",
        sid,
        uid,
        now(),
      );
      return store.snapshot(sid, uid);
    },
    addTask(uid, sid, title) {
      const s = session(sid);
      member(uid, sid, true);
      if (s.ended_at !== null)
        throw new AppError(
          "La session est terminée. Vous pouvez encore mettre à jour vos objectifs existants pour votre bilan.",
        );
      if (
        get(
          "SELECT COUNT(*) AS n FROM tasks WHERE session_id=? AND user_id=?",
          sid,
          uid,
        ).n >= 8
      )
        throw new AppError(
          "Choisissez au maximum 8 objectifs pour cette session.",
        );
      const id = randomUUID();
      run(
        "INSERT INTO tasks(id,session_id,user_id,title,created_at) VALUES(?,?,?,?,?)",
        id,
        sid,
        uid,
        title,
        now(),
      );
      return { id, title, status: "todo" };
    },
    updateTask(uid, sid, tid, { title, status }) {
      session(sid);
      const task = ownedTask(uid, sid, tid);
      run(
        "UPDATE tasks SET title=?,status=? WHERE id=?",
        title ?? task.title,
        status ?? task.status,
        tid,
      );
      return {
        id: tid,
        title: title ?? task.title,
        status: status ?? task.status,
      };
    },
    deleteTask(uid, sid, tid) {
      session(sid);
      ownedTask(uid, sid, tid);
      run("DELETE FROM tasks WHERE id=?", tid);
    },
    finish(uid, sid) {
      const s = session(sid);
      if (s.owner_id !== uid)
        throw new AppError(
          "Seul l’organisateur peut terminer la session.",
          403,
        );
      if (s.ended_at === null)
        run("UPDATE sessions SET ended_at=? WHERE id=?", now(), sid);
      return store.snapshot(sid, uid);
    },
    extend(uid, sid, minutes = 15) {
      const s = session(sid);
      if (s.owner_id !== uid)
        throw new AppError(
          "Seul l’organisateur peut prolonger la session.",
          403,
        );
      if (s.ended_at !== null)
        throw new AppError("Cette session est terminée.");
      if (s.duration + minutes > 360)
        throw new AppError("La session ne peut pas dépasser 6 heures.");
      run(
        "UPDATE sessions SET ends_at=ends_at+?,duration=duration+? WHERE id=?",
        minutes * 60000,
        minutes,
        sid,
      );
      return store.snapshot(sid, uid);
    },
    review(uid, sid, reflection = "") {
      const s = session(sid);
      const p = member(uid, sid);
      if (p.reviewed_at !== null)
        return { earned: p.earned, minutes: p.minutes };
      const time = now();
      const end = Math.min(time, s.ended_at ?? s.ends_at, s.ends_at);
      const minutes = Math.max(0, Math.floor((end - p.joined_at) / 60000));
      const tasks = all(
        "SELECT status FROM tasks WHERE session_id=? AND user_id=?",
        sid,
        uid,
      );
      const day = Math.floor(time / 86400000) * 86400000;
      const count = get(
        "SELECT COUNT(*) AS n FROM participants WHERE user_id=? AND reviewed_at>=? AND reviewed_at<? AND earned>0",
        uid,
        day,
        day + 86400000,
      ).n;
      const progress = tasks.length
        ? tasks.reduce(
            (a, t) =>
              a + (t.status === "done" ? 1 : t.status === "advanced" ? 0.5 : 0),
            0,
          ) / tasks.length
        : 0;
      const earned =
        minutes >= 5 && tasks.length > 0 && count < 3
          ? 10 + Math.round(10 * progress)
          : 0;
      db.exec("BEGIN IMMEDIATE");
      try {
        run(
          "UPDATE participants SET reviewed_at=?,reflection=?,earned=?,minutes=? WHERE session_id=? AND user_id=? AND reviewed_at IS NULL",
          time,
          reflection,
          earned,
          minutes,
          sid,
          uid,
        );
        if (
          get(
            "SELECT COUNT(*) AS n FROM participants WHERE session_id=? AND reviewed_at IS NULL",
            sid,
          ).n === 0 &&
          s.ended_at === null
        )
          run("UPDATE sessions SET ended_at=? WHERE id=?", time, sid);
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
      return { earned, minutes };
    },
    snapshot(sid, uid) {
      const s = session(sid);
      const meta = summary(s);
      if (
        !get(
          "SELECT 1 FROM participants WHERE session_id=? AND user_id=?",
          sid,
          uid ?? "",
        )
      )
        return { ...meta, preview: true, note: undefined, ownerId: undefined };
      const participants = all(
        "SELECT p.*,u.name,u.color FROM participants p JOIN users u ON u.id=p.user_id WHERE session_id=? ORDER BY p.joined_at,p.rowid",
        sid,
      ).map((p) => ({
        id: p.user_id,
        name: p.name,
        color: p.color,
        joinedAt: p.joined_at,
        reviewedAt: p.reviewed_at,
        reflection: p.reflection,
        earned: p.earned,
        minutes: p.minutes,
        tasks: all(
          "SELECT id,title,status FROM tasks WHERE session_id=? AND user_id=? ORDER BY created_at,rowid",
          sid,
          p.user_id,
        ),
      }));
      return {
        ...meta,
        preview: false,
        participants,
        totalXp: participants.reduce((a, p) => a + p.earned, 0),
      };
    },
    bootstrap(uid) {
      const me = uid ? user(uid) : null;
      if (!me)
        return {
          user: null,
          sessions: [],
          groupXp: 0,
          stats: { xp: 0, sessions: 0, minutes: 0, completed: 0 },
          companions: [],
        };
      const sessions = all(
        "SELECT s.id FROM sessions s JOIN participants p ON p.session_id=s.id WHERE p.user_id=? ORDER BY s.created_at DESC",
        uid,
      ).map((row) => {
        const s = summary(session(row.id));
        const p = member(uid, row.id);
        return {
          ...s,
          reviewedAt: p.reviewed_at,
          earned: p.earned,
          minutes: p.minutes,
        };
      });
      const stats = get(
        "SELECT COALESCE(SUM(earned),0) AS xp, COUNT(*) AS sessions,COALESCE(SUM(minutes),0) AS minutes FROM participants WHERE user_id=? AND reviewed_at IS NOT NULL",
        uid,
      );
      stats.completed = get(
        "SELECT COUNT(*) AS n FROM tasks t JOIN participants p ON p.session_id=t.session_id AND p.user_id=t.user_id WHERE t.user_id=? AND t.status='done' AND p.reviewed_at IS NOT NULL",
        uid,
      ).n;
      const companions = all(
        "SELECT u.id,u.name,u.color,COUNT(*) AS sessions FROM participants a JOIN participants b ON a.session_id=b.session_id JOIN users u ON u.id=b.user_id WHERE a.user_id=? AND b.user_id!=? AND a.reviewed_at IS NOT NULL AND b.reviewed_at IS NOT NULL GROUP BY u.id ORDER BY sessions DESC LIMIT 8",
        uid,
        uid,
      );
      return {
        user: me,
        sessions,
        stats,
        companions,
        groupXp: get("SELECT COALESCE(SUM(earned),0) AS xp FROM participants")
          .xp,
      };
    },
  };
  return store;
}
