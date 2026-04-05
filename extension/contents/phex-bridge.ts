import type { PlasmoCSConfig } from "plasmo"

/**
 * PHEx Bridge — Isolated World Content Script
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
document.documentElement.setAttribute("data-phex-game-url", defaultGameUrl)

// Async override from storage (custom dev URLs)
chrome.storage.local.get(["phexGameUrl", "phexGuiUrl"], (result) => {
  if (result.phexGameUrl) {
    document.documentElement.setAttribute("data-phex-game-url", result.phexGameUrl)
  }
  if (result.phexGuiUrl) {
    document.documentElement.setAttribute("data-phex-gui-url", result.phexGuiUrl)
  }
  // Signal that final URLs (including any overrides) are now set
  document.documentElement.setAttribute("data-phex-ready", "1")
})
