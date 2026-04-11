// Background service worker for Prodigy Origin — Firefox MV3 variant
// Identical rules to the chromium build, but uses string literals for
// declarativeNetRequest action/header/resource types. Firefox's DNR supports
// all of these values but does not expose the Chromium enum OBJECTS
// (RuleActionType, HeaderOperation, ResourceType) as runtime JS globals, so
// AMO's validator flags `chrome.declarativeNetRequest.RuleActionType.BLOCK`
// etc. as "not supported by Firefox." String literals work identically in
// both browsers and silence the warnings.

const RULES: chrome.declarativeNetRequest.Rule[] = [
  // BLOCK original game.min.js — content script handles replacement
  {
    id: 1,
    priority: 1,
    action: {
      type: "block"
    },
    condition: {
      urlFilter: "*://code.prodigygame.com/code/*/game.min.js*",
      resourceTypes: ["script"]
    }
  },
  // Remove CSP and X-Frame-Options headers
  {
    id: 2,
    priority: 1,
    action: {
      type: "modifyHeaders",
      responseHeaders: [
        {
          header: "Content-Security-Policy",
          operation: "remove"
        },
        {
          header: "X-Frame-Options",
          operation: "remove"
        }
      ]
    },
    condition: {
      urlFilter: "*://*.prodigygame.com/*",
      resourceTypes: ["main_frame", "sub_frame"]
    }
  },
  // Redirect login background image
  {
    id: 3,
    priority: 2,
    action: {
      type: "redirect",
      redirect: {
        url: "https://raw.githubusercontent.com/ProdigyPXP/ProdigyOrigin/master/.github/origin-bg.png"
      }
    },
    condition: {
      urlFilter: "*://cdn.prodigygame.com/game/assets/v1_cache/single-images/login-bg-13/1/login-bg-13.png",
      resourceTypes: ["main_frame", "sub_frame", "image", "other"]
    }
  },
  // Redirect logo
  {
    id: 4,
    priority: 2,
    action: {
      type: "redirect",
      redirect: {
        url: "https://raw.githubusercontent.com/ProdigyPXP/ProdigyOrigin/master/.github/origin-logo.png"
      }
    },
    condition: {
      urlFilter: "*://code.prodigygame.com/assets/svg/*logo*-*.svg",
      resourceTypes: ["main_frame", "sub_frame", "image", "other"]
    }
  }
]

// Register dynamic rules on extension install/update
chrome.runtime.onInstalled.addListener(async () => {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules()
  const existingRuleIds = existingRules.map((rule) => rule.id)

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds,
    addRules: RULES
  })

  console.log("[Origin] DeclarativeNetRequest rules registered successfully")
})

export {}
