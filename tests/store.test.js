import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStore } from "../server/store.js";

function setup(t) {
  let time = Date.UTC(2026, 9, 13, 12);
  const store = createStore({ filename: ":memory:", now: () => time });
  t.after(() => store.close());
  const a = store.createProfile("Alice", "sage");
  const b = store.createProfile("Basile", "clay");
  const session = store.createSession(a.user.id, {
    title: "Révisions ensemble",
    room: "Study Room 1",
    duration: 60,
    note: "",
  });
  return {
    store,
    a: a.user,
    b: b.user,
    session,
    advance: (min) => {
      time += min * 60000;
    },
  };
}

test("invitation previews hide objectives until the second participant explicitly joins", (t) => {
  const { store, a, b, session } = setup(t);
  store.addTask(a.id, session.id, "Comprendre les suites");
  assert.equal(store.snapshot(session.id, b.id).preview, true);
  assert.equal(store.snapshot(session.id, b.id).participants, undefined);
  store.join(b.id, session.id);
  assert.equal(store.snapshot(session.id, b.id).participants.length, 2);
});
test("participants cannot change someone else’s objectives or close their session", (t) => {
  const { store, a, b, session } = setup(t);
  store.join(b.id, session.id);
  const task = store.addTask(a.id, session.id, "Exercice 1");
  assert.throws(
    () => store.updateTask(b.id, session.id, task.id, { status: "done" }),
    /autorisé/,
  );
  assert.throws(() => store.finish(b.id, session.id), /organisateur/);
});
test("review awards progress once, locks tasks and preserves the other participant session", (t) => {
  const { store, a, b, session, advance } = setup(t);
  store.join(b.id, session.id);
  const task = store.addTask(a.id, session.id, "Chapitre 1");
  store.updateTask(a.id, session.id, task.id, { status: "done" });
  advance(6);
  const first = store.review(a.id, session.id, "Bien avancé");
  assert.equal(first.earned, 20);
  assert.equal(store.review(a.id, session.id, "Encore").earned, 20);
  assert.equal(store.bootstrap(a.id).groupXp, 20);
  assert.throws(
    () => store.addTask(a.id, session.id, "Après le bilan"),
    /bilan/,
  );
  assert.equal(store.snapshot(session.id, b.id).status, "active");
});
test("the server expires sessions, rejects late joins and caps measured time at the deadline", (t) => {
  const { store, a, b, session, advance } = setup(t);
  store.addTask(a.id, session.id, "Travail");
  advance(90);
  assert.equal(store.snapshot(session.id, a.id).status, "ended");
  assert.throws(() => store.join(b.id, session.id), /terminée/);
  store.review(a.id, session.id, "Bilan");
  assert.equal(store.bootstrap(a.id).stats.minutes, 60);
});
test("short sessions earn no points and fourth daily review cannot farm more rewards", (t) => {
  const { store, a, session, advance } = setup(t);
  store.addTask(a.id, session.id, "Essai");
  assert.equal(store.review(a.id, session.id, "Trop court").earned, 0);
  for (let i = 0; i < 4; i++) {
    const s = store.createSession(a.id, {
      title: "Session",
      room: "Study Room 1",
      duration: 15,
      note: "",
    });
    store.addTask(a.id, s.id, "Objectif");
    advance(6);
    assert.equal(store.review(a.id, s.id, "Avancé").earned, i < 3 ? 10 : 0);
  }
  assert.equal(store.bootstrap(a.id).groupXp, 30);
});
test("data and identity survive reopening the database", () => {
  const dir = mkdtempSync(join(tmpdir(), "study-test-"));
  const file = join(dir, "db.sqlite");
  try {
    let store = createStore({ filename: file });
    const profile = store.createProfile("Alice", "sage");
    store.createSession(profile.user.id, {
      title: "Persistante",
      room: "Study Room 1",
      duration: 60,
      note: "",
    });
    store.close();
    store = createStore({ filename: file });
    assert.equal(store.authenticate(profile.token).name, "Alice");
    assert.equal(
      store.bootstrap(profile.user.id).sessions[0].title,
      "Persistante",
    );
    store.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
