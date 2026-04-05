import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://math.prodigygame.com/*"],
  run_at: "document_idle"
}

const BUNDLE_URL =
  "https://raw.githubusercontent.com/ProdigyPNP/ProdigyMathGameHacking/master/cheatGUI/dist/bundle.js"

declare global {
  interface Window {
    __PHEX_CHEATGUI_INJECTED__?: boolean
  }
}

const injectBundle = async () => {
  if (window.__PHEX_CHEATGUI_INJECTED__) {
    return
  }

  window.__PHEX_CHEATGUI_INJECTED__ = true

  try {
    const response = await fetch(`${BUNDLE_URL}?updated=${Date.now()}`, {
      cache: "no-store"
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch cheatGUI bundle: ${response.status}`)
    }

    const bundle = await response.text()
    const script = document.createElement("script")
    script.type = "text/javascript"
    script.textContent = bundle

    ;(document.head || document.documentElement).appendChild(script)
    script.remove()
  } catch (error) {
    console.error("[PHEx] Unable to inject cheatGUI bundle", error)
    window.__PHEX_CHEATGUI_INJECTED__ = false
  }
}

void injectBundle()