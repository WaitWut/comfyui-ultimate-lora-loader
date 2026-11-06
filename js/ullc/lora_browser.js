import { fetchLoraTree } from "./lora_tree.js";
import { fetchCivitaiLocalModels, findCivitaiModel } from "./civitai_toolkit_info.js";
import { createPreviewButton, hidePreviewTip } from "./preview_tip.js";

// Folder browser popup

/**
 * Collect every file under `node` (recursive).
 * Returns [{ file, full, relFromRoot }] where relFromRoot is the path
 * relative to the search root (folders joined with "/").
 */
function flattenFiles(node, folderPrefix = []) {
  const out = [];
  if (!node || typeof node !== "object") return out;

  const fullPaths = node.__full_paths__ || {};
  for (const file of node.__files__ || []) {
    const full = fullPaths[file] || [...folderPrefix, file].join("/");
    const relFromRoot = [...folderPrefix, file].join("/");
    out.push({ file, full, relFromRoot, folderPrefix: folderPrefix.slice() });
  }

  for (const key of Object.keys(node)) {
    if (key === "__files__" || key === "__full_paths__") continue;
    out.push(...flattenFiles(node[key], [...folderPrefix, key]));
  }
  return out;
}

/**
 * Opens a folder-drill-down popup anchored near (x, y).
 * Calls onSelect(fullRelativePath) when a file is chosen.
 *
 * Search: empty = browse current folder; non-empty = recursive search
 * within the subtree rooted at the current breadcrumb path.
 */
export function openLoraBrowser(x, y, onSelect) {
  const overlay = document.createElement("div");
  overlay.className = "fll-popup-overlay";

  const popup = document.createElement("div");
  popup.className = "fll-popup";

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // position, clamped to viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  popup.style.left = Math.min(x, vw - 620) + "px";
  popup.style.top = Math.min(y, vh - 440) + "px";

  const close = () => {
    if (searchTimer) clearTimeout(searchTimer);
    document.removeEventListener("keydown", onPopupKeyDown, true);
    hidePreviewTip();
    overlay.remove();
  };
  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) close();
  });

  function getFocusables() {
    const search = popup.querySelector(".fll-search");
    const crumbs = [...popup.querySelectorAll(".fll-crumb:not(.current)")];
    const groups = [...popup.querySelectorAll(".fll-search-group.clickable")];
    const entries = [...popup.querySelectorAll(".fll-entry")];
    return [search, ...groups, ...entries, ...crumbs].filter(Boolean);
  }

  function cycleFocus(backward) {
    const items = getFocusables();
    if (!items.length) return;
    const active = document.activeElement;
    let i = items.indexOf(active);
    if (i === -1) i = backward ? 0 : -1;
    const next = items[(i + (backward ? -1 : 1) + items.length) % items.length];
    next.focus();
    if (next.classList.contains("fll-entry")) {
      next.scrollIntoView({ block: "nearest" });
    }
  }

  function onPopupKeyDown(e) {
    if (!overlay.isConnected) return;
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    // Keep Tab inside the popup; don't let Comfy steal focus.
    e.preventDefault();
    e.stopPropagation();
    cycleFocus(e.shiftKey);
  }
  document.addEventListener("keydown", onPopupKeyDown, true);

  // Enter / Space activate focused crumb or entry (Tab lands on them).
  popup.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    if (
      el.classList.contains("fll-entry") ||
      el.classList.contains("fll-crumb") ||
      el.classList.contains("fll-search-group")
    ) {
      e.preventDefault();
      e.stopPropagation();
      el.click();
    }
  });

  let path = []; // array of folder names representing current drill-down position
  let searchQuery = "";
  let searchTimer = null;
  const SEARCH_DEBOUNCE_MS = 200;
  let civitaiModels = null; // Toolkit index (optional)

  Promise.all([
    fetchLoraTree(),
    fetchCivitaiLocalModels().catch(() => null),
  ]).then(([tree, models]) => {
    civitaiModels = models;
    renderLevel(tree, { focusSearch: true });
  });

  function metaForFile(fullPath) {
    if (!civitaiModels || !fullPath) return null;
    return findCivitaiModel(civitaiModels, fullPath);
  }

  function matchesQuery(q, { file, full, relFromRoot }, meta) {
    if (file.toLowerCase().includes(q)) return true;
    if (relFromRoot.toLowerCase().includes(q)) return true;
    if (full.toLowerCase().includes(q)) return true;
    const civitai = (meta?.civitai_model_name || "").toLowerCase();
    if (civitai.includes(q)) return true;
    const base = (meta?.base_model || "").toLowerCase();
    return base.includes(q);
  }

  function goToPath(nextPath, tree) {
    path = nextPath;
    searchQuery = "";
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }
    renderLevel(tree, { focusSearch: true });
  }

  function focusSearchInput(search) {
    requestAnimationFrame(() => {
      search.focus();
      const len = search.value.length;
      try {
        search.setSelectionRange(len, len);
      } catch (_) {
        /* search inputs in some browsers are picky about selection */
      }
    });
  }

  function appendFileEntry(list, { file, full, pathHint }) {
    const entry = document.createElement("div");
    entry.className = "fll-entry";
    entry.tabIndex = 0;

    const icon = document.createElement("span");
    icon.className = "fll-entry-icon";
    icon.textContent = "🔹";

    const meta = metaForFile(full);
    const civitaiName = (meta?.civitai_model_name || "").trim();
    const coverUrl = meta?.local_cover_path || null;
    const previewBtn = createPreviewButton(coverUrl);

    const baseModel = document.createElement("div");
    baseModel.className = "fll-base-model";
    const bm = (meta?.base_model || "").trim();
    if (bm) {
      baseModel.textContent = bm;
      baseModel.title = bm;
    } else {
      baseModel.classList.add("empty");
      baseModel.textContent = "—";
    }

    const labelWrap = document.createElement("div");
    labelWrap.className = "fll-entry-label-wrap";

    // In search hits, show folder structure first so you see where it lives.
    if (pathHint) {
      const pathLine = document.createElement("span");
      pathLine.className = "fll-entry-path";
      pathLine.textContent = "📁 " + pathHint.split("/").join(" / ");
      pathLine.title = pathHint;
      labelWrap.appendChild(pathLine);
    }

    const label = document.createElement("span");
    label.className = "fll-entry-label";
    if (civitaiName && civitaiName.toLowerCase() !== file.toLowerCase()) {
      label.textContent = civitaiName;
      const sub = document.createElement("span");
      sub.className = "fll-entry-label-sub";
      sub.textContent = file;
      labelWrap.appendChild(label);
      labelWrap.appendChild(sub);
    } else {
      label.textContent = file;
      labelWrap.appendChild(label);
    }

    const tipLines = [];
    if (pathHint) tipLines.push(pathHint);
    if (civitaiName) tipLines.push(civitaiName);
    tipLines.push(full);
    labelWrap.title = tipLines.join("\n");

    entry.appendChild(icon);
    entry.appendChild(previewBtn);
    entry.appendChild(baseModel);
    entry.appendChild(labelWrap);

    entry.onclick = () => {
      onSelect(full);
      close();
    };

    list.appendChild(entry);
  }

  function renderLevel(tree, { focusSearch = false } = {}) {
    hidePreviewTip();

    // walk to current path
    let node = tree;
    for (const seg of path) {
      node = node[seg];
      if (!node) {
        // path became invalid (e.g. folder deleted) - reset to root
        path = [];
        node = tree;
        break;
      }
    }

    popup.innerHTML = "";

    const header = document.createElement("div");
    header.className = "fll-popup-header";

    // breadcrumbs
    const crumbs = document.createElement("div");
    crumbs.className = "fll-breadcrumbs";

    const rootCrumb = document.createElement("span");
    rootCrumb.className = "fll-crumb" + (path.length === 0 ? " current" : "");
    rootCrumb.textContent = "loras";
    if (path.length > 0) rootCrumb.tabIndex = 0;
    rootCrumb.onclick = () => {
      goToPath([], tree);
    };
    crumbs.appendChild(rootCrumb);

    path.forEach((seg, idx) => {
      const sep = document.createElement("span");
      sep.className = "fll-crumb-sep";
      sep.textContent = "/";
      crumbs.appendChild(sep);

      const crumb = document.createElement("span");
      const isCurrent = idx === path.length - 1;
      crumb.className = "fll-crumb" + (isCurrent ? " current" : "");
      crumb.textContent = seg;
      if (!isCurrent) crumb.tabIndex = 0;
      crumb.onclick = () => {
        goToPath(path.slice(0, idx + 1), tree);
      };
      crumbs.appendChild(crumb);
    });

    header.appendChild(crumbs);

    const q = searchQuery.trim().toLowerCase();
    const scopeLabel = path.length ? path.join("/") : "all folders";

    const search = document.createElement("input");
    search.type = "search";
    search.className = "fll-search";
    search.placeholder = q
      ? `Search in ${scopeLabel}…`
      : `Search in ${scopeLabel} (name / file / base)…`;
    search.value = searchQuery;
    search.autocomplete = "off";
    search.spellcheck = false;
    // Stop Comfy/LiteGraph from eating keystrokes while typing in the popup.
    search.addEventListener("keydown", (e) => e.stopPropagation());
    search.addEventListener("keyup", (e) => e.stopPropagation());
    search.addEventListener("keypress", (e) => e.stopPropagation());
    search.oninput = () => {
      const pending = search.value;
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchQuery = pending;
        renderLevel(tree, { focusSearch: true });
      }, SEARCH_DEBOUNCE_MS);
    };
    header.appendChild(search);
    popup.appendChild(header);

    const list = document.createElement("div");
    list.className = "fll-popup-list";

    if (q) {
      // Recursive search under the current breadcrumb root, grouped by folder.
      const hits = flattenFiles(node)
        .filter((item) => matchesQuery(q, item, metaForFile(item.full)))
        .sort((a, b) => a.relFromRoot.localeCompare(b.relFromRoot));

      if (hits.length === 0) {
        const empty = document.createElement("div");
        empty.className = "fll-empty";
        empty.textContent = "No matches";
        list.appendChild(empty);
      } else {
        const groups = new Map(); // folderKey -> hits[]
        for (const hit of hits) {
          const key = hit.folderPrefix.join("/") || "";
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(hit);
        }

        for (const [folderKey, groupHits] of groups) {
          const groupHeader = document.createElement("div");
          groupHeader.className = "fll-search-group";
          const groupLabel = folderKey
            ? "📁 " + folderKey.split("/").join(" / ")
            : "📁 loras (root)";
          groupHeader.textContent = `${groupLabel}  ·  ${groupHits.length}`;
          groupHeader.title = folderKey
            ? `Open folder: ${folderKey}`
            : "Already at root";
          if (folderKey) {
            groupHeader.classList.add("clickable");
            groupHeader.tabIndex = 0;
            groupHeader.onclick = () => {
              goToPath([...path, ...folderKey.split("/")], tree);
            };
          }
          list.appendChild(groupHeader);

          for (const hit of groupHits) {
            appendFileEntry(list, {
              file: hit.file,
              full: hit.full,
              pathHint: "", // group header already shows the folder
            });
          }
        }
      }

      popup.appendChild(list);
      if (focusSearch) focusSearchInput(search);
      return;
    }

    // Browse mode: only the current folder level.
    const subfolders = Object.keys(node)
      .filter((k) => k !== "__files__" && k !== "__full_paths__")
      .sort((a, b) => a.localeCompare(b));

    const files = (node.__files__ || []).slice().sort((a, b) => a.localeCompare(b));
    const fullPaths = node.__full_paths__ || {};

    if (subfolders.length === 0 && files.length === 0) {
      const empty = document.createElement("div");
      empty.className = "fll-empty";
      empty.textContent = "No LoRAs here";
      list.appendChild(empty);
      popup.appendChild(list);
      if (focusSearch) focusSearchInput(search);
      return;
    }

    for (const folder of subfolders) {
      const entry = document.createElement("div");
      entry.className = "fll-entry";
      entry.tabIndex = 0;

      const icon = document.createElement("span");
      icon.className = "fll-entry-icon";
      icon.textContent = "📁";

      const label = document.createElement("span");
      label.className = "fll-entry-label";
      label.textContent = folder;

      const arrow = document.createElement("span");
      arrow.className = "fll-entry-arrow";
      arrow.textContent = "▸";

      entry.appendChild(icon);
      entry.appendChild(label);
      entry.appendChild(arrow);

      entry.onclick = () => {
        goToPath([...path, folder], tree);
      };

      list.appendChild(entry);
    }

    for (const file of files) {
      appendFileEntry(list, {
        file,
        full: fullPaths[file] || file,
        pathHint: "",
      });
    }

    popup.appendChild(list);
    if (focusSearch) focusSearchInput(search);
  }
}
