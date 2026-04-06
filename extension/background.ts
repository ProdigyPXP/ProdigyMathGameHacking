// Background service worker for Prodigy Origin
// Registers declarativeNetRequest rules for blocking/modifying requests

const RULES: chrome.declarativeNetRequest.Rule[] = [
  // BLOCK original game.min.js — content script handles replacement via direct extension URL
  // (DNR extensionPath redirects cause "pending" requests; direct chrome-extension:// loads work)
  {
    id: 1,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.BLOCK
    },
    condition: {
      urlFilter: "*://code.prodigygame.com/code/*/game.min.js*",
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.SCRIPT]
    }
  },
  // Remove CSP and X-Frame-Options headers
  {
    id: 2,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      responseHeaders: [
        {
          header: "Content-Security-Policy",
          operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE
        },
        {
          header: "X-Frame-Options",
          operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE
        }
      ]
    },
    condition: {
      urlFilter: "*://*.prodigygame.com/*",
      resourceTypes: [
        chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
        chrome.declarativeNetRequest.ResourceType.SUB_FRAME
      ]
    }
  },
  // Redirect login background image
  {
    id: 3,
    priority: 2,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: {
        url: "https://raw.githubusercontent.com/ProdigyPXP/ProdigyMathGameHacking/master/.github/origin-bg.png"
      }
    },
    condition: {
      urlFilter: "*://cdn.prodigygame.com/game/assets/v1_cache/single-images/login-bg-13/1/login-bg-13.png",
      resourceTypes: [
        chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
        chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
        chrome.declarativeNetRequest.ResourceType.IMAGE,
        chrome.declarativeNetRequest.ResourceType.OTHER
      ]
    }
  },
  // Redirect logo
  {
    id: 4,
    priority: 2,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: {
        url: "https://raw.githubusercontent.com/ProdigyPXP/ProdigyMathGameHacking/master/.github/origin-logo.png"
      }
    },
    condition: {
      urlFilter: "*://code.prodigygame.com/assets/svg/*logo*-*.svg",
      resourceTypes: [
        chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
        chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
        chrome.declarativeNetRequest.ResourceType.IMAGE,
        chrome.declarativeNetRequest.ResourceType.OTHER
      ]
    }
  }
]

// Register dynamic rules on extension install/update
chrome.runtime.onInstalled.addListener(async () => {
  // Clear any existing dynamic rules
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules()
  const existingRuleIds = existingRules.map((rule) => rule.id)

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds,
    addRules: RULES
  })

  console.log("[Origin] DeclarativeNetRequest rules registered successfully")
})

export {}
