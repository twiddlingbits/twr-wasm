export interface ICanvasMetrics {
	charWidth: number,
	charHeight: number,
	white: number,
	black: number
}

export class twrCanvas {
    ctx:CanvasRenderingContext2D|undefined;
    charWidth:number;
    charHeight:number;

    constructor(element:HTMLCanvasElement|null|undefined) {
        if (element) {
            let c=element.getContext("2d");
            if (!c) throw new Error("canvas 2D context not found in twrCanvasConstructor");
            this.ctx=c;

            this.ctx.font = "16px Courier New";
            this.ctx.textBaseline="top";
            this.charWidth=Math.ceil(this.ctx.measureText("XXXX").width/4 + 0.5);
            let fM = this.ctx.measureText("X"); 
            this.charHeight = Math.ceil(fM.fontBoundingBoxAscent + fM.fontBoundingBoxDescent+0.5);
        }
        else {
            this.charWidth=0;
            this.charHeight=0;
        }
   }

    isvalid() {
        return !!this.ctx;
    }

    syncGetMetrics() : ICanvasMetrics {
        return {
            "charWidth":this.getAvgCharWidth(),
            "charHeight":this.getCharHeight(),
            "white":this.getColorWhite(),
            "black":this.getColorBlack()
        }
    }

    getAvgCharWidth() {
        return this.charWidth; 
    }

    getCharHeight() {
        return this.charHeight;
    }

    getColorWhite() {
        return 1;  // hard coded, needed to support forground/background and arbitrary colors
    }

    getColorBlack() {
        return 0;
    }

    fillRect(x:number, y:number, w:number, h:number, color:number) {
        if (!this.ctx) return;

        if (color==0) // need to improve this
            this.ctx.fillStyle = "black";
        else
            this.ctx.fillStyle = "white";
        
        this.ctx.fillRect(x, y, w, h);
    }

    charOut(x:number, y:number, ch:number)   // the way this is used, it could be implemented as 1 char which would be simpler
    {
        if (!this.ctx) return;

        this.fillRect(x, y, this.charWidth, this.charHeight, 0);
        let txt=String.fromCharCode(ch);
        this.ctx.fillStyle = "white";
        this.ctx.textBaseline="top";
        this.ctx.font = "16px Courier New";
        this.ctx.fillText(txt, x, y);
    }
}