import type { PlasmoCSConfig } from "plasmo"

/**
 * Prodigy Origin Bridge — Isolated World Content Script
 *
 * Sets the default remote game URL synchronously so the MAIN world script
 * can read it immediately. Then reads chrome.storage.local for custom
 * overrides and updates the attribute + sets a ready signal.
 */
export const config: PlasmoCSConfig = {
  matches: ["https://math.prodigygame.com/*"],
  run_at: "document_start"
}

// Default: fetch patched game live from GitHub
const defaultGameUrl = "https://raw.githubusercontent.com/ProdigyPXP/P-NP/patched/game.min.js"

// Synchronous — MAIN world can read this immediately
document.documentElement.setAttribute("data-origin-game-url", defaultGameUrl)

// Async override from storage (custom dev URLs)
chrome.storage.local.get(["originGameUrl", "originGuiUrl"], (result) => {
  if (result.originGameUrl) {
    document.documentElement.setAttribute("data-origin-game-url", result.originGameUrl)
  }
  if (result.originGuiUrl) {
    document.documentElement.setAttribute("data-origin-gui-url", result.originGuiUrl)
  }
  // Signal that final URLs (including any overrides) are now set
  document.documentElement.setAttribute("data-origin-ready", "1")
})
