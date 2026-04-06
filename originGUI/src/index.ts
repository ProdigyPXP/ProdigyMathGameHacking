// @ts-nocheck
// Prodigy Origin Mod Menu

import { io } from "socket.io-client"; // Import socket.io-client
import "./style.scss"; // Import SCSS style
import { _ } from "./utils/util"; // Import Prodigy typings
import { statusMessage } from "./utils/status"; // Import status message
import Swal from "sweetalert2"; // Import Swal
import { License, NoLicense } from "./utils/swal";


export const menu = document.createElement("div"); // Create mod menu element
export const wrapper = document.getElementById("game-wrapper"); // Create game wrapper

document.getElementById("origin-menu")?.remove(); // Remove any existing menu if present
document.getElementById("origin-toggler")?.remove(); // Remove any existing menu togglers if present
menu.id = "origin-menu"; // Set menu ID


menu.style = "position: fixed;top: -10%;left: 10%;right: 10%;width: 80%;height: 80%;z-index: 2;background-color: rgba(0, 0, 0, 0.5);backdrop-filter: blur(5px);"; // Set menu style

wrapper?.prepend(menu);

export const toggler = document.createElement("button"); // Create menu toggler
toggler.id = "origin-toggler";


let visible = false;
wrapper?.prepend(toggler);
toggler.onclick = () => {
	visible = !visible;

	if (visible) {
		toggler.innerText = "▼";
		menu.style.top = "-100vh";
	} else {
		toggler.innerText = "▲";
		menu.style.top = "10%";
	}
};
toggler.onclick({} as any);

const menuleft = document.createElement("DIV");
menuleft.classList.add("menu-left");
menu.append(menuleft);

let firstCategory = true;
function addArea (title: string) {
	const area = document.createElement("div");

    if (firstCategory == false) {
        area.append(document.createElement("br"));
        area.append(document.createElement("br"));
    } else {
        firstCategory = false;
    }


	area.classList.add("menu-area");
	area.style.textAlign = "center";
	menuleft.append(area);

	const header = document.createElement("h1");
	header.innerText = title;
	header.style.textAlign = "center";
	header.style.color = "white";

	area.append(header);
	return area;
};

const title = document.createElement("h1");
title.classList.add("menu-title");
title.innerText = "Prodigy Origin";
title.style.textAlign = "center";
menuleft.append(title);

const disc = document.createElement("h2");
disc.style.fontSize = "25px";
disc.style.color = "white";
disc.innerHTML = "<br>Press SHIFT to show/hide the menu. Scroll down in the menu for more mods.";
menuleft.append(disc);

const subtitle = document.createElement("h3");
subtitle.style.fontSize = "20px";
subtitle.innerHTML = `
<p>Join our Discord <a href='https://dsc.gg/ProdigyPXP'>https://dsc.gg/ProdigyPXP</a>!</p>

<hr>
`;
subtitle.style.color = "white";
menuleft.append(subtitle);



export const category = {
	player: addArea("Player Mods"),
	inventory: addArea("Inventory Mods"),
	location: addArea("Location Mods"),
	pets: addArea("Pet Mods"),
	battle: addArea("Battle Mods"),
	minigames: addArea("Minigame Mods"),
	misc: addArea("Miscellaneous Mods"),
	utility: addArea("Utility Mods"),
	beta: addArea("Beta Testing | Beta Mods may damage your account"),
	patched : addArea("Patched Mods")
};



// If an item called hasTip is defined in the localStorage
if (!localStorage.hasTip) {
	(async () => {
	    await Swal.fire({
		    title: 'Welcome!',
		    html: `To get started with the hacks, click this dropdown!`,
	        icon: 'info',
		    backdrop: `
		        url("https://i.imgur.com/CdV9piu.png")
		        left top
		        no-repeat
		    `
       });
	})();
	localStorage.hasTip = true;
	console.log("Player was shown the tip.");
} else {
	console.log("Player already has tip.");
};


// If an item called "level" is defined in the localStorage
if (localStorage.getItem("level")) {
	// Then, override _.player.getLevel with the value in localStorage.
	_.player.getLevel = () => localStorage.getItem("level");

	console.log("Loaded menu from localStorage.");
}


let shownMenu : boolean = true;
document.addEventListener("keydown", function (event) {
	if (event.key == "Shift") {

		console.log("Shift key was pressed.");

		if (shownMenu == true) {
			// Mods are shown, so let's hide them.
			console.log("Hiding mod menu...");
			document.getElementById("origin-menu").style.display = "none";
			document.getElementById("origin-toggler").style.display = "none";
			shownMenu = false;
			console.log("Hidden mod menu.");
		} else {
			// Mods are hidden, so let's show them.
			console.log("Showing mod menu...");
			document.getElementById("origin-menu").style.display = "block";
			document.getElementById("origin-toggler").style.display = "block";
            shownMenu = true;
			console.log("Shown mod menu.");
		}
	}
});


if (process.env.NODE_ENV === "development") {
	const socket = io("http://localhost:3001");
	let used = false;
	socket.on("update", data => {
		if (used) return;
		used = true;
		socket.disconnect();
		document.getElementById("origin-menu")?.remove();
		document.getElementById("origin-toggler")?.remove();
		eval(data);
	});
}




// LICENSE POPUPS
(async () => {



        if (!(await License.fire("Prodigy Origin", `
            <p>
            <a href="https://github.com/ProdigyPXP/ProdigyMathGameHacking/blob/master/README.md">This is free and open-source software</a>.
            If you paid for this or accessed this behind a paywall/AdFly link, demand a refund. If you sell this software, or otherwise make a commercial advantage from it, you are violating
            <a href = "https://github.com/ProdigyPXP/ProdigyMathGameHacking/blob/master/LICENSE.txt">our license</a>.
            </p>
        `)).value) {

            if (!(await NoLicense.fire("Prodigy Origin License", `
                <p>
                <strong>You need to agree to our license to use Prodigy Origin. If you changed your mind and now agree to our license, reload Prodigy.</strong>
                </p>
            `)).value) {

                // Play Prodigy without hacks
                document.getElementById("origin-menu")?.remove(); // Remove any existing menu if present
                document.getElementById("origin-toggler")?.remove(); // Remove any existing menu togglers if present

            } else {

                // Reload Prodigy
                location.reload();
            }


        } else {


            // Display status message.
            await statusMessage();
        }

})();