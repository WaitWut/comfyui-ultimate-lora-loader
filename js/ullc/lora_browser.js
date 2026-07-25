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
  popup.style.left = Math.min(x, vw - 380) + "px";
  popup.style.top = Math.min(y, vh - 440) + "px";

  const close = () => {
    if (searchTimer) clearTimeout(searchTimer);
    hidePreviewTip();
    overlay.remove();
  };
  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) close();
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
    renderLevel(tree);
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
    renderLevel(tree);
  }

  function renderLevel(tree, { keepSearchFocus = false } = {}) {
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

    // breadcrumbs
    const crumbs = document.createElement("div");
    crumbs.className = "fll-breadcrumbs";

    const rootCrumb = document.createElement("span");
    rootCrumb.className = "fll-crumb" + (path.length === 0 ? " current" : "");
    rootCrumb.textContent = "loras";
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
      crumb.onclick = () => {
        goToPath(path.slice(0, idx + 1), tree);
      };
      crumbs.appendChild(crumb);
    });

    popup.appendChild(crumbs);

    // Primitive filter over the currently visible folder list.
    // Also matches Civitai display names from Toolkit when available.
    const search = document.createElement("input");
    search.type = "search";
    search.className = "fll-search";
    search.placeholder = "Filter folders, files & Civitai names…";
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
        renderLevel(tree, { keepSearchFocus: true });
      }, SEARCH_DEBOUNCE_MS);
    };
    popup.appendChild(search);

    if (keepSearchFocus) {
      // Re-focus after re-render so debounce doesn't steal the caret.
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
          return civitai.includes(q);
        })
      : files;

    if (visibleFolders.length === 0 && visibleFiles.length === 0) {
      const empty = document.createElement("div");
      empty.className = "fll-empty";
      empty.textContent = q ? "No matches" : "No LoRAs here";
      popup.appendChild(empty);
      return;
    }

    for (const folder of visibleFolders) {
      const entry = document.createElement("div");
      entry.className = "fll-entry";

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

      popup.appendChild(entry);
    }

    for (const file of visibleFiles) {
      const entry = document.createElement("div");
      entry.className = "fll-entry";

      const icon = document.createElement("span");
      icon.className = "fll-entry-icon";
      icon.textContent = "🔹";

      const full = fullPaths[file] || file;
      const meta = metaForFile(full);
      const civitaiName = (meta?.civitai_model_name || "").trim();
      const coverUrl = meta?.local_cover_path || null;
      const previewBtn = createPreviewButton(coverUrl);

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
      entry.appendChild(labelWrap);

      entry.onclick = () => {
        onSelect(full);
        close();
      };

      popup.appendChild(entry);
    }
  }
}
