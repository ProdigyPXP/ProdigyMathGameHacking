# Prodigy Origin — Claude Configuration

## Project Overview

Prodigy Origin is a monorepo for modding Prodigy Math Game. It is maintained by the **ProdigyPXP** organization.

### Architecture

- **originGUI/** — In-game mod menu written in TypeScript, bundled with esbuild. Provides a visual mod menu injected into the Prodigy game page.
- **extension/** — Plasmo-based MV3 Chrome extension (Prodigy Origin). Handles:
  - Blocking the original `game.min.js` via declarativeNetRequest
  - Removing CSP/X-Frame-Options headers
  - Injecting patched game code and mod menu bundle using the `onreset` attribute trick
  - Custom login background and logo redirects
- **typings/** — Reverse-engineered TypeScript type definitions for Prodigy's game objects
- **meta/** — Documentation, guides

### Key Technical Details

- **Package manager:** pnpm (NOT npm). Workspace defined in `pnpm-workspace.yaml`.
- **Build tools:** esbuild for originGUI, Plasmo for extension
- **Extension injection method:** `document.documentElement.setAttribute("onreset", code)` + `dispatchEvent(new CustomEvent("reset"))` + `removeAttribute("onreset")` — this bypasses CSP restrictions in MV3
- **Content script runs in `world: "MAIN"`** — Plasmo handles this via `chrome.scripting.registerContentScripts()` from the background service worker
- **DNR rules are registered dynamically** in `extension/background.ts` via `chrome.declarativeNetRequest.updateDynamicRules()`
- **Log prefix:** `[Origin]` in all console output
- **Window globals:** `__ORIGIN_INJECTED__`, `__ORIGIN_REWRITTEN__`, `__ORIGIN_GAME_URL__`, `__ORIGIN_GUI_URL__`
- **DOM attributes:** `data-origin-game-url`, `data-origin-gui-url`, `data-origin-ready`, `data-origin`
- **Storage keys:** `originGameUrl`, `originGuiUrl`

### Related Repos

- **ProdigyPXP/P-NP** — Static patch pipeline. GitHub Action runs every 2 hours, fetches Prodigy game files, patches them, commits to "patched" branch. The extension fetches the patched `game.min.js` from this branch.

## Critical Rules

1. **Use pnpm**, never npm.
2. **Keep git history** — no force pushes, no history rewrites.
3. **esbuild for originGUI**, Plasmo for extension. No webpack.
4. **MV3 only** — no MV2 APIs. Use declarativeNetRequest, not webRequest.
5. **The onreset injection trick is intentional and critical** — do not replace it with script tag injection or other methods. It's the only reliable way to inject code into the MAIN world under MV3 CSP restrictions.
6. **Graceful degradation** — if patches fail, set `patchDegraded: true` and create a GitHub issue.

## Build Commands

```bash
# Install all workspace dependencies
pnpm install

# Build originGUI
cd originGUI && pnpm build

# Build extension (Plasmo)
cd extension && pnpm build

# Dev mode for extension
cd extension && pnpm dev
```

## Testing

- Load the unpacked extension from `extension/build/chrome-mv3-dev/` (dev) or `extension/build/chrome-mv3-prod/` (prod)
- Navigate to https://math.prodigygame.com/ to test
- Check browser console for `[Origin]` log messages
- Verify DNR rules are active in chrome://extensions → service worker → inspect

## File Structure (Key Files)

```
extension/
  background.ts          — Service worker: DNR rules registration
  contents/prodigy.ts    — Content script (world: MAIN): game + mod menu injection
  contents/origin-bridge.ts — Bridge script (ISOLATED world): URL communication
  popup.tsx              — Extension popup UI
  package.json           — Plasmo config + manifest overrides
originGUI/
  build.mjs              — esbuild build script
  src/index.ts           — Entry point
  dist/bundle.js         — Built output (committed for P-NP to fetch)
typings/
  *.d.ts                 — Game type definitions
```
