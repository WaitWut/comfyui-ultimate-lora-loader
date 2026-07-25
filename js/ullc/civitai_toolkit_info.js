import { api } from "../../../scripts/api.js";

// Civitai Toolkit model info (soft dependency on /civitai_utils/*)

let _civitaiModelsCache = null;
let _civitaiModelsCacheTime = 0;
const CIVITAI_MODELS_CACHE_MS = 60000;

function _normPath(p) {
  return String(p || "").replace(/\\/g, "/").toLowerCase();
}

export async function fetchCivitaiLocalModels(force = false) {
  const now = Date.now();
  if (!force && _civitaiModelsCache && now - _civitaiModelsCacheTime < CIVITAI_MODELS_CACHE_MS) {
    return _civitaiModelsCache;
  }
  const res = await api.fetchApi("/civitai_utils/get_local_models");
  if (!res.ok) {
    throw new Error(`Civitai Toolkit API HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data.status !== "ok" || !Array.isArray(data.models)) {
    throw new Error(data.message || "Civitai Toolkit returned no models");
  }
  _civitaiModelsCache = data.models;
  _civitaiModelsCacheTime = now;
  return _civitaiModelsCache;
}

export function findCivitaiModel(models, loraPath) {
  const target = _normPath(loraPath);
  const basename = target.split("/").pop();
  const loras = models.filter((m) => String(m.model_type || "").toLowerCase() === "loras");
  const pool = loras.length ? loras : models;
  return (
    pool.find((m) => _normPath(m.filename) === target) ||
    pool.find((m) => {
      const f = _normPath(m.filename);
      return f === basename || f.endsWith("/" + basename);
    }) ||
    null
  );
}

/** Soft lookup — returns null if Toolkit missing / not indexed. */
export async function getCivitaiLoraMeta(loraPath) {
  if (!loraPath) return null;
  try {
    const models = await fetchCivitaiLocalModels();
    return findCivitaiModel(models, loraPath);
  } catch (_) {
    return null;
  }
}

export function createCivitaiModelInfoPopup(title, model) {
  const existing = document.querySelector(".ullc-civitai-popup");
  if (existing) existing.remove();

  const popup = document.createElement("div");
  popup.className = "ullc-civitai-popup";
  const data = model;

  const copyToClipboard = (text, targetElement) => {
    navigator.clipboard.writeText(text).then(() => {
      const originalText = targetElement.innerHTML;
      targetElement.innerHTML = "Copied!";
      targetElement.classList.add("copied");
      setTimeout(() => {
        targetElement.innerHTML = originalText;
        targetElement.classList.remove("copied");
      }, 1500);
    }).catch((err) => console.error("[UltimateLoraLoaderCivitai] copy failed:", err));
  };

  const parseHtml = (htmlString) =>
    new DOMParser().parseFromString(htmlString, "text/html").body.innerHTML;

  const versionDescriptionHTML = data.version_description
    ? parseHtml(data.version_description)
    : "";
  const modelDescriptionHTML = data.model_description
    ? parseHtml(data.model_description)
    : "<em>No description available.</em>";

  const triggersHTML =
    data.trained_words && data.trained_words.length > 0
      ? data.trained_words
          .map((tag) => `<code class="trigger-word" title="Click to copy">${tag}</code>`)
          .join("")
      : "<em>None specified</em>";

  const copyAllTriggersBtn =
    data.trained_words && data.trained_words.length > 0
      ? `<button class="copy-all-btn" data-text="${data.trained_words.join(", ")}">Copy All</button>`
      : "";

  const tagsHTML =
    data.tags && data.tags.length > 0
      ? `<div class="detail-tags">${data.tags.map((tag) => `<span class="detail-tag">${tag}</span>`).join("")}</div>`
      : "<em>No tags found.</em>";

  const ratingText =
    data.civitai_stats?.rating !== undefined
      ? `${data.civitai_stats.rating.toFixed(1)} (${data.civitai_stats.ratingCount})`
      : `👍 ${data.civitai_stats?.thumbsUpCount || 0}`;

  popup.innerHTML = `
    <div class="popup-content">
      <div class="popup-header">
        <h2>${title}</h2>
        <span class="popup-close" title="Close">&times;</span>
      </div>
      <div class="popup-body">
        <div class="info-grid">
          <div class="info-item"><strong>Civitai Name:</strong> <span>${data.civitai_model_name || "N/A"}</span></div>
          <div class="info-item"><strong>Version:</strong> <span>${data.version_name || "N/A"}</span></div>
          <div class="info-item"><strong>Base Model:</strong> <span>${data.base_model || "N/A"}</span></div>
          <div class="info-item"><strong>Downloads:</strong> <span>${data.civitai_stats?.downloadCount || 0}</span></div>
          <div class="info-item"><strong>Rating:</strong> <span>${ratingText}</span></div>
        </div>
        <div class="info-section">
          <h4>Tags</h4>
          ${tagsHTML}
        </div>
        <div class="info-section">
          <div class="section-header">
            <h4>Trigger Words</h4>
            ${copyAllTriggersBtn}
          </div>
          <div class="triggers-container">${triggersHTML}</div>
        </div>
        ${
          versionDescriptionHTML
            ? `<div class="info-section">
                <h4>Version Description</h4>
                <div class="model-description-content version-desc">${versionDescriptionHTML}</div>
              </div>`
            : ""
        }
        <div class="info-section">
          <details class="description-details" open>
            <summary>Model Description</summary>
            <div class="model-description-content">${modelDescriptionHTML}</div>
          </details>
        </div>
        <div class="info-section hash-section">
          <strong>Hash:</strong>
          <code class="hash-code">${data.hash || "N/A"}</code>
          <button class="copy-btn" data-text="${data.hash || ""}">Copy</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(popup);

  const close = () => popup.remove();
  popup.querySelector(".popup-close").onclick = close;
  popup.onclick = (e) => {
    if (e.target === popup) close();
  };

  popup.querySelectorAll(".trigger-word").forEach((el) => {
    el.onclick = () => copyToClipboard(el.textContent, el);
  });
  const copyAllBtn = popup.querySelector(".copy-all-btn");
  if (copyAllBtn) {
    copyAllBtn.onclick = (e) => copyToClipboard(e.target.dataset.text, e.target);
  }
  const copyHashBtn = popup.querySelector(".hash-section .copy-btn");
  if (copyHashBtn) {
    copyHashBtn.onclick = (e) => copyToClipboard(e.target.dataset.text, e.target);
  }
}

export async function openCivitaiToolkitLoraInfo(loraPath) {
  const displayName = String(loraPath || "").split(/[/\\]/).pop() || loraPath;
  try {
    const models = await fetchCivitaiLocalModels();
    const model = findCivitaiModel(models, loraPath);
    if (!model) {
      alert(
        `Civitai Toolkit has no info for:\n${loraPath}\n\nMake sure the Toolkit scan finished and this LoRA is indexed.`
      );
      return;
    }
    createCivitaiModelInfoPopup(displayName, model);
  } catch (e) {
    console.error("[UltimateLoraLoaderCivitai] Toolkit info failed:", e);
    alert(
      `Could not open Toolkit info.\nIs Civitai Toolkit installed and loaded?\n\n${e.message || e}`
    );
  }
}
