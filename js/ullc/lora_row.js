import { app } from "../../../scripts/app.js";
import { isLoraMissing } from "./lora_tree.js";
import { openLoraBrowser } from "./lora_browser.js";
import { TRASH_ICON_SVG } from "./icons.js";
import { getCivitaiLoraMeta } from "./civitai_toolkit_info.js";
import { bindPreviewHover } from "./preview_tip.js";
import { IMAGE_ICON_SVG } from "./icons.js";
// ---------------------------------------------------------------------------
// Node widget
// ---------------------------------------------------------------------------

export function makeRow(entry, { onChange, onRemove, onReplace, onInfoToolkit, onInfoFull, showClipStrength, onDragStart, onDragOver, onDrop, onDragEnd, onPriorityChange, currentPriority }) {
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

  const previewBtn = document.createElement("div");
  previewBtn.className = "fll-preview-btn";
  previewBtn.innerHTML = IMAGE_ICON_SVG;

  let coverUrl = null;
  bindPreviewHover(previewBtn, () => coverUrl);

  const name = document.createElement("div");
  name.className = "fll-name";
  const shortName = entry.lora.split(/[/\\]/).pop();
  const missing = isLoraMissing(entry.lora);

  const nameTitle = document.createElement("div");
  nameTitle.className = "fll-name-title";
  nameTitle.textContent = missing ? "⚠ " + shortName : shortName;

  const nameFile = document.createElement("div");
  nameFile.className = "fll-name-file";
  nameFile.style.display = "none";

  name.appendChild(nameTitle);
  name.appendChild(nameFile);

  if (missing) {
    name.classList.add("fll-name-missing");
    name.title = `File not found on disk:\n${entry.lora}\n\nClick to choose a replacement.`;
    name.onclick = (e) => {
      e.stopPropagation();
      if (!onReplace) return;
      const rect = name.getBoundingClientRect();
      openLoraBrowser(rect.left, rect.bottom + 4, (loraPath) => onReplace(loraPath));
    };
  } else {
    // Avoid duplicating civitai/filename already shown — tooltip is base model only.
    name.removeAttribute("title");
  }

  // Soft-enrich from Civitai Toolkit local DB (display name + cover; base in tooltip).
  if (!missing) {
    getCivitaiLoraMeta(entry.lora).then((meta) => {
      if (!meta || !name.isConnected) return;
      const civitaiName = (meta.civitai_model_name || "").trim();
      if (civitaiName && civitaiName.toLowerCase() !== shortName.toLowerCase()) {
        nameTitle.textContent = civitaiName;
        nameFile.textContent = shortName;
        nameFile.style.display = "";
      }
      if (meta.local_cover_path) {
        coverUrl = meta.local_cover_path;
        previewBtn.classList.add("has-preview");
      }
      const bm = (meta.base_model || "").trim();
      if (bm) name.title = bm;
      else name.removeAttribute("title");
    });
  }

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

  const infoToolkit = document.createElement("div");
  infoToolkit.className = "fll-info";
  infoToolkit.textContent = "?";
  infoToolkit.title = "Like Civitai Toolkit → Local Manager";
  infoToolkit.onclick = (e) => {
    e.stopPropagation();
    onInfoToolkit?.(entry.lora);
  };

  const infoFull = document.createElement("div");
  infoFull.className = "fll-info fll-info-full";
  infoFull.textContent = "i";
  infoFull.title = "Like default LoraLoader → View Lora info";
  infoFull.onclick = (e) => {
    e.stopPropagation();
    onInfoFull?.(entry.lora);
  };

  const remove = document.createElement("div");
  remove.className = "fll-remove";
  remove.innerHTML = TRASH_ICON_SVG;
  remove.onclick = () => onRemove();

  row.appendChild(dragHandle);
  row.appendChild(priority);
  row.appendChild(toggle);
  row.appendChild(previewBtn);
  row.appendChild(name);
  row.appendChild(modelStrength);
  if (clipStrength) row.appendChild(clipStrength);
  row.appendChild(infoToolkit);
  row.appendChild(infoFull);
  row.appendChild(remove);

  return row;
}

export function rowClassName(entry) {
  let cls = "fll-row";
  if (!entry.enabled) cls += " disabled";
  if (entry.enabled) cls += " enabled-highlight";
  if (isLoraMissing(entry.lora)) cls += " missing";
  return cls;
}

