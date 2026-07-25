import { api } from "../../../scripts/api.js";
import { getConfig } from "./config.js";

// Lora tree fetch (cached per session, refetch on popup open if stale)

let _treeCache = null;
let _treeCacheTime = 0;
const TREE_CACHE_MS = 15000; // refresh at most every 15s so new files show up reasonably fast

// Flat set of every valid lora path the backend reports (the exact strings
// get_filename_list("loras") returns, which is what an entry's `lora` field
// stores). Stays null until the first successful tree fetch so we never flag
// rows as "missing" before we actually know what's on disk.
let validLoraPaths = null;

function _normLora(p) {
  // Normalize separators so a workflow saved on one OS doesn't read as
  // "missing" on another; the flag is purely cosmetic so being lenient here
  // only ever avoids false positives.
  return String(p).replace(/\\/g, "/");
}

// Walk the nested tree collecting every value in every __full_paths__ map -
// those values are the full relative paths, i.e. the source of truth for
// what's installed. Rebuilt on each tree fetch so added/removed files show up.
function _rebuildValidLoraPaths(tree) {
  const set = new Set();
  (function walk(node) {
    if (!node || typeof node !== "object") return;
    const fp = node.__full_paths__;
    if (fp) {
      for (const k in fp) set.add(_normLora(fp[k]));
    }
    for (const key in node) {
      if (key === "__files__" || key === "__full_paths__") continue;
      walk(node[key]);
    }
  })(tree);
  validLoraPaths = set;
}

// True only when we have a loaded list AND this lora isn't in it. Unknown
// (list not loaded yet / fetch failed) -> false, so we fail safe toward
// "not missing" rather than lighting up every row red on a transient hiccup.
export function isLoraMissing(loraName) {
  if (!validLoraPaths || !loraName) return false;
  return !validLoraPaths.has(_normLora(loraName));
}

export async function fetchLoraTree(force = false) {
  const now = Date.now();
  if (!force && _treeCache && now - _treeCacheTime < TREE_CACHE_MS) {
    return _treeCache;
  }
  const { api_prefix, log_prefix } = getConfig();
  try {
    const res = await api.fetchApi(`${api_prefix}/tree`);
    const data = await res.json();
    _treeCache = data;
    _treeCacheTime = now;
    _rebuildValidLoraPaths(data);
    return data;
  } catch (e) {
    console.error(`${log_prefix} Failed to fetch lora tree`, e);
    return _treeCache || { __files__: [] };
  }
}
