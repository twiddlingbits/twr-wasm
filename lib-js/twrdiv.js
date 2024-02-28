import { twrSharedCircularBuffer } from "./twrcircular.js";
export class twrDiv {
    constructor(element, modParams) {
        this.CURSOR = String.fromCharCode(9611); // ▋ see https://daniel-hug.github.io/characters/#k_70
        this.cursorOn = false;
        this.lastChar = 0;
        this.extraBR = false;
        this.div = element;
        this.divKeys = new twrSharedCircularBuffer(); // tsconfig, lib must be set to 2017 or higher
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
        return [this.divKeys.sharedArray];
    }
    /*
     * add character to div.  Supports the following control codes:
     * any of CRLF, CR (/r), or LF(/n)  will cause a new line
     * 0xE cursor on
     * 0x8 backspace
     * 0xF cursor off
    */
    charOut(ch) {
        if (!this.div)
            return;
        //console.log("div::charout: ", ch);
        if (this.extraBR) {
            this.extraBR = false;
            if (this.cursorOn)
                this.div.innerHTML = this.div.innerHTML.slice(0, -1);
            this.div.innerHTML = this.div.innerHTML.slice(0, -4);
            if (this.cursorOn)
                this.div.innerHTML += this.CURSOR;
        }
        switch (ch) {
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
                this.div.innerHTML += String.fromCharCode(ch);
                if (this.cursorOn)
                    this.div.innerHTML += this.CURSOR;
                break;
        }
        this.lastChar = ch;
    }
}
export class twrDivProxy {
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
    charOut(ch) {
        postMessage(["divout", ch]);
    }
}
//# sourceMappingURL=twrdiv.js.map