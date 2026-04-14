import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://math.prodigygame.com/*"],
  run_at: "document_start",
  world: "MAIN"
}

declare global {
  interface Window {
    __ORIGIN_INJECTED__?: boolean
    __ORIGIN_REWRITTEN__?: boolean
    __ORIGIN_GAME_URL__?: string
    __ORIGIN_GUI_URL__?: string
  }
}

/**
 * Prodigy Origin Content Script — SRI Bypass via Document Rewrite + Direct URL Replacement
 *
 * The bridge script (ISOLATED world) sets data-origin-game-url synchronously
 * with the default remote GitHub URL for the patched game, then asynchronously
 * reads
 * chrome.storage.local for custom overrides and sets data-origin-ready="1"
 * when done.
 *
 * This script (MAIN world):
 * - Immediately sets up prototype overrides and appendChild interceptors
 *   (Phase 2-4) — these don't need the URL upfront, they read it lazily
 * - Waits for data-origin-ready before running the document rewrite (Phase 1)
 *   so custom URLs from storage are available
 * - DNR blocks the original game.min.js at the network level, so the brief
 *   wait for storage is safe
 */

// ─── Save originals ───
const origAppendChild = Node.prototype.appendChild
const origInsertBefore = Node.prototype.insertBefore
const origAppend = Element.prototype.append
const origRemoveAttribute = Element.prototype.removeAttribute
const origSetAttribute = Element.prototype.setAttribute
const origGetAttribute = Element.prototype.getAttribute
const origCreateElement = Document.prototype.createElement

// ─── Phase 2: Prototype Overrides (set up immediately) ───

function lockIntegrity(el: HTMLElement): void {
  Object.defineProperty(el, "integrity", {
    set() {},
    get() { return "" },
    configurable: true,
  })
}

Document.prototype.createElement = function (tagName: string, options?: ElementCreationOptions): HTMLElement {
  const el = origCreateElement.call(this, tagName, options) as HTMLElement
  const tag = tagName.toLowerCase()
  if (tag === "script" || tag === "link") {
    lockIntegrity(el)
  }
  return el
}

Element.prototype.setAttribute = function (name: string, value: string) {
  if (name === "integrity") return
  return origSetAttribute.call(this, name, value)
}

for (const Proto of [HTMLScriptElement.prototype, HTMLLinkElement.prototype]) {
  Object.defineProperty(Proto, "integrity", {
    set() {},
    get() { return "" },
    configurable: true,
  })
}

// ─── Phase 3: appendChild override (set up immediately, reads URL lazily) ───

function isGameScript(node: Node): node is HTMLScriptElement {
  if (!(node instanceof HTMLScriptElement)) return false
  const src = node.src || ""
  return src.includes("game.min.js") && !origGetAttribute.call(node, "data-origin")
}

function createNopScript(): HTMLScriptElement {
  const nop = origCreateElement.call(document, "script") as HTMLScriptElement
  lockIntegrity(nop)
  origSetAttribute.call(nop, "data-origin", "1")
  return nop
}

function injectGameViaFetch(gameUrl: string): void {
  console.log(`[Origin] Fetching game via fetch+onreset: ${gameUrl}`)
  fetch(gameUrl)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.text()
    })
    .then(js => {
      const semaphore = `if(window.SW&&window.SW.Load&&typeof window.SW.Load.decrementLoadSemaphore==='function')window.SW.Load.decrementLoadSemaphore();`
      // Prepend 'var URL=window.URL;' to shadow document.URL (a string) with the real
      // URL constructor. HTML event handlers include the document in their scope chain,
      // so 'URL' inside an onreset handler resolves to document.URL (the page URL string)
      // instead of window.URL (the URL class), breaking 'new URL(...)' calls in the game.
      document.documentElement.setAttribute("onreset", "var URL=window.URL;\n" + js + "\n" + semaphore)
      document.documentElement.dispatchEvent(new CustomEvent("reset"))
      document.documentElement.removeAttribute("onreset")
      console.log("[Origin] Game injected via onreset")
    })
    .catch(e => {
      console.error("[Origin] Failed to fetch game:", e)
    })
}

function stripIntegrity(node: Node): void {
  if (node instanceof HTMLScriptElement || node instanceof HTMLLinkElement) {
    const hasIntegrity = origGetAttribute.call(node, "integrity")
    if (hasIntegrity) {
      origRemoveAttribute.call(node, "integrity")
    }
  }
}

Node.prototype.appendChild = function <T extends Node>(child: T): T {
  if (isGameScript(child)) {
    const gameUrl = window.__ORIGIN_GAME_URL__ || (child as HTMLScriptElement).src
    injectGameViaFetch(gameUrl)
    return origAppendChild.call(this, createNopScript()) as unknown as T
  }
  stripIntegrity(child)
  return origAppendChild.call(this, child) as T
}

Node.prototype.insertBefore = function <T extends Node>(newNode: T, refNode: Node | null): T {
  if (isGameScript(newNode)) {
    const gameUrl = window.__ORIGIN_GAME_URL__ || (newNode as HTMLScriptElement).src
    injectGameViaFetch(gameUrl)
    return origInsertBefore.call(this, createNopScript(), refNode) as unknown as T
  }
  stripIntegrity(newNode)
  return origInsertBefore.call(this, newNode, refNode) as T
}

Element.prototype.append = function (...nodes: (Node | string)[]) {
  const processed = nodes.map(node => {
    if (node instanceof Node && isGameScript(node)) {
      const gameUrl = window.__ORIGIN_GAME_URL__ || (node as HTMLScriptElement).src
      injectGameViaFetch(gameUrl)
      return createNopScript()
    }
    if (node instanceof Node) stripIntegrity(node)
    return node
  })
  return origAppend.apply(this, processed)
}

// ─── Phase 4: MutationObserver — strip integrity + hijack parser-added game script ───
let gameScriptHandled = false

function handleParserAddedGameScript(script: HTMLScriptElement): void {
  if (gameScriptHandled) return
  gameScriptHandled = true
  const gameUrl = window.__ORIGIN_GAME_URL__ || script.src
  // Neutralize the src so the browser doesn't try to load the original (DNR would
  // block anyway, but this avoids the network error noise + ensures it never runs).
  origSetAttribute.call(script, "data-origin", "1")
  script.removeAttribute("src")
  script.textContent = ""
  injectGameViaFetch(gameUrl)
}

function handleGamePreload(link: HTMLLinkElement): void {
  // Stop the preload from triggering a fetch for the original game.min.js.
  link.remove()
}

const integrityObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof HTMLScriptElement) {
        const hasIntegrity = origGetAttribute.call(node, "integrity")
        if (hasIntegrity) origRemoveAttribute.call(node, "integrity")
        const src = node.src || ""
        if (src.includes("game.min.js") && !origGetAttribute.call(node, "data-origin")) {
          handleParserAddedGameScript(node)
        }
      } else if (node instanceof HTMLLinkElement) {
        const hasIntegrity = origGetAttribute.call(node, "integrity")
        if (hasIntegrity) origRemoveAttribute.call(node, "integrity")
        const href = node.href || ""
        const rel = (node.rel || "").toLowerCase()
        if (rel === "preload" && href.includes("game.min.js")) {
          handleGamePreload(node)
        }
      }
    }
  }
})

// ─── Phase 1: Document Rewrite (runs after bridge signals ready) ───

function readUrlsFromBridge(): void {
  const url = document.documentElement?.getAttribute("data-origin-game-url")
  if (url) {
    window.__ORIGIN_GAME_URL__ = url
    console.log("[Origin] Extension game URL:", url)
  }
  const guiUrl = document.documentElement?.getAttribute("data-origin-gui-url")
  if (guiUrl) {
    window.__ORIGIN_GUI_URL__ = guiUrl
    console.log("[Origin] Custom mod bundle URL:", guiUrl)
  }
}

function scanExistingDom(): void {
  // Catch the game script / preload if they're already in the DOM by the time we run.
  const gameScript = document.querySelector<HTMLScriptElement>(
    'script[src*="game.min.js"]:not([data-origin])'
  )
  if (gameScript) handleParserAddedGameScript(gameScript)

  const preloads = document.querySelectorAll<HTMLLinkElement>(
    'link[rel="preload"][href*="game.min.js"]'
  )
  preloads.forEach(handleGamePreload)

  document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
    "script[integrity], link[integrity]"
  ).forEach((el) => origRemoveAttribute.call(el, "integrity"))
}

// ─── Init ───
;(function main() {
  if (window.__ORIGIN_INJECTED__) return
  window.__ORIGIN_INJECTED__ = true

  // Start integrity observer immediately
  const root = document.documentElement || document
  integrityObserver.observe(root, { childList: true, subtree: true })

  if (!document.documentElement) {
    const earlyObserver = new MutationObserver(() => {
      if (document.documentElement) {
        earlyObserver.disconnect()
        integrityObserver.observe(document.documentElement, { childList: true, subtree: true })
      }
    })
    earlyObserver.observe(document, { childList: true })
  }

  // Check if bridge already set the ready signal (sync default URL case)
  if (document.documentElement?.getAttribute("data-origin-ready")) {
    readUrlsFromBridge()
    scanExistingDom()
    console.log("[Origin] Content script loaded — document rewrite + direct URL replacement active")
    return
  }

  // Otherwise wait for the ready signal (async storage case)
  // Use MutationObserver on attributes — yields the event loop so the
  // ISOLATED world's storage callback can fire and set the attributes
  const bridgeObserver = new MutationObserver(() => {
    if (document.documentElement?.getAttribute("data-origin-ready")) {
      bridgeObserver.disconnect()
      readUrlsFromBridge()
      scanExistingDom()
      console.log("[Origin] Content script loaded — document rewrite + direct URL replacement active (async)")
    }
  })
  bridgeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-origin-ready"]
  })

  console.log("[Origin] Content script loaded — waiting for bridge ready signal")
})()
