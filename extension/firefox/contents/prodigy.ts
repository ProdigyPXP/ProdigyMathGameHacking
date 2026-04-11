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
      document.documentElement.setAttribute("onreset", js + "\n" + semaphore)
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

// ─── Phase 4: MutationObserver for integrity stripping ───
const integrityObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof HTMLScriptElement || node instanceof HTMLLinkElement) {
        const hasIntegrity = origGetAttribute.call(node, "integrity")
        if (hasIntegrity) {
          origRemoveAttribute.call(node, "integrity")
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

function rewriteDocument(): void {
  if (window.__ORIGIN_REWRITTEN__) return
  window.__ORIGIN_REWRITTEN__ = true

  if (!location.pathname.startsWith("/load") && !location.search.includes("launcher=true")) {
    console.log("[Origin] Not on load page, skipping document rewrite")
    return
  }

  const extensionGameUrl = window.__ORIGIN_GAME_URL__
  if (!extensionGameUrl) {
    console.warn("[Origin] No extension game URL available, cannot rewrite")
    return
  }

  try {
    // Strip auth code/state params — they're one-time tokens and re-fetching
    // them triggers a redirect to play.prodigygame.com (CORS block).
    const rewriteUrl = new URL(location.href)
    rewriteUrl.searchParams.delete("code")
    rewriteUrl.searchParams.delete("state")
    const xhr = new XMLHttpRequest()
    xhr.open("GET", rewriteUrl.href, false)
    xhr.send()

    if (xhr.status === 200 && xhr.responseText) {
      let html = xhr.responseText

      html = html.replace(/\s+integrity\s*=\s*"[^"]*"/gi, "")
      html = html.replace(/\s+integrity\s*=\s*'[^']*'/gi, "")

      html = html.replace(
        /<link[^>]*rel=["']preload["'][^>]*game\.min\.js[^>]*>/gi,
        "<!-- Origin: preload removed -->"
      )
      html = html.replace(
        /<link[^>]*game\.min\.js[^>]*rel=["']preload["'][^>]*>/gi,
        "<!-- Origin: preload removed -->"
      )

      // Replace the entire game script tag with an inline fetch+onreset injector.
      // We cannot use <script src="raw.githubusercontent.com/..."> because GitHub
      // serves JS as text/plain, which Chrome's strict MIME check rejects.
      // An inline script fetches the content as text and injects it via onreset,
      // which executes in MAIN world without any MIME type restriction.
      const gameUrl = JSON.stringify(extensionGameUrl)
      const semaphore = `if(window.SW&&window.SW.Load&&typeof window.SW.Load.decrementLoadSemaphore==='function')window.SW.Load.decrementLoadSemaphore();`
      // Prepend 'var URL=window.URL;' to shadow document.URL (a string) with the real
      // URL constructor. HTML event handlers include the document in their scope chain,
      // so 'URL' inside an onreset handler resolves to document.URL (the page URL string)
      // instead of window.URL (the URL class), breaking 'new URL(...)' calls in the game.
      const inlineInjector = `<script>(async()=>{try{const js=await(await fetch(${gameUrl})).text();document.documentElement.setAttribute("onreset","var URL=window.URL;\\n"+js+"\\n${semaphore}");document.documentElement.dispatchEvent(new CustomEvent("reset"));document.documentElement.removeAttribute("onreset");console.log("[Origin] Game injected via onreset")}catch(e){console.error("[Origin] Failed to inject game:",e)}})();<\/script>`

      html = html.replace(
        /<script[^>]*code\.prodigygame\.com\/code\/[^"']*game\.min\.js[^>]*>\s*(<\/script>)?/gi,
        inlineInjector
      )

      console.log("[Origin] Rewriting document: integrity stripped + game script replaced with fetch+onreset injector")

      document.open()
      document.write(html)
      document.close()

      console.log("[Origin] Document rewrite complete")
    }
  } catch (e) {
    console.warn("[Origin] Document rewrite failed:", e)
  }
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
    rewriteDocument()
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
      rewriteDocument()
      console.log("[Origin] Content script loaded — document rewrite + direct URL replacement active (async)")
    }
  })
  bridgeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-origin-ready"]
  })

  console.log("[Origin] Content script loaded — waiting for bridge ready signal")
})()
