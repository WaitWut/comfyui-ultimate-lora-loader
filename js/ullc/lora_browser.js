import { fetchLoraTree } from "./lora_tree.js";
import { fetchCivitaiLocalModels, findCivitaiModel } from "./civitai_toolkit_info.js";
import { createPreviewButton, hidePreviewTip } from "./preview_tip.js";

// Folder browser popup

/**
 * Opens a folder-drill-down popup anchored near (x, y).
 * Calls onSelect(fullRelativePath) when a file is chosen.
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
    const entries = [...popup.querySelectorAll(".fll-entry")];
    return [search, ...entries, ...crumbs].filter(Boolean);
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
    if (el.classList.contains("fll-entry") || el.classList.contains("fll-crumb")) {
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

    // Primitive filter over the currently visible folder list.
    // Also matches Civitai display names from Toolkit when available.
    const search = document.createElement("input");
    search.type = "search";
    search.className = "fll-search";
    search.placeholder = "Filter name / file / base model…";
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

    // subfolders (any key that isn't __files__ / __full_paths__)
    const subfolders = Object.keys(node)
      .filter((k) => k !== "__files__" && k !== "__full_paths__")
      .sort((a, b) => a.localeCompare(b));

    const files = (node.__files__ || []).slice().sort((a, b) => a.localeCompare(b));
    const fullPaths = node.__full_paths__ || {};

    const q = searchQuery.trim().toLowerCase();
    const visibleFolders = q
      ? subfolders.filter((f) => f.toLowerCase().includes(q))
      : subfolders;
    const visibleFiles = q
      ? files.filter((f) => {
          if (f.toLowerCase().includes(q)) return true;
          const full = fullPaths[f] || f;
          const meta = metaForFile(full);
          const civitai = (meta?.civitai_model_name || "").toLowerCase();
          if (civitai.includes(q)) return true;
          const base = (meta?.base_model || "").toLowerCase();
          return base.includes(q);
        })
      : files;

    if (visibleFolders.length === 0 && visibleFiles.length === 0) {
      const empty = document.createElement("div");
      empty.className = "fll-empty";
      empty.textContent = q ? "No matches" : "No LoRAs here";
      list.appendChild(empty);
      popup.appendChild(list);
      if (focusSearch) focusSearchInput(search);
      return;
    }

    for (const folder of visibleFolders) {
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

    for (const file of visibleFiles) {
      const entry = document.createElement("div");
      entry.className = "fll-entry";
      entry.tabIndex = 0;

      const icon = document.createElement("span");
      icon.className = "fll-entry-icon";
      icon.textContent = "🔹";

      const full = fullPaths[file] || file;
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

      const label = document.createElement("span");
      label.className = "fll-entry-label";
      if (civitaiName && civitaiName.toLowerCase() !== file.toLowerCase()) {
        label.textContent = civitaiName;
        const sub = document.createElement("span");
        sub.className = "fll-entry-label-sub";
        sub.textContent = file;
        labelWrap.appendChild(label);
        labelWrap.appendChild(sub);
        labelWrap.title = `${civitaiName}\n${full}`;
      } else {
        label.textContent = file;
        label.title = file;
        labelWrap.appendChild(label);
      }

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

    popup.appendChild(list);
    if (focusSearch) focusSearchInput(search);
  }
}
