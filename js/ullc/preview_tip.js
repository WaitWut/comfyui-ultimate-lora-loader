// Shared hover preview tip (Toolkit local_cover_path)

import { IMAGE_ICON_SVG } from "./icons.js";

let activeTip = null;

export function hidePreviewTip() {
  if (activeTip) {
    activeTip.remove();
    activeTip = null;
  }
}

export function showPreviewTip(anchorEl, coverUrl) {
  hidePreviewTip();
  if (!coverUrl || !anchorEl) return;

  const tip = document.createElement("div");
  tip.className = "fll-preview-tip";
  const img = document.createElement("img");
  img.src = coverUrl;
  img.alt = "preview";
  tip.appendChild(img);
  document.body.appendChild(tip);
  activeTip = tip;

  const rect = anchorEl.getBoundingClientRect();
  const tipW = 228;
  const tipH = 290;
  let left = rect.right + 8;
  let top = rect.top;
  if (left + tipW > window.innerWidth - 8) left = rect.left - tipW - 8;
  if (top + tipH > window.innerHeight - 8) top = Math.max(8, window.innerHeight - tipH - 8);
  tip.style.left = left + "px";
  tip.style.top = top + "px";
}

/**
 * Wire mouseenter/leave on a preview button.
 * getCoverUrl: string | (() => string|null)
 */
export function bindPreviewHover(btn, getCoverUrl) {
  btn.onmouseenter = () => {
    const url = typeof getCoverUrl === "function" ? getCoverUrl() : getCoverUrl;
    showPreviewTip(btn, url);
  };
  btn.onmouseleave = () => hidePreviewTip();
  // Don't select the row / entry when interacting with the preview control.
  btn.onmousedown = (e) => e.stopPropagation();
  btn.onclick = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };
}

/** Create preview control. No native title — it delays and covers the tip. */
export function createPreviewButton(coverUrl) {
  const btn = document.createElement("div");
  btn.className = "fll-preview-btn";
  btn.innerHTML = IMAGE_ICON_SVG;
  if (coverUrl) {
    btn.classList.add("has-preview");
    bindPreviewHover(btn, coverUrl);
  }
  return btn;
}
