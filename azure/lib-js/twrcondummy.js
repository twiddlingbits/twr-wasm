import { twrLibrary, twrLibraryInstanceRegistry } from "./twrlibrary.js";
// This class exists so the twrlibbuiltin can cause all functions (like twrConCls) to resolve at runtime link time
// twr.a links to all of these, even if the relevant console is not loaded by the app at runtime
// These functions should never be called, because twrLibrary routes a call (like io_cls(id)) to the correct console instance based on id
// see TODO comments in twrLibrary.ts for possible better fixes
export default class twrConsoleDummy extends twrLibrary {
    id;
    imports = {
        twrConCharOut: { noBlock: true },
        twrConGetProp: {},
        twrConPutStr: { noBlock: true },
        twrConCharIn: { isAsyncFunction: true, isModuleAsyncOnly: true },
        twrConSetFocus: { noBlock: true },
        twrConSetC32: { noBlock: true },
        twrConCls: { noBlock: true },
        twrConSetRange: { noBlock: true },
        twrConSetReset: { noBlock: true },
        twrConPoint: {},
        twrConSetCursor: { noBlock: true },
        twrConSetCursorXY: { noBlock: true },
        twrConSetColors: { noBlock: true },
        twrConDrawSeq: {},
        twrConLoadImage: { isModuleAsyncOnly: true, isAsyncFunction: true },
    };
    libSourcePath = new URL(import.meta.url).pathname;
    interfaceName = "twrConsole";
    constructor() {
        // all library constructors should start with these two lines
        super();
        this.id = twrLibraryInstanceRegistry.register(this);
    }
    twrConGetProp(callingMod, pn) {
        throw new Error("internal error");
    }
    keyDown(ev) {
        throw new Error("internal error");
    }
    twrConCharOut(callingMod, c, codePage) {
        throw new Error("internal error");
    }
    twrConPutStr(callingMod, chars, codePage) {
        throw new Error("internal error");
    }
    twrConSetC32(callingMod, location, c32) {
        throw new Error("internal error");
    }
    twrConCls() {
        throw new Error("internal error");
    }
    twrConSetRange(callingMod, chars, start, len) {
        throw new Error("internal error");
    }
    setRangeJS(start, values) {
        throw new Error("internal error");
    }
    twrConSetReset(callingMod, x, y, isset) {
        throw new Error("internal error");
    }
    twrConPoint(callingMod, x, y) {
        throw new Error("internal error");
    }
    twrConSetCursor(callingMod, location) {
        throw new Error("internal error");
    }
    twrConSetCursorXY(callingMod, x, y) {
        throw new Error("internal error");
    }
    twrConSetColors(callingMod, foreground, background) {
        throw new Error("internal error");
    }
    async twrConCharIn_async(callingMod) {
        throw new Error("internal error");
    }
    twrConSetFocus() {
        throw new Error("internal error");
    }
    twrConDrawSeq(mod, ds) {
        throw new Error("internal error");
    }
    getProp(name) {
        throw new Error("internal error");
    }
    putStr(str) {
        throw new Error("internal error");
    }
    charOut(c32) {
        throw new Error("internal error");
    }
    twrConLoadImage_async(mod, urlPtr, id) {
        throw new Error("internal error");
    }
}
//# sourceMappingURL=twrcondummy.js.map