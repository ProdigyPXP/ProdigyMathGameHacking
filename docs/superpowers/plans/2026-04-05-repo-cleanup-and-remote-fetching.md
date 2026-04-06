# Repo Cleanup & Remote-Only Fetching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up both GitHub repos (delete stale branches, merge patched into P-NP master), remove the bundled game.min.js from the extension, and make both game.min.js and bundle.js always fetched live from GitHub.

**Architecture:** The extension currently bundles a 10MB `game.min.js` in `extension/assets/`. Instead, the MAIN world content script will fetch the patched game file directly from `https://raw.githubusercontent.com/ProdigyPXP/P-NP/patched/game.min.js` at runtime. CheatGUI `bundle.js` is already fetched live (baked into P-NP's suffix code). The bridge script and popup URL configurator remain for dev overrides.

**Tech Stack:** Plasmo (extension), esbuild (cheatGUI), GitHub CLI (`gh`), git

---

## Phase 1: Git Repo Cleanup

### Task 1: Delete stale branches in PMGH (ProdigyMathGameHacking)

**Context:** PMGH has these remote branches to delete:
- `dependabot/github_actions/pnpm/action-setup-4.0.0` — stale dependabot PR
- `dependabot/npm_and_yarn/cheatGUI/sass-loader-16.0.0` — stale dependabot PR
- `dependabot/npm_and_yarn/cheatGUI/typescript-eslint/eslint-plugin-8.0.0` — stale dependabot PR
- `international` — old feature branch (last commit: "no need for this")
- `kennel` — old feature branch (ancient commits)
- `ultimate` — old feature branch (ancient commits)

Only `master` survives.

- [ ] **Step 1: Delete all stale remote branches**

```bash
cd /home/alex/ProdigyMathGameHacking
git push origin --delete dependabot/github_actions/pnpm/action-setup-4.0.0
git push origin --delete dependabot/npm_and_yarn/cheatGUI/sass-loader-16.0.0
git push origin --delete dependabot/npm_and_yarn/cheatGUI/typescript-eslint/eslint-plugin-8.0.0
git push origin --delete international
git push origin --delete kennel
git push origin --delete ultimate
```

- [ ] **Step 2: Prune local tracking refs**

```bash
git remote prune origin
```

- [ ] **Step 3: Verify only master remains**

```bash
git branch -a
```
Expected: only `master` and `remotes/origin/master` (plus `remotes/origin/HEAD`).

- [ ] **Step 4: Commit — N/A (no file changes)**

### Task 2: Clean up P-NP branches

**Context:** P-NP has these remote branches:
- `master` — source code (patcher, workflows, config)
- `patched` — auto-generated output (game.min.js + metadata.json), updated every 2h by GitHub Actions
- `freehost` — old experiment ("trynna do some free hostin")
- `standalone` — old experiment

`patched` is **NOT merged into master** — it's a separate orphan branch with only build artifacts. It must stay as-is because the GitHub Action (`patch.yml`) writes to it on a schedule. `freehost` and `standalone` are deleted.

- [ ] **Step 1: Delete stale remote branches**

```bash
cd /home/alex/P-NP
git push origin --delete freehost
git push origin --delete standalone
```

- [ ] **Step 2: Prune local tracking refs**

```bash
git remote prune origin
```

- [ ] **Step 3: Verify remaining branches**

```bash
git branch -a
```
Expected: `master`, `remotes/origin/master`, `remotes/origin/patched`, `remotes/origin/HEAD`.

- [ ] **Step 4: Commit — N/A (no file changes)**

---

## Phase 2: Remove Bundled game.min.js from Extension

### Task 3: Remove `extension/assets/game.min.js` and update references

**Files:**
- Delete: `extension/assets/game.min.js` (10MB file)
- Modify: `extension/package.json` — remove `web_accessible_resources` entry
- Modify: `extension/contents/phex-bridge.ts` — remove bundled URL, use GitHub raw URL as default
- Modify: `extension/contents/prodigy.ts` — update comments referencing bundled asset

The default game URL becomes: `https://raw.githubusercontent.com/ProdigyPXP/P-NP/patched/game.min.js`

- [ ] **Step 1: Delete the bundled game asset**

```bash
cd /home/alex/ProdigyMathGameHacking
rm extension/assets/game.min.js
```

Keep `extension/assets/icon.png` (it's the extension icon).

- [ ] **Step 2: Remove `web_accessible_resources` from `extension/package.json`**

In `extension/package.json`, remove the entire `web_accessible_resources` block from the `manifest` section:

```json
// REMOVE this entire block from manifest:
"web_accessible_resources": [
  {
    "resources": ["assets/game.min.js"],
    "matches": ["https://math.prodigygame.com/*"]
  }
]
```

Also remove the dev-only `host_permissions` entries (local IP addresses). The final `host_permissions` should be:

```json
"host_permissions": [
  "*://*.prodigygame.com/*",
  "https://raw.githubusercontent.com/*"
]
```

- [ ] **Step 3: Rewrite `extension/contents/phex-bridge.ts` to use GitHub raw URL as default**

Replace the entire file with:

```typescript
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
```

- [ ] **Step 4: Update comment in `extension/contents/prodigy.ts`**

Change the doc comment block (lines 18-33) — replace references to "bundled extension asset URL" with "remote GitHub URL":

```typescript
/**
 * PHEx Content Script — SRI Bypass via Document Rewrite + Direct URL Replacement
 *
 * The bridge script (ISOLATED world) sets data-phex-game-url synchronously
 * with the default remote GitHub URL for the patched game, then asynchronously
 * reads chrome.storage.local for custom overrides and sets data-phex-ready="1"
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
```

Also update the safety timeout comment (line 277):

```typescript
// Safety timeout: if ready signal never comes, fall back to default URL
```

- [ ] **Step 5: Update popup placeholder text in `extension/popup.tsx`**

Change line 99 placeholder from:
```
placeholder="(default: bundled extension asset)"
```
to:
```
placeholder="(default: GitHub P-NP patched branch)"
```

- [ ] **Step 6: Build the extension**

```bash
cd /home/alex/ProdigyMathGameHacking/extension
pnpm build
```

Expected: Build succeeds without errors. The built output in `build/chrome-mv3-prod/` should NOT contain `assets/game.min.js`.

- [ ] **Step 7: Verify no bundled game.min.js in build**

```bash
find extension/build/chrome-mv3-prod -name "game.min.js" 2>/dev/null
```

Expected: No output (file should not exist).

- [ ] **Step 8: Commit**

```bash
cd /home/alex/ProdigyMathGameHacking
git add extension/contents/phex-bridge.ts extension/contents/prodigy.ts extension/popup.tsx extension/package.json
git rm extension/assets/game.min.js
git commit -m "feat: remove bundled game.min.js, fetch patched game live from GitHub

The extension no longer bundles the 10MB patched game file. Instead it
fetches from https://raw.githubusercontent.com/ProdigyPXP/P-NP/patched/game.min.js
at runtime. Custom URL overrides via the popup configurator still work."
```

---

## Phase 3: Revert Dev-Only Changes in P-NP

### Task 4: Revert P-NP local dev URL changes

**Files:**
- Modify: `P-NP/src/constants.ts` — revert `GUI_LINK` to GitHub raw URL

The current `GUI_LINK` points to `https://192.168.0.73:8081/bundle.js` (local dev). Revert to the production GitHub URL.

- [ ] **Step 1: Revert `src/constants.ts`**

Change `GUI_LINK` from:
```typescript
export const GUI_LINK = "https://192.168.0.73:8081/bundle.js";
```
to:
```typescript
export const GUI_LINK = "https://raw.githubusercontent.com/ProdigyPXP/ProdigyMathGameHacking/master/cheatGUI/dist/bundle.js";
```

- [ ] **Step 2: Verify `src/patch.ts` still has the `__PHEX_GUI_URL__` override**

Line 306 should still read:
```typescript
const guiUrl = window.__PHEX_GUI_URL__ || "${GUI_LINK}";
```

This is correct — the extension popup can still override the GUI URL for dev purposes, but the default is the live GitHub URL.

- [ ] **Step 3: Build P-NP to verify**

```bash
cd /home/alex/P-NP
pnpm install && pnpm build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /home/alex/P-NP
git add src/constants.ts
git commit -m "fix: revert GUI_LINK to production GitHub URL

Local dev URL (192.168.0.73) was a temporary override. The extension
popup configurator handles custom URLs for dev without changing source."
```

---

## Phase 4: Clean Up Build Artifacts & Misc

### Task 5: Clean up PMGH build artifacts and dev files from git

**Context:** The PMGH repo has `extension/build/` contents tracked in git (build artifacts that shouldn't be committed), and `.mcp.json` was added for debugging.

**Files:**
- Modify: `.gitignore` — add `extension/build/`, `.mcp.json`, `extension/.plasmo/cache/`
- Delete (from git): `.mcp.json` (Chrome DevTools MCP config, debug only)
- Delete (from git tracking): `extension/build/` directory (build artifacts)
- Delete (from git tracking): `extension/.plasmo/cache/` directory

- [ ] **Step 1: Add build artifacts to `.gitignore`**

Append to `/home/alex/ProdigyMathGameHacking/.gitignore`:

```
# Extension build output
extension/build/
extension/.plasmo/cache/

# MCP debug config
.mcp.json
```

- [ ] **Step 2: Remove tracked build artifacts from git**

```bash
cd /home/alex/ProdigyMathGameHacking
git rm -r --cached extension/build/ 2>/dev/null || true
git rm -r --cached extension/.plasmo/cache/ 2>/dev/null || true
git rm --cached .mcp.json 2>/dev/null || true
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore extension build artifacts and MCP debug config

Build output and cache files should not be tracked. The .mcp.json was
a temporary debug config for Chrome DevTools MCP."
```

### Task 6: Push all changes

- [ ] **Step 1: Push PMGH**

```bash
cd /home/alex/ProdigyMathGameHacking
git push origin master
```

- [ ] **Step 2: Push P-NP**

```bash
cd /home/alex/P-NP
git push origin master
```

- [ ] **Step 3: Verify both repos look clean**

```bash
cd /home/alex/ProdigyMathGameHacking && git status && echo "---" && cd /home/alex/P-NP && git status
```

Expected: Both repos show clean working trees (build artifacts exist locally but are gitignored).

---

## Summary of Final State

| Item | Before | After |
|------|--------|-------|
| PMGH branches | master + 6 stale | master only |
| P-NP branches | master + freehost + standalone + patched | master + patched |
| game.min.js | Bundled in extension (10MB) | Fetched live from `P-NP/patched` branch |
| CheatGUI bundle.js | Already fetched live | No change (still fetched live) |
| GUI_LINK in P-NP | `192.168.0.73:8081` (dev) | `raw.githubusercontent.com/...` (prod) |
| Extension build/ | Tracked in git | Gitignored |
| .mcp.json | Tracked in git | Gitignored + removed from tracking |
| Popup URL configurator | Still works | Still works (for dev overrides) |
