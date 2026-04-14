// Patched / Broken Mods Archive
//
// This file is intentionally inert — no mods here are registered to the menu.
// Code is preserved here for reference and future repair.
//
// Moved here because these mods are either:
//   ❌ Broken  — game update removed or renamed the APIs they depend on
//   🔒 Patched — server-side patch makes them non-functional
//
// ─────────────────────────────────────────────────────────────────────────────
// ROOT CAUSES
// ─────────────────────────────────────────────────────────────────────────────
// 1. prodigy.giftBoxController removed from prodigy object; not in
//    gameContainer either.  Affects: Obtain Conjure Cubes.
//
// 2. Battle is server-authoritative in SecureBattleRevamp — no client-side
//    victory or heal method survives. Escape was restored via
//    state._battleController.escapeBattle(), but Win/Heal cannot be faked
//    client-side.  Affects: Win Battle, Heal Team.
//
// 3. battleData module not discoverable in gameContainer binding map.
//    Affects: Get all Runes.
//
// 4. prodigy.pvpNetworkHandler not present (server-side patch).
//    Affects: Arena Point Increaser.
//
// 5. prodigy.debugMisc.disableTimeoutDialogue not present (server-side patch).
//    Affects: Disable Timeout Dialog.
// ─────────────────────────────────────────────────────────────────────────────

/*

// ═══════════════════════════════════════════════════════════════════
// FROM player.ts — Obtain Conjure Cubes
// ❌ Broken: prodigy.giftBoxController is undefined
// ═══════════════════════════════════════════════════════════════════

new Hack(category.player, "Obtain Conjure Cubes").setClick(async () => {
    const cubes = await NumberInput.fire("Conjure Cubes", "How many conjure cubes do you want to get? (Max 99)", "question");
    if (cubes.value === undefined) return;
    for (let i = 0; i < Math.min(99, +cubes.value); i++) {
        prodigy.giftBoxController.receiveGiftBox(null, getItem("giftBox", 1));
    }
    return Toast.fire("Success!", `You have gained ${cubes.value} conjure cube${cubes.value != 1 ? "s" : ""}.`, "success");
});


// ═══════════════════════════════════════════════════════════════════
// FROM battle.ts — Win Battle [PvE]
// 🔒 Patched: battle is server-authoritative in SecureBattleRevamp.
//             No client-side victory method available.
// ═══════════════════════════════════════════════════════════════════

new Hack(category.battle, "Win Battle [PvE]", "Instantly win a battle in PvE.").setClick(async () => {
    const currentState = game.state.current;
    console.log("Current State: " + currentState);
    switch (currentState) {
        case "PVP":
        case "CoOp":
            return Toast.fire("Invalid State.", "PvP is not supported for this hack.", "error");
        case "Battle":
            Object.fromEntries(_.instance.game.state.states).Battle.startVictory();
            return Toast.fire("Victory!", "You have successfully won the battle.", "success");
        case "SecureBattle":
            Object.fromEntries(_.instance.game.state.states).SecureBattle.battleVictory();
            return Toast.fire("Victory!", "You have successfully won the battle.", "success");
        default:
            return Toast.fire("Invalid State.", "You are currently not in a battle.", "error");
    }
});


// ═══════════════════════════════════════════════════════════════════
// FROM battle.ts — Heal Team [PvE]
// 🔒 Patched: battle is server-authoritative in SecureBattleRevamp.
//             player.heal() no longer drives server state mid-battle.
// ═══════════════════════════════════════════════════════════════════

new Hack(category.battle, "Heal Team [PvE]", "Instantly heals you and your pets, if you are in PvE.").setClick(async () => {
    const currentState: string = game.state.current;
    if (currentState === "PVP" || currentState === "CoOp") {
        return Toast.fire("Invalid State.", "PvP is not supported for this hack.", "error");
    } else if (["Battle", "SecureBattle"].includes(currentState)) {
        player.heal();
        return Toast.fire("Success!", "Your team has been healed successfully!", "success");
    } else {
        return Toast.fire("Invalid State.", "Your are currently not in a battle.", "error");
    }
});


// ═══════════════════════════════════════════════════════════════════
// FROM beta.ts — Get all Runes [BETA]
// ❌ Broken: battleData module not found in gameContainer binding map
// ═══════════════════════════════════════════════════════════════════

new Hack(category.beta, "Get all Runes [BETA]").setClick(async () => {
    if (!(await Confirm.fire({
            title: "Hang on!",
            html: "This hack may damage your account with various bugs, for example you may be unable to do Rune Run.<br><br>Proceed?",
            icon: "warning"
        })).value) {
        return;
    }

    const amount = parseInt((await NumberInput.fire({
        title: "Amount",
        text: "How many of each would you like?",
        icon: "question",
        inputValidator: (res: any) => res ? "" : "Please select which you'd like to get."
    })).value);
    if (isNaN(amount)) return;
    let mod;

    Array.from(_.instance.prodigy.gameContainer._inversifyContainer._bindingDictionary._map).forEach(e => {
        try {
            if (_.instance.prodigy.gameContainer.get(e[0]).battleData) {
                mod = e[0];
            }
        } catch {
            console.log(`Error for ${e[0]}`);
        }
    });

    _.instance.prodigy.gameContainer.get(mod).battleData._secureCharacterState._data.inventory.orb = runeify(_.gameData.orb, amount);
    return Toast.fire("Runes Added!", "Your runes have been added!", "success");
});


// ═══════════════════════════════════════════════════════════════════
// FROM patched.ts — Arena Point Increaser [Patched]
// 🔒 Patched: prodigy.pvpNetworkHandler not present; server rejects requests
// ═══════════════════════════════════════════════════════════════════

let arenaInterval: unknown | null = null;

new Hack(category.patched, "Arena Point Increaser [Patched]").setClick(async () => {
    if (arenaInterval) {
        return Swal.fire("Already Enabled", "Arena Point Increaser is already enabled.", "error");
    } else if (!(await Confirm.fire("This hack is patched.", "Running it will probably do nothing.")).value) {
        return console.log("Cancelled");
    } else {
        arenaInterval = setInterval(async () => {
            const data = await (
                await fetch(
                    `https://api.prodigygame.com/leaderboard-api/season/${prodigy.pvpNetworkHandler.seasonID}/user/${player.userID}/pvp?userID=${player.userID}`, {
                        headers: {
                            authorization: `Bearer ${prodigy.network.jwtAuthProvider.getToken()}`,
                            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                        },
                        body: `seasonID=${prodigy.pvpNetworkHandler.seasonID}&action=win`,
                        method: "POST",
                        mode: "cors",
                    }
                )
            ).text();
            if (data !== "") {
                const jsoned = JSON.parse(data);
                console.log(`[API] ${jsoned.points} Points (+100)`);
            } else console.log(`[API] Failed to add points.`);
        }, 60500);
        return Swal.fire("Enabled", "Arena Point Increaser has been enabled.", "success");
    }
});


// ═══════════════════════════════════════════════════════════════════
// FROM patched.ts — Disable Timeout Dialog [Patched]
// 🔒 Patched: prodigy.debugMisc.disableTimeoutDialogue not present
// ═══════════════════════════════════════════════════════════════════

new Hack(category.patched, "Disable Timeout Dialog [Patched]").setClick(async () => {
    if (!(await Confirm.fire("This hack is patched.", "Running it will probably do nothing.")).value) {
        return console.log("Cancelled");
    } else {
        prodigy.debugMisc.disableTimeoutDialogue();
    }
    return Toast.fire("Enabled", "Timeout Dialog has been disabled.", "success");
});

*/
