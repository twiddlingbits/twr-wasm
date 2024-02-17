import {twrWasmModuleBase} from "./twrmodbase"
import {twrSharedCircularBuffer} from "./twrcircular";
import {twrSignal} from "./twrsignal";


// Canvas have a size that will be set based on the character width x height
// The display size for a canvas will default to this size, but can be changed in the HTML/JS via
//    canvas.style.width = "700px";
//    canvas.style.height = "500px";

export interface ICanvasProps {
	charWidth: number,
	charHeight: number,
	foreColor: number,
	backColor: number,
    widthInChars: number,
    heightInChars: number,
}

enum D2DType {
    D2D_FILLRECT=1,
    D2D_LINE=2,
    D2D_TEXT=3,
    D2D_CHAR=4,
    D2D_SETWIDTH=10,
    D2D_SETDRAWCOLOR=11,
    D2D_SETFONT=12
}

export type TCanvasProxyParams = [ICanvasProps, SharedArrayBuffer, SharedArrayBuffer];

export interface ICanvas {
    props: ICanvasProps,
    charIn?: ()=>number,
    inkey?: ()=>number,
    getCanvasProxyParams?: ()=>TCanvasProxyParams,
    drawSeq: (ds:number)=>void,
 }
 
export class twrCanvas implements ICanvas {
    ctx:CanvasRenderingContext2D|undefined;
    props:ICanvasProps={charWidth: 0, charHeight: 0, foreColor: 0, backColor: 0, widthInChars: 0, heightInChars: 0};
    owner: twrWasmModuleBase;
    drawCompleteSignal:twrSignal;
    canvasKeys: twrSharedCircularBuffer;

    constructor(element:HTMLCanvasElement|null|undefined, width:number, height:number, forecolor:string, backcolor:string,  fontsize:number, modbase:twrWasmModuleBase) {
   
        this.owner=modbase;
        this.props.widthInChars=width;
        this.props.heightInChars=height;
        this.drawCompleteSignal=new twrSignal();
		this.canvasKeys = new twrSharedCircularBuffer();  // tsconfig, lib must be set to 2017 or higher
  
        if (element) {
            if (!element.getContext) throw new Error("attempted to create new twrCanvas with an element that is not a valid HTMLCanvasElement");
            let c=element.getContext("2d");
            if (!c) throw new Error("canvas 2D context not found in twrCanvasConstructor");

            c.font = fontsize.toString()+"px Courier New";
            c.textBaseline="top";
            const sampleText="          ";
            const tm=c.measureText(sampleText);
            this.props.charWidth=Math.ceil(tm.width / sampleText.length);   // ceil rounds up (eg .9 -> 1)
            let fM = c.measureText("X"); 
            this.props.charHeight = Math.ceil(fM.fontBoundingBoxAscent + fM.fontBoundingBoxDescent);

            element.width=this.props.charWidth*this.props.widthInChars;
            element.height=this.props.charHeight*this.props.heightInChars;

            // reset after dims changed.  Not sure if ctx is needed to rest, but others do
            let c2=element.getContext("2d");
            if (!c2) throw new Error("canvas 2D context not found in twrCanvasConstructor (2nd time)");
            this.ctx=c2;
            this.ctx.font = fontsize.toString()+"px Courier New";
            this.ctx.textBaseline="top";

            c2.fillStyle=backcolor;
            this.props.backColor=Number("0x"+c2.fillStyle.slice(1));

            c2.fillStyle=forecolor;
            this.props.foreColor=Number("0x"+c2.fillStyle.slice(1));

        }

        //console.log("twrCanvas.constructor props: ", this.props);
   }

    isValid() {
        return !!this.ctx;
    }

    getCanvasProxyParams() : TCanvasProxyParams {
        return [this.props, this.drawCompleteSignal.sharedArray, this.canvasKeys.sharedArray];
    }

    getProp(pn:number): number {
        const propName=this.owner.getString(pn) as keyof ICanvasProps;
        return this.props[propName];
    }

/*
 #define D2D_FILLRECT 1
#define D2D_LINE 2
#define D2D_TEXT 3
#define D2D_SETWIDTH 10
#define D2D_SETDRAWCOLOR 11
#define D2D_SETFONT 12

struct d2dins_char {
        struct d2d_instruction *next;
        short type;
        short x,y;
        short c;
};

struct d2dins_rect {
    struct d2d_instruction *next;
    short type;
    short x,y,w,h
};

struct d2dins_setdrawcolor {
    struct d2d_instruction *next;
    short type;
    unsigned long color;
};

struct d2d_draw_seq {
    struct d2d_instruction_hdr* start;
    struct d2d_instruction_hdr* last;
};

struct d2d_instruction_hdr {
    struct d2d_instruction_hdr *next;
    short type;
};

*/

    drawSeq(ds:number) {
        //console.log("twr::Canvas enter drawSeq");
        if (!this.ctx) return;

        let ins=this.owner.getLong(ds);  /* ds->start */
        const lastins=this.owner.getLong(ds+4);  /* ds->last */
        //console.log("instruction start, last ",ins.toString(16), lastins.toString(16));

        let next:number;

        while (1) {

            const type:D2DType=this.owner.getShort(ins+4);    /* hdr->type */
            if (0/*type!=D2DType.D2D_FILLRECT*/) {
                console.log("ins",ins)
                console.log("hdr.next",this.owner.mem8[ins],this.owner.mem8[ins+1],this.owner.mem8[ins+2],this.owner.mem8[ins+3]);
                console.log("hdr.type",this.owner.mem8[ins+4],this.owner.mem8[ins+5]);
                console.log("next 4 bytes", this.owner.mem8[ins+6],this.owner.mem8[ins+7],this.owner.mem8[ins+8],this.owner.mem8[ins+9]);
                console.log("and 4 more ", this.owner.mem8[ins+10],this.owner.mem8[ins+11],this.owner.mem8[ins+12],this.owner.mem8[ins+13]);
                //console.log("ins, type, next is ", ins.toString(16), type.toString(16), next.toString(16));
             }
            switch (type) {
                case D2DType.D2D_FILLRECT:
                {
                    const x=this.owner.getShort(ins+8);
                    const y=this.owner.getShort(ins+10);
                    const w=this.owner.getShort(ins+12);
                    const h=this.owner.getShort(ins+14);
                    //console.log("fillrect",x,y,w,h)
                    this.ctx.fillRect(x, y, w, h);
                }
                    break;

                case D2DType.D2D_CHAR:
                {
                    const x=this.owner.getShort(ins+8);
                    const y=this.owner.getShort(ins+10);
                    const c=this.owner.getShort(ins+12);
                    //console.log("charout",x,y,c)
                    let txt=String.fromCharCode(c);
                    this.ctx.fillText(txt, x, y);
                }
                    break;

                case D2DType.D2D_SETDRAWCOLOR:
                    {
                        const color=this.owner.getLong(ins+8);  // will be long aligned, so 6 becomes 8
                        const cssColor= "#"+("000000" + color.toString(16)).slice(-6);
                        this.ctx.fillStyle = cssColor;
                        //console.log("this.ctx.fillStyle ",this.ctx.fillStyle)
                    }
                        break;

                default:
                    throw new Error ("Unsupported Sequence Type in drawSeq: "+type);
            }
            next=this.owner.getLong(ins);  /* hdr->next */
            if (next==0) {
                if (ins!=lastins) throw new Error("assert type error in twrcanvas, ins!=lastins");
                break;
            }
            ins=next;
        }

        this.drawCompleteSignal.signal();
        //console.log("twr::Canvas EXIT drawSeq");

    }

        //struct d2dins_rect rect;
        //struct d2dins_line line;
        //struct d2dins_text text;
        //struct d2dins_char char;
        //struct d2dins_setwidth width;
        //struct d2dins_setdrawcolor color;
        //struct d2dins_setfont font;
}

export class twrCanvasProxy implements ICanvas {
    canvasKeys: twrSharedCircularBuffer;
    drawCompleteSignal:twrSignal;
    props: ICanvasProps;
    owner: twrWasmModuleBase;

    constructor(params:TCanvasProxyParams, owner:twrWasmModuleBase) {
        const [props, signalBuffer,  canvasKeysBuffer] = params;
        this.drawCompleteSignal = new twrSignal(signalBuffer);
        this.canvasKeys = new twrSharedCircularBuffer(canvasKeysBuffer);
        this.props=props;
        this.owner=owner;
       // console.log("twrCanvasProxy.constructor props: ", this.props);
    }

    charIn() {  
        //ctx.commit(); not avail in chrome
    
        //postMessage(["debug", 'x']);
        
        return this.canvasKeys.readWait();  // wait for a key, then read it
    }
    
    inkey() {
        if (this.canvasKeys.isEmpty())
            return 0;
        else
            return this.charIn();    
    }

    getProp(pn:number): number {
        const propName=this.owner.getString(pn) as keyof ICanvasProps;
        return this.props[propName];
    }
    
    drawSeq(ds:number) {
        this.drawCompleteSignal.reset();
        postMessage(["drawseq", [ds]]);
        this.drawCompleteSignal.wait();
    }
}
