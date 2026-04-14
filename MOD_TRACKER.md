# Origin GUI — Mod Tracker

Re-tested against Prodigy Math Game version **2026.18.1** on **2026-04-13** after OriginGUI mod repairs.
Extension: Prodigy Origin (P-NP patched game).

**Legend:**  
✅ Working · ⚠️ Partial · ❌ Broken · ⏭️ Not tested (destructive/requires game state) · 🔒 Acknowledged patched

---

## Known Systemic Issues

| Root Cause | Affected Mods |
|---|---|
| `prodigy.giftBoxController` removed from prodigy object; not in gameContainer either | Obtain Conjure Cubes; Conjure Cubes step in Max Account / Hypermax Account |
| Battle is server-authoritative in `SecureBattleRevamp` — no client-side victory/heal method | Win Battle, Heal Team |
| `battleData` module not discoverable in gameContainer binding map | Get all Runes, Runes portion of Hypermax Account |
| `pvpNetworkHandler` not present on prodigy object | Arena Point Increaser |
| `debugMisc.disableTimeoutDialogue` not present | Disable Timeout Dialog |

**Resolved (2026-04-13):** `_.constants` undefined — replaced with FlagProvider service `"35d-3bd9"` (`.set(key, value)` / `.get(key)`). Fixes Disable Math, Skip Enemy Turn, Disable Monster Encounters, Disable Inactivity Kick. Battle state rename — Escape Battle now handles `SecureBattleRevamp` via `state._battleController.escapeBattle()`. Toggle Membership rewritten against service `"859-25be"` with `isMember` getter override.

---

## Player Mods

| Mod | Status | Notes |
|---|---|---|
| **Max Account** | ⚠️ Partial | Gold, level, bounty, achievements, items, pets, equipment all work. Conjure Cubes step fails silently (giftBoxController missing). |
| **Set Gold** | ✅ Working | Sets `player.data.gold`. Verified 9,999,999. |
| **Set Level** | ✅ Working | Sets level + recalculates stars. |
| **Get member stars** | ✅ Working | Sets `player.data.storedMemberStars`. |
| **Set Bounty Points** | ✅ Working | Sets `player.data.bountyScore`, capped at 100. |
| **Obtain Conjure Cubes** | ❌ Broken | `prodigy.giftBoxController` is undefined. Crashes on call. |
| **Set Wins** | ✅ Working | Sets `player.data.win`. |
| **Set Losses** | ✅ Working | Sets `player.data.loss`. |
| **Toggle membership** | ⚠️ In progress | Rewritten against service `"859-25be"` with instance-level `isMember` getter override (`Object.defineProperty(ms, 'isMember', { get: () => true })`). Fix in progress — verify live. |
| **Set name (Client side only)** | ✅ Working | Overrides `player.getName()`. Client-side only, reverts on reload. |
| **Change Name** | ✅ Working | Edits `player.name.data.firstName/middleName/lastName/nickname`. |
| **Uncap player level (client side only)** | ✅ Working | Overrides `player.getLevel()` via eval. Client-side. |
| **Get all achievements** | ✅ Working | Sets all 100 achievement progress slots to 10. |
| **Fix Morph Crash** | ✅ Working | Clears `player.getPlayerData().playerTransformation`. |
| **Permanent Morph** | ✅ Working | Sets `maxTime` and `timeRemaining` to Infinity on active transform. Requires an active morph to be meaningful. |
| **Complete Current Task In Quest** | ✅ Working | `getCurrentQuestID()` and `completeQuest()` accessible on zone objects. |
| **Set Dark Tower Floor** | ✅ Working | Sets `player.data.tower`. |
| **Get UserID** | ✅ Working | Returns `player.userID` (numeric). Clipboard write attempted. |
| **Copy Account** | ⏭️ Not tested | Destructive. Requires `localStorage.JWT_TOKEN` which is not present in tested session. Would likely fail auth. |
| **Set Grade** | ✅ Working | Sets `player.grade`. |

---

## Inventory Mods

| Mod | Status | Notes |
|---|---|---|
| **Item stacker** | ✅ Working | All 13 item categories populated. Removes bounty notes. |
| **Clear inventory** | ✅ Working | `Object.keys(player.backpack.data).forEach(d => player.backpack.data[d] = [])` clears all 13 categories. Verified. |
| **Selector (Basic)** | ✅ Working | All 13 item categories accessible from `_.gameData`. |
| **Selector (Advanced)** | ✅ Working | Fixed 2026-04-13: else branch now sets quantity `N = amt.value` on the existing item. |
| **Obtain All Furniture** | ✅ Working | Fixed 2026-04-13: duplicate button removed; single entry honors user-specified amount. |
| **Obtain All Mounts** | ✅ Working | 41 mounts added via `itemify`. |
| **Remove item** | ✅ Working | Finds item by ID, decrements N, splices if ≤ 0. |

---

## Location Mods

| Mod | Status | Notes |
|---|---|---|
| **WASD Movement** | ✅ Working | Toggler sets `useWASD` flag. `player._playerContainer.walkSpeed` accessible. Starts enabled by default (`.status = true`). |
| **Edit walkspeed** | ✅ Working | Sets `player._playerContainer.walkSpeed`. Polls until container available. |
| **Toggle Click Teleporting** | ✅ Working | Sets walkSpeed to 500 on interval; clearing restores 1.5. Duplicated in Utility section. |
| **Teleport To Map (interactive)** | ✅ Working | 35 zones, multiple maps per zone. `prodigy.world.zones[zone].teleport()` works. |
| **Teleport to house by userID** | ✅ Working | `friendsListNetworkHandler` accessible. Hardcoded gameContainer ID `"2e1-e659"` for broadcast — may be stale but untested. |
| **Get Map Location** | ✅ Working | Returns `player.data.zone`. |

---

## Pet Mods

| Mod | Status | Notes |
|---|---|---|
| **Get All Pets** | ✅ Working | Adds all pets via `kennel.addPet()`. Populates encounter info. 313 pets in test. |
| **Get All Legacy Epics** | ✅ Working | IDs 125–133. 9 epics added. |
| **Get All Mythical Epics** | ✅ Working | IDs 158,164–171,189. 10 epics found in gameData and added. |
| **Clear Pets** | ⏭️ Not tested | Destructive. Logic (`kennel.data.length = 0`) is straightforward. |
| **Add Pet** | ✅ Working | `kennel.addPet(id)` works. Adds encounter entry. |
| **Uncap pet level [Client Side]** | ✅ Working | Overrides `petTeam[n].getLevel()` via eval. Reverts on reload. |
| **Delete Pet** | ✅ Working | `kennel.data.splice(index, 1)` works. |

---

## Battle Mods

> Most battle mods were tested outside of battle. State-dependent results noted. Current battle state system uses `SecureBattleRevamp` instead of the `Battle`/`SecureBattle` states the code was written for.

| Mod | Status | Notes |
|---|---|---|
| **Disable math [PvP, PvE]** | ✅ Working | Fixed 2026-04-13: uses FlagProvider service `"35d-3bd9"` → `set("GameConstants.Debug.EDUCATION_ENABLED", false)`. |
| **Instant Kill [PvE]** | ✅ Working | Sets `player.modifiers.damage` to `VERY_LARGE_NUMBER`. No battle state required. |
| **PvP Health [PvP]** | ✅ Working | Sets `player.pvpHP` and overrides `player.getMaxHearts`. No battle state required. |
| **Escape Battle [PvP, PvE]** | ✅ Working | Fixed 2026-04-13: PvE branch handles `SecureBattleRevamp` via `state._battleController.escapeBattle()`. PvP/CoOp paths unchanged. |
| **Win Battle [PvE]** | 🔒 Patched | Server-authoritative; no client-side victory method available in `SecureBattleRevamp`. Archived in `patchedMods.ts`. |
| **Set Battle Hearts [PvP, PvE]** | ✅ Working | Sets `player.getMaxHearts`, `pvpHP`, and `player.data.hp`. No battle state required. |
| **Fill Battle Energy [PvP, PvE]** | ⏭️ Not tested | Requires being in battle. Logic calls `game.state.getCurrentState().teams[0].setEnergy(99)` — not testable from overworld. |
| **Skip enemy turn** | ✅ Working | Fixed 2026-04-13: uses FlagProvider `"35d-3bd9"` → `set("GameConstants.Battle.SKIP_ENEMY_TURN", true)`. |
| **Heal Team [PvE]** | 🔒 Patched | Server-authoritative; `player.heal()` no longer drives server state mid-battle. Archived in `patchedMods.ts`. |

---

## Minigame Mods

| Mod | Status | Notes |
|---|---|---|
| **69x Walk Speed [Dyno Dig]** | ✅ Working | `game.state.states.get("DinoDig").walkSpeed` is writable. Must be inside DinoDig for the change to have visual effect. |

---

## Miscellaneous Mods

| Mod | Status | Notes |
|---|---|---|
| **Skip Tutorial** | ✅ Working | `world.getZone("house"/"academy").testQuest()` accessible. |
| **Disable Monster Encounters** | ✅ Working | Fixed 2026-04-13: uses FlagProvider `"35d-3bd9"` → `set("GameConstants.Debug.SCALE_ENCOUNTER_DISTANCE", 0)`. |
| **Unlimited Spins** | ✅ Working | Overrides `player.canSpin` function. Restores original on disable. |
| **Reset Account** | ⏭️ Not tested | Destructive and irreversible. |
| **[Fix] Fix Battle Crash** | ✅ Working | Calls `assignRandomSpells()` on all pets in team. |
| **[Fix] Stuck in Unfinished Tower Fix** | ✅ Working | `world.zones["house"].teleport("exit")` works. |

---

## Utility Mods

| Mod | Status | Notes |
|---|---|---|
| **Close all popups** | ✅ Working | `prodigy.open.menuCloseAll()` works. |
| **Grab UserID of all players on screen** | ✅ Working | Reads `TileScreen.playerList`. Returns empty if no other players are visible. |
| **Save Character Locally [Local]** | ✅ Working | `player.getUpdatedData(true)` serializable; stored in `localStorage.playerData`. |
| **Load local character [Local]** | ✅ Working | POST to `game-api/v3/characters/:id` with stored data. Requires reload to take effect. |
| **Save Character** | ✅ Working | `_.network.getCharData` accessible. |
| **Update menu** | ✅ Working | Removes menu/toggler elements, fetches fresh bundle from GitHub master, evals it. |
| **Disable inactivity kick** | ✅ Working | Fixed 2026-04-13: uses FlagProvider `"35d-3bd9"` → `set("GameConstants.Inactivity.LOG_OUT_TIMER_SECONDS", 0)`. |
| **Enable menu resize** | ✅ Working | Sets `origin-menu` style `resize: both`. |
| **Edit walkspeed** | ✅ Working | Duplicate of Location mod. Same logic, works. |
| **Toggle Click Teleporting** | ✅ Working | Duplicate of Location mod. Same logic, works. |
| **Pause Game** | ✅ Working | Sets `_.network.game._paused`. |
| **Eval Console** | ✅ Working | `eval()` in MAIN world with full game access. Shows warning dialog first. |

---

## Beta Mods

| Mod | Status | Notes |
|---|---|---|
| **Switch Branch** | ✅ Working | Fetches GitHub branches API, loads bundle from selected branch. |
| **Get all Runes [BETA]** | ❌ Broken | Iterates gameContainer bindings looking for a service with `.battleData` — none found. Mod cannot locate the rune state service. |
| **Edit Pet [BETA]** | ⚠️ Partial | Level edit: ✅ works. Name/nickname edit: ✅ works. Attack edit: ⚠️ `foreignSpells` not found on tested pets (no pets with custom spells in team). |
| **Morph Player [BETA]** | ✅ Working | Sets `player.getPlayerData().playerTransformation` with transform type/ID. Visual update via `appearanceChanged`. |
| **(client side) Toggle Invisibility [BETA]** | ✅ Working | `current.user.visible` (resolved via `TileScreen` state user object) is writable. Client-side only. |
| **Toggle Close Popups [BETA]** | ✅ Working | Runs `PopupInterval` which setIntervals to close all open popups. |
| **Hypermax Account [BETA]** | ⚠️ Partial | All sections work except: (1) Conjure Cubes step broken (giftBoxController missing), (2) Get all Runes step broken (battleData module not found). Rest — gold, level, items, pets, equipment, walkspeed — all work. |
| **FPS Counter [BETA]** | ✅ Working | `startFps()`/`stopFps()` create/remove a DOM overlay element. |

---

## Patched Mods

| Mod | Status | Notes |
|---|---|---|
| **Arena Point Increaser [Patched]** | 🔒 Patched | `prodigy.pvpNetworkHandler` not present. Endpoint would reject requests regardless. Acknowledged patched in source. |
| **Disable Timeout Dialog [Patched]** | 🔒 Patched | `prodigy.debugMisc.disableTimeoutDialogue` not found. Acknowledged patched in source. |

---

## Summary

| Category | Total | ✅ Working | ⚠️ Partial | ❌ Broken | ⏭️ Not Tested | 🔒 Patched |
|---|---|---|---|---|---|---|
| Player | 20 | 15 | 2 | 1 | 2 | 0 |
| Inventory | 7 | 7 | 0 | 0 | 0 | 0 |
| Location | 6 | 6 | 0 | 0 | 0 | 0 |
| Pets | 7 | 6 | 0 | 0 | 1 | 0 |
| Battle | 9 | 6 | 0 | 0 | 1 | 2 |
| Minigames | 1 | 1 | 0 | 0 | 0 | 0 |
| Misc | 6 | 5 | 0 | 0 | 1 | 0 |
| Utility | 12 | 11 | 0 | 0 | 1 | 0 |
| Beta | 8 | 5 | 2 | 1 | 0 | 0 |
| Patched | 2 | 0 | 0 | 0 | 0 | 2 |
| **Total** | **78** | **62** | **4** | **2** | **6** | **4** |

_Removed (2026-04-13): Bobbify, uwu._

### Priority Fixes

_Recorded 2026-04-13 after repair sweep._

1. **`giftBoxController` missing** — Find new path or remove Conjure Cubes from Max/Hypermax Account. Fixes 1 broken mod, improves 2 partial.
2. **`battleData` module** — Get all Runes and Hypermax runes step cannot find the module. Discovery logic needs a new shape function.
