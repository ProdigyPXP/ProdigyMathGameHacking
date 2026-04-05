import type { CSSProperties } from "react"

const cardStyle: CSSProperties = {
  width: 320,
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

function openTab(url: string) {
  chrome.tabs.create({ url })
}

function IndexPopup() {
  return (
    <main style={cardStyle}>
      <h1 style={{ margin: 0, fontSize: 22 }}>PHEx</h1>
      <p style={{ marginTop: 8, lineHeight: 1.45 }}>
        cheatGUI bundle injection is enabled for Prodigy pages.
      </p>

      <button
        style={buttonStyle}
        onClick={() => openTab("https://play.prodigygame.com")}
      >
        Open Prodigy
      </button>

      <button
        style={{ ...buttonStyle, background: "#0ea5e9" }}
        onClick={() => openTab("https://dsc.gg/ProdigyPNP")}
      >
        Open Discord
      </button>
    </main>
  )
}

export default IndexPopup