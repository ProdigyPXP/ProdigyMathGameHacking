// Battle Hacks



// BEGIN IMPORTS
import { Toast, NumberInput } from "../utils/swal"; // Import Toast and NumberInput from swal
import { category } from "../index"; // Import the mod menu bases.
import Toggler from "../class/Toggler";
import Hack from "../class/Hack";
import { _, game, VERY_LARGE_NUMBER, player } from "../utils/util"; // Import prodigy typings
import { setConstant } from "../utils/constants"; // FlagProvider helper
// END IMPORTS



// BEGIN BATTLE HACKS









// Begin Instant Kill
new Toggler(category.battle, "Instant Kill [PvE]", "Makes your spells do insane damage in PvE!").setEnabled(async () => {
    player.modifiers.damage = VERY_LARGE_NUMBER;
    return Toast.fire("Enabled!", "You will now do insane damage in PvE!", "success");

}).setDisabled(() => {
    player.modifiers.damage = 1;
    return Toast.fire("Disabled!", "You will no longer do insane damage in PvE!", "success");
});
// End Instant Kill






// Begin PvP Health
new Hack(category.battle, "PvP Health [PvP]", "Increases your HP in PvP by a hell ton.").setClick(async () => {
    player.pvpHP = VERY_LARGE_NUMBER;
    player.getMaxHearts = () => VERY_LARGE_NUMBER;
    return Toast.fire("Success!", "You now have lots of health!", "success");
});
// End PvP Health

















// Begin Set Battle Hearts
new Hack(category.battle, "Set Battle Hearts [PvP, PvE]", "Sets your hearts in battle, automatically raise your max hearts in PvP or PvE.").setClick(async () => {
    const hp = await NumberInput.fire("Health Amount", "How much HP do you want?", "question");
    if (hp.value === undefined) return;
    player.getMaxHearts = () => +hp.value;
    player.pvpHP = +hp.value;
    player.data.hp = +hp.value;
    return Toast.fire("Success!", "Your hearts have been set.", "success");
});
// End Set Battle Hearts





// Begin Fill Battle Energy
new Hack(category.battle, "Fill Battle Energy [PvP, PvE]", "Fills up your battle energy, if you are in PvP or PvE.").setClick(async () => {
    const state = game.state.getCurrentState();
    if (!("teams" in state)) return Toast.fire("Error", "You are currently not in a battle.", "error");
    state.teams[0].setEnergy(99);
    return Toast.fire("Success!", "Your battle energy has been filled.", "success");
});
// End Fill Battle Energy




// Begin Disable math [PvP, PvE]
// Uses FlagProvider service "35d-3bd9" (see P-NP vault/battle-constants-and-types.md).
new Toggler(category.battle, "Disable math [PvP, PvE]", "Disable math in PvP, PvE, anywhere! This doesn't work in the Floatling town.").setEnabled(async () => {
    if (!setConstant("GameConstants.Debug.EDUCATION_ENABLED", false)) {
        return Toast.fire("Error", "FlagProvider service not found.", "error");
    }
    return Toast.fire("Enabled!", "You will no longer do Math!", "success");
}).setDisabled(async () => {
    setConstant("GameConstants.Debug.EDUCATION_ENABLED", true);
    return Toast.fire("Disabled!", "You will now do Math!", "success");
});
// End Disable math




// Begin Skip Enemy Turn
new Toggler(category.battle, "Skip enemy turn").setEnabled(async () => {
    if (!setConstant("GameConstants.Battle.SKIP_ENEMY_TURN", true)) {
        return Toast.fire("Error", "FlagProvider service not found.", "error");
    }
    return Toast.fire("Skipping!", "Enemy turns will now be skipped.", "success");
}).setDisabled(async () => {
    setConstant("GameConstants.Battle.SKIP_ENEMY_TURN", false);
    return Toast.fire("Disabled", "Enemy turns will no longer be skipped.", "success");
});
// End Skip Enemy Turn




// Begin Escape Battle [PvP, PvE]
// PvE path updated for SecureBattleRevamp — see P-NP vault/battle-system.md.
new Hack(category.battle, "Escape Battle [PvP, PvE]", "Escape any battle, PvP or PvE!").setClick(async () => {
    const currentState = game.state.current;

    if (currentState === "PVP") {
        Object.fromEntries(_.instance.game.state.states).PVP.endPVP();
        return Toast.fire("Escaped!", "You have successfully escaped from the PvP battle.", "success");
    }

    if (currentState === "CoOp") {
        _.instance.prodigy.world.$(player.data.zone);
        return Toast.fire("Escaped!", "You have successfully escaped from the battle.", "success");
    }

    if (currentState === "SecureBattleRevamp") {
        const bc = (_ as any).instance?._game?._state?._current?._battleController;
        if (!bc || typeof bc.attemptEscape !== "function") {
            return Toast.fire("Error", "BattleController not available on current state.", "error");
        }
        await bc.attemptEscape();
        return Toast.fire("Escaped!", "You have successfully escaped from the PvE battle.", "success");
    }

    if (["Battle", "SecureBattle"].includes(currentState)) {
        Object.fromEntries(_.instance.game.state.states)[currentState].runAwayCallback();
        return Toast.fire("Escaped!", "You have successfully escaped from the PvE battle.", "success");
    }

    return Toast.fire("Invalid State.", "You are currently not in a battle.", "error");
});
// End Escape Battle




// Begin Win Battle [PvE]
new Hack(category.battle, "Win Battle [PvE]", "Instantly win the current PvE battle.").setClick(async () => {
    if (game.state.current !== "SecureBattleRevamp") {
        return Toast.fire("Invalid State.", "You are currently not in a PvE battle.", "error");
    }
    const bc = (_ as any).instance?.game?._state?._current?._battleController;
    if (!bc || typeof bc.onVictory !== "function") {
        return Toast.fire("Error", "BattleController not available on current state.", "error");
    }
    await bc.onVictory();
    return Toast.fire("Victory!", "You won the battle!", "success");
});
// End Win Battle











// END BATTLE HACKS
