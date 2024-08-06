import { IOTypes } from "./twrcon.js";
import { twrCodePageToUnicodeCodePoint, codePageUTF32 } from "./twrlocale.js";
import { twrConsoleRegistry } from "./twrconreg.js";
export class twrConsoleDebug {
    logline = "";
    element = undefined;
    id;
    cpTranslate;
    constructor() {
        this.id = twrConsoleRegistry.registerConsole(this);
        this.cpTranslate = new twrCodePageToUnicodeCodePoint();
    }
    charOut(ch, codePage) {
        const char = this.cpTranslate.convert(ch, codePage);
        if (char == 10 || char == 0x03) { // ASCII 03 is End-of-Text, and is used here to indicate the preceding char should be printed
            console.log(this.logline); // ideally without a linefeed, but there is no way to not have a LF with console.log API.
            this.logline = "";
        }
        else {
            this.logline = this.logline + String.fromCodePoint(char);
            if (this.logline.length >= 300) {
                console.log(this.logline);
                this.logline = "";
            }
        }
    }
    getProp(propName) {
        if (propName === "type")
            return IOTypes.CHARWRITE;
        console.log("twrConsoleDebug.getProp passed unknown property name: ", propName);
        return 0;
    }
    getProxyParams() {
        return ["twrConsoleDebugProxy", this.id];
    }
    keyDown(ev) {
        throw new Error("twrConsoleDebug does not support character input");
    }
    processMessage(msgType, data, callingModule) {
        const [id, ...params] = data;
        if (id != this.id)
            throw new Error("internal error"); // should never happen
        switch (msgType) {
            case "debug-charout":
                {
                    const [ch, codePage] = params;
                    this.charOut(ch, codePage);
                }
                break;
            case "debug-putstr":
                {
                    const [str] = params;
                    this.putStr(str);
                }
                break;
            default:
                return false;
        }
        return true;
    }
    putStr(str) {
        for (let i = 0; i < str.length; i++)
            this.charOut(str.codePointAt(i) || 0, codePageUTF32);
    }
}
export class twrConsoleDebugProxy {
    id;
    constructor(params) {
        this.id = params[1];
    }
    charIn() {
        return 0;
    }
    setFocus() {
    }
    charOut(ch, codePoint) {
        postMessage(["debug-charout", [this.id, ch, codePoint]]);
    }
    putStr(str) {
        postMessage(["debug-putstr", [this.id, str]]);
    }
    getProp(propName) {
        if (propName === "type")
            return IOTypes.CHARWRITE;
        console.log("twrConsoleDebugProxy.getProp passed unknown property name: ", propName);
        return 0;
    }
}
// ************************************************************************
// debugLog doesn't currently wait for the message to log, it returns immediately.
// I could move this to be in the twrWaitingCalls class
//# sourceMappingURL=twrcondebug.js.map