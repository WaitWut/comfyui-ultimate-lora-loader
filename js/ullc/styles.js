const CSS = `    .fll-container {
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

    /* Missing on disk - wins over enabled-highlight's background/border so a
       broken row reads as broken whether it's toggled on or off. */
    .fll-row.missing,
    .fll-row.missing.enabled-highlight {
      background: #3a2323;
      border-color: #c0392b;
    }
    .fll-name.fll-name-missing {
      color: #ff8a80;
      cursor: pointer;
    }
    .fll-name.fll-name-missing:hover {
      text-decoration: underline;
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
      min-width: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 1px;
      color: #ddd;
      font-size: 12px;
      cursor: default;
      line-height: 1.2;
    }
    .fll-name-title,
    .fll-name-file {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .fll-name-title {
      color: #e8e8ea;
      font-size: 12px;
    }
    .fll-name-file {
      color: #888;
      font-size: 10px;
    }
    .fll-name.fll-name-missing .fll-name-title {
      color: #ff8a80;
    }

    .fll-preview-btn {
      flex: 0 0 18px;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #777;
      cursor: default;
      border-radius: 4px;
      user-select: none;
      opacity: 0.35;
    }
    .fll-preview-btn svg {
      width: 14px;
      height: 14px;
      display: block;
      pointer-events: none;
    }
    .fll-preview-btn.has-preview {
      opacity: 1;
      cursor: pointer;
      color: #aaa;
    }
    .fll-preview-btn.has-preview:hover {
      background: #3a3a3e;
      color: #c4b5fd;
    }
    .fll-header-preview-slot {
      flex: 0 0 18px;
      width: 18px;
    }
    .fll-base-model {
      flex: 0 0 78px;
      width: 78px;
      max-width: 78px;
      box-sizing: border-box;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 10px;
      line-height: 1.2;
      color: #c4b5fd;
      background: #2a2840;
      border: 1px solid #4a4568;
      border-radius: 4px;
      padding: 2px 5px;
      text-align: center;
      cursor: default;
      user-select: none;
    }
    .fll-base-model.empty {
      color: #666;
      background: transparent;
      border-color: transparent;
    }
    .fll-preview-tip {
      position: fixed;
      z-index: 10050;
      pointer-events: none;
      padding: 4px;
      background: #1c1c1f;
      border: 1px solid #555;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.55);
    }
    .fll-preview-tip img {
      display: block;
      max-width: 220px;
      max-height: 280px;
      object-fit: contain;
      border-radius: 4px;
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
      min-width: 400px;
      max-width: 600px;
      width: min(600px, calc(100vw - 24px));
      max-height: 420px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #232326;
      border: 1px solid #46464c;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      padding: 0;
      box-sizing: border-box;
      font-size: 12px;
      color: #ddd;
    }

    .fll-popup-header {
      flex: 0 0 auto;
      padding: 4px 4px 0 4px;
      background: #232326;
      border-bottom: 1px solid #38383c;
      z-index: 1;
    }

    .fll-popup-list {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 6px 4px 4px 4px;
    }

    .fll-breadcrumbs {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 2px;
      padding: 4px 6px 6px 6px;
      margin-bottom: 0;
      border-bottom: none;
    }

    .fll-search {
      display: block;
      width: 75%;
      max-width: 75%;
      box-sizing: border-box;
      margin: 0 0 6px 0;
      padding: 6px 8px;
      background: #1c1c1f;
      border: 1px solid #444;
      border-radius: 5px;
      color: #ddd;
      font-size: 12px;
      outline: none;
    }
    .fll-search:focus {
      border-color: #6d5aa8;
    }
    .fll-search::placeholder {
      color: #777;
    }

    .fll-crumb {
      cursor: pointer;
      color: #a78bfa;
      white-space: nowrap;
      border-radius: 3px;
    }
    .fll-crumb:hover {
      text-decoration: underline;
    }
    .fll-crumb:focus-visible {
      outline: 1px solid #6d5aa8;
      outline-offset: 1px;
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
    .fll-entry:focus-visible {
      outline: 1px solid #6d5aa8;
      outline-offset: -1px;
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
    .fll-entry-label-wrap {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
      overflow: hidden;
    }
    .fll-entry-label-sub {
      font-size: 10px;
      color: #888;
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

    /* --- Info buttons: Toolkit local (?) + pysssss full (i) --- */
    .fll-info {
      flex: 0 0 20px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      cursor: pointer;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 700;
      line-height: 1;
      user-select: none;
    }
    .fll-info:hover {
      background: #3a3a3e;
      color: #a78bfa;
    }
    .fll-info.fll-info-full:hover {
      color: #60a5fa;
    }
    .fll-header-info-slot {
      flex: 0 0 20px;
      width: 20px;
    }
    .fll-header-info-pair {
      flex: 0 0 44px;
      width: 44px;
      display: flex;
      gap: 4px;
    }

    /* --- Civitai Toolkit-compatible info popup --- */
    .ullc-civitai-popup {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.75);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(4px);
    }
    .ullc-civitai-popup .popup-content {
      background: var(--comfy-menu-bg, #2a2a2e);
      padding: 0;
      border-radius: 8px;
      max-width: 800px;
      width: 95%;
      border: 1px solid var(--border-color, #444);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .ullc-civitai-popup .popup-header {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      border-bottom: 1px solid var(--border-color, #444);
    }
    .ullc-civitai-popup .popup-header h2 {
      margin: 0;
      flex-grow: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--fg-color, #ddd);
      font-size: 1.15em;
    }
    .ullc-civitai-popup .popup-close {
      font-size: 28px;
      cursor: pointer;
      color: var(--fg-color, #ddd);
      margin-left: 15px;
      line-height: 1;
    }
    .ullc-civitai-popup .popup-close:hover { color: #f44; }
    .ullc-civitai-popup .popup-body {
      overflow-y: auto;
      word-break: break-word;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      color: var(--fg-color, #ddd);
    }
    .ullc-civitai-popup .model-description-content {
      font-size: 13px;
      background: rgba(0,0,0,0.2);
      padding: 12px;
      border-radius: 5px;
    }
    .ullc-civitai-popup .model-description-content.version-desc {
      background: rgba(80, 80, 0, 0.2);
    }
    .ullc-civitai-popup .model-description-content img {
      max-width: 100%;
      height: auto;
      border-radius: 5px;
      margin-top: 10px;
    }
    .ullc-civitai-popup .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }
    .ullc-civitai-popup .info-item {
      background: var(--comfy-box-bg, #1c1c1f);
      padding: 8px;
      border-radius: 5px;
      font-size: 0.9em;
    }
    .ullc-civitai-popup .info-item strong {
      color: var(--desc-text-color, #999);
      margin-right: 8px;
    }
    .ullc-civitai-popup .info-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .ullc-civitai-popup .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ullc-civitai-popup h4 { margin: 0; }
    .ullc-civitai-popup .detail-tags,
    .ullc-civitai-popup .triggers-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .ullc-civitai-popup .detail-tag {
      background: var(--comfy-input-bg, #333);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
    }
    .ullc-civitai-popup .trigger-word {
      background: var(--comfy-input-bg, #333);
      padding: 5px 10px;
      border-radius: 5px;
      border: 1px solid var(--border-color, #444);
      cursor: pointer;
      user-select: none;
    }
    .ullc-civitai-popup .trigger-word:hover {
      border-color: var(--accent-color, #a78bfa);
      color: var(--accent-color, #a78bfa);
    }
    .ullc-civitai-popup .trigger-word.copied {
      border-color: #5f9;
      color: #5f9;
    }
    .ullc-civitai-popup .copy-btn,
    .ullc-civitai-popup .copy-all-btn {
      background: var(--comfy-input-bg, #333);
      border: 1px solid var(--border-color, #444);
      color: var(--input-text-color, #ddd);
      padding: 4px 10px;
      border-radius: 5px;
      cursor: pointer;
    }
    .ullc-civitai-popup .copy-btn:hover,
    .ullc-civitai-popup .copy-all-btn:hover {
      border-color: var(--accent-color, #a78bfa);
      color: var(--accent-color, #a78bfa);
    }
    .ullc-civitai-popup .copy-btn.copied,
    .ullc-civitai-popup .copy-all-btn.copied {
      border-color: #5f9;
      color: #5f9;
    }
    .ullc-civitai-popup .description-details summary {
      cursor: pointer;
      font-weight: bold;
      font-size: 1.1em;
    }
    .ullc-civitai-popup .hash-section {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--comfy-box-bg, #1c1c1f);
      padding: 10px;
      border-radius: 5px;
    }
    .ullc-civitai-popup .hash-section strong { flex-shrink: 0; }
    .ullc-civitai-popup .hash-code {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
`;

export function injectStyles(styleId = "ultimate-lora-loader-civitai-styles") {
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = CSS;
  document.head.appendChild(style);
}
