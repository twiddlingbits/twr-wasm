import {twrWasmModuleBase, IModParams} from "./twrmodbase.js"
import {twrSharedCircularBuffer} from "./twrcircular.js";
import {twrSignal} from "./twrsignal.js";


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
    canvasWidth:number,
    canvasHeight:number
}

enum D2DType {
    D2D_FILLRECT=1,
    D2D_HVLINE=2,
    D2D_TEXT=3,
    D2D_TEXTFILL=4,
    D2D_CHAR=5,
    D2D_SETLINEWIDTH=10,
    D2D_SETFILLSTYLE=11,
    D2D_SETFONT=12,
    D2D_BEGINPATH=13,
    D2D_MOVETO=14,
    D2D_LINETO=15,
    D2D_FILL=16,
    D2D_STROKE=17,
    D2D_SETSTROKESTYLE=18,
    D2D_ARC=19,
    D2D_STROKERECT=20,
    D2D_FILLTEXT=21,
    D2D_IMAGEDATA=22,
    D2D_PUTIMAGEDATA=23,


}

export type TCanvasProxyParams = [ICanvasProps, SharedArrayBuffer, SharedArrayBuffer];

export interface ICanvas {
    props: ICanvasProps,
    charIn?: ()=>number,
    inkey?: ()=>number,
    getProxyParams?: ()=>TCanvasProxyParams,
    drawSeq: (ds:number)=>void,
 }
 
export class twrCanvas implements ICanvas {
    ctx:CanvasRenderingContext2D|undefined;
    props:ICanvasProps={charWidth: 0, charHeight: 0, foreColor: 0, backColor: 0, widthInChars: 0, heightInChars: 0, canvasHeight:0, canvasWidth:0};
    owner: twrWasmModuleBase;
    cmdCompleteSignal?:twrSignal;
    canvasKeys?: twrSharedCircularBuffer;
    imageData: { [index: number]: ImageData};

    constructor(element:HTMLCanvasElement|null|undefined, modParams:IModParams, modbase:twrWasmModuleBase) {
        const {forecolor, backcolor, fontsize, isd2dcanvas: isd2dcanvas} = modParams; 
        this.owner=modbase;
        this.props.widthInChars=modParams.windim[0];
        this.props.heightInChars=modParams.windim[1];

        if (!this.owner.isWasmModule) {
            this.cmdCompleteSignal=new twrSignal();
            this.canvasKeys = new twrSharedCircularBuffer();  // tsconfig, lib must be set to 2017 or higher
        }

        this.imageData={};
  
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

            if (!isd2dcanvas) {
                element.width=this.props.charWidth*this.props.widthInChars;
                element.height=this.props.charHeight*this.props.heightInChars;
            }

            this.props.canvasHeight=element.height;
            this.props.canvasWidth=element.width;
            //console.log("this.props.canvasHeight, this.props.canvasWidth",this.props.canvasHeight,this.props.canvasWidth);

            // reset after dims changed.  Not sure if ctx is needed to rest, but others do
            let c2=element.getContext("2d");
            if (!c2) throw new Error("canvas 2D context not found in twrCanvas.constructor (2nd time)");
            this.ctx=c2;
            this.ctx.font = fontsize.toString()+"px Courier New";
            this.ctx.textBaseline="top";

            c2.fillStyle=backcolor;
            this.props.backColor=Number("0x"+c2.fillStyle.slice(1));

            c2.fillStyle=forecolor;
            this.props.foreColor=Number("0x"+c2.fillStyle.slice(1));

        }

        //console.log("Create New twrCanvas: ",this.isValid(), element, this);

        //console.log("twrCanvas.constructor props: ", this.props);
   }

    isValid() {
        return !!this.ctx;
    }

    getProxyParams() : TCanvasProxyParams {
        if (!this.cmdCompleteSignal || !this.canvasKeys) throw new Error("internal error in getProxyParams.");
        return [this.props, this.cmdCompleteSignal.sharedArray, this.canvasKeys.sharedArray];
    }

    getProp(pn:number): number {
        if (!this.isValid()) console.log("internal error - getProp called on invalid twrCanvas");
        const propName=this.owner.getString(pn) as keyof ICanvasProps;
        //console.log("enter twrCanvas.getprop: ", pn, propName, this.props[propName], this.props);
        return this.props[propName];
    }

/* see draw2d.h for structs that match */

    drawSeq(ds:number) {
        //console.log("twr::Canvas enter drawSeq");
        if (!this.isValid()) console.log("internal error - drawSeq called on invalid twrCanvas");
        if (!this.ctx) return;

        let ins=this.owner.getLong(ds);  /* ds->start */
        const lastins=this.owner.getLong(ds+4);  /* ds->last */
        //console.log("instruction start, last ",ins.toString(16), lastins.toString(16));

        let next:number;
        //let insCount=0;

        while (1) {

            //insCount++;

            const type:D2DType=this.owner.getLong(ins+4);    /* hdr->type */
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
                    this.ctx.fillRect(x, y, w, h);
                }
                    break;

                case D2DType.D2D_STROKERECT:
                {
                    const x=this.owner.getShort(ins+8);
                    const y=this.owner.getShort(ins+10);
                    const w=this.owner.getShort(ins+12);
                    const h=this.owner.getShort(ins+14);
                    this.ctx.strokeRect(x, y, w, h);
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

                case D2DType.D2D_TEXTFILL:
                {
                    const x=this.owner.getShort(ins+8);
                    const y=this.owner.getShort(ins+10);
                    const text_color=this.owner.getLong(ins+12);
                    const back_color=this.owner.getLong(ins+16);
                    const strlen=this.owner.getLong(ins+20);
                    const str=this.owner.getString(this.owner.getLong(ins+24), strlen);
                    //console.log("D2D_TEXTFILL params: ", x, y, text_color, back_color, strlen, str)
    
                    this.ctx.save();
                    this.ctx.fillStyle = "#"+("000000" + back_color.toString(16)).slice(-6);
                    const tm=this.ctx.measureText(str);
                    this.ctx.fillRect(x, y, tm.width, tm.fontBoundingBoxAscent + tm.fontBoundingBoxDescent);
                    //console.log("D2D_TEXTFILL fillRect: ",this.ctx.fillStyle, x, y, tm.width, tm.fontBoundingBoxAscent + tm.fontBoundingBoxDescent);

                    this.ctx.fillStyle = "#"+("000000" + text_color.toString(16)).slice(-6);
                    this.ctx.fillText(str, x, y);
                    //console.log("D2D_TEXTFILL fillText: ",this.ctx.fillStyle, str, x, y, text_color, back_color, str, strlen)

                    this.ctx.restore();
                }
                    break;

                case D2DType.D2D_FILLTEXT:
                {
                    const x=this.owner.getShort(ins+8);
                    const y=this.owner.getShort(ins+10);
                    const str=this.owner.getString(this.owner.getLong(ins+12));

                    //console.log("filltext ",x,y,str)
    
                    this.ctx.fillText(str, x, y);
                }
                    break;

                case D2DType.D2D_SETFILLSTYLE:
                {
                    const color=this.owner.getLong(ins+8); 
                    const cssColor= "#"+("00000000" + color.toString(16)).slice(-8);
                    this.ctx.fillStyle = cssColor;
                    //console.log("fillstyle: ", this.ctx.fillStyle, ":", cssColor,":", color)
                }
                    break;

                case D2DType.D2D_SETSTROKESTYLE:
                {
                    const color=this.owner.getLong(ins+8); 
                    const cssColor= "#"+("00000000" + color.toString(16)).slice(-8);
                    this.ctx.strokeStyle = cssColor;
                }
                    break;

                case D2DType.D2D_SETLINEWIDTH:
                {
                    const width=this.owner.getShort(ins+8);  
                    this.ctx.lineWidth=width;
                    //console.log("twrCanvas D2D_SETLINEWIDTH: ", this.ctx.lineWidth);
                }
                    break;

                // draw line, but dont include last point
                case D2DType.D2D_HVLINE:
                {
                    const x=this.owner.getShort(ins+8);
                    const y=this.owner.getShort(ins+10);
                    const x2=this.owner.getShort(ins+12);
                    const y2=this.owner.getShort(ins+14);

                    if (this.ctx.lineWidth==1 && x==x2) { // single pixel width vertical line
                        this.ctx.fillRect(x, y, 1, y2-y);
                        //console.log("twrCanvas RECT Vertical D2D_LINE: ", x, y, 1, y2-y, this.ctx.fillStyle);

                    }
                    else if (this.ctx.lineWidth==1 && y==y2) { // single pixel width horizontal line
                        this.ctx.fillRect(x, y, x2-x, 1);
                        //console.log("twrCanvas RECT horizonal D2D_LINE: ", x, y, x2-x, 1, this.ctx.fillStyle);

                    }
                    else {  // this actually does include the last point
                        console.log("D2D_HVLINE: warning: line is not horizontal or vertical. Ignored.")
                    }
    
                }
                    break;

                case D2DType.D2D_MOVETO:
                {
                    const x=this.owner.getShort(ins+8);
                    const y=this.owner.getShort(ins+10);
                    this.ctx.moveTo(x, y);
                }
                    break;

                case D2DType.D2D_LINETO:
                {
                    const x=this.owner.getShort(ins+8);
                    const y=this.owner.getShort(ins+10);
                    this.ctx.lineTo(x, y);
                }
                    break;

                case D2DType.D2D_BEGINPATH:
                {
                    this.ctx.beginPath();
                }
                    break;

                case D2DType.D2D_FILL:
                {
                    this.ctx.fill();
                }
                    break;

                case D2DType.D2D_STROKE:
                {
                    this.ctx.stroke();
                }
                    break;

                case D2DType.D2D_ARC:
                {
                    const x=this.owner.getShort(ins+8);
                    const y=this.owner.getShort(ins+10);
                    const radius=this.owner.getLong(ins+12);
                    const startAngle=this.owner.getDouble(ins+16);
                    const endAngle=this.owner.getDouble(ins+24);
                    const counterClockwise= (this.owner.getLong(ins+32)!=0);

                    this.ctx.arc(x, y, radius, startAngle, endAngle, counterClockwise)
                }
                    break;

                case D2DType.D2D_IMAGEDATA:
                {
                    const start=this.owner.getLong(ins+8);
                    const length=this.owner.getLong(ins+12);
                    const width=this.owner.getLong(ins+16);
                    const height=this.owner.getLong(ins+20);

                    const z = Uint8ClampedArray.from(this.owner.mem8.slice(start, start+length));
                    this.imageData[start]=new ImageData(z, width, height);
                    //console.log("D2D_IMAGEDATA",start, length, width, height, this.imageData[start]);
                }
                    break;

                case D2DType.D2D_PUTIMAGEDATA:
                {
                    const start=this.owner.getLong(ins+8);
                    const dx=this.owner.getLong(ins+12);
                    const dy=this.owner.getLong(ins+16);
                    const dirtyX=this.owner.getLong(ins+20);
                    const dirtyY=this.owner.getLong(ins+24);
                    const dirtyWidth=this.owner.getLong(ins+28);
                    const dirtyHeight=this.owner.getLong(ins+32);

                    //console.log("D2D_PUTIMAGEDATA",start, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight, this.imageData[start]);
                    
                    if (dirtyWidth==0 && dirtyHeight==0) {
                        this.ctx.putImageData(this.imageData[start], dx, dy);
                    }
                    else {
                        this.ctx.putImageData(this.imageData[start], dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
                    }
                }
                    break;

                default:
                    throw new Error ("unimplemented or unknown Sequence Type in drawSeq: "+type);
            }
            next=this.owner.getLong(ins);  /* hdr->next */
            if (next==0) {
                if (ins!=lastins) throw new Error("assert type error in twrcanvas, ins!=lastins");
                break;
            }
            ins=next;
        }

        if (this.cmdCompleteSignal) this.cmdCompleteSignal.signal();
        //console.log("Canvas.drawSeq() completed  with instruction count of ", insCount);
    }
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

        //console.log("Create New twrCanvasProxy: ",this.props)

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
        //console.log("enter twrCanvasProxy.getprop: ", pn, propName, this.props[propName], this.props);
        return this.props[propName];
    }
    
    drawSeq(ds:number) {
        this.drawCompleteSignal.reset();
        postMessage(["drawseq", [ds]]);
        this.drawCompleteSignal.wait();
    }
}
