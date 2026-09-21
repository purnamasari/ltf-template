#!/usr/bin/env node
/**
 * Frame registry tooling.
 *
 *   node scripts/frames.mjs scan <metadata.json> [--apply]
 *   node scripts/frames.mjs table
 *
 * `scan` takes a get_metadata dump of the parent section (docs/design/frames.json
 * → parent.nodeId) and compares its direct children against the registry. It
 * prints a short table; the dump itself never has to be read by anyone. With
 * --apply it writes back re-resolved node ids and any frame names it learned.
 *
 * `table` regenerates the human-readable table in frames.md from the registry,
 * so the two can never drift.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// fileURLToPath, not URL.pathname: on Windows the latter yields "/D:/repo/",
// which Node then resolves against the drive root as "D:\D:\repo".
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const REGISTRY = `${ROOT}docs/design/frames.json`;
const DOC = `${ROOT}docs/design/frames.md`;

const id = (v) => String(v ?? "").replace(/-/g, ":").trim();
const read = (p) => JSON.parse(readFileSync(p, "utf8"));

/** Depth-first walk of whatever shape the metadata dump arrived in. */
function* walk(node, depth = 0) {
  if (Array.isArray(node)) {
    for (const n of node) yield* walk(n, depth);
    return;
  }
  if (!node || typeof node !== "object") return;
  if (node.id) yield { node, depth };
  for (const kids of [node.children, node.nodes, node.frames]) {
    if (Array.isArray(kids)) for (const k of kids) yield* walk(k, depth + 1);
    else if (kids && typeof kids === "object") yield* walk(Object.values(kids), depth + 1);
  }
}

/** The direct children of the parent section — the frames of the flow. */
function framesOf(dump, parentId) {
  const all = [...walk(dump)];
  const parent = all.find((n) => id(n.node.id) === parentId);
  const kids = parent ? parent.node.children : null;
  const list = Array.isArray(kids) && kids.length
    ? kids
    : (() => {
        // No parent wrapper in the dump — fall back to the shallowest layer
        // that holds more than one node, which is the frame row on the canvas.
        const byDepth = new Map();
        for (const { node, depth } of all) {
          if (!byDepth.has(depth)) byDepth.set(depth, []);
          byDepth.get(depth).push(node);
        }
        const depths = [...byDepth.keys()].sort((a, b) => a - b);
        return byDepth.get(depths.find((d) => byDepth.get(d).length > 1) ?? depths[0]) ?? [];
      })();

  return list.map((n) => ({
    nodeId: id(n.id),
    name: String(n.name ?? "").trim(),
    x: Number(n.x ?? n.absoluteBoundingBox?.x ?? 0),
    y: Number(n.y ?? n.absoluteBoundingBox?.y ?? 0),
  }));
}

function scan(dumpPath, apply) {
  const reg = read(REGISTRY);
  const parentId = id(reg.parent.nodeId);
  const found = framesOf(read(dumpPath), parentId);

  if (!found.length) {
    console.error(
      `No frames found in ${dumpPath}.\n` +
        `Expected JSON holding the parent node ${parentId} with a children array of\n` +
        `{ id, name, x, y } objects. Save the get_metadata output verbatim and retry.`
    );
    process.exit(2);
  }

  const byId = new Map(found.map((f) => [f.nodeId, f]));
  const claimed = new Set();
  const rows = [];

  // Pass 1 — the id still exists. The ordinary case.
  for (const e of reg.frames) {
    const hit = byId.get(id(e.nodeId));
    if (!hit) continue;
    claimed.add(hit.nodeId);
    const renamed = e.figmaName && hit.name && e.figmaName !== hit.name;
    rows.push({
      state: e.figmaName === null ? "learned" : renamed ? "renamed" : "ok",
      entry: e,
      hit,
      note: e.figmaName === null ? `name is "${hit.name}"` : renamed ? `"${e.figmaName}" → "${hit.name}"` : "",
    });
    if (apply) e.figmaName = hit.name || e.figmaName;
  }

  // Pass 2 — the id is gone. A duplicate-and-replace keeps the name, so try that
  // next, then fall back to the nearest unclaimed frame on the canvas.
  const orphans = reg.frames.filter((e) => !byId.has(id(e.nodeId)));
  const free = () => found.filter((f) => !claimed.has(f.nodeId));

  for (const e of orphans) {
    const pool = free();
    const sameName = e.figmaName ? pool.filter((f) => f.name === e.figmaName) : [];
    let hit = null;
    let how = "";
    if (sameName.length === 1) {
      [hit] = sameName;
      how = "matched by name";
    } else if (sameName.length > 1) {
      hit = sameName.sort((a, b) => a.x - b.x)[0];
      how = `${sameName.length} frames share this name — took the leftmost, check this one`;
    }
    if (hit) {
      claimed.add(hit.nodeId);
      rows.push({ state: "re-id", entry: e, hit, note: `${id(e.nodeId)} → ${hit.nodeId}, ${how}` });
      if (apply) e.nodeId = hit.nodeId;
    } else {
      rows.push({ state: "missing", entry: e, hit: null, note: `${id(e.nodeId)} is no longer under the parent` });
    }
  }

  const added = free().sort((a, b) => a.x - b.x);

  const w = (s, n) => String(s).padEnd(n);
  const order = { missing: 0, "re-id": 1, renamed: 2, learned: 3, ok: 4 };
  rows.sort((a, b) => order[a.state] - order[b.state]);

  console.log(`parent ${parentId} — ${found.length} frames in Figma, ${reg.frames.length} in the registry\n`);
  console.log(`${w("state", 9)}${w("key", 14)}${w("route", 12)}note`);
  for (const r of rows) console.log(`${w(r.state, 9)}${w(r.entry.key, 14)}${w(r.entry.route, 12)}${r.note}`);
  for (const f of added) console.log(`${w("NEW", 9)}${w("—", 14)}${w("—", 12)}${f.nodeId} "${f.name}" — no row in the registry`);

  const attention = rows.filter((r) => r.state !== "ok" && r.state !== "learned").length + added.length;
  console.log(`\n${attention} frame(s) need a decision.`);
  if (added.length && rows.some((r) => r.state === "missing")) {
    console.log(
      "A missing row alongside a new frame is usually one screen rebuilt, not two changes.\n" +
        "Confirm with the designer before treating it as a new screen."
    );
  }

  if (apply) {
    writeFileSync(REGISTRY, `${JSON.stringify(reg, null, 2)}\n`);
    console.log(`\nWrote re-resolved ids and names to ${REGISTRY.replace(ROOT, "")}.`);
  } else if (attention || rows.some((r) => r.state === "learned")) {
    console.log("Re-run with --apply to write the resolved ids and names back.");
  }
}

function table() {
  const reg = read(REGISTRY);
  const body = [
    "| Route | Frame | Figma name | Node id | Implemented in | Synced |",
    "| --- | --- | --- | --- | --- | --- |",
    ...reg.frames.map(
      (f) =>
        `| \`${f.route}\` | ${f.describes} | ${f.figmaName ? `${f.figmaName}` : "_not yet scanned_"} | \`${f.nodeId}\` | \`${f.file}\` | ${f.synced} |`
    ),
  ].join("\n");

  const doc = readFileSync(DOC, "utf8");
  const next = doc.replace(
    /(<!-- frames:begin -->)[\s\S]*?(<!-- frames:end -->)/,
    `$1\n\n${body}\n\n$2`
  );
  if (next === doc) {
    console.error("No <!-- frames:begin --> / <!-- frames:end --> markers in frames.md.");
    process.exit(2);
  }
  writeFileSync(DOC, next);
  console.log(`Rewrote the table in ${DOC.replace(ROOT, "")} from ${reg.frames.length} registry entries.`);
}

const [mode, arg] = process.argv.slice(2);
if (mode === "scan" && arg) scan(arg, process.argv.includes("--apply"));
else if (mode === "table") table();
else {
  console.error("usage: frames.mjs scan <metadata.json> [--apply] | frames.mjs table");
  process.exit(1);
}
