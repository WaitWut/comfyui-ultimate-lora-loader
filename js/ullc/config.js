/**
 * Shared package identity. Edit config.json to run multiple copies
 * of this custom node side-by-side (unique extension_name, node_class,
 * api_prefix, style_id).
 */

let _config = null;

export async function loadConfig() {
  if (_config) return _config;
  const res = await fetch(new URL("./config.json", import.meta.url));
  if (!res.ok) {
    throw new Error(`Failed to load ullc config.json (HTTP ${res.status})`);
  }
  _config = await res.json();
  return _config;
}

export function getConfig() {
  if (!_config) {
    throw new Error("ullc config not loaded yet — call await loadConfig() first");
  }
  return _config;
}
