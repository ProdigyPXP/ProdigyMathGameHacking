# Prodigy Origin — Firefox build

Parallel Plasmo project targeting `firefox-mv3`. The Chromium build lives one
directory up in `extension/` and is published to the Chrome Web Store. This
tree exists to produce an AMO-compliant XPI.

## Why a separate tree?

The Firefox build differs from Chromium in exactly two places:

1. **`background.ts`** uses string literals (`"block"`, `"modifyHeaders"`,
   `"remove"`, ...) instead of `chrome.declarativeNetRequest.RuleActionType.*`
   / `HeaderOperation.*` enum references. Firefox's DNR implementation
   supports all the same action types but does not expose the enum objects
   at runtime, so AMO's validator flags the enum references as
   "not supported by Firefox." String literals are the portable form.

2. **`package.json`** adds `browser_specific_settings.gecko.data_collection_permissions`
   (required by AMO for all new extensions as of Nov 2025). The permission
   is declared as `required: ["none"]` because the extension does not
   collect, process, or transmit user data — all patches run client-side.

Every other file (popup, contents, components, assets, fonts, styles) is a
byte-identical copy of the chromium tree. Keep them in sync by hand when
changing shared UI or content-script logic.

## Build

    cd extension/firefox
    pnpm install
    pnpm build

Output: `build/firefox-mv3-prod/` — load via `about:debugging` → "This Firefox"
→ "Load Temporary Add-on" → select `manifest.json`.

## Package for AMO

    pnpm package

Produces a ZIP ready to upload at https://addons.mozilla.org/en-US/developers/.
