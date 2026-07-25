"""
Ultimate Lora Loader (Civitai) for ComfyUI
------------------------------------------
Fork of Ultimate Lora Loader with per-row Civitai Toolkit info support.

Identity (node class, API routes, menu name) comes from js/ullc/config.json
so multiple copies can sit side-by-side — edit that one file per install.
"""

import json
from pathlib import Path

import folder_paths
import comfy.sd
import comfy.utils
from aiohttp import web
from server import PromptServer


def _load_config():
    path = Path(__file__).resolve().parent / "js" / "ullc" / "config.json"
    with path.open(encoding="utf-8") as f:
        cfg = json.load(f)
    required = (
        "extension_name",
        "node_class",
        "node_display_name",
        "api_prefix",
        "style_id",
        "log_prefix",
    )
    missing = [k for k in required if k not in cfg]
    if missing:
        raise RuntimeError(f"ullc config.json missing keys: {', '.join(missing)}")
    prefix = str(cfg["api_prefix"]).rstrip("/")
    if not prefix.startswith("/"):
        prefix = "/" + prefix
    cfg["api_prefix"] = prefix
    return cfg


CONFIG = _load_config()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_lora_tree():
    """
    Build a nested dict representing the folder structure of every
    configured `loras` search path, e.g.:

    {
      "__files__": ["root_lora.safetensors"],
      "characters": {
        "__files__": ["lora1.safetensors", "lora2.safetensors"],
      },
      "styles": {
        "__files__": ["anime_style.safetensors"],
        "watercolor": { "__files__": ["v2.safetensors"] }
      }
    }

    Uses folder_paths.get_filename_list("loras") as the source of truth for
    *which* files count (respects ComfyUI's extension filtering + any extra
    search paths from extra_model_paths.yaml), then re-nests them by their
    relative path instead of leaving them flattened with "/" in the name.
    """
    tree = {"__files__": []}

    all_loras = folder_paths.get_filename_list("loras")

    for rel_path in all_loras:
        # rel_path looks like "characters/lora1.safetensors" or "root_lora.safetensors"
        parts = rel_path.replace("\\", "/").split("/")
        filename = parts[-1]
        folders = parts[:-1]

        node = tree
        for folder in folders:
            node = node.setdefault(folder, {"__files__": []})
        node.setdefault("__files__", [])
        node["__files__"].append(filename)
        # store the full relative path alongside the display name so the
        # frontend can send back the exact string get_filename_list expects
        node.setdefault("__full_paths__", {})
        node["__full_paths__"][filename] = rel_path

    return tree


# ---------------------------------------------------------------------------
# API route: GET {api_prefix}/tree  (from config.json)
# Guarded so a duplicate install with the same api_prefix doesn't crash
# ComfyUI with "method HEAD is already registered".
# ---------------------------------------------------------------------------

_TREE_ROUTE = f"{CONFIG['api_prefix']}/tree"


async def get_lora_tree(request):
    try:
        tree = _build_lora_tree()
        return web.json_response(tree)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


_existing_paths = {getattr(r, "path", None) for r in PromptServer.instance.routes}
if _TREE_ROUTE not in _existing_paths:
    PromptServer.instance.routes.get(_TREE_ROUTE)(get_lora_tree)
else:
    print(
        f"{CONFIG['log_prefix']} Route {_TREE_ROUTE} already registered "
        "(duplicate custom_nodes install with the same api_prefix?). Skipping."
    )


# ---------------------------------------------------------------------------
# Node
# ---------------------------------------------------------------------------

class UltimateLoraLoaderCivitai:
    """
    Dynamic-stack LoRA loader. The list of loras is stored as a single
    JSON-serialized widget value ("loras_data") that the JS frontend
    manages entirely (add/remove/reorder/toggle/strength). Python just
    reads that JSON and applies each enabled entry in order.
    """

    NODE_NAME = CONFIG["node_display_name"]

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "model": ("MODEL",),
                # Hidden-ish widget that actually carries the data; the JS
                # widget draws the real UI (rows, add-lora button, popup)
                # and keeps this string in sync.
                "loras_data": ("STRING", {"default": "[]", "multiline": False}),
            },
            "optional": {
                # CLIP is optional: some pipelines (video/upscale/ControlNet-only
                # workflows) never touch CLIP, and some users want to apply
                # LoRAs to just the UNet even when CLIP exists elsewhere. When
                # not connected, we skip the CLIP side of each LoRA patch
                # entirely (mirroring ComfyUI core's own LoraLoaderModelOnly,
                # which calls load_lora_for_models(model, None, ..., strength_clip=0)
                # - clip=None is an explicitly supported case, not a hack).
                "clip": ("CLIP",),
            },
        }

    RETURN_TYPES = ("MODEL", "CLIP")
    RETURN_NAMES = ("MODEL", "CLIP")
    FUNCTION = "load_loras"
    CATEGORY = "loaders"

    def load_loras(self, model, loras_data, clip=None):
        import json

        try:
            entries = json.loads(loras_data) if loras_data else []
        except Exception:
            entries = []

        out_model = model
        out_clip = clip

        for entry in entries:
            if not entry.get("enabled", True):
                continue

            lora_name = entry.get("lora")
            if not lora_name:
                continue

            strength_model = float(entry.get("strengthModel", entry.get("strength", 1.0)))
            # If clip isn't connected, force strength_clip to 0 regardless of
            # what's stored in the entry - there's no CLIP object to patch,
            # and comfy.sd.load_lora_for_models expects strength_clip=0 when
            # clip is None (this is the exact pattern ComfyUI core's
            # LoraLoaderModelOnly uses internally).
            strength_clip = float(entry.get("strengthClip", entry.get("strength", 1.0))) if out_clip is not None else 0.0

            if strength_model == 0 and strength_clip == 0:
                continue

            lora_path = folder_paths.get_full_path("loras", lora_name)
            if lora_path is None:
                print(f"{CONFIG['log_prefix']} Could not find lora: {lora_name}, skipping.")
                continue

            lora_sd = comfy.utils.load_torch_file(lora_path, safe_load=True)

            out_model, out_clip = comfy.sd.load_lora_for_models(
                out_model, out_clip, lora_sd, strength_model, strength_clip
            )

        return (out_model, out_clip)


NODE_CLASS_MAPPINGS = {
    CONFIG["node_class"]: UltimateLoraLoaderCivitai,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    CONFIG["node_class"]: CONFIG["node_display_name"],
}
