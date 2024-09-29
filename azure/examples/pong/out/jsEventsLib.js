import { twrLibrary, keyEventToCodePoint, twrLibraryInstanceRegistry } from "twr-wasm";
// Libraries use default export
export default class jsEventsLib extends twrLibrary {
    id;
    imports = {
        registerKeyUpEvent: {},
        registerKeyDownEvent: {},
        registerAnimationLoop: {},
        registerMousePressEvent: {},
        registerMouseMoveEvent: {},
        setElementText: {},
    };
    // every library should have this line
    libSourcePath = new URL(import.meta.url).pathname;
    constructor() {
        super();
        this.id = twrLibraryInstanceRegistry.register(this);
    }
    registerKeyUpEvent(callingMod, eventID) {
        const keyEventListner = (event) => {
            const r = keyEventToCodePoint(event); // twr-wasm utility function
            if (r) {
                console.log(event, r);
                callingMod.postEvent(eventID, r);
            }
        };
        document.addEventListener('keyup', keyEventListner);
    }
    registerKeyDownEvent(callingMod, eventID) {
        const keyEventListner = (event) => {
            const r = keyEventToCodePoint(event); // twr-wasm utility function
            if (r) {
                callingMod.postEvent(eventID, r);
            }
        };
        document.addEventListener('keydown', keyEventListner);
    }
    registerAnimationLoop(callingMod, eventID) {
        const loop = (time) => {
            callingMod.postEvent(eventID, time);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
    registerMouseMoveEvent(callingMod, eventID, elementIDPtr, relative) {
        const elementID = callingMod.wasmMem.getString(elementIDPtr);
        const element = document.getElementById(elementID);
        if (element == null)
            throw new Error("registerMouseEvent was given a non-existant element ID!");
        if (relative) {
            const x_off = element.offsetLeft;
            const y_off = element.offsetTop;
            element.addEventListener('mousemove', (e) => {
                callingMod.postEvent(eventID, e.clientX - x_off, e.clientY - y_off);
            });
        }
        else {
            element.addEventListener('mousemove', (e) => {
                callingMod.postEvent(eventID, e.clientX, e.clientY);
            });
        }
    }
    registerMousePressEvent(callingMod, eventID, elementIDPtr, relative) {
        const elementID = callingMod.wasmMem.getString(elementIDPtr);
        const element = document.getElementById(elementID);
        if (element == null)
            throw new Error("registerMouseEvent was given a non-existent element ID!");
        if (relative) {
            const x_off = element.offsetLeft;
            const y_off = element.offsetTop;
            element.addEventListener('mousedown', (e) => {
                callingMod.postEvent(eventID, e.clientX - x_off, e.clientY - y_off, e.button);
            });
        }
        else {
            element.addEventListener('mousedown', (e) => {
                callingMod.postEvent(eventID, e.clientX, e.clientY, e.button);
            });
        }
    }
    setElementText(mod, elementIDPtr, textPtr) {
        const elementID = mod.wasmMem.getString(elementIDPtr);
        const text = mod.wasmMem.getString(textPtr);
        const element = document.getElementById(elementID);
        if (!element)
            throw new Error(`setElementText was given an invalid ID (${elementID})`);
        element.innerText = text;
    }
}
//# sourceMappingURL=jsEventsLib.js.map