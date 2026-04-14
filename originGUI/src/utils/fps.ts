import { wrapper } from "../index";

const FPSc = document.createElement("button"); // Create menu toggler
let fpsInterval: ReturnType<typeof setInterval> | null = null;


export function startFps () : void {
    if (fpsInterval) return;
    activate();
}

export function stopFps () : void {
    if (fpsInterval) {
        clearInterval(fpsInterval);
        fpsInterval = null;
    }
    document.getElementById("fps-counter")?.remove();
}


function activate () : void {

    FPSc.id = "fps-counter";
    wrapper?.prepend(FPSc);


    fpsInterval = setInterval(() => {
        FPSc.innerText = _.player.game.fps._framerate.toFixed(2) + " FPS";
    }, 300);
}