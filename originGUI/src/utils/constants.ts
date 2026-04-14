// Game constants access helper.
// The P-NP patcher captures the game's own constants object into
// `window._.constants` (bolted-on Map-like API). Writes propagate to the same
// storage the game reads, so toggling GameConstants.* flags at runtime works.

import { _ } from "./util";

export function setConstant (key: string, value: unknown): boolean {
    const c = (_ as any).constants;
    if (!c || typeof c.set !== "function") return false;
    c.set(key, value);
    return true;
}

export function getConstant (key: string): unknown {
    const c = (_ as any).constants;
    if (!c || typeof c.get !== "function") return undefined;
    return c.get(key);
}
