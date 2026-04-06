import { useEffect, useState } from "react"
import type { CSSProperties } from "react"

const DEFAULTS = {
  gameUrl: "",
  guiUrl: ""
}

const cardStyle: CSSProperties = {
  width: 360,
  minHeight: 220,
  padding: 16,
  boxSizing: "border-box",
  fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  color: "#e2e8f0"
}

const buttonStyle: CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 8,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1d4ed8",
  color: "#eff6ff",
  cursor: "pointer",
  fontWeight: 600
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#e2e8f0",
  fontSize: 13,
  boxSizing: "border-box",
  marginTop: 4
}

const labelStyle: CSSProperties = {
  display: "block",
  marginTop: 10,
  fontSize: 12,
  fontWeight: 600,
  color: "#94a3b8"
}

function openTab(url: string) {
  chrome.tabs.create({ url })
}

function IndexPopup() {
  const [gameUrl, setGameUrl] = useState("")
  const [guiUrl, setGuiUrl] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(["originGameUrl", "originGuiUrl"], (result) => {
      setGameUrl(result.originGameUrl ?? DEFAULTS.gameUrl)
      setGuiUrl(result.originGuiUrl ?? DEFAULTS.guiUrl)
    })
  }, [])

  function save() {
    chrome.storage.local.set({
      originGameUrl: gameUrl,
      originGuiUrl: guiUrl
    }, () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  function reset() {
    setGameUrl(DEFAULTS.gameUrl)
    setGuiUrl(DEFAULTS.guiUrl)
    chrome.storage.local.remove(["originGameUrl", "originGuiUrl"])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <main style={cardStyle}>
      <h1 style={{ margin: 0, fontSize: 22 }}>Prodigy Origin</h1>
      <p style={{ marginTop: 6, marginBottom: 0, lineHeight: 1.4, fontSize: 13 }}>
        Mod loader and game enhancements for Prodigy.
      </p>

      <label style={labelStyle}>
        Patched game.min.js URL
        <input
          style={inputStyle}
          value={gameUrl}
          onChange={(e) => setGameUrl(e.target.value)}
          placeholder="(default: GitHub patched branch)"
        />
      </label>

      <label style={labelStyle}>
        Mod bundle URL
        <input
          style={inputStyle}
          value={guiUrl}
          onChange={(e) => setGuiUrl(e.target.value)}
          placeholder="(default: baked into patched game)"
        />
      </label>

      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <button style={{ ...buttonStyle, marginTop: 0, flex: 1 }} onClick={save}>
          {saved ? "Saved!" : "Save"}
        </button>
        <button
          style={{ ...buttonStyle, marginTop: 0, flex: 1, background: "#475569" }}
          onClick={reset}
        >
          Reset
        </button>
      </div>

      <p style={{ marginTop: 6, fontSize: 11, opacity: 0.5 }}>
        Leave blank to use defaults. Reload the Prodigy tab after saving.
      </p>

      <hr style={{ border: "none", borderTop: "1px solid #334155", margin: "10px 0" }} />

      <button
        style={{ ...buttonStyle, marginTop: 0 }}
        onClick={() => openTab("https://play.prodigygame.com")}
      >
        Open Prodigy
      </button>

      <button
        style={{ ...buttonStyle, background: "#0ea5e9" }}
        onClick={() => openTab("https://dsc.gg/ProdigyPXP")}
      >
        Open Discord
      </button>
    </main>
  )
}

export default IndexPopup
