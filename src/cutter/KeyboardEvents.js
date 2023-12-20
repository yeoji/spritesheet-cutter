const pressedKeys = {};
window.onkeyup = function(e) { pressedKeys[e.key] = false; }
window.onkeydown = function(e) { pressedKeys[e.key] = true; }

export function isKeyDown(key) {
    return pressedKeys[key];
}

export const SHIFT_KEY = 'Shift';