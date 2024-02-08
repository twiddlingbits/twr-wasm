export class twrCanvas {
    constructor(element) {
        if (element) {
            let c = element.getContext("2d");
            if (!c)
                throw new Error("canvas 2D context not found in twrCanvasConstructor");
            this.ctx = c;
            this.ctx.font = "16px Courier New";
            this.ctx.textBaseline = "top";
            this.charWidth = Math.ceil(this.ctx.measureText("XXXX").width / 4 + 0.5);
            let fM = this.ctx.measureText("X");
            this.charHeight = Math.ceil(fM.fontBoundingBoxAscent + fM.fontBoundingBoxDescent + 0.5);
        }
        else {
            this.charWidth = 0;
            this.charHeight = 0;
        }
    }
    isvalid() {
        return !!this.ctx;
    }
    syncGetMetrics() {
        return {
            "charWidth": this.getAvgCharWidth(),
            "charHeight": this.getCharHeight(),
            "white": this.getColorWhite(),
            "black": this.getColorBlack()
        };
    }
    getAvgCharWidth() {
        return this.charWidth;
    }
    getCharHeight() {
        return this.charHeight;
    }
    getColorWhite() {
        return 1; // hard coded, needed to support forground/background and arbitrary colors
    }
    getColorBlack() {
        return 0;
    }
    fillRect(x, y, w, h, color) {
        if (!this.ctx)
            return;
        if (color == 0) // need to improve this
            this.ctx.fillStyle = "black";
        else
            this.ctx.fillStyle = "white";
        this.ctx.fillRect(x, y, w, h);
    }
    charOut(x, y, ch) {
        if (!this.ctx)
            return;
        this.fillRect(x, y, this.charWidth, this.charHeight, 0);
        let txt = String.fromCharCode(ch);
        this.ctx.fillStyle = "white";
        this.ctx.textBaseline = "top";
        this.ctx.font = "16px Courier New";
        this.ctx.fillText(txt, x, y);
    }
}
//# sourceMappingURL=twrcanvas.js.map