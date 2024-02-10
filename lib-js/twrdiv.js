let logline = "";
export function debugLog(char) {
    if (char == 10) {
        console.log(logline);
        logline = "";
    }
    else {
        logline = logline + String.fromCharCode(char);
        if (logline.length >= 100) {
            console.log(logline);
            logline = "";
        }
    }
}
export class twrDiv {
    constructor(element) {
        this.CURSOR = String.fromCharCode(9611); // ▋ see https://daniel-hug.github.io/characters/#k_70
        this.cursorOn = false;
        this.lastChar = 0;
        this.extraBR = false;
        this.div = element;
    }
    isvalid() {
        return !!this.div;
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
//# sourceMappingURL=twrdiv.js.map