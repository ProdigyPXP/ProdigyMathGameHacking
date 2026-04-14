// Miscellaneous Hacks



// BEGIN IMPORTS
import { Toast, Confirm, Swal } from "../utils/swal"; // Import Toast and Confirm from swal
import { category } from "../index";  // Import the mod menu bases.
import Toggler from "../class/Toggler";
import Hack from "../class/Hack";
import { current, player, _ } from "../utils/util"; // Import Prodigy typings
import { startFps, stopFps } from "../utils/fps";
import { setConstant } from "../utils/constants"; // FlagProvider helper
// END IMPORTS


// BEGIN MISCELLANEOUS HACKS



// Begin Skip Tutorial
new Hack(category.misc, "Skip Tutorial").setClick(async () => {
	const setQuest = (t: string, i: number, n?: unknown, e?: unknown) => {
		_.instance.prodigy.world.getZone(t).testQuest(i, n, e);
		try {
			Object.fromEntries(_.instance.game.state.states).TileScreen.process();
		} catch {}
	};

	setQuest("house", 2);
	setQuest("academy", 2);
	player.state.set("tutorial-0", 4);
	player.backpack.addKeyItem(13, 0);
	player.tutorial.data.menus[14] = [1];
	_.instance.prodigy.open.map(true, []);
	player.onTutorialComplete();
	player.data.level = Math.max(player.data.level, 5);
});
// End Skip Tutorial





// Begin FPS Counter
new Toggler(category.beta, "FPS Counter [BETA]", "Shows you a framerate counter").setEnabled(async () => {
    startFps();
}).setDisabled(async() => {
    stopFps();
});
// End FPS Counter


// Begin Unlimited Spins
try {
	// canSpinBackup captured lazily inside setEnabled so we don't crash at load time.
	// Old code: `current.user.source.canSpin` — was broken because current was null at load.
	let canSpinBackup: unknown = null;
	new Toggler(category.misc, "Unlimited Spins", "Lets you spin the wheel as many times as you want!").setEnabled(async () => {
		canSpinBackup = player.canSpin; // capture original on first enable
		player.canSpin = (() => { true; });
		return Toast.fire("Enabled!", "You can now spin the wheel as many times as you want!", "success");
	}).setDisabled(async() => {
		player.canSpin = canSpinBackup;
		return Toast.fire("Disabled!", "You can now spin the wheel only when allowed.", "success");
	});
	// End Unlimited Spins
} catch (error : unknown) {
	console.error("Unlimited Spins ERROR: " + error);
}





// Begin Reset Account
new Hack(category.misc, "Reset Account", "Completely resets your account.").setClick(async () => {
	if (!(await Confirm.fire("Are you sure you want to reset your account?", "This action is not reversible.")).value) return;
	player.resetAccount();
	return Swal.fire("Reset!", "Your account has been reset. Reload Prodigy for the full effect.", "success");
});
// End Reset Account



// Begin Fix Battle Crash
new Hack(category.misc, "[Fix] Fix Battle Crash").setClick(async () => {
	// @ts-expect-error
	player.kennel.petTeam.forEach(v => {
		if (v && (v as any).assignRandomSpells) (v as any).assignRandomSpells();
	});

	return Toast.fire("Success!", "Fixed kennel attack bug!", "success");
});
// End Fix Battle Crash



// Begin Stuck in Unfinished Tower Fix
new Hack(category.misc, "[Fix] Stuck in Unfinished Tower Fix", "Takes you out of an unfinished tower if you're stuck in one.").setClick(async () => {
	_.instance.prodigy.world.zones["house"].teleport("exit");
	return Toast.fire("Success!", "You've been teleported outside of your house.", "success");
});
// End Stuck in Unfinished Tower Fix




// Begin Disable Monster Encounters
// Uses FlagProvider service "35d-3bd9" (see P-NP vault/battle-constants-and-types.md).
new Toggler(category.misc, "Disable Monster Encounters").setEnabled(async () => {
    if (!setConstant("GameConstants.Debug.SCALE_ENCOUNTER_DISTANCE", 0)) {
        return Toast.fire("Error", "FlagProvider service not found.", "error");
    }
    return Toast.fire("Enabled!", "Monsters will no longer battle you.", "success");
}).setDisabled(() => {
    setConstant("GameConstants.Debug.SCALE_ENCOUNTER_DISTANCE", 1);
    return Toast.fire("Disabled!", "Monsters will now battle you.", "success");
});
// End Disable Monster Encounters





// END MISCELLANEOUS HACKS
