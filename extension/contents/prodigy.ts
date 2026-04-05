import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://math.prodigygame.com/*"],
  run_at: "document_start",
  world: "MAIN"
}

declare global {
  interface Window {
    __PHEX_INJECTED__?: boolean
    __PHEX_REWRITTEN__?: boolean
    __PHEX_GAME_URL__?: string
    __PHEX_GUI_URL__?: string
  }
}

/**
 * PHEx Content Script — SRI Bypass via Document Rewrite + Direct URL Replacement
 *
 * The bridge script (ISOLATED world) sets data-phex-game-url synchronously
 * with the default remote GitHub URL for the patched game, then asynchronously
 * reads
 * chrome.storage.local for custom overrides and sets data-phex-ready="1"
 * when done.
 *
 * This script (MAIN world):
 * - Immediately sets up prototype overrides and appendChild interceptors
 *   (Phase 2-4) — these don't need the URL upfront, they read it lazily
 * - Waits for data-phex-ready before running the document rewrite (Phase 1)
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
  return src.includes("game.min.js") && !origGetAttribute.call(node, "data-phex")
}

function createCleanGameScript(original: HTMLScriptElement): HTMLScriptElement {
  const extensionUrl = window.__PHEX_GAME_URL__
  const clean = origCreateElement.call(document, "script") as HTMLScriptElement
  lockIntegrity(clean)
  origSetAttribute.call(clean, "data-phex", "1")

  clean.src = extensionUrl || original.src

  if (original.onload) clean.onload = original.onload
  if (original.onerror) clean.onerror = original.onerror
  if (original.async) clean.async = original.async
  if (original.defer) clean.defer = original.defer
  if (original.type) clean.type = original.type
  if (original.crossOrigin) clean.crossOrigin = original.crossOrigin

  console.log(`[PHEx] Replaced game.min.js with extension URL: ${clean.src}`)
  return clean
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
    const clean = createCleanGameScript(child as HTMLScriptElement)
    return origAppendChild.call(this, clean) as unknown as T
  }
  stripIntegrity(child)
  return origAppendChild.call(this, child) as T
}

Node.prototype.insertBefore = function <T extends Node>(newNode: T, refNode: Node | null): T {
  if (isGameScript(newNode)) {
    const clean = createCleanGameScript(newNode as HTMLScriptElement)
    return origInsertBefore.call(this, clean, refNode) as unknown as T
  }
  stripIntegrity(newNode)
  return origInsertBefore.call(this, newNode, refNode) as T
}

Element.prototype.append = function (...nodes: (Node | string)[]) {
  const processed = nodes.map(node => {
    if (node instanceof Node) {
      if (isGameScript(node)) {
        return createCleanGameScript(node as HTMLScriptElement)
      }
      stripIntegrity(node)
    }
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
  const url = document.documentElement?.getAttribute("data-phex-game-url")
  if (url) {
    window.__PHEX_GAME_URL__ = url
    console.log("[PHEx] Extension game URL:", url)
  }
  const guiUrl = document.documentElement?.getAttribute("data-phex-gui-url")
  if (guiUrl) {
    window.__PHEX_GUI_URL__ = guiUrl
    console.log("[PHEx] Custom CheatGUI URL:", guiUrl)
  }
}

function rewriteDocument(): void {
  if (window.__PHEX_REWRITTEN__) return
  window.__PHEX_REWRITTEN__ = true

  if (!location.pathname.startsWith("/load") && !location.search.includes("launcher=true")) {
    console.log("[PHEx] Not on load page, skipping document rewrite")
    return
  }

  const extensionGameUrl = window.__PHEX_GAME_URL__
  if (!extensionGameUrl) {
    console.warn("[PHEx] No extension game URL available, cannot rewrite")
    return
  }

  try {
    const xhr = new XMLHttpRequest()
    xhr.open("GET", location.href, false)
    xhr.send()

    if (xhr.status === 200 && xhr.responseText) {
      let html = xhr.responseText

      html = html.replace(/\s+integrity\s*=\s*"[^"]*"/gi, "")
      html = html.replace(/\s+integrity\s*=\s*'[^']*'/gi, "")

      html = html.replace(
        /https?:\/\/code\.prodigygame\.com\/code\/[^"']*game\.min\.js[^"']*/gi,
        extensionGameUrl
      )

      html = html.replace(
        /<link[^>]*rel=["']preload["'][^>]*game\.min\.js[^>]*>/gi,
        "<!-- PHEx: preload removed -->"
      )
      html = html.replace(
        /<link[^>]*game\.min\.js[^>]*rel=["']preload["'][^>]*>/gi,
        "<!-- PHEx: preload removed -->"
      )

      html = html.replace(
        /(<script[^>]*(?:game\.min\.js|assets\/game\.min)[^>]*?)(\s+onload\s*=\s*"[^"]*")([^>]*>)/gi,
        "$1$3"
      )
      html = html.replace(
        /(<script[^>]*(?:game\.min\.js|assets\/game\.min)[^>]*?)(\s+onload\s*=\s*'[^']*')([^>]*>)/gi,
        "$1$3"
      )

      console.log("[PHEx] Rewriting document: integrity stripped + game.min.js URL replaced + onload stripped")

      document.open()
      document.write(html)
      document.close()

      console.log("[PHEx] Document rewrite complete")
    }
  } catch (e) {
    console.warn("[PHEx] Document rewrite failed:", e)
  }
}

// ─── Init ───
;(function main() {
  if (window.__PHEX_INJECTED__) return
  window.__PHEX_INJECTED__ = true

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
  if (document.documentElement?.getAttribute("data-phex-ready")) {
    readUrlsFromBridge()
    rewriteDocument()
    console.log("[PHEx] Content script loaded — document rewrite + direct URL replacement active")
    return
  }

  // Otherwise wait for the ready signal (async storage case)
  // Use MutationObserver on attributes — yields the event loop so the
  // ISOLATED world's storage callback can fire and set the attributes
  const bridgeObserver = new MutationObserver(() => {
    if (document.documentElement?.getAttribute("data-phex-ready")) {
      bridgeObserver.disconnect()
      readUrlsFromBridge()
      rewriteDocument()
      console.log("[PHEx] Content script loaded — document rewrite + direct URL replacement active (async)")
    }
  })
  bridgeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-phex-ready"]
  })

  // Safety timeout: if ready signal never comes, fall back to default URL
  setTimeout(() => {
    if (!window.__PHEX_GAME_URL__) {
      bridgeObserver.disconnect()
      // Read whatever is available (sync default URL at minimum)
      readUrlsFromBridge()
      if (!window.__PHEX_GAME_URL__) {
        console.warn("[PHEx] Bridge never signaled ready, no URL available")
        return
      }
      console.log("[PHEx] Bridge timeout — using fallback URL")
      rewriteDocument()
    }
  }, 500)

  console.log("[PHEx] Content script loaded — waiting for bridge ready signal")
})()
