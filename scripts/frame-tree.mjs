/**
 * Print one frame's subtree from a saved section snapshot, so a sync can read
 * geometry without spending another `get_metadata` call on Figma.
 *
 *   node scripts/frame-tree.mjs <node-id> [snapshot]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const [, , wanted, file = `${ROOT}docs/design/snapshots/parent.json`] = process.argv;
const id = String(wanted ?? "").replace(/-/g, ":");

const find = (n) =>
  n.id === id ? n : (n.children ?? []).reduce((hit, c) => hit ?? find(c), null);

const frame = find(JSON.parse(readFileSync(file, "utf8")));
if (!frame) {
  console.error(`No node ${id} in ${file}`);
  process.exit(1);
}

const n = (v) => (typeof v === "number" ? Math.round(v) : v);
(function print(node, depth = 0) {
  const pad = "  ".repeat(depth);
  const box = ["x", "y", "width", "height"].every((k) => k in node)
    ? ` [${n(node.x)},${n(node.y)} ${n(node.width)}x${n(node.height)}]`
    : "";
  console.log(`${pad}${node.type} ${node.id}${box} ${node.name}`);
  for (const c of node.children ?? []) print(c, depth + 1);
})(frame);
