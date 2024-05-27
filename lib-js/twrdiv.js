import { twrSharedCircularBuffer } from "./twrcircular.js";
import { twrCodePageToUnicodeCodePointImpl, codePageUTF16 } from "./twrlocale.js";
export class twrDiv {
    div;
    divKeys;
    CURSOR = String.fromCharCode(9611); // ▋ see https://daniel-hug.github.io/characters/#k_70
    cursorOn = false;
    lastChar = 0;
    extraBR = false;
    owner;
    constructor(element, modParams, modbase) {
        this.div = element;
        this.owner = modbase;
        if (!this.owner.isWasmModule) { // twrWasmModule doesn't use shared memory
            this.divKeys = new twrSharedCircularBuffer(); // tsconfig, lib must be set to 2017 or higher
        }
        if (this.div && !modParams.styleIsDefault) { // don't let default colors override divStyle
            this.div.style.backgroundColor = modParams.backcolor;
            this.div.style.color = modParams.forecolor;
            this.div.style.font = modParams.fontsize.toString() + "px arial";
        }
    }
    isValid() {
        return !!this.div;
    }
    getProxyParams() {
        if (!this.divKeys)
            throw new Error("internal error in getProxyParams.");
        return [this.divKeys.sharedArray];
    }
    /*
     * add utf-8 or windows-1252 character to div.  Supports the following control codes:
     * any of CRLF, CR (/r), or LF(/n)  will cause a new line
     * 0x8 backspace
     * 0xE cursor on
     * 0xF cursor off
    */
    charOut(ch, codePage) {
        if (!this.div)
            return;
        //console.log("div::charout: ", ch, codePage);
        if (this.extraBR) {
            this.extraBR = false;
            if (this.cursorOn)
                this.div.innerHTML = this.div.innerHTML.slice(0, -1);
            this.div.innerHTML = this.div.innerHTML.slice(0, -4);
            if (this.cursorOn)
                this.div.innerHTML += this.CURSOR;
        }
        const chnum = twrCodePageToUnicodeCodePointImpl(ch, codePage);
        if (chnum != 0) {
            switch (chnum) {
                case 10: // newline
                case 13: // return
                    if (ch == 10 && this.lastChar == 13)
                        break; // detect CR LF and treat as single new line
                    if (this.cursorOn)
                        this.div.innerHTML = this.div.innerHTML.slice(0, -1);
                    this.div.innerHTML += "<br><br>"; //2nd break is a place holder for next line (fixes scroll issue at bottom)
                    this.extraBR = true;
                    if (this.cursorOn)
                        this.div.innerHTML += this.CURSOR;
                    //element.scrollIntoView();
                    //element.scrollTop = element.scrollHeight;
                    let p = this.div.getBoundingClientRect();
                    window.scrollTo(0, p.height + 100);
                    break;
                case 8: // backspace
                    if (this.cursorOn)
                        this.div.innerHTML = this.div.innerHTML.slice(0, -1);
                    this.div.innerHTML = this.div.innerHTML.slice(0, -1);
                    if (this.cursorOn)
                        this.div.innerHTML += this.CURSOR;
                    break;
                case 0xE: // cursor on
                    if (!this.cursorOn) {
                        this.cursorOn = true;
                        this.div.innerHTML += this.CURSOR;
                        this.div.focus();
                    }
                    break;
                case 0xF: // cursor off
                    if (this.cursorOn) {
                        this.cursorOn = false;
                        this.div.innerHTML = this.div.innerHTML.slice(0, -1);
                    }
                    break;
                default:
                    if (this.cursorOn)
                        this.div.innerHTML = this.div.innerHTML.slice(0, -1);
                    this.div.innerHTML += String.fromCodePoint(chnum);
                    if (this.cursorOn)
                        this.div.innerHTML += this.CURSOR;
                    break;
            }
            this.lastChar = chnum;
        }
    }
    stringOut(str) {
        for (let i = 0; i < str.length; i++)
            this.charOut(str.charCodeAt(i), codePageUTF16);
    }
}
export class twrDivProxy {
    divKeys;
    constructor(params) {
        const [divKeysBuffer] = params;
        this.divKeys = new twrSharedCircularBuffer(divKeysBuffer);
    }
    charIn() {
        return this.divKeys.readWait(); // wait for a key, then read it
    }
    inkey() {
        if (this.divKeys.isEmpty())
            return 0;
        else
            return this.charIn();
    }
    charOut(ch, codePoint) {
        postMessage(["divout", [ch, codePoint]]);
    }
}
//# sourceMappingURL=twrdiv.js.map