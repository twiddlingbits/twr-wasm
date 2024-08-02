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
    D2D_FILLCODEPOINT=5,
    D2D_SETLINEWIDTH=10,
    D2D_SETFILLSTYLERGBA=11,
    D2D_SETFONT=12,
    D2D_BEGINPATH=13,
    D2D_MOVETO=14,
    D2D_LINETO=15,
    D2D_FILL=16,
    D2D_STROKE=17,
    D2D_SETSTROKESTYLERGBA=18,
    D2D_ARC=19,
    D2D_STROKERECT=20,
    D2D_FILLTEXT=21,
    D2D_IMAGEDATA=22,
    D2D_PUTIMAGEDATA=23,
    D2D_BEZIERTO=24,
    D2D_MEASURETEXT=25,
    D2D_SAVE=26,
    D2D_RESTORE=27,
    D2D_CREATERADIALGRADIENT=28,
    D2D_SETCOLORSTOP=29,
    D2D_SETFILLSTYLEGRADIENT=30,
    D2D_RELEASEID=31,
    D2D_CREATELINEARGRADIENT=32,
    D2D_SETFILLSTYLE=33,
    D2D_SETSTROKESTYLE=34,
    D2D_CLOSEPATH=35,
    D2D_RESET=36,
    D2D_CLEARRECT=37,
    D2D_SCALE=38,
    D2D_TRANSLATE=39,
    D2D_ROTATE=40,
    D2D_GETTRANSFORM = 41,
    D2D_SETTRANSFORM = 42,
    D2D_RESETTRANSFORM = 43,
    D2D_STROKETEXT = 44,
    D2D_ROUNDRECT = 45,
    D2D_ELLIPSE = 46,
    D2D_QUADRATICCURVETO = 47,
    D2D_SETLINEDASH = 48,
    D2D_GETLINEDASH = 49,
    D2D_ARCTO = 50,
    D2D_GETLINEDASHLENGTH = 51,
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
    precomputedObjects: {  [index: number]: 
        (ImageData | 
			{mem8:Uint8Array, width:number, height:number})  |
         CanvasGradient
    };

    constructor(element:HTMLCanvasElement|null|undefined, modParams:IModParams, modbase:twrWasmModuleBase) {
        const {forecolor, backcolor, fontsize, isd2dcanvas } = modParams; 
        this.owner=modbase;
        this.props.widthInChars=modParams.windim[0];
        this.props.heightInChars=modParams.windim[1];

        if (!this.owner.isWasmModule) {
            this.cmdCompleteSignal=new twrSignal();
            this.canvasKeys = new twrSharedCircularBuffer();  // tsconfig, lib must be set to 2017 or higher
        }

        this.precomputedObjects={};
  
        if (element) {
            if (!element.getContext) throw new Error("attempted to create new twrCanvas with an element that is not a valid HTMLCanvasElement");
            let c=element.getContext("2d");
            if (!c) throw new Error("canvas 2D context not found in twrCanvasConstructor");

            c.font = fontsize.toString()+"px Courier New";
            c.textBaseline="top";
            const sampleText="          ";
				//const sampleText=String.fromCharCode(2593).repeat(6);   // this shaded block is typically full width in a font
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

            // reset after dims changed.  Not sure if ctx is needed to reset, but others do
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

        const ins_start_offset = 16;

        let ins=this.owner.getLong(ds);  /* ds->start */
        const lastins=this.owner.getLong(ds+4);  /* ds->last */
        
        let ins_start = ins + ins_start_offset;
        //console.log("instruction start, last ",ins.toString(16), lastins.toString(16));

        let next:number;
        //let insCount=0;
        
        // if (!this.owner.exports) throw new Error("this.owner.exports undefined");
        // if (!this.owner.exports["free"]) throw new Error("Canvas this.owner.exports[\"free\"] is undefined");
        // const free = this.owner.exports!["free"] as CallableFunction;

        // if (!this.owner.exports["malloc"]) throw new Error("Canvas this.owner.exports[\"malloc\"] is undefined");
        // const malloc = this.owner.exports!["malloc"] as CallableFunction;
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
                    const x=this.owner.getDouble(ins_start);
                    const y=this.owner.getDouble(ins_start+8);
                    const w=this.owner.getDouble(ins_start+16);
                    const h=this.owner.getDouble(ins_start+24);
                    this.ctx.fillRect(x, y, w, h);
                }
                    break;

                case D2DType.D2D_STROKERECT:
                {
                    const x=this.owner.getDouble(ins_start);
                    const y=this.owner.getDouble(ins_start+8);
                    const w=this.owner.getDouble(ins_start+16);
                    const h=this.owner.getDouble(ins_start+24);
                    this.ctx.strokeRect(x, y, w, h);
                }
                    break;

                case D2DType.D2D_FILLCODEPOINT:
                {
                    const x=this.owner.getDouble(ins_start);
                    const y=this.owner.getDouble(ins_start+8);
                    const c=this.owner.getLong(ins_start+16);
                    let txt=String.fromCodePoint(c);
                    this.ctx.fillText(txt, x, y);
                }
                    break;

                
                case D2DType.D2D_FILLTEXT:
                {
                    const x=this.owner.getDouble(ins_start);
                    const y=this.owner.getDouble(ins_start+8);
						  const codePage=this.owner.getLong(ins_start+20);
                    const strPointer = this.owner.getLong(ins_start+16);
                    const str=this.owner.getString(strPointer, undefined, codePage);

                    //console.log("filltext ",x,y,str)
    
                    this.ctx.fillText(str, x, y);
                    // free(strPointer);
                }
                    break;

                case D2DType.D2D_MEASURETEXT:
                {
						  const codePage=this.owner.getLong(ins_start+8);
                    const str=this.owner.getString(this.owner.getLong(ins_start), undefined, codePage);
                    const tmidx=this.owner.getLong(ins_start+4);
    
                    const tm=this.ctx.measureText(str);
                    this.owner.setDouble(tmidx+0, tm.actualBoundingBoxAscent);
                    this.owner.setDouble(tmidx+8, tm.actualBoundingBoxDescent);
                    this.owner.setDouble(tmidx+16, tm.actualBoundingBoxLeft);
                    this.owner.setDouble(tmidx+24, tm.actualBoundingBoxRight);
                    this.owner.setDouble(tmidx+32, tm.fontBoundingBoxAscent);
                    this.owner.setDouble(tmidx+40, tm.fontBoundingBoxDescent);
                    this.owner.setDouble(tmidx+48, tm.width);
                }
                    break;

                case D2DType.D2D_SETFONT:
                {
                    const fontPointer = this.owner.getLong(ins_start);
                    const str=this.owner.getString(fontPointer);
                    this.ctx.font=str;
                    // free(fontPointer);
                }
                    break;

                case D2DType.D2D_SETFILLSTYLERGBA:
                {
                    const color=this.owner.getLong(ins_start); 
                    const cssColor= "#"+("00000000" + color.toString(16)).slice(-8);
                    this.ctx.fillStyle = cssColor;
                    //console.log("fillstyle: ", this.ctx.fillStyle, ":", cssColor,":", color)
                }
                    break;

                case D2DType.D2D_SETSTROKESTYLERGBA:
                {
                    const color=this.owner.getLong(ins_start); 
                    const cssColor= "#"+("00000000" + color.toString(16)).slice(-8);
                    this.ctx.strokeStyle = cssColor;
                }
                    break;

                case D2DType.D2D_SETFILLSTYLE:
                {
                    const cssColorPointer = this.owner.getLong(ins_start);
                    const cssColor= this.owner.getString(cssColorPointer);
                    this.ctx.fillStyle = cssColor;
                    // free(cssColorPointer);
                }
                    break

                case D2DType.D2D_SETSTROKESTYLE:
                {
                    const cssColorPointer = this.owner.getLong(ins_start);
                    const cssColor= this.owner.getString(cssColorPointer);
                    this.ctx.strokeStyle = cssColor;
                    // free(cssColorPointer);
                }
                    break

                case D2DType.D2D_SETLINEWIDTH:
                {
                    const width=this.owner.getDouble(ins_start);  
                    this.ctx.lineWidth=width;
                    //console.log("twrCanvas D2D_SETLINEWIDTH: ", this.ctx.lineWidth);
                }
                    break;

                case D2DType.D2D_MOVETO:
                {
                    const x=this.owner.getDouble(ins_start);
                    const y=this.owner.getDouble(ins_start+8);
                    this.ctx.moveTo(x, y);
                }
                    break;

                case D2DType.D2D_LINETO:
                {
                    const x=this.owner.getDouble(ins_start);
                    const y=this.owner.getDouble(ins_start+8);
                    this.ctx.lineTo(x, y);
                }
                    break;

                case D2DType.D2D_BEZIERTO:
                {
                    const cp1x=this.owner.getDouble(ins_start);
                    const cp1y=this.owner.getDouble(ins_start+8);
                    const cp2x=this.owner.getDouble(ins_start+16);
                    const cp2y=this.owner.getDouble(ins_start+24);
                    const x=this.owner.getDouble(ins_start+32);
                    const y=this.owner.getDouble(ins_start+40);
                    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
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

                case D2DType.D2D_SAVE:
                {
                    this.ctx.save();
                }
                    break;

                case D2DType.D2D_RESTORE:
                {
                    this.ctx.restore();
                }
                    break;

                case D2DType.D2D_STROKE:
                {
                    this.ctx.stroke();
                }
                    break;

                case D2DType.D2D_ARC:
                {
                    const x=this.owner.getDouble(ins_start);
                    const y=this.owner.getDouble(ins_start+8);
                    const radius=this.owner.getDouble(ins_start+16);
                    const startAngle=this.owner.getDouble(ins_start+24);
                    const endAngle=this.owner.getDouble(ins_start+32);
                    const counterClockwise= (this.owner.getLong(ins_start+40)!=0);

                    this.ctx.arc(x, y, radius, startAngle, endAngle, counterClockwise)
                }
                    break;

                case D2DType.D2D_IMAGEDATA:
                {
                    const start=this.owner.getLong(ins_start);
                    const length=this.owner.getLong(ins_start+4);
                    const width=this.owner.getLong(ins_start+8);
                    const height=this.owner.getLong(ins_start+12);
                    const id=this.owner.getLong(ins_start+16);

                    if ( id in this.precomputedObjects ) console.log("warning: D2D_IMAGEDATA ID already exists.");

                    if (this.owner.isWasmModule) {
                        const z = new Uint8ClampedArray(this.owner.memory!.buffer, start, length);
                        this.precomputedObjects[id]=new ImageData(z, width, height);
                    }
                    else {  // Uint8ClampedArray doesn't support shared memory
                        this.precomputedObjects[id]={mem8: new Uint8Array(this.owner.memory!.buffer, start, length), width:width, height:height};
                    }
                    //console.log("D2D_IMAGEDATA",start, length, width, height, this.imageData[start]);
                }
                    break;

                case D2DType.D2D_CREATERADIALGRADIENT:
                {
                    const x0=this.owner.getDouble(ins_start);
                    const y0=this.owner.getDouble(ins_start+8);
                    const radius0=this.owner.getDouble(ins_start+16);
                    const x1=this.owner.getDouble(ins_start+24);
                    const y1=this.owner.getDouble(ins_start+32);
                    const radius1=this.owner.getDouble(ins_start+40);
                    const id= this.owner.getLong(ins_start+48);

                    let gradient=this.ctx.createRadialGradient(x0, y0, radius0, x1, y1, radius1);
                    if ( id in this.precomputedObjects ) console.log("warning: D2D_CREATERADIALGRADIENT ID already exists.");
                    this.precomputedObjects[id] = gradient;
                }
                    break

                case D2DType.D2D_CREATELINEARGRADIENT:
                    {
                        const x0=this.owner.getDouble(ins_start);
                        const y0=this.owner.getDouble(ins_start+8);
                        const x1=this.owner.getDouble(ins_start+16);
                        const y1=this.owner.getDouble(ins_start+24);
                        const id= this.owner.getLong(ins_start+32);
    
                        let gradient=this.ctx.createLinearGradient(x0, y0, x1, y1);
                        if ( id in this.precomputedObjects ) console.log("warning: D2D_CREATELINEARGRADIENT ID already exists.");
                        this.precomputedObjects[id] = gradient;
                    }
                        break

                case D2DType.D2D_SETCOLORSTOP:
                {
                    const id = this.owner.getLong(ins_start);
                    const pos=this.owner.getLong(ins_start+4);
                    const cssColorPointer = this.owner.getLong(ins_start+8);
                    const cssColor= this.owner.getString(cssColorPointer);

                    if (!(id in this.precomputedObjects)) throw new Error("D2D_SETCOLORSTOP with invalid ID: "+id);
                    const gradient=this.precomputedObjects[id] as CanvasGradient;
                    gradient.addColorStop(pos, cssColor);

                    // free(cssColorPointer);
                }
                    break

                case D2DType.D2D_SETFILLSTYLEGRADIENT:
                {
                    const id=this.owner.getLong(ins_start);
                    if (!(id in this.precomputedObjects)) throw new Error("D2D_SETFILLSTYLEGRADIENT with invalid ID: "+id);
                    const gradient=this.precomputedObjects[id] as CanvasGradient;
                    this.ctx.fillStyle=gradient;
                }
                    break

                case D2DType.D2D_RELEASEID:
                {
                    const id=this.owner.getLong(ins_start);
                    if (this.precomputedObjects[id])
                        delete this.precomputedObjects[id];
                    else
                        console.log("warning: D2D_RELEASEID with undefined ID ",id);
                }
                    break

                    

                case D2DType.D2D_PUTIMAGEDATA:
                {
                    const id=this.owner.getLong(ins_start);
                    const dx=this.owner.getLong(ins_start+4);
                    const dy=this.owner.getLong(ins_start+8);
                    const dirtyX=this.owner.getLong(ins_start+12);
                    const dirtyY=this.owner.getLong(ins_start+16);
                    const dirtyWidth=this.owner.getLong(ins_start+20);
                    const dirtyHeight=this.owner.getLong(ins_start+24);

                    if (!(id in this.precomputedObjects)) throw new Error("D2D_PUTIMAGEDATA with invalid ID: "+id);

                    //console.log("D2D_PUTIMAGEDATA",start, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight, this.imageData[start]);

                    let imgData:ImageData;
                    if (this.owner.isWasmModule) {
                        //console.log("D2D_PUTIMAGEDATA isWasmModule");
                        imgData=this.precomputedObjects[id] as ImageData;
                    }
                    else {  // Uint8ClampedArray doesn't support shared memory, so copy the memory
                        //console.log("D2D_PUTIMAGEDATA wasmModuleAsync");
                        const z = this.precomputedObjects[id] as {mem8:Uint8Array, width:number, height:number}; // Uint8Array
                        const ca=Uint8ClampedArray.from(z.mem8);  // shallow copy
                        imgData=new ImageData(ca, z.width, z.height);
                    }
                    
                    if (dirtyWidth==0 && dirtyHeight==0) {
                        this.ctx.putImageData(imgData, dx, dy);
                    }
                    else {
                        this.ctx.putImageData(imgData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
                    }
                }
                    break;

                case D2DType.D2D_CLOSEPATH:
                {
                    this.ctx.closePath();
                }
                    break;
                
                case D2DType.D2D_RESET:
                {
                    this.ctx.reset();
                }
                    break;

                case D2DType.D2D_CLEARRECT:
                {
                    const x=this.owner.getDouble(ins_start);
                    const y=this.owner.getDouble(ins_start+8);
                    const w=this.owner.getDouble(ins_start+16);
                    const h=this.owner.getDouble(ins_start+24);
                    this.ctx.clearRect(x, y, w, h);
                }
                    break;
                
                case D2DType.D2D_SCALE:
                {
                    const x=this.owner.getDouble(ins_start);
                    const y=this.owner.getDouble(ins_start+8);
                    this.ctx.scale(x, y);
                }
                    break;
                
                case D2DType.D2D_TRANSLATE:
                {
                    const x=this.owner.getDouble(ins_start);
                    const y=this.owner.getDouble(ins_start+8);
                    this.ctx.translate(x, y);
                }
                    break;
                case D2DType.D2D_ROTATE:
                {
                    const angle=this.owner.getDouble(ins_start);
                    this.ctx.rotate(angle);
                }
                    break;

                case D2DType.D2D_GETTRANSFORM:
                {
                    const matrix_ptr=this.owner.getLong(ins_start);
                    const transform=this.ctx.getTransform();
                    this.owner.setDouble(matrix_ptr+0, transform.a);
                    this.owner.setDouble(matrix_ptr+8, transform.b);
                    this.owner.setDouble(matrix_ptr+16, transform.c);
                    this.owner.setDouble(matrix_ptr+24, transform.d);
                    this.owner.setDouble(matrix_ptr+32, transform.e);
                    this.owner.setDouble(matrix_ptr+40, transform.f);
                }
                    break;
                
                case D2DType.D2D_SETTRANSFORM:
                {
                    const a = this.owner.getDouble(ins_start);
                    const b = this.owner.getDouble(ins_start+8);
                    const c = this.owner.getDouble(ins_start+16);
                    const d = this.owner.getDouble(ins_start+24);
                    const e = this.owner.getDouble(ins_start+32);
                    const f = this.owner.getDouble(ins_start+40);

                    this.ctx.setTransform(a, b, c, d, e, f);
                }
                    break;
                
                case D2DType.D2D_RESETTRANSFORM:
                {
                    this.ctx.resetTransform();
                }
                    break;
                
                case D2DType.D2D_STROKETEXT:
                {
                    const x=this.owner.getDouble(ins_start);
                    const y=this.owner.getDouble(ins_start+8);
                    const codePage=this.owner.getLong(ins_start+20);
                    const strPointer = this.owner.getLong(ins_start+16);
                    const str=this.owner.getString(strPointer, undefined, codePage);
    
                    this.ctx.strokeText(str, x, y);
                    // free(strPointer);
                }
                    break;
                
                case D2DType.D2D_ROUNDRECT:
                {
                    const x = this.owner.getDouble(ins_start);
                    const y = this.owner.getDouble(ins_start+8);
                    const width = this.owner.getDouble(ins_start+16);
                    const height = this.owner.getDouble(ins_start+24);
                    const radii = this.owner.getDouble(ins_start+32);

                    this.ctx.roundRect(x, y, width, height, radii);
                }
                    break;
                
                case D2DType.D2D_ELLIPSE:
                {
                    const x=this.owner.getDouble(ins_start);
                    const y=this.owner.getDouble(ins_start+8);
                    const radiusX=this.owner.getDouble(ins_start+16);
                    const radiusY=this.owner.getDouble(ins_start+24);
                    const rotation=this.owner.getDouble(ins_start+32);
                    const startAngle=this.owner.getDouble(ins_start+40);
                    const endAngle=this.owner.getDouble(ins_start+48);
                    const counterClockwise= (this.owner.getLong(ins_start+56)!=0);

                    this.ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterClockwise)
                }
                    break;
                
                case D2DType.D2D_QUADRATICCURVETO:
                {
                    const cpx = this.owner.getDouble(ins_start);
                    const cpy = this.owner.getDouble(ins_start+8);
                    const x = this.owner.getDouble(ins_start+16);
                    const y = this.owner.getDouble(ins_start+24);

                    this.ctx.quadraticCurveTo(cpx, cpy, x, y);
                }
                    break;
                
                case D2DType.D2D_SETLINEDASH:
                {
                    const segment_len = this.owner.getLong(ins_start);
                    const seg_ptr = this.owner.getLong(ins_start+4);
                    let segments = [];
                    for (let i = 0; i < segment_len; i++) {
                        segments[i] = this.owner.getDouble(seg_ptr + i*8);
                    }
                    this.ctx.setLineDash(segments);
                    // if (segment_len > 0)
                    //     free(seg_ptr);
                }
                    break;
                case D2DType.D2D_GETLINEDASH:
                {
                    const segments = this.ctx.getLineDash();

                    const buffer_length = this.owner.getLong(ins_start);
                    const buffer_ptr = this.owner.getLong(ins_start+4);
                    const segment_length_ptr = ins_start+8;

                    this.owner.setLong(segment_length_ptr, segments.length);
                    if (segments.length > 0) {
                        // const seg_list = malloc(8 * segments.length) as number;
                        // console.log("ts: ", seg_list);
                        // this.owner.setLong(seg_ptr+4, seg_list);
                        for (let i = 0; i < Math.min(segments.length, buffer_length); i++) {
                            this.owner.setDouble(buffer_ptr + i*8, segments[i]);
                        }
                        if (segments.length > buffer_length) {
                            console.log("warning: D2D_GETLINEDASH exceeded given max_length, truncating excess");
                        }
                    }
                }
                    break;
                
                case D2DType.D2D_ARCTO:
                {
                    const x1 = this.owner.getDouble(ins_start);
                    const y1 = this.owner.getDouble(ins_start+8);
                    const x2 = this.owner.getDouble(ins_start+16);
                    const y2 = this.owner.getDouble(ins_start+24);
                    const radius = this.owner.getDouble(ins_start+32);

                    this.ctx.arcTo(x1, y1, x2, y2, radius);
                }
                    break;
                
                case D2DType.D2D_GETLINEDASHLENGTH:
                {
                    this.owner.setLong(ins_start, this.ctx.getLineDash().length);
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
            ins_start = ins + ins_start_offset;
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
