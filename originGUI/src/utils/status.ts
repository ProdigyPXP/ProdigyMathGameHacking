import { Swal } from "../utils/swal";  // Import Swal





export function statusMessage () {


    fetch(`https://raw.githubusercontent.com/ProdigyPXP/ProdigyMathGameHacking/master/originGUI/statusmessage.json?updated=${Date.now()}`).then(response => response.json()).then(async data => {

            const enabled = data.enabled;

            if (enabled === false) {
                return console.log("Status message is disabled.");
            } else {

                await Swal.fire({
                    title: data.title,
                    html: data.html,
                    icon: data.icon,
                });

            }

        });



};
