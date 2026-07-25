// pysssss "View Lora info" dialog (preview, Civitai link, trained words)
// Soft dependency on comfyui-custom-scripts

let _pysssssModelInfoUrl = null;

export async function resolvePysssssModelInfoUrl() {
  if (_pysssssModelInfoUrl) return _pysssssModelInfoUrl;

  const known = [
    "/extensions/comfyui-custom-scripts/js/modelInfo.js",
    "/extensions/ComfyUI-Custom-Scripts/js/modelInfo.js",
  ];
  for (const url of known) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) {
        _pysssssModelInfoUrl = url;
        return url;
      }
    } catch (_) {
      /* try next */
    }
  }

  const list = await (await fetch("/extensions")).json();
  const hit = (list || []).find((p) => /custom-scripts\/js\/modelInfo\.js$/i.test(p));
  if (hit) {
    _pysssssModelInfoUrl = hit.startsWith("/") ? hit : `/${hit}`;
    return _pysssssModelInfoUrl;
  }

  throw new Error("comfyui-custom-scripts not found (needed for View Lora info)");
}

export async function openPysssssLoraInfo(loraPath, node) {
  try {
    const url = await resolvePysssssModelInfoUrl();
    const mod = await import(/* @vite-ignore */ url);
    if (!mod?.LoraInfoDialog) {
      throw new Error("LoraInfoDialog export missing from modelInfo.js");
    }
    new mod.LoraInfoDialog(loraPath, node).show("loras", loraPath);
  } catch (e) {
    console.error("[UltimateLoraLoaderCivitai] pysssss Lora info failed:", e);
    alert(
      `Could not open View Lora info.\nIs ComfyUI-Custom-Scripts (pysssss) installed?\n\n${e.message || e}`
    );
  }
}
