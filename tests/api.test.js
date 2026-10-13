import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../server/store.js";
import { createApp } from "../server/app.js";

async function setup(t) {
  const store = createStore();
  const { app, dispose } = createApp(store);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    dispose();
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    store.close();
  });
  function client() {
    let cookie = "";
    return async (path, body, method = body ? "POST" : "GET", headers = {}) => {
      const r = await fetch(base + path, {
        method,
        headers: {
          ...(body ? { "content-type": "application/json", origin: base } : {}),
          cookie,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (r.headers.has("set-cookie"))
        cookie = r.headers.get("set-cookie").split(";")[0];
      return { status: r.status, body: await r.json(), headers: r.headers };
    };
  }
  return { alice: client(), bob: client(), anonymous: client(), base };
}
test("HTTP flow shares real goals across two authenticated browsers and enforces ownership", async (t) => {
  const { alice, bob, anonymous } = await setup(t);
  const profile = await alice("/api/profile", { name: "Alice", color: "sage" });
  assert.match(profile.headers.get("set-cookie"), /HttpOnly/);
  await bob("/api/profile", { name: "Basile", color: "clay" });
  const { body: s } = await alice("/api/sessions", {
    title: "Algèbre",
    room: "Study Room 1",
    duration: 60,
    note: "",
  });
  const { body: task } = await alice(`/api/sessions/${s.id}/tasks`, {
    title: "Exercice 1",
  });
  assert.equal((await anonymous(`/api/sessions/${s.id}`)).body.preview, true);
  await bob(`/api/sessions/${s.id}/join`, {});
  assert.equal(
    (await bob(`/api/sessions/${s.id}`)).body.participants[0].tasks[0].title,
    "Exercice 1",
  );
  assert.equal(
    (
      await bob(
        `/api/sessions/${s.id}/tasks/${task.id}`,
        { status: "done" },
        "PATCH",
      )
    ).status,
    403,
  );
  assert.equal((await bob(`/api/sessions/${s.id}/finish`, {})).status, 403);
  assert.equal(
    (
      await alice(
        `/api/sessions/${s.id}/tasks/${task.id}`,
        { status: "done" },
        "PATCH",
      )
    ).status,
    200,
  );
  assert.equal(
    (await bob(`/api/sessions/${s.id}`)).body.participants[0].tasks[0].status,
    "done",
  );
});
test("malformed inputs, cross-origin mutations and unsigned visitors are rejected", async (t) => {
  const { alice, anonymous } = await setup(t);
  assert.equal(
    (await alice("/api/profile", { name: "", color: "sage" })).status,
    400,
  );
  assert.equal(
    (
      await alice("/api/profile", { name: "Alice", color: "sage" }, "POST", {
        origin: "https://unrelated.example",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await anonymous("/api/sessions", {
        title: "Unauthenticated",
        room: "Room",
        duration: 30,
      })
    ).status,
    401,
  );
  await alice("/api/profile", { name: "Alice", color: "sage" });
  assert.equal(
    (
      await alice("/api/sessions", {
        title: "Bad duration",
        room: "Room",
        duration: -50,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await alice("/api/sessions", {
        title: "Bad duration",
        room: "Room",
        duration: 999999999,
      })
    ).status,
    400,
  );
});
