import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
// Injected once. Note the `box-sizing: border-box` + width:100% (not 100%+margin)
// on the add-lora button — this is what actually fixes the rgthree overflow bug,
// where the button's own padding/border pushed it past the node's rounded edge.

const STYLE_ID = "ultimate-lora-loader-styles";
if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .fll-container {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      padding: 6px;
      gap: 4px;
      overflow: hidden;
    }

    .fll-row {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #2a2a2e;
      border-radius: 6px;
      padding: 4px 6px;
      box-sizing: border-box;
      width: 100%;
      border: 1px solid transparent;
    }

    .fll-row.disabled {
      opacity: 0.45;
    }

    .fll-row.enabled-highlight {
      background: #2f2b3d;
      border-color: #6d5aa8;
    }

    /* --- Toggle switch (replaces checkbox) --- */
    .fll-toggle-switch {
      position: relative;
      flex: 0 0 30px;
      width: 30px;
      height: 16px;
      border-radius: 999px;
      background: #46464c;
      cursor: pointer;
      transition: background 0.15s ease;
      display: inline-block;
    }
    .fll-toggle-switch.on {
      background: #a78bfa;
    }
    .fll-toggle-switch .fll-toggle-knob {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #e8e8ea;
      transition: left 0.15s ease;
    }
    .fll-toggle-switch.on .fll-toggle-knob {
      left: 16px;
    }

    .fll-name {
      flex: 1 1 auto;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #ddd;
      font-size: 12px;
      cursor: default;
    }

    .fll-drag-handle {
      flex: 0 0 16px;
      width: 16px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #777;
      cursor: grab;
      user-select: none;
    }
    .fll-drag-handle:active {
      cursor: grabbing;
    }
    .fll-drag-handle svg {
      width: 10px;
      height: 14px;
      fill: currentColor;
    }

    .fll-priority {
      flex: 0 0 26px;
      width: 26px;
      background: #1c1c1f;
      border: 1px solid #444;
      border-radius: 4px;
      color: #999;
      font-size: 11px;
      text-align: center;
      padding: 2px 0;
      box-sizing: border-box;
      cursor: pointer;
    }
    .fll-priority:focus {
      outline: none;
      border-color: #6d5aa8;
      color: #ddd;
    }
    .fll-priority::-webkit-outer-spin-button,
    .fll-priority::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .fll-priority[type="number"] {
      -moz-appearance: textfield;
    }

    .fll-row.dragging {
      opacity: 0.4;
    }

    .fll-row.drop-target-above {
      border-top: 2px solid #a78bfa;
    }
    .fll-row.drop-target-below {
      border-bottom: 2px solid #a78bfa;
    }

    .fll-strength-wrap {
      display: flex;
      align-items: center;
      flex: 0 0 74px;
      width: 74px;
      background: #1c1c1f;
      border: 1px solid #444;
      border-radius: 4px;
      box-sizing: border-box;
      overflow: hidden;
    }

    .fll-strength-arrow {
      flex: 0 0 18px;
      width: 18px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      cursor: pointer;
      user-select: none;
      font-size: 10px;
    }
    .fll-strength-arrow:hover {
      background: #2f2f34;
      color: #ddd;
    }

    .fll-strength {
      flex: 1 1 auto;
      width: 100%;
      min-width: 0;
      background: transparent;
      border: none;
      color: #ddd;
      font-size: 11px;
      text-align: center;
      padding: 2px 0;
      box-sizing: border-box;
      cursor: pointer;
    }
    .fll-strength:focus {
      outline: none;
    }
    /* hide native number spinner - we draw our own arrows */
    .fll-strength::-webkit-outer-spin-button,
    .fll-strength::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .fll-strength[type="number"] {
      -moz-appearance: textfield;
    }

    .fll-remove {
      flex: 0 0 20px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      cursor: pointer;
      border-radius: 4px;
    }
    .fll-remove:hover {
      background: #3a3a3e;
      color: #f87171;
    }
    .fll-remove svg {
      width: 13px;
      height: 13px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
    }

    /* --- Header row (toggle-all / column labels / delete-all) --- */
    /* Matches .fll-row's column widths/gap/padding exactly so the toggle-all
       switch and delete-all icon line up with the switch/trash columns below. */
    .fll-header-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 2px 6px;
      box-sizing: border-box;
      width: 100%;
    }
    .fll-header-label {
      font-size: 10px;
      color: #888;
      user-select: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .fll-header-label.name-label {
      flex: 1 1 auto;
    }
    .fll-header-label.strength-label {
      flex: 0 0 74px;
      width: 74px;
      text-align: center;
    }
    .fll-header-toggle-slot {
      flex: 0 0 30px;
      width: 30px;
      display: flex;
      align-items: center;
    }
    .fll-header-remove-slot {
      flex: 0 0 20px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
      cursor: pointer;
      border-radius: 4px;
    }
    .fll-header-remove-slot:hover {
      background: #3a3a3e;
      color: #f87171;
    }
    .fll-header-remove-slot svg {
      width: 12px;
      height: 12px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
    }

    .fll-add-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      box-sizing: border-box;
      margin: 0;
      padding: 6px 0;
      background: #333338;
      border: 1px solid #46464c;
      border-radius: 6px;
      color: #ccc;
      font-size: 12px;
      cursor: pointer;
      user-select: none;
    }
    .fll-add-btn:hover {
      background: #3d3d43;
      border-color: #5a5a62;
    }

    /* --- Folder browser popup --- */

    .fll-popup-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: rgba(0,0,0,0.35);
    }

    .fll-popup {
      position: fixed;
      z-index: 10001;
      min-width: 260px;
      max-width: 360px;
      max-height: 420px;
      overflow-y: auto;
      background: #232326;
      border: 1px solid #46464c;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      padding: 4px;
      box-sizing: border-box;
      font-size: 12px;
      color: #ddd;
    }

    .fll-breadcrumbs {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 2px;
      padding: 4px 6px 8px 6px;
      border-bottom: 1px solid #38383c;
      margin-bottom: 4px;
    }

    .fll-crumb {
      cursor: pointer;
      color: #a78bfa;
      white-space: nowrap;
    }
    .fll-crumb:hover {
      text-decoration: underline;
    }
    .fll-crumb-sep {
      color: #666;
      margin: 0 2px;
    }
    .fll-crumb.current {
      color: #ddd;
      cursor: default;
    }
    .fll-crumb.current:hover {
      text-decoration: none;
    }

    .fll-entry {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      border-radius: 5px;
      cursor: pointer;
    }
    .fll-entry:hover {
      background: #34343a;
    }
    .fll-entry-icon {
      flex: 0 0 16px;
      text-align: center;
      opacity: 0.85;
    }
    .fll-entry-label {
      flex: 1 1 auto;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .fll-entry-arrow {
      flex: 0 0 auto;
      color: #888;
      font-size: 11px;
    }

    .fll-empty {
      padding: 14px 8px;
      color: #888;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Lora tree fetch (cached per session, refetch on popup open if stale)
// ---------------------------------------------------------------------------

let _treeCache = null;
let _treeCacheTime = 0;
const TREE_CACHE_MS = 15000; // refresh at most every 15s so new files show up reasonably fast

async function fetchLoraTree(force = false) {
  const now = Date.now();
  if (!force && _treeCache && now - _treeCacheTime < TREE_CACHE_MS) {
    return _treeCache;
  }
  try {
    const res = await api.fetchApi("/ultimate_lora_loader/tree");
    const data = await res.json();
    _treeCache = data;
    _treeCacheTime = now;
    return data;
  } catch (e) {
    console.error("[UltimateLoraLoader] Failed to fetch lora tree", e);
    return _treeCache || { __files__: [] };
  }
}

// ---------------------------------------------------------------------------
// Folder browser popup
// ---------------------------------------------------------------------------

/**
 * Opens a folder-drill-down popup anchored near (x, y).
 * Calls onSelect(fullRelativePath) when a file is chosen.
 */
function openLoraBrowser(x, y, onSelect) {
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

  const close = () => overlay.remove();
  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) close();
  });

  let path = []; // array of folder names representing current drill-down position

  fetchLoraTree().then((tree) => {
    renderLevel(tree);
  });

  function renderLevel(tree) {
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
      path = [];
      renderLevel(tree);
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
        path = path.slice(0, idx + 1);
        renderLevel(tree);
      };
      crumbs.appendChild(crumb);
    });

    popup.appendChild(crumbs);

    // subfolders (any key that isn't __files__ / __full_paths__)
    const subfolders = Object.keys(node)
      .filter((k) => k !== "__files__" && k !== "__full_paths__")
      .sort((a, b) => a.localeCompare(b));

    const files = (node.__files__ || []).slice().sort((a, b) => a.localeCompare(b));
    const fullPaths = node.__full_paths__ || {};

    if (subfolders.length === 0 && files.length === 0) {
      const empty = document.createElement("div");
      empty.className = "fll-empty";
      empty.textContent = "No LoRAs here";
      popup.appendChild(empty);
      return;
    }

    for (const folder of subfolders) {
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
        path = [...path, folder];
        renderLevel(tree);
      };

      popup.appendChild(entry);
    }

    for (const file of files) {
      const entry = document.createElement("div");
      entry.className = "fll-entry";

      const icon = document.createElement("span");
      icon.className = "fll-entry-icon";
      icon.textContent = "🔹";

      const label = document.createElement("span");
      label.className = "fll-entry-label";
      label.textContent = file;
      label.title = file;

      entry.appendChild(icon);
      entry.appendChild(label);

      entry.onclick = () => {
        const full = fullPaths[file] || file;
        onSelect(full);
        close();
      };

      popup.appendChild(entry);
    }
  }
}

// ---------------------------------------------------------------------------
// Node widget
// ---------------------------------------------------------------------------

function makeRow(entry, { onChange, onRemove, showClipStrength, onDragStart, onDragOver, onDrop, onDragEnd, onPriorityChange, currentPriority }) {
  const row = document.createElement("div");
  row.className = rowClassName(entry);
  // Row itself isn't draggable - only the dedicated drag handle icon
  // triggers a drag, so clicking the toggle/priority/strength/trash
  // controls never gets mistaken for a drag gesture. The row still needs
  // to be a drop target though, so drag events are wired on `row` for
  // dragover/drop, and on `dragHandle` for dragstart specifically.
  row.ondragover = (e) => {
    e.preventDefault();
    onDragOver?.(e, row);
  };
  row.ondrop = (e) => {
    e.preventDefault();
    onDrop?.(e, row);
  };

  const dragHandle = document.createElement("div");
  dragHandle.className = "fll-drag-handle";
  dragHandle.innerHTML = `<svg viewBox="0 0 10 16" xmlns="http://www.w3.org/2000/svg">
    <circle cx="2" cy="2" r="1.4"/><circle cx="8" cy="2" r="1.4"/>
    <circle cx="2" cy="8" r="1.4"/><circle cx="8" cy="8" r="1.4"/>
    <circle cx="2" cy="14" r="1.4"/><circle cx="8" cy="14" r="1.4"/>
  </svg>`;
  dragHandle.draggable = true;
  dragHandle.ondragstart = (e) => {
    e.dataTransfer.effectAllowed = "move";
    // Firefox requires setData to be called for drag to actually start
    e.dataTransfer.setData("text/plain", "");
    onDragStart?.(e, row);
  };
  dragHandle.ondragend = (e) => {
    onDragEnd?.(e, row);
  };

  const priority = document.createElement("input");
  priority.type = "number";
  priority.className = "fll-priority";
  priority.step = "1";
  priority.min = "1";
  priority.readOnly = true;
  priority.value = String(currentPriority ?? 1);

  function applyPriority(raw) {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      onPriorityChange?.(parsed);
    }
  }

  function openPriorityDialog(event) {
    openValueDialog({
      event,
      label: "Priority",
      currentValue: () => currentPriority ?? 1,
      formatValue: (v) => String(v),
      applyValue: applyPriority,
    });
  }

  priority.onclick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    priority.blur();
    openPriorityDialog(e);
  };
  priority.onfocus = (e) => {
    priority.blur();
    openPriorityDialog(e);
  };
  priority.onchange = () => {
    applyPriority(priority.value);
  };

  const toggle = document.createElement("div");
  toggle.className = "fll-toggle-switch" + (entry.enabled ? " on" : "");
  const knob = document.createElement("div");
  knob.className = "fll-toggle-knob";
  toggle.appendChild(knob);
  toggle.onclick = () => {
    entry.enabled = !entry.enabled;
    toggle.className = "fll-toggle-switch" + (entry.enabled ? " on" : "");
    row.className = rowClassName(entry);
    onChange();
  };

  const name = document.createElement("div");
  name.className = "fll-name";
  const shortName = entry.lora.split("/").pop();
  name.textContent = shortName;
  name.title = entry.lora;

  const STRENGTH_STEP = 0.05;

  function focusAndSelectDialogInput() {
    // The dialog mounts asynchronously (it's a Vue component), so grab
    // its input on the next couple of frames rather than assuming it
    // exists the instant prompt() returns. Match broadly since we don't
    // have a stable class name to rely on. Shared by both the strength
    // steppers and the priority field's dialog.
    let attempts = 0;
    const tryFocus = () => {
      attempts++;
      const inputs = document.querySelectorAll("input");
      for (const el of inputs) {
        const rect = el.getBoundingClientRect();
        if (el.readOnly || rect.width === 0 || rect.height === 0 || !document.body.contains(el)) {
          continue;
        }
        el.focus();
        requestAnimationFrame(() => {
          try {
            el.select();
          } catch (e) {
            /* select() can throw on some input types - ignore */
          }
          try {
            el.setSelectionRange(0, el.value.length);
          } catch (e) {
            /* setSelectionRange unsupported on this input type - ignore */
          }
        });
        return;
      }
      if (attempts < 8) {
        requestAnimationFrame(tryFocus);
      }
    };
    requestAnimationFrame(tryFocus);
  }

  // Generic "click a readonly number field, get a native quick-edit
  // dialog" helper - shared by the strength steppers and the priority
  // field. rgthree's Power Lora Loader uses LiteGraph's canvas-native
  // prompt() for this exact interaction (confirmed by comparing behavior
  // directly) - it reliably autofocuses+selects its input, unlike the
  // newer Vue-based app.extensionManager.dialog.
  function openValueDialog({ event, label, currentValue, formatValue, applyValue }) {
    const canvas = app?.canvas;
    if (canvas?.prompt) {
      canvas.prompt(
        label,
        formatValue(currentValue()),
        (value) => {
          if (value === null || value === undefined || value === "") return;
          applyValue(value);
        },
        event
      );
      return;
    }

    const dialogApi = app?.extensionManager?.dialog;
    if (dialogApi?.prompt) {
      dialogApi
        .prompt({
          title: "Value",
          message: label,
          defaultValue: formatValue(currentValue()),
        })
        .then((value) => {
          if (value === null || value === undefined) return;
          applyValue(value);
        });
      focusAndSelectDialogInput();
      return;
    }

    const raw = window.prompt(label, formatValue(currentValue()));
    if (raw !== null) applyValue(raw);
  }

  function formatStrength(v) {
    return v.toFixed(2);
  }

  // Shared factory for a strength stepper control (◀ [value] ▶), bound to
  // whichever entry field it's given. Used once for strengthModel always,
  // and a second time for strengthClip only when clip is actually
  // connected to the node - showing a clip-strength control that does
  // nothing (since Python forces strength_clip to 0 when clip is
  // disconnected) would be confusing rather than helpful.
  function makeStrengthStepper(getValue, setValue, promptLabel) {
    const wrap = document.createElement("div");
    wrap.className = "fll-strength-wrap";

    const down = document.createElement("div");
    down.className = "fll-strength-arrow";
    down.textContent = "◀";

    const input = document.createElement("input");
    input.type = "number";
    input.className = "fll-strength";
    input.step = String(STRENGTH_STEP);
    input.readOnly = true;
    input.value = formatStrength(getValue());

    const up = document.createElement("div");
    up.className = "fll-strength-arrow";
    up.textContent = "▶";

    function apply(v) {
      const clamped = isNaN(v) ? 1.0 : v;
      setValue(clamped);
      input.value = formatStrength(clamped);
      onChange();
    }

    function openDialog(event) {
      openValueDialog({
        event,
        label: promptLabel,
        currentValue: getValue,
        formatValue: formatStrength,
        applyValue: (raw) => apply(parseFloat(raw)),
      });
    }

    input.onclick = (e) => {
      e.preventDefault();
      input.blur();
      openDialog(e);
    };
    input.onfocus = (e) => {
      input.blur();
      openDialog(e);
    };
    input.onchange = () => {
      apply(parseFloat(input.value));
    };
    down.onclick = () => apply(getValue() - STRENGTH_STEP);
    up.onclick = () => apply(getValue() + STRENGTH_STEP);

    wrap.appendChild(down);
    wrap.appendChild(input);
    wrap.appendChild(up);
    return wrap;
  }

  // Ensure both fields exist on the entry even if only one is shown -
  // strengthClip is still stored (e.g. so it's ready if clip gets
  // connected later) even when not currently editable in the UI.
  if (entry.strengthModel === undefined) entry.strengthModel = 1.0;
  if (entry.strengthClip === undefined) entry.strengthClip = entry.strengthModel;

  const modelStrength = makeStrengthStepper(
    () => entry.strengthModel ?? 1.0,
    (v) => {
      entry.strengthModel = v;
    },
    showClipStrength ? "Model Strength" : "Strength"
  );

  let clipStrength = null;
  if (showClipStrength) {
    clipStrength = makeStrengthStepper(
      () => entry.strengthClip ?? 1.0,
      (v) => {
        entry.strengthClip = v;
      },
      "Clip Strength"
    );
  }

  const remove = document.createElement("div");
  remove.className = "fll-remove";
  remove.innerHTML = TRASH_ICON_SVG;
  remove.onclick = () => onRemove();

  row.appendChild(dragHandle);
  row.appendChild(priority);
  row.appendChild(toggle);
  row.appendChild(name);
  row.appendChild(modelStrength);
  if (clipStrength) row.appendChild(clipStrength);
  row.appendChild(remove);

  return row;
}

function rowClassName(entry) {
  let cls = "fll-row";
  if (!entry.enabled) cls += " disabled";
  if (entry.enabled) cls += " enabled-highlight";
  return cls;
}

const TRASH_ICON_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 7h16" stroke-linecap="round"/>
  <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6 7l1 13.2A1.8 1.8 0 0 0 8.8 22h6.4a1.8 1.8 0 0 0 1.8-1.8L18 7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 11v6M14 11v6" stroke-linecap="round"/>
</svg>`;

app.registerExtension({
  name: "ultimate.lora.loader",

  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== "UltimateLoraLoader") return;

    const onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;

      const node = this;

      // Double LiteGraph's usual default node width - the standard default
      // (based on title/socket label lengths) is cramped for this node's
      // content (lora names, strength stepper, trash icon all need to fit
      // on one row without truncating too aggressively). Only applied once
      // at creation time, not on every later resize, so it doesn't fight a
      // user's manual width choice on subsequent loads.
      if (node.size && node.size[0]) {
        node.setSize([node.size[0] * 2, node.size[1]]);
      }

      // ComfyUI auto-generates a visible widget row for the "loras_data"
      // STRING input. It MUST stay in node.widgets - that's where
      // ComfyUI's prompt-serialization step reads widget values from (via
      // widget.serializeValue() / widget.value) to send them to Python -
      // so we can't remove it from node.widgets. But *rendering* it is
      // handled inconsistently across ComfyUI versions: overriding
      // computeSize/draw/mouse worked in some render paths but not the
      // newer Vue-based widget rendering, which still drew a full text row.
      // The one thing that reliably works regardless of internal ComfyUI
      // version is hiding the actual DOM element once it exists - that's a
      // browser-level operation, not something routed through whatever
      // internal widget API ComfyUI happens to use this month.
      const dataWidget = node.widgets?.find((w) => w.name === "loras_data");
      if (dataWidget) {
        // keep these too - harmless, and still helps on canvas-rendered builds
        dataWidget.computeSize = () => [0, 0];
        dataWidget.draw = () => {};
        dataWidget.mouse = () => false;
      }

      function hideDataWidgetDom() {
        if (!dataWidget) return;
        // Known attribute names ComfyUI has used across versions for a
        // widget's mounted DOM element.
        const el = dataWidget.element || dataWidget.inputEl || dataWidget.textEl || dataWidget.domElement;
        if (el && el.style) {
          el.style.display = "none";
        }
        // Fallback: some ComfyUI versions render each widget row as a DOM
        // node inside the node's own HTML container rather than exposing
        // it directly on the widget object. Find it by matching the
        // widget's current value/name inside this node's DOM subtree.
        if (node.domElement || node.htmlElement) {
          const root = node.domElement || node.htmlElement;
          const rows = root.querySelectorAll?.("[data-widget-name], .comfy-widget, .p-inputtext") || [];
          rows.forEach((rowEl) => {
            const name = rowEl.getAttribute?.("data-widget-name");
            if (name === "loras_data") {
              const rowContainer = rowEl.closest?.(".comfy-widget-row, .widget-row") || rowEl;
              rowContainer.style.display = "none";
            }
          });
        }
      }

      // Last-resort fallback that doesn't depend on guessing ComfyUI's
      // internal class names at all: the loras_data widget's displayed
      // text is always our JSON array string (starts with "["), which is
      // distinctive enough to find directly. Scoped to this node's own
      // rendered area (container's parent chain) rather than the whole
      // document, so this stays cheap.
      let lorasWidgetObserver = null;
      function findNodeRootElement() {
        // container is appended into ComfyUI's DOM widget wrapper, which
        // itself lives inside this node's rendered element on the canvas.
        // Walk up a few levels from something we know is in the node's
        // subtree to find a stable ancestor to scope the observer to.
        let el = container.parentElement;
        for (let i = 0; i < 5 && el && el.parentElement; i++) {
          el = el.parentElement;
        }
        return el || container.parentElement || document.body;
      }
      function scanAndHideLorasWidget() {
        const root = findNodeRootElement();
        if (!root || !root.querySelectorAll) return;
        const candidates = root.querySelectorAll("input, textarea, div, span");
        candidates.forEach((elm) => {
          if (elm === container || container.contains(elm)) return; // never touch our own UI
          const val = elm.value !== undefined ? elm.value : elm.textContent;
          if (
            typeof val === "string" &&
            val.trim().startsWith("[") &&
            val.includes('"lora"') &&
            val.includes('"enabled"')
          ) {
            const rowWrapper = elm.closest?.("label, .comfy-widget-row, .widget-row, li, tr") || elm;
            rowWrapper.style.display = "none";
          }
        });
      }
      function startLorasWidgetObserver() {
        if (lorasWidgetObserver) return;
        const root = findNodeRootElement();
        if (!root) return;
        lorasWidgetObserver = new MutationObserver(() => scanAndHideLorasWidget());
        lorasWidgetObserver.observe(root, { childList: true, subtree: true, characterData: true });
      }

      let entries = [];
      try {
        entries = dataWidget?.value ? JSON.parse(dataWidget.value) : [];
      } catch (e) {
        entries = [];
      }

      const container = document.createElement("div");
      container.className = "fll-container";
      container.style.boxSizing = "border-box";

      const headerRow = document.createElement("div");
      headerRow.className = "fll-header-row";

      const toggleAllSlot = document.createElement("div");
      toggleAllSlot.className = "fll-header-toggle-slot";
      const toggleAllSwitch = document.createElement("div");
      toggleAllSwitch.className = "fll-toggle-switch";
      const toggleAllKnob = document.createElement("div");
      toggleAllKnob.className = "fll-toggle-knob";
      toggleAllSwitch.appendChild(toggleAllKnob);
      toggleAllSlot.appendChild(toggleAllSwitch);

      const dragHandleSpacer = document.createElement("div");
      dragHandleSpacer.className = "fll-drag-handle";

      const priorityLabel = document.createElement("div");
      priorityLabel.className = "fll-header-label";
      priorityLabel.style.flex = "0 0 26px";
      priorityLabel.style.width = "26px";
      priorityLabel.style.textAlign = "center";
      priorityLabel.textContent = "#";

      const nameLabel = document.createElement("div");
      nameLabel.className = "fll-header-label name-label";
      nameLabel.textContent = "Name";

      const strengthLabel = document.createElement("div");
      strengthLabel.className = "fll-header-label strength-label";
      strengthLabel.textContent = "Strength";

      const clipStrengthLabel = document.createElement("div");
      clipStrengthLabel.className = "fll-header-label strength-label";
      clipStrengthLabel.textContent = "Clip";
      clipStrengthLabel.style.display = "none";

      const deleteAllSlot = document.createElement("div");
      deleteAllSlot.className = "fll-header-remove-slot";
      deleteAllSlot.innerHTML = TRASH_ICON_SVG;

      headerRow.appendChild(dragHandleSpacer);
      headerRow.appendChild(priorityLabel);
      headerRow.appendChild(toggleAllSlot);
      headerRow.appendChild(nameLabel);
      headerRow.appendChild(strengthLabel);
      headerRow.appendChild(clipStrengthLabel);
      headerRow.appendChild(deleteAllSlot);

      const rowsWrap = document.createElement("div");
      rowsWrap.style.display = "flex";
      rowsWrap.style.flexDirection = "column";
      rowsWrap.style.gap = "4px";
      rowsWrap.style.boxSizing = "border-box";

      const addBtn = document.createElement("div");
      addBtn.className = "fll-add-btn";
      addBtn.innerHTML = `<span>Add Lora</span>`;

      function persist() {
        if (dataWidget) {
          dataWidget.value = JSON.stringify(entries);
        }
        node.setDirtyCanvas(true, true);
      }

      function isClipConnected() {
        // clip is an optional input now - only show its strength control
        // when something is actually plugged in, since an editable-but-
        // inert control (Python forces strength_clip to 0 when clip is
        // None) would just be confusing UI clutter.
        const clipInput = node.inputs?.find((inp) => inp.name === "clip");
        return !!(clipInput && clipInput.link != null);
      }

      let draggedIndex = null;

      function render() {
        rowsWrap.innerHTML = "";
        const showClipStrength = isClipConnected();
        entries.forEach((entry, idx) => {
          const row = makeRow(entry, {
            onChange: persist,
            onRemove: () => {
              entries.splice(idx, 1);
              persist();
              render();
              resizeNode();
            },
            showClipStrength,
            currentPriority: idx + 1,
            onPriorityChange: (rawPriority) => {
              // Clamp to valid range and convert back to 0-indexed. Typing
              // a priority number is just another way to reorder - same
              // splice-based move as drag-and-drop, just driven by a typed
              // target position instead of a drop location.
              const targetIndex = Math.max(0, Math.min(entries.length - 1, rawPriority - 1));
              if (targetIndex === idx) {
                render(); // snap back to the correct value if unchanged/invalid
                return;
              }
              const [moved] = entries.splice(idx, 1);
              entries.splice(targetIndex, 0, moved);
              persist();
              render();
            },
            onDragStart: (e, rowEl) => {
              draggedIndex = idx;
              rowEl.classList.add("dragging");
            },
            onDragEnd: (e, rowEl) => {
              draggedIndex = null;
              // clear any lingering drop-target indicators on all rows,
              // not just this one, in case the drag ended outside a
              // valid drop target
              rowsWrap.querySelectorAll(".fll-row").forEach((r) => {
                r.classList.remove("dragging", "drop-target-above", "drop-target-below");
              });
            },
            onDragOver: (e, rowEl) => {
              if (draggedIndex === null || draggedIndex === idx) return;
              // show whether the dragged row would land above or below
              // this one, based on cursor position within the row's
              // height - gives clear visual feedback on drop position
              const rect = rowEl.getBoundingClientRect();
              const isAbove = e.clientY - rect.top < rect.height / 2;
              rowEl.classList.toggle("drop-target-above", isAbove);
              rowEl.classList.toggle("drop-target-below", !isAbove);
            },
            onDrop: (e, rowEl) => {
              if (draggedIndex === null || draggedIndex === idx) return;
              const rect = rowEl.getBoundingClientRect();
              const isAbove = e.clientY - rect.top < rect.height / 2;
              let targetIndex = isAbove ? idx : idx + 1;
              // account for the removal shifting indices when the dragged
              // row was originally before the target position
              if (draggedIndex < targetIndex) targetIndex -= 1;

              const [moved] = entries.splice(draggedIndex, 1);
              entries.splice(targetIndex, 0, moved);
              draggedIndex = null;
              persist();
              render();
            },
          });
          rowsWrap.appendChild(row);
        });
        headerRow.style.display = entries.length > 0 ? "flex" : "none";
        strengthLabel.textContent = showClipStrength ? "Model" : "Strength";
        clipStrengthLabel.style.display = showClipStrength ? "block" : "none";
        // reflect current state: switch shows "on" only when every row is enabled
        const allEnabled = entries.length > 0 && entries.every((e) => e.enabled);
        toggleAllSwitch.className = "fll-toggle-switch" + (allEnabled ? " on" : "");
      }

      toggleAllSlot.onclick = () => {
        if (entries.length === 0) return;
        // if every entry is already enabled, turn all off; otherwise turn all on
        const allEnabled = entries.every((e) => e.enabled);
        entries.forEach((e) => (e.enabled = !allEnabled));
        persist();
        render();
      };

      deleteAllSlot.onclick = () => {
        if (entries.length === 0) return;
        entries.length = 0;
        persist();
        render();
        resizeNode();
      };

      function syncWidth() {
        // Explicitly pin the container's pixel width to the node's current
        // width. Relying on CSS `width: 100%` here is what caused the
        // add-lora bar / text box to bleed past the node's rounded edge -
        // ComfyUI's DOM widget wrapper doesn't reliably constrain percentage
        // widths, so we compute and set an exact pixel value instead.
        //
        // Observed behavior: our content consistently sits closer to the
        // node's left edge than the right, meaning the wrapper ComfyUI's
        // Vue DOM widget system places container into likely insets it
        // from the left by some fixed amount that isn't part of our own
        // box model. A previous attempt shrank container's width from the
        // right to compensate, which was backwards - that makes the right
        // gap bigger, not smaller, since container is left-anchored with
        // no auto margin. Pulling container left with a negative margin
        // directly counteracts a left-side wrapper inset instead.
        const nodeWidth = node.size[0];
        const leftPull = 10; // negative margin to counteract the wrapper's left inset
        const w = Math.max(0, nodeWidth);
        container.style.width = w + "px";
        container.style.maxWidth = w + "px";
        container.style.marginLeft = -leftPull + "px";
        container.style.marginBottom = "0";
      }

      // Shared height calculation - used both to grow the node when loras
      // are added/removed, and to clamp the node back up (or let the list
      // scroll) if the user tries to manually drag it smaller than the
      // list's natural size.
      const ROW_HEIGHT = 34; // .fll-row rendered height: strength-arrow content (22px) + strength-wrap border (2px) + row padding 4px*2 (8px) + row border 1px*2 (2px)
      const ROW_GAP = 4; // gap between rows in rowsWrap
      const HEADER_HEIGHT = 20; // .fll-header-row: toggle switch (16px) + row padding 2px*2 (4px)
      const ADD_BTN_HEIGHT = 28; // .fll-add-btn: ~14px text line + padding 6px*2 (12px) + border 1px*2 (2px)
      const CONTAINER_PADDING_V = 12; // .fll-container top+bottom padding (6+6)
      const SOCKET_ROWS_HEIGHT = 56; // title bar + model/clip socket rows above the DOM widget
      const GAP_BETWEEN_SECTIONS = 4; // .fll-container's own `gap` between header/rowsWrap/addBtn
      const MIN_VISIBLE_ROWS = 2; // floor for the scrollable list area once the user shrinks the node below its natural size
      const BOTTOM_SLACK = 8; // extra buffer so bottom padding stays visually visible even if real rendered row height is a couple px taller than our ROW_HEIGHT estimate

      function computeRequiredHeights() {
        const rowCount = entries.length;
        const rowsHeightFull = rowCount > 0 ? rowCount * ROW_HEIGHT + (rowCount - 1) * ROW_GAP : 0;
        const headerHeight = rowCount > 0 ? HEADER_HEIGHT + GAP_BETWEEN_SECTIONS : 0;

        // "Chrome" = everything in the column except the row list itself:
        // add button, header row (+ its gap), and container's own vertical
        // padding (plus a small slack buffer so the bottom padding doesn't
        // visually disappear if real rendered content is a touch taller
        // than our fixed-constant estimate). Used both to size the node to
        // fit everything (natural), and to figure out how much space is
        // left for rowsWrap once the node is smaller than that (floor /
        // manual resize).
        const chromeHeight =
          ADD_BTN_HEIGHT + headerHeight + (rowCount > 0 ? GAP_BETWEEN_SECTIONS : 0) + CONTAINER_PADDING_V + BOTTOM_SLACK;

        const minRowsVisible = Math.min(rowCount, MIN_VISIBLE_ROWS);
        const floorRowsHeight = minRowsVisible > 0 ? minRowsVisible * ROW_HEIGHT + (minRowsVisible - 1) * ROW_GAP : 0;

        return {
          // Node grows to fit every row with no scrolling - the
          // confirmed-working default behavior when adding/removing loras.
          naturalNodeHeight: SOCKET_ROWS_HEIGHT + chromeHeight + rowsHeightFull,
          // Smallest the node is ever allowed to shrink to manually - fits
          // the chrome plus at least MIN_VISIBLE_ROWS rows; beyond that the
          // list scrolls internally instead of spilling out or forcing the
          // node to keep growing.
          floorNodeHeight: SOCKET_ROWS_HEIGHT + chromeHeight + floorRowsHeight,
          chromeHeight,
        };
      }

      // Guards against onResize's manual-drag clamping logic firing as a
      // side effect of resizeNode()'s own programmatic node.setSize() calls.
      // node.setSize() triggers LiteGraph's onResize regardless of whether
      // a human dragged the corner or we called it ourselves to grow the
      // node - without this guard, every lora add/remove would immediately
      // have its "grow to fit everything, no scrolling" result overwritten
      // by onResize's "clamp to available space, scroll if needed" logic,
      // which is what caused the list to start scrolling again after only
      // 3 rows instead of continuing to grow.
      let isProgrammaticResize = false;

      function resizeNode() {
        syncWidth();
        // Both previous approaches to sizing this node (manual
        // delta-tracking, then widget.computeSize() reporting a measured
        // height) ended up fighting or looping with whatever height
        // ComfyUI's DOM widget wrapper imposes on `container` - measuring
        // container's height and then having that measurement feed back
        // into constraining container's height again is a trap. To
        // sidestep that failure mode entirely, this doesn't measure
        // anything - it computes the required height arithmetically from
        // known, fixed pixel sizes for each piece of UI, decoupled from
        // whatever the DOM wrapper does with container's actual rendered
        // box.
        const { naturalNodeHeight } = computeRequiredHeights();

        // Growing to fit every row (no scrolling) as loras are added is
        // the confirmed-working behavior from before - keep it as-is here.
        // rowsWrap only becomes scrollable when the user manually shrinks
        // the node smaller than this natural size (handled in onResize).
        rowsWrap.style.maxHeight = "";
        rowsWrap.style.overflowY = "visible";

        container.style.minHeight = naturalNodeHeight - SOCKET_ROWS_HEIGHT + "px";

        if (naturalNodeHeight > node.size[1]) {
          isProgrammaticResize = true;
          node.setSize([node.size[0], naturalNodeHeight]);
          node.setDirtyCanvas(true, true);
          isProgrammaticResize = false;
        }
      }

      // Keep width in sync whenever the user manually drags-resizes the node,
      // and enforce a minimum height so the row list can never spill out
      // past the node's border. Between the floor and the natural
      // (fits-everything) size, the row list scrolls internally to fit
      // whatever space the user has chosen; below the floor, the node
      // snaps back up to the floor instead of letting content clip.
      const onResize = node.onResize;
      node.onResize = function (size) {
        const r2 = onResize ? onResize.apply(this, arguments) : undefined;
        syncWidth();
        hideDataWidgetDom();

        // Skip the clamp/scroll logic entirely when this onResize firing
        // is just a side effect of resizeNode()'s own setSize call above -
        // resizeNode() already set the correct (unlimited/natural) rowsWrap
        // state, and we don't want to immediately clamp it back down.
        if (isProgrammaticResize) {
          return r2;
        }

        const { floorNodeHeight, chromeHeight } = computeRequiredHeights();

        if (node.size[1] < floorNodeHeight) {
          node.setSize([node.size[0], floorNodeHeight]);
        }

        // Whatever vertical space remains after the node's fixed chrome
        // (socket rows + button + header + padding) goes to the row list;
        // it scrolls internally to fit within that space.
        const availableForRows = node.size[1] - SOCKET_ROWS_HEIGHT - chromeHeight;
        rowsWrap.style.maxHeight = Math.max(availableForRows, ROW_HEIGHT) + "px";
        rowsWrap.style.overflowY = "auto";

        node.setDirtyCanvas(true, true);
        return r2;
      };

      // Re-neutralize the loras_data widget after workflow load/paste, since
      // onConfigure can rebuild widget state from serialized values.
      const onConfigure = node.onConfigure;
      node.onConfigure = function () {
        const r3 = onConfigure ? onConfigure.apply(this, arguments) : undefined;
        const w = node.widgets?.find((w2) => w2.name === "loras_data");
        if (w) {
          w.computeSize = () => [0, 0];
          w.draw = () => {};
          w.mouse = () => false;
        }
        try {
          entries = w?.value ? JSON.parse(w.value) : [];
        } catch (e) {
          entries = [];
        }
        render();
        syncWidth();
        resizeNode();
        hideDataWidgetDom();
        return r3;
      };

      // Re-render rows whenever clip is connected/disconnected, so the
      // clip-strength stepper appears or disappears immediately rather
      // than only updating on the next unrelated render.
      const onConnectionsChange = node.onConnectionsChange;
      node.onConnectionsChange = function (type, index, connected, link_info, ioSlot) {
        const r4 = onConnectionsChange ? onConnectionsChange.apply(this, arguments) : undefined;
        if (ioSlot?.name === "clip" || node.inputs?.[index]?.name === "clip") {
          render();
          resizeNode();
        }
        return r4;
      };

      addBtn.onclick = (e) => {
        e.stopPropagation();
        const rect = addBtn.getBoundingClientRect();
        openLoraBrowser(rect.left, rect.bottom + 4, (loraPath) => {
          entries.push({
            lora: loraPath,
            enabled: true,
            strengthModel: 1.0,
            strengthClip: 1.0,
          });
          persist();
          render();
          resizeNode();
          hideDataWidgetDom();
        });
      };

      container.appendChild(addBtn);
      container.appendChild(headerRow);
      container.appendChild(rowsWrap);

      node.addDOMWidget("ultimate_lora_loader_ui", "div", container, {
        serialize: false,
        hideOnZoom: false,
      });

      render();
      syncWidth();

      // restore size sanity on load (also re-syncs width once ComfyUI has
      // finished laying out the node on the canvas, in case initial
      // node.size wasn't final yet at widget-creation time). Also retry
      // hiding the loras_data DOM element a few times with backoff, since
      // its DOM node may not exist yet at widget-creation time if it's
      // mounted asynchronously (e.g. Vue's next-tick rendering).
      setTimeout(() => {
        syncWidth();
        resizeNode();
        hideDataWidgetDom();
        scanAndHideLorasWidget();
        startLorasWidgetObserver();
      }, 0);
      [50, 150, 400, 1000].forEach((delay) => {
        setTimeout(() => {
          hideDataWidgetDom();
          scanAndHideLorasWidget();
        }, delay);
      });

      const onRemoved = node.onRemoved;
      node.onRemoved = function () {
        if (lorasWidgetObserver) {
          lorasWidgetObserver.disconnect();
          lorasWidgetObserver = null;
        }
        return onRemoved ? onRemoved.apply(this, arguments) : undefined;
      };

      return r;
    };
  },
});
