import { twrLibrary, twrLibraryInstanceRegistry } from "./twrlibrary.js";
// Libraries use default export
export default class twrLibTimer extends twrLibrary {
    id;
    imports = {
        twr_timer_single_shot: {},
        twr_timer_repeat: {},
        twr_timer_cancel: {},
        twr_sleep: { isAsyncFunction: true, isModuleAsyncOnly: true },
    };
    libSourcePath = new URL(import.meta.url).pathname;
    constructor() {
        // all library constructors should start with these two lines
        super();
        this.id = twrLibraryInstanceRegistry.register(this);
    }
    twr_timer_single_shot(callingMod, milliSeconds, eventID) {
        return setTimeout(() => {
            callingMod.postEvent(eventID);
        }, milliSeconds);
    }
    twr_timer_repeat(callingMod, milliSeconds, eventID) {
        return setInterval(() => {
            callingMod.postEvent(eventID);
        }, milliSeconds);
    }
    twr_timer_cancel(callingMod, timerID) {
        clearInterval(timerID);
    }
    async twr_sleep_async(callingMod, milliSeconds) {
        const p = new Promise((resolve) => {
            setTimeout(() => { resolve(); }, milliSeconds);
        });
        return p;
    }
}
//# sourceMappingURL=twrlibtimer.js.map