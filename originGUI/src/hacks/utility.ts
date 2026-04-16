// Utility Hacks


// BEGIN IMPORTS
import { Toast, Input, Confirm, Swal } from "../utils/swal";  // Import Toast and Input from swal
import { category } from "../index"; // Import the mod menu bases and the dimensions to resize the menu
import Toggler from "../class/Toggler";
import Hack from "../class/Hack";
import { _, saveCharacter, current, player } from "../utils/util";  // Import Prodigy typings
import { setConstant } from "../utils/constants"; // FlagProvider helper
// END IMPORTS


// BEGIN UTILITY HACKS




// Begin Close all Popups
new Hack(category.utility, "Close all popups", "Closes all popups in Prodigy.").setClick(async () => {
    _.instance.prodigy.open.menuCloseAll();
    return Toast.fire("Closed!", "All open popups were closed.", "success");
});
// End Close all Popups


new Hack(category.utility, "Grab UserID of all players on screen", "Shows you the UserID and name of every player currently shown on the screen.").setClick(async () => {
    const users : object = current.playerList;
    if (Object.keys(users).length === 0) {
        return Toast.fire("No players found.", "There are no other players on the screen.", "error");
    }

    const ul = document.createElement("ul");
    for (const [user, data] of Object.entries(users)) {
        let name = "Unknown";
        try {
            name = (data as any).nameText.textSource.source;
        } catch {
            // player entity may be partially initialized
        }
        const li = document.createElement("li");
        li.textContent = `uID: ${user} - ${name}`;
        ul.append(li);
    }
    return Swal.fire({ title: "All players on the screen:", html: ul, icon: "info" });
});




// Begin Save Character Locally
new Hack(category.utility, "Save Character Locally [Local]", "Saves your character locally.").setClick(async () => {
    localStorage.setItem("playerData", JSON.stringify(player.getUpdatedData(true)));
    return Toast.fire("Success!", "Note: Load Character will only work on this device.", "success");
});
// End Save Character Locally






// Begin Load local Character
new Hack(category.utility, "Load local character [Local]", "Loads your character locally.").setClick(async () => {
    if (!localStorage.getItem("playerData")) {
        return Toast.fire("Error", "No saved character.", "error");
    } else {
        const playerData = localStorage.getItem("playerData");
        const req = await fetch(`https://api.prodigygame.com/game-api/v3/characters/${player.userID}`, {
            headers: {
                accept: "*/*",
                "accept-language": "en-US,en;q=0.9",
                authorization: localStorage.JWT_TOKEN,
                "content-type": "application/json",
                // Browsers set these automatically — kept for reference
                // "sec-ch-ua": "\" Not;A Brand\";v=\"99\", \"Google Chrome\";v=\"91\", \"Chromium\";v=\"91\"",
                // "sec-ch-ua-mobile": "?0",
                // "sec-fetch-dest": "empty",
                // "sec-fetch-mode": "cors",
                // "sec-fetch-site": "same-site"
            },
            referrer: "https://play.prodigygame.com/",
            referrerPolicy: "strict-origin-when-cross-origin",
            body: JSON.stringify({
                data: playerData,
                userID: player.userID
            }),
            method: "POST",
            mode: "cors"
        });
        if (!req.ok) return Toast.fire("Request failed.", `An error occurred while loading the character. Error code: ${req.status}`, "error");
        return Toast.fire("Success!", "Character has been successfully loaded. Reload for the changes to take effect.", "success");
    }
});
// End Load local Character





// Begin Save Character
new Hack(category.utility, "Save Character", "Helps fix bugs where not all hacks save.").setClick(async () => {
    saveCharacter();
    return Toast.fire("Success!", "Your character has been saved!", "success");
});
// End Save Character





// Begin Update menu
new Hack(category.utility, "Update menu", "Updates menu to the latest version without needing to reload.").setClick(async () => {
    document.getElementById("origin-menu")?.remove();
    document.getElementById("origin-toggler")?.remove();
    (async () => {
        eval(await (await fetch(`https://raw.githubusercontent.com/ProdigyPXP/ProdigyOrigin/master/originGUI/dist/bundle.js?updated=${Date.now()}`)).text()); // updated parameter is so browser ignores cached version
    })();
    return Toast.fire("Updated!", "Mod menu was updated.", "success");
});
// End Update menu










// Begin Enable menu resize drag
new Toggler(category.utility, "Enable menu resize", "Allows you to resize the menu via dragging the bottom right corner.").setEnabled(async () => {
    // @ts-expect-error
    document.getElementById("origin-menu").style.resize = "both";
    return Toast.fire("Success!", "Drag the bottom right corner of the menu to resize it.", "success");
}).setDisabled(() => {
    // @ts-expect-error
    document.getElementById("origin-menu").style.resize = "none";
    // document.getElementById("origin-menu").style.height = dimensions.height;
    // document.getElementById("origin-menu").style.width = dimensions.width;
    return Toast.fire("Success!", "The menu position is now locked.", "success");
});
// End Enable menu resize drag









// Begin Pause Game
new Toggler(category.utility, "Pause Game").setEnabled(async () => {
    _.network.game._paused = true;
    return Toast.fire("Success!", "Successfully paused Prodigy.", "success");
}).setDisabled(async () => {
    _.network.game._paused = false;
    return Toast.fire("Success!", "Successfully resumed Prodigy.", "success");
});
// End Pause Game





// Begin Eval Console
new Hack(category.utility, "Eval Console", "Evaluate JavaScript code without opening F12").setClick(async () => {


    if (!(await Confirm.fire({
            title: "Important",
            html: "This hack is potentially dangerous, as it evaluates plain JavaScript code, with access to Prodigy's typings. <strong>Please do not paste code from random people on the internet here, that may be dangerous.</strong><br><br>Proceed?",
            icon: "warning"
        })).value) {
        return console.log("Cancelled.");
    }



    const code = await Input.fire("Code:", "Enter the code you want to evaluate.");
    if (!code.value) return;
    try {
        eval(code.value);
    } catch (err) {

        if (err) {
            return Swal.fire({
                title: "Error",
                html: `Oops! There was an error with the code! <br> <code>&nbsp;${err}&nbsp;</code>`,
                icon: "error"
            });
        }
    }

    return Toast.fire("Evaluated!", "Code was evaluated.", "success");
});
// End Eval Console




// Begin Disable inactivity kick
// Uses FlagProvider service "35d-3bd9" (see P-NP vault/battle-constants-and-types.md).
new Hack(category.utility, "Disable inactivity kick", "Keeps you from being logged out for inactivity.").setClick(async () => {
    if (!setConstant("GameConstants.Inactivity.LOG_OUT_TIMER_SECONDS", 0)) {
        return Toast.fire("Error", "FlagProvider service not found.", "error");
    }
    return Toast.fire("Success!", "You now will never be logged out!", "success");
});
// End Disable inactivity kick




// Begin Save Inventory
new Hack(category.utility, "Save Inventory", "Forces a server-side save of your inventory/backpack.").setClick(async () => {
    try {
        (player as any).updated = true;
        (player as any).saveEnabled = true;
        if (player.backpack) (player.backpack as any).updated = true;
        if (typeof (player as any).save === "function") {
            await (player as any).save();
        }
        return Toast.fire("Saved!", "Inventory saved to server.", "success");
    } catch (e) {
        return Swal.fire("Error", "Failed to save inventory: " + e, "error");
    }
});
// End Save Inventory


// Begin Save Pet Data
new Hack(category.utility, "Save Pet Data", "Forces a server-side save of your pet/kennel data.").setClick(async () => {
    (player.kennel as any).updated = true;
    (player as any).updated = true;
    (player as any).saveEnabled = true;
    if (typeof (player as any).forceSaveCharacter === "function") {
        (player as any).forceSaveCharacter();
    }
    return Toast.fire("Saved!", "Pet data saved to server.", "success");
});
// End Save Pet Data


// END UTILITY HACKS
