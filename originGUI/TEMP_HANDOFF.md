# originGUI — PXI Fusion Port Handoff

This document covers every hack found in PXI Fusion that does **not** currently exist in
originGUI, with full implementation instructions derived from the PXI source.

---

## Project structure reminder

```
src/
  index.ts          ← category definitions (add new categories here if needed)
  hacks/
    player.ts       ← player stat hacks
    inventory.ts    ← item/inventory hacks
    pets.ts         ← pet hacks
    battle.ts       ← battle hacks
    minigame.ts     ← minigame hacks  ← Dino Dig timer hacks go here
    misc.ts         ← miscellaneous   ← Bobbified goes here
    utility.ts      ← save/load tools ← Save Inventory, Save Pet Data go here
    beta.ts         ← risky/experimental
```

Standard imports for any hack file:
```ts
import { Toast, Confirm, Swal } from "../utils/swal";
import { category } from "../index";
import Hack from "../class/Hack";
import Toggler from "../class/Toggler";
import { current, player, _ } from "../utils/util";
```

`player` = `Boot.prototype.game._state._current.user.source`
`_.instance.game.state.states.get("DinoDig")` = DinoDig state

---

## 1. Battle Pass hacks — NEW category

**Add to `src/index.ts`** alongside the other categories:
```ts
export const category = {
  // ... existing ...
  battlepass: addArea("Battle Pass Mods"),
};
```

**Create `src/hacks/battlepass.ts`** (or add to `misc.ts` if you don't want a new tab):

### 1a. Treasure Free — unlock all free tier rewards

```ts
new Hack(category.battlepass, "Treasure Free", "Unlocks all free Battle Pass tier rewards.").setClick(async () => {
  const prodigy = window._?.prodigy;
  const battlePass = prodigy?._currentBattlePass ?? prodigy?._battlePass;

  if (!battlePass || typeof battlePass !== "object") {
    return Swal.fire("Error", "Battle Pass not found.", "error");
  }

  const tiers = battlePass._tiers;
  if (!tiers || typeof tiers !== "object") {
    return Swal.fire("Error", "Tiers not found in battle pass.", "error");
  }

  Object.values(tiers).forEach((tier: any) => {
    if (!tier) return;
    tier.isCompleted = true;
    if (tier.freeReward) {
      tier.freeReward.claimed = false;
      tier.freeReward.claimable = true;
    }
  });

  return Swal.fire("Success", "Free tier rewards unlocked.", "success");
});
```

### 1b. Treasure Core — unlock bottom premium tier rewards

```ts
new Hack(category.battlepass, "Treasure Core", "Unlocks all Core (bottom premium) Battle Pass tier rewards.").setClick(async () => {
  const prodigy = window._?.prodigy;
  const battlePass = prodigy?._currentBattlePass ?? prodigy?._battlePass;

  if (!battlePass || typeof battlePass !== "object") {
    return Swal.fire("Error", "Battle Pass not found.", "error");
  }

  const tiers = battlePass._tiers;
  if (!tiers || typeof tiers !== "object") {
    return Swal.fire("Error", "Tiers not found in battle pass.", "error");
  }

  Object.values(tiers).forEach((tier: any) => {
    if (!tier) return;
    tier.isCompleted = true;
    if (tier.bottomPremiumReward) {
      tier.bottomPremiumReward.claimed = false;
      tier.bottomPremiumReward.claimable = true;
    }
  });

  return Swal.fire("Success", "Core tier rewards unlocked.", "success");
});
```

### 1c. Treasure Plus — unlock top premium tier rewards

```ts
new Hack(category.battlepass, "Treasure Plus", "Unlocks all Plus (top premium) Battle Pass tier rewards.").setClick(async () => {
  const prodigy = window._?.prodigy;
  const battlePass = prodigy?._currentBattlePass ?? prodigy?._battlePass;

  if (!battlePass || typeof battlePass !== "object") {
    return Swal.fire("Error", "Battle Pass not found.", "error");
  }

  const tiers = battlePass._tiers;
  if (!tiers || typeof tiers !== "object") {
    return Swal.fire("Error", "Tiers not found in battle pass.", "error");
  }

  Object.values(tiers).forEach((tier: any) => {
    if (!tier) return;
    tier.isCompleted = true;
    if (tier.topPremiumReward) {
      tier.topPremiumReward.claimed = false;
      tier.topPremiumReward.claimable = true;
    }
  });

  return Swal.fire("Success", "Plus tier rewards unlocked.", "success");
});
```

**API notes:**
- `window._?.prodigy._currentBattlePass` or `._battlePass` — exact key may vary by game version, try both
- Each tier has: `isCompleted`, `freeReward.{claimed,claimable}`, `bottomPremiumReward.{claimed,claimable}`, `topPremiumReward.{claimed,claimable}`
- These are client-side flag changes — need to test whether a save call is needed afterward

---

## 2. Dino Dig timer hacks — add to `src/hacks/minigame.ts`

The DinoDig state is already accessed in the existing walk speed hack:
`_.instance.game.state.states.get("DinoDig")`

### 2a. Add 100 Days to Dino Dig timer

```ts
new Hack(category.minigames, "Dino Dig +100 Days", "Adds 100 days to the active Dino Dig timer.").setClick(async () => {
  const dinoState = _.instance.game.state.states.get("DinoDig");
  if (!dinoState?.timer?.addTime) {
    return Swal.fire("Error", "You are not currently in Dino Dig.", "error");
  }
  dinoState.timer.addTime(8.64e9); // 100 days in milliseconds
  return Toast.fire("Done!", "Added 100 days to the Dino Dig timer.", "success");
});
```

### 2b. End Dino Dig immediately

```ts
new Hack(category.minigames, "End Dino Dig", "Instantly ends the current Dino Dig session.").setClick(async () => {
  const dinoState = _.instance.game.state.states.get("DinoDig");
  if (!dinoState?.timer?.addTime) {
    return Swal.fire("Error", "You are not currently in Dino Dig.", "error");
  }
  dinoState.timer.addTime(-9e15); // subtracts ~285,388 years, forces expiry
  return Toast.fire("Done!", "Dino Dig session ended.", "success");
});
```

---

## 3. Set Magicoin — add to `src/hacks/player.ts`

Magicoins are a separate currency stored at `_secureInventory._cacheByPath.currency[27]`.
(Currency slot 27 — different from gold.)

```ts
new Hack(category.player, "Set Magicoin", "Set your Magicoin amount.").setClick(async () => {
  const { value } = await Swal.fire({
    title: "Set Magicoin",
    input: "number",
    inputLabel: "Amount of Magicoin",
    inputPlaceholder: "e.g. 9999",
    showCancelButton: true,
    inputValidator: (v) => {
      if (!v) return "Please enter a number!";
      if (Number(v) < 0) return "Must be a positive number!";
    },
  });
  if (!value) return;

  try {
    player._secureInventory._cacheByPath.currency[27].stackable.quantity = parseInt(value);
    return Toast.fire("Done!", `Magicoin set to ${value}.`, "success");
  } catch (e) {
    return Swal.fire("Error", "Failed to set Magicoin. The path may have changed.", "error");
  }
});
```

**Note:** `_secureInventory` is a secure/protected inventory wrapper. If this path stops working
check for currency in `player.backpack.data` instead.

---

## 4. Get All Gems — add to `src/hacks/inventory.ts`

Gem item IDs (from game data): **3, 4, 10, 11, 17**

```ts
new Hack(category.inventory, "Get All Gems", "Adds one of each gem type to your backpack and saves.").setClick(async () => {
  const gemIds = [3, 4, 10, 11, 17];

  gemIds.forEach(id => {
    const existing = player.backpack.data.key.find((e: any) => e.ID === id);
    if (existing) {
      existing.N += 1;
    } else {
      player.backpack.data.key.push({ ID: id, N: 1 });
    }
  });

  player.appearance.updated = true;
  player.updated = true;
  player.saveEnabled = true;
  player.forceSaveCharacter();
  player.appearanceChanged = true;
  player.backpack.updated = true;

  return Toast.fire("Done!", "All gems added to your backpack.", "success");
});
```

---

## 5. All Pets Level 150 — add to `src/hacks/pets.ts`

Clears the entire kennel and re-adds every pet from game data at level 150 with
correct HP and XP values. **Destructive — overwrites existing pets.**

```ts
new Hack(category.pets, "All Pets Level 150", "Replaces all your pets with every pet at level 150. WARNING: Erases current pet data.").setClick(async () => {
  const confirmed = await Confirm.fire(
    "Are you sure?",
    "This will erase all your current pet data and replace it with every pet at level 150."
  );
  if (!confirmed.value) return;

  try {
    function randomIntFromInterval(min: number, max: number) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function getHpFromPet(level: number, petGameData: any) {
      const statValue = petGameData.data.statHealth;
      const level1Hp = (500 / 1.25) * Math.pow(Math.pow(1.25, 0.25), statValue - 1);
      const hpInc = (100 / 1.25) * Math.pow(Math.pow(1.25, 0.25), statValue - 1);
      return Math.ceil(level1Hp + (level - 1) * hpInc);
    }

    function getXP(level: number) {
      if (level === 1) return 0;
      if (level === 2) return 10;
      const offsetLevel = level - 2;
      const xpConstant = 1.042;
      return Math.round((((1 - Math.pow(xpConstant, offsetLevel)) / (1 - xpConstant)) * 20) + 10);
    }

    const gameData = _.instance.game.state.states.get("Boot")._gameData;
    const level = 150;
    const xp = getXP(level);
    const pets = gameData.pet;

    // Clear kennel
    player.kennel.data.length = 0;

    // Add all pets at level 150
    pets.forEach((pet: any) => {
      player.kennel.addPet(
        pet.data.member === 0 ? pet.ID : pet.ID.toString(),
        getHpFromPet(level, pet),
        xp,
        level
      );
    });

    // Update encounter info
    player.kennel._encounterInfo._data.pets = pets.map((pet: any) => ({
      firstSeenDate: Date.now() - randomIntFromInterval(20000, 120000),
      ID: pet.ID,
      timesBattled: 1,
      timesRescued: 1,
      rescueAttempts: 1,
    }));

    return Swal.fire("Done!", "All pets added at level 150. Leave the game open for ~2 minutes to fully sync.", "success");
  } catch (e) {
    return Swal.fire("Error", "Failed to add pets: " + e, "error");
  }
});
```

---

## 6. Set Rift Keys — add to `src/hacks/player.ts`

The PXI version is still obfuscated. **Must deobfuscate `set-rift-keys.js` first** before
porting — run it through the same webcrack pipeline used on the extension files.

URL: `https://menu.pxi-fusion.com/Hacks2/set-rift-keys.js`

Likely path (based on pattern from magicoin): somewhere in `player._secureInventory` or
`player.backpack.data` keyed to rift key item ID. Once deobfuscated, follow the same
pattern as Set Magicoin above.

---

## 7. Bobbified — add to `src/hacks/misc.ts`

Sets the player to the "Bobby Fancywoman" preset (level 69, negative stars, specific gear).
Cosmetic prank hack.

```ts
new Hack(category.misc, "Bobbified", "Turns you into Bobby Fancywoman (level 69, specific appearance).").setClick(async () => {
  const confirmed = await Confirm.fire("Are you sure?", "You will be transformed into Bobby Fancywoman.");
  if (!confirmed.value) return;

  player.name.data.firstName = 44;
  player.name.data.middleName = 754;
  player.name.data.lastName = 882;
  player.data.stars = -1e22;
  player.data.level = 69;

  player.appearance.setEyeColor(1);
  player.appearance.setFace(4);
  player.appearance.setHair(19, 1);
  player.appearance.setSkinColor(1);

  player.equipment.setFollow(19);
  player.equipment.setHat(19);
  player.equipment.setBoots(19);
  player.equipment.setOutfit(19);
  player.equipment.setWeapon(19);

  return Toast.fire("Done!", "You are now Bobby Fancywoman.", "success");
});
```

**Note:** Name IDs 44/754/882 are indices into the game's name lookup table, not strings.
The appearance/equipment setter IDs (all 19) refer to specific asset IDs in game data.

---

## 8. Save Inventory — add to `src/hacks/utility.ts`

Forces a backpack-only save to server. Different from the existing "Save Character" which
saves the whole character object.

```ts
new Hack(category.utility, "Save Inventory", "Forces a server-side save of your inventory/backpack.").setClick(async () => {
  try {
    player.updated = true;
    player.saveEnabled = true;
    if (player.backpack) {
      player.backpack.updated = true;
    }
    if (typeof player.save === "function") {
      await player.save();
    }
    return Toast.fire("Saved!", "Inventory saved to server.", "success");
  } catch (e) {
    return Swal.fire("Error", "Failed to save inventory: " + e, "error");
  }
});
```

---

## 9. Save Pet Data — add to `src/hacks/utility.ts` or `pets.ts`

Forces the kennel to be marked dirty and saved. Useful after pet edits that don't
auto-save.

```ts
new Hack(category.utility, "Save Pet Data", "Forces a server-side save of your pet/kennel data.").setClick(async () => {
  player.kennel.updated = true;
  // Trigger a character save to flush the kennel
  player.updated = true;
  player.saveEnabled = true;
  if (typeof player.forceSaveCharacter === "function") {
    player.forceSaveCharacter();
  }
  return Toast.fire("Saved!", "Pet data saved to server.", "success");
});
```

---

## Summary — files to touch

| File | Changes |
|---|---|
| `src/index.ts` | Add `battlepass: addArea("Battle Pass Mods")` to `category` object |
| `src/hacks/battlepass.ts` | **New file** — Treasure Free, Core, Plus |
| `src/hacks/minigame.ts` | Add Dino Dig +100 Days, End Dino Dig |
| `src/hacks/player.ts` | Add Set Magicoin, Set Rift Keys (after deobfuscating) |
| `src/hacks/inventory.ts` | Add Get All Gems |
| `src/hacks/pets.ts` | Add All Pets Level 150 |
| `src/hacks/misc.ts` | Add Bobbified |
| `src/hacks/utility.ts` | Add Save Inventory, Save Pet Data |

## Remaining work before all hacks are done

- [ ] Deobfuscate `https://menu.pxi-fusion.com/Hacks2/set-rift-keys.js` and extract the
      rift key inventory path, then implement Set Rift Keys
- [ ] Test Battle Pass hacks in-game — confirm `_currentBattlePass` vs `_battlePass` key
      and whether a save call is needed after setting tier flags
- [ ] Verify gem item IDs (3, 4, 10, 11, 17) are still current in the live game version
- [ ] `mint.js` and `Pet Slots` from PXI are unimplemented placeholders — nothing to port
