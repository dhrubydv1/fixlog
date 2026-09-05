import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

// Exercise the real route handlers with isolated auth and database dependencies.
// Lazy queries model Prisma's array transactions; failed transactions roll back.
class PrismaError extends Error {
  constructor(code) { super(code); this.code = code; }
}

function fixture() {
  let state = { notification: [], helpfulVote: [], fixReport: [], fix: [{
    id: 10, userId: "owner", title: "Prisma connection fix", visibility: "PUBLIC",
    problem: "Cannot connect", solution: "Correct the connection", tags: "prisma",
    category: "Database", errorMessage: null, cause: null,
  }] };
  const controls = { userId: "actor", admin: false, failNotification: false, staleVote: false };
  const matches = (row, where = {}) => Object.entries(where).every(([key, value]) =>
    key === "userId_fixId" ? matches(row, value) : row[key] === value);
  const select = (row, fields) => !row ? null : fields
    ? Object.fromEntries(Object.keys(fields).filter((key) => fields[key]).map((key) => [key, row[key]]))
    : { ...row };
  const lazy = (fn) => ({ then: (resolve, reject) => Promise.resolve().then(fn).then(resolve, reject) });
  const db = {};
  for (const model of Object.keys(state)) {
    const rows = () => state[model];
    db[model] = {
      findFirst: ({ where, select: fields }) => lazy(() => select(rows().find((row) => matches(row, where)), fields)),
      findUnique: ({ where, select: fields }) => lazy(() => {
        if (model === "helpfulVote" && controls.staleVote) {
          controls.staleVote = false;
          return null;
        }
        return select(rows().find((row) => matches(row, where)), fields);
      }),
      findMany: ({ where, select: fields, orderBy }) => lazy(() => {
        const result = rows().filter((row) => matches(row, where));
        for (const order of [...(orderBy || [])].reverse()) {
          const [key, direction] = Object.entries(order)[0];
          result.sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * (direction === "desc" ? -1 : 1));
        }
        return result.map((row) => select(row, fields));
      }),
      count: ({ where }) => lazy(() => rows().filter((row) => matches(row, where)).length),
      create: ({ data, select: fields }) => lazy(() => {
        if (model === "notification" && controls.failNotification) throw new Error("write failed");
        if (model === "helpfulVote" && rows().some((row) => row.userId === data.userId && row.fixId === data.fixId)) {
          throw new PrismaError("P2002");
        }
        const row = { id: Math.max(0, ...rows().map((item) => item.id)) + 1, createdAt: new Date(), readAt: null, ...data };
        rows().push(row);
        return select(row, fields);
      }),
      updateMany: ({ where, data }) => lazy(() => {
        const targets = rows().filter((row) => matches(row, where));
        targets.forEach((row) => Object.assign(row, data));
        return { count: targets.length };
      }),
      update: ({ where, data }) => lazy(() => {
        const row = rows().find((item) => matches(item, where));
        if (!row) throw new PrismaError("P2025");
        Object.assign(row, data);
        return { ...row };
      }),
      delete: ({ where }) => lazy(() => {
        const index = rows().findIndex((row) => matches(row, where));
        if (index < 0) throw new PrismaError("P2025");
        return rows().splice(index, 1)[0];
      }),
    };
  }
  db.$transaction = async (work) => {
    const snapshot = structuredClone(state);
    try {
      if (typeof work === "function") return await work(db);
      const results = [];
      for (const query of work) results.push(await query);
      return results;
    } catch (error) { state = snapshot; throw error; }
  };
  const modules = new Map();
  const mocks = {
    "server-only": {},
    "@/lib/prisma": { prisma: db },
    "@/lib/auth": { auth: { api: { getSession: async () => controls.userId
      ? { user: { id: controls.userId, email: "never-return@example.test" } } : null } } },
    "@/lib/admin": { isAdmin: () => controls.admin },
    "@/app/generated/prisma/client": { Prisma: { PrismaClientKnownRequestError: PrismaError } },
  };
  function load(name) {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (modules.has(name)) return modules.get(name);
    const file = path.resolve(testDirectory, "..", name.replace(/^@\//, "") + ".ts");
    const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const loadedModule = { exports: {} };
    new Function("require", "module", "exports", "console", outputText)(load, loadedModule, loadedModule.exports, { error() {} });
    modules.set(name, loadedModule.exports);
    return loadedModule.exports;
  }
  const invoke = (route, method, id, body, query = "") => load(route)[method](
    new Request(`http://localhost/api/test${query}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) }),
    { params: Promise.resolve({ id: String(id) }) },
  );
  return { controls, db, load, invoke, get state() { return state; } };
}

const routes = {
  list: "@/app/api/notifications/route",
  read: "@/app/api/notifications/[id]/route",
  helpful: "@/app/api/community/fixes/[id]/helpful/route",
  save: "@/app/api/community/fixes/[id]/save/route",
  moderate: "@/app/api/admin/fixes/[id]/moderate/route",
};

function seedNotification(f, id, userId = "owner", readAt = null) {
  f.state.notification.push({ id, userId, createdAt: new Date(`2026-09-0${id}T12:00:00Z`), readAt,
    type: "HELPFUL_VOTE", title: "Someone found your Fix helpful.", message: "Prisma connection fix", link: "/fixes/10" });
}

test("notification endpoints require a session", async () => {
  const f = fixture();
  f.controls.userId = null;
  for (const [route, method] of [[routes.list, "GET"], [routes.read, "PATCH"]]) {
    assert.equal((await f.invoke(route, method, 1)).status, 401);
  }
});

test("inbox and unread count only include caller records, with no identity fields", async () => {
  const f = fixture();
  f.controls.userId = "owner";
  seedNotification(f, 1);
  seedNotification(f, 2, "owner", new Date());
  seedNotification(f, 3, "other");
  const response = await f.invoke(routes.list, "GET", null, null, "?userId=other");
  const inbox = await response.json();
  assert.deepEqual(inbox.notifications.map((item) => item.id), [2, 1]);
  assert.equal(inbox.unreadCount, 1);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.deepEqual(Object.keys(inbox.notifications[0]).sort(), ["id", "createdAt", "readAt", "type", "title", "message", "link"].sort());
  const count = await f.invoke(routes.list, "GET", null, null, "?unreadCountOnly=true&userId=other");
  assert.deepEqual(await count.json(), { unreadCount: 1 });
});

test("mark-as-read rejects foreign and missing records identically, ignoring browser ownership", async () => {
  const f = fixture();
  seedNotification(f, 1);
  const foreign = await f.invoke(routes.read, "PATCH", 1, { userId: "owner", readAt: "2000-01-01" });
  const missing = await f.invoke(routes.read, "PATCH", 99);
  assert.equal(foreign.status, 404);
  assert.equal(missing.status, 404);
  assert.deepEqual(await foreign.json(), await missing.json());
  assert.equal(f.state.notification[0].readAt, null);
});

test("read timestamp is server-controlled and repeated PATCH preserves it", async () => {
  const f = fixture();
  f.controls.userId = "owner";
  seedNotification(f, 1);
  const first = await (await f.invoke(routes.read, "PATCH", 1, { readAt: "2000-01-01", userId: "other" })).json();
  const second = await (await f.invoke(routes.read, "PATCH", 1)).json();
  assert.ok(first.notification.readAt);
  assert.notEqual(first.notification.readAt, "2000-01-01");
  assert.equal(second.notification.readAt, first.notification.readAt);
  assert.equal("userId" in first.notification, false);
  assert.equal((await (await f.invoke(routes.list, "GET")).json()).unreadCount, 0);
  for (const id of ["0", "-1", "NaN", "1.1", "2147483648"]) {
    assert.equal((await f.invoke(routes.read, "PATCH", id)).status, 400);
  }
});

test("helpful vote notifies owner once, un-vote does not notify", async () => {
  const f = fixture();
  assert.equal((await f.invoke(routes.helpful, "POST", 10)).status, 200);
  assert.equal(f.state.notification.length, 1);
  assert.equal(f.state.notification[0].userId, "owner");
  assert.equal(f.state.notification[0].type, "HELPFUL_VOTE");
  assert.equal(f.state.notification[0].link, "/fixes/10");
  assert.equal((await f.invoke(routes.helpful, "POST", 10)).status, 200);
  assert.equal(f.state.helpfulVote.length, 0);
  assert.equal(f.state.notification.length, 1);
});

test("duplicate vote race does not duplicate the notification", async () => {
  const f = fixture();
  await f.invoke(routes.helpful, "POST", 10);
  f.controls.staleVote = true;
  assert.equal((await f.invoke(routes.helpful, "POST", 10)).status, 200);
  assert.equal(f.state.helpfulVote.length, 1);
  assert.equal(f.state.notification.length, 1);
});

test("save creates a private copy and notifies the original owner", async () => {
  const f = fixture();
  assert.equal((await f.invoke(routes.save, "POST", 10)).status, 201);
  assert.equal(f.state.fix[1].userId, "actor");
  assert.equal(f.state.fix[1].visibility, "PRIVATE");
  assert.equal(f.state.notification[0].userId, "owner");
  assert.equal(f.state.notification[0].type, "FIX_SAVED");
  assert.equal(f.state.notification[0].link, "/fixes/10");
});

test("owners and private Fix activity do not generate helpful/save notifications", async () => {
  for (const route of [routes.helpful, routes.save]) {
    const f = fixture();
    f.controls.userId = "owner";
    assert.equal((await f.invoke(route, "POST", 10)).status, 409);
    f.controls.userId = "actor";
    f.state.fix[0].visibility = "PRIVATE";
    assert.equal((await f.invoke(route, "POST", 10)).status, 404);
    assert.equal(f.state.notification.length, 0);
  }
});

test("moderation hide and delete preserve a safe owner notification; keep does not notify", async () => {
  for (const action of ["KEEP", "HIDE", "DELETE"]) {
    const f = fixture();
    f.controls.admin = true;
    assert.equal((await f.invoke(routes.moderate, "POST", 10, { action, confirmDelete: true })).status, 200);
    if (action === "KEEP") {
      assert.equal(f.state.notification.length, 0);
    } else {
      assert.equal(f.state.notification.length, 1);
      assert.equal(f.state.notification[0].userId, "owner");
      assert.equal(f.state.notification[0].link, "/dashboard");
      assert.equal(f.state.notification[0].type, action === "HIDE" ? "MODERATION_HIDDEN" : "MODERATION_DELETED");
      assert.equal(f.state.notification[0].message, "Prisma connection fix");
      if (action === "HIDE") assert.equal(f.state.fix[0].visibility, "PRIVATE");
      else assert.equal(f.state.fix.length, 0);
    }
  }
});

test("admin self-moderation and unauthorized moderation never self-notify", async () => {
  for (const action of ["HIDE", "DELETE"]) {
    const f = fixture();
    assert.equal((await f.invoke(routes.moderate, "POST", 10, { action, confirmDelete: true })).status, 404);
    f.controls.admin = true;
    f.controls.userId = "owner";
    assert.equal((await f.invoke(routes.moderate, "POST", 10, { action, confirmDelete: true })).status, 200);
    assert.equal(f.state.notification.length, 0);
  }
});

test("notification failure rolls back its vote, copy, or moderation action", async () => {
  for (const [route, body] of [[routes.helpful], [routes.save], [routes.moderate, { action: "HIDE" }], [routes.moderate, { action: "DELETE", confirmDelete: true }]]) {
    const f = fixture();
    f.controls.admin = true;
    f.controls.failNotification = true;
    assert.equal((await f.invoke(route, "POST", 10, body)).status, 500);
    assert.equal(f.state.notification.length, 0);
    assert.equal(f.state.helpfulVote.length, 0);
    assert.equal(f.state.fix.length, 1);
    assert.equal(f.state.fix[0].visibility, "PUBLIC");
  }
});
