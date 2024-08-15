import {twrSharedCircularBuffer} from "./twrcircular.js";
import {twrSignal} from "./twrsignal.js";
import {IConsoleCanvas, IConsoleCanvasProxy, ICanvasProps, TConsoleCanvasProxyParams, IOTypes, TConsoleMessage} from "./twrcon.js";
import {twrConsoleRegistry} from "./twrconreg.js"
import { IWasmMemoryBase } from "./twrmodmem.js";

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
    D2D_DRAWIMAGE = 52,
    D2D_RECT = 53,
    D2D_TRANSFORM = 54,
    D2D_SETLINECAP = 55,
    D2D_SETLINEJOIN = 56,
    D2D_SETLINEDASHOFFSET = 57,
    D2D_GETIMAGEDATA = 58,
    D2D_IMAGEDATATOC = 59,
    D2D_GETCANVASPROPDOUBLE = 60,
    D2D_GETCANVASPROPSTRING = 61,
    D2D_SETCANVASPROPDOUBLE = 62,
    D2D_SETCANVASPROPSTRING = 63,
}

export class twrConsoleCanvas implements IConsoleCanvas {
   ctx:CanvasRenderingContext2D;
   id:number;
   element:HTMLCanvasElement
   props:ICanvasProps;
   cmdCompleteSignal?:twrSignal;
   canvasKeys?: twrSharedCircularBuffer;
   returnValue?: twrSharedCircularBuffer;
   isAsyncMod:boolean;
   precomputedObjects: {  [index: number]: 
      (ImageData | 
      {mem8:Uint8Array, width:number, height:number})  |
      CanvasGradient |
      HTMLImageElement
   };

   constructor(element:HTMLCanvasElement) {
      this.isAsyncMod=false; // set to true if getProxyParams called

      this.precomputedObjects={};

      if (!(element && element instanceof HTMLCanvasElement && element.getContext)) 
         throw new Error("Invalid HTMLCanvasElement parameter in twrConsoleCanvas constructor ");

      this.element=element;

      const c=element.getContext("2d");
      if (!c) throw new Error("Canvas 2D context not found.");
      this.ctx=c;

      // these two lines are for backwards compatibility with prior version of twr-wasm
      c.font = "16 px Courier New";
      c.textBaseline="top";

      this.props = {canvasHeight: element.height, canvasWidth: element.width, type: IOTypes.CANVAS2D}; 
      this.id=twrConsoleRegistry.registerConsole(this);
   }

   // these are the parameters needed to create a twrConsoleCanvasProxy, paired to us
   getProxyParams() : TConsoleCanvasProxyParams {
      this.cmdCompleteSignal=new twrSignal();
      this.canvasKeys = new twrSharedCircularBuffer();  // tsconfig, lib must be set to 2017 or higher
      this.returnValue = new twrSharedCircularBuffer();
      this.isAsyncMod=true;
      return ["twrConsoleCanvasProxy", this.id, this.props, this.cmdCompleteSignal.sharedArray, this.canvasKeys.sharedArray, this.returnValue.sharedArray];
   }

    getProp(name:keyof ICanvasProps): number {
      return this.props[name];
   }

   // process messages sent from twrConsoleCanvasProxy
   // these are used to "remote procedure call" from the worker thread to the JS Main thread
   processMessage(msg:TConsoleMessage, wasmMem:IWasmMemoryBase) {
      const [msgClass, id, msgType, ...params] = msg;
      if (id!=this.id) throw new Error("internal error");  // should never happen

      switch (msgType) {
         case "canvas2d-drawseq":
         {
            const [ds] =  params;
            this.drawSeq(ds, wasmMem);
            break;
         }
         case "canvas2d-loadimage":
        {
            const [urlPtr, id] = params;
            this.loadImage(urlPtr, id, wasmMem);
            break;
        }

         default:
            throw new Error("internal error");  // should never happen
      }
   }

   private loadImage(urlPtr: number, id: number, wasmMem: IWasmMemoryBase) {
        const url = wasmMem.getString(urlPtr);
        if ( id in this.precomputedObjects ) console.log("warning: D2D_LOADIMAGE ID already exists.");
        
        const img = new Image();
        const errorMsg = "`private loadImage` either has an internal error or is being misused";
        img.onload = () => {
            if (this.returnValue) {
                this.returnValue.write(1);
            }
            else throw new Error(errorMsg);
        };
        img.onerror = () => {
            if (this.returnValue) {
                console.log("Warning: D2D_LOADIMAGE: failed to load image " + url);
                this.returnValue.write(0);
            } 
            else throw new Error(errorMsg);
        }

        img.src = url;

        this.precomputedObjects[id] = img;
   }

   /* see draw2d.h for structs that match */
   drawSeq(ds:number, wasmMem:IWasmMemoryBase) {
      //console.log("twr::Canvas enter drawSeq");
      if (!this.ctx) return;
        const insHdrSize = 16;
        let currentInsHdr=wasmMem.getLong(ds);  /* ds->start */
        const lastInsHdr=wasmMem.getLong(ds+4);  /* ds->last */
        let currentInsParams = currentInsHdr + insHdrSize;
        //console.log("instruction start, last ",ins.toString(16), lastins.toString(16));

        let nextInsHdr:number;
        //let insCount=0;
        
        while (1) {

         //insCount++;

            const type:D2DType=wasmMem.getLong(currentInsHdr+4);    /* hdr->type */
            if (0/*type!=D2DType.D2D_FILLRECT*/) {
                console.log("ins",currentInsHdr)
                console.log("hdr.next",wasmMem.mem8[currentInsHdr],wasmMem.mem8[currentInsHdr+1],wasmMem.mem8[currentInsHdr+2],wasmMem.mem8[currentInsHdr+3]);
                console.log("hdr.type",wasmMem.mem8[currentInsHdr+4],wasmMem.mem8[currentInsHdr+5]);
                console.log("next 4 bytes", wasmMem.mem8[currentInsHdr+6],wasmMem.mem8[currentInsHdr+7],wasmMem.mem8[currentInsHdr+8],wasmMem.mem8[currentInsHdr+9]);
                console.log("and 4 more ", wasmMem.mem8[currentInsHdr+10],wasmMem.mem8[currentInsHdr+11],wasmMem.mem8[currentInsHdr+12],wasmMem.mem8[currentInsHdr+13]);
                //console.log("ins, type, next is ", ins.toString(16), type.toString(16), next.toString(16));
             }
            switch (type) {
               case D2DType.D2D_FILLRECT:
               {
                  const x=wasmMem.getDouble(currentInsParams);
                  const y=wasmMem.getDouble(currentInsParams+8);
                  const w=wasmMem.getDouble(currentInsParams+16);
                  const h=wasmMem.getDouble(currentInsParams+24);
                  this.ctx.fillRect(x, y, w, h);
               }
                  break;

               case D2DType.D2D_STROKERECT:
               {
                  const x=wasmMem.getDouble(currentInsParams);
                  const y=wasmMem.getDouble(currentInsParams+8);
                  const w=wasmMem.getDouble(currentInsParams+16);
                  const h=wasmMem.getDouble(currentInsParams+24);
                  this.ctx.strokeRect(x, y, w, h);
               }
                  break;

               case D2DType.D2D_FILLCODEPOINT:
               {
                  const x=wasmMem.getDouble(currentInsParams);
                  const y=wasmMem.getDouble(currentInsParams+8);
                  const c=wasmMem.getLong(currentInsParams+16);
                  let txt=String.fromCodePoint(c);
                  this.ctx.fillText(txt, x, y);
               }
                  break;

               
               case D2DType.D2D_FILLTEXT:
               {
                  const x=wasmMem.getDouble(currentInsParams);
                  const y=wasmMem.getDouble(currentInsParams+8);
                  const codePage=wasmMem.getLong(currentInsParams+20);
                  const strPointer = wasmMem.getLong(currentInsParams+16);
                  const str=wasmMem.getString(strPointer, undefined, codePage);

                  //console.log("filltext ",x,y,str)
   
                  this.ctx.fillText(str, x, y);
               }
                  break;

               case D2DType.D2D_MEASURETEXT:
               {
                  const codePage=wasmMem.getLong(currentInsParams+8);
                  const str=wasmMem.getString(wasmMem.getLong(currentInsParams), undefined, codePage);
                  const tmidx=wasmMem.getLong(currentInsParams+4);
   
                  const tm=this.ctx.measureText(str);
                  wasmMem.setDouble(tmidx+0, tm.actualBoundingBoxAscent);
                  wasmMem.setDouble(tmidx+8, tm.actualBoundingBoxDescent);
                  wasmMem.setDouble(tmidx+16, tm.actualBoundingBoxLeft);
                  wasmMem.setDouble(tmidx+24, tm.actualBoundingBoxRight);
                  wasmMem.setDouble(tmidx+32, tm.fontBoundingBoxAscent);
                  wasmMem.setDouble(tmidx+40, tm.fontBoundingBoxDescent);
                  wasmMem.setDouble(tmidx+48, tm.width);
               }
                  break;

               case D2DType.D2D_SETFONT:
               {
                  const fontPointer = wasmMem.getLong(currentInsParams);
                  const str=wasmMem.getString(fontPointer);
                  this.ctx.font=str;
               }
                  break;

               case D2DType.D2D_SETFILLSTYLERGBA:
               {
                  const color=wasmMem.getLong(currentInsParams); 
                  const cssColor= "#"+("00000000" + color.toString(16)).slice(-8);
                  this.ctx.fillStyle = cssColor;
                  //console.log("fillstyle: ", this.ctx.fillStyle, ":", cssColor,":", color)
               }
                  break;

               case D2DType.D2D_SETSTROKESTYLERGBA:
               {
                  const color=wasmMem.getLong(currentInsParams); 
                  const cssColor= "#"+("00000000" + color.toString(16)).slice(-8);
                  this.ctx.strokeStyle = cssColor;
               }
                  break;

               case D2DType.D2D_SETFILLSTYLE:
               {
                  const cssColorPointer = wasmMem.getLong(currentInsParams);
                  const cssColor= wasmMem.getString(cssColorPointer);
                  this.ctx.fillStyle = cssColor;
               }
                  break

               case D2DType.D2D_SETSTROKESTYLE:
               {
                  const cssColorPointer = wasmMem.getLong(currentInsParams);
                  const cssColor= wasmMem.getString(cssColorPointer);
                  this.ctx.strokeStyle = cssColor;
               }
                  break

               case D2DType.D2D_SETLINEWIDTH:
               {
                  const width=wasmMem.getDouble(currentInsParams);  
                  this.ctx.lineWidth=width;
                  //console.log("twrCanvas D2D_SETLINEWIDTH: ", this.ctx.lineWidth);
               }
                  break;

               case D2DType.D2D_MOVETO:
               {
                  const x=wasmMem.getDouble(currentInsParams);
                  const y=wasmMem.getDouble(currentInsParams+8);
                  this.ctx.moveTo(x, y);
               }
                  break;

               case D2DType.D2D_LINETO:
               {
                  const x=wasmMem.getDouble(currentInsParams);
                  const y=wasmMem.getDouble(currentInsParams+8);
                  this.ctx.lineTo(x, y);
               }
                  break;

               case D2DType.D2D_BEZIERTO:
               {
                  const cp1x=wasmMem.getDouble(currentInsParams);
                  const cp1y=wasmMem.getDouble(currentInsParams+8);
                  const cp2x=wasmMem.getDouble(currentInsParams+16);
                  const cp2y=wasmMem.getDouble(currentInsParams+24);
                  const x=wasmMem.getDouble(currentInsParams+32);
                  const y=wasmMem.getDouble(currentInsParams+40);
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
                  const x=wasmMem.getDouble(currentInsParams);
                  const y=wasmMem.getDouble(currentInsParams+8);
                  const radius=wasmMem.getDouble(currentInsParams+16);
                  const startAngle=wasmMem.getDouble(currentInsParams+24);
                  const endAngle=wasmMem.getDouble(currentInsParams+32);
                  const counterClockwise= (wasmMem.getLong(currentInsParams+40)!=0);

                  this.ctx.arc(x, y, radius, startAngle, endAngle, counterClockwise)
               }
                  break;

               case D2DType.D2D_IMAGEDATA:
               {
                  const start=wasmMem.getLong(currentInsParams);
                  const length=wasmMem.getLong(currentInsParams+4);
                  const width=wasmMem.getLong(currentInsParams+8);
                  const height=wasmMem.getLong(currentInsParams+12);
                  const id=wasmMem.getLong(currentInsParams+16);

                  if ( id in this.precomputedObjects ) console.log("warning: D2D_IMAGEDATA ID already exists.");

                  if (this.isAsyncMod) {  // Uint8ClampedArray doesn't support shared memory
                     this.precomputedObjects[id]={mem8: new Uint8Array(wasmMem.memory!.buffer, start, length), width:width, height:height};
                  }
                  else {
                     const z = new Uint8ClampedArray(wasmMem.memory!.buffer, start, length);
                     this.precomputedObjects[id]=new ImageData(z, width, height);
                  }
               }
                  break;

               case D2DType.D2D_CREATERADIALGRADIENT:
               {
                  const x0=wasmMem.getDouble(currentInsParams);
                  const y0=wasmMem.getDouble(currentInsParams+8);
                  const radius0=wasmMem.getDouble(currentInsParams+16);
                  const x1=wasmMem.getDouble(currentInsParams+24);
                  const y1=wasmMem.getDouble(currentInsParams+32);
                  const radius1=wasmMem.getDouble(currentInsParams+40);
                  const id= wasmMem.getLong(currentInsParams+48);

               let gradient=this.ctx.createRadialGradient(x0, y0, radius0, x1, y1, radius1);
               if ( id in this.precomputedObjects ) console.log("warning: D2D_CREATERADIALGRADIENT ID already exists.");
               this.precomputedObjects[id] = gradient;
               }
                  break

               case D2DType.D2D_CREATELINEARGRADIENT:
               {
                  const x0=wasmMem.getDouble(currentInsParams);
                  const y0=wasmMem.getDouble(currentInsParams+8);
                  const x1=wasmMem.getDouble(currentInsParams+16);
                  const y1=wasmMem.getDouble(currentInsParams+24);
                  const id= wasmMem.getLong(currentInsParams+32);

                  let gradient=this.ctx.createLinearGradient(x0, y0, x1, y1);
                  if ( id in this.precomputedObjects ) console.log("warning: D2D_CREATELINEARGRADIENT ID already exists.");
                  this.precomputedObjects[id] = gradient;
               }
                     break

               case D2DType.D2D_SETCOLORSTOP:
               {
                  const id = wasmMem.getLong(currentInsParams);
                  const pos=wasmMem.getLong(currentInsParams+4);
                  const cssColorPointer = wasmMem.getLong(currentInsParams+8);
                  const cssColor= wasmMem.getString(cssColorPointer);

                  if (!(id in this.precomputedObjects)) throw new Error("D2D_SETCOLORSTOP with invalid ID: "+id);
                  const gradient=this.precomputedObjects[id] as CanvasGradient;
                  gradient.addColorStop(pos, cssColor);

               }
                  break

               case D2DType.D2D_SETFILLSTYLEGRADIENT:
               {
                  const id=wasmMem.getLong(currentInsParams);
                  if (!(id in this.precomputedObjects)) throw new Error("D2D_SETFILLSTYLEGRADIENT with invalid ID: "+id);
                  const gradient=this.precomputedObjects[id] as CanvasGradient;
                  this.ctx.fillStyle=gradient;
               }
                  break

               case D2DType.D2D_RELEASEID:
               {
                  const id=wasmMem.getLong(currentInsParams);
                  if (this.precomputedObjects[id])
                     delete this.precomputedObjects[id];
                  else
                     console.log("warning: D2D_RELEASEID with undefined ID ",id);
               }
                  break

               

               case D2DType.D2D_PUTIMAGEDATA:
               {
                  const id=wasmMem.getLong(currentInsParams);
                  const dx=wasmMem.getLong(currentInsParams+4);
                  const dy=wasmMem.getLong(currentInsParams+8);
                  const dirtyX=wasmMem.getLong(currentInsParams+12);
                  const dirtyY=wasmMem.getLong(currentInsParams+16);
                  const dirtyWidth=wasmMem.getLong(currentInsParams+20);
                  const dirtyHeight=wasmMem.getLong(currentInsParams+24);

                  if (!(id in this.precomputedObjects)) throw new Error("D2D_PUTIMAGEDATA with invalid ID: "+id);

                  //console.log("D2D_PUTIMAGEDATA",start, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight, this.imageData[start]);

                  let imgData:ImageData;
      
                  if (this.isAsyncMod) {  // Uint8ClampedArray doesn't support shared memory, so copy the memory
                     //console.log("D2D_PUTIMAGEDATA wasmModuleAsync");
                     const z = this.precomputedObjects[id] as {mem8:Uint8Array, width:number, height:number}; // Uint8Array
                     const ca=Uint8ClampedArray.from(z.mem8);  // shallow copy
                     imgData=new ImageData(ca, z.width, z.height);
                  }
                  else  {
                     imgData=this.precomputedObjects[id] as ImageData;
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
                  const x=wasmMem.getDouble(currentInsParams);
                  const y=wasmMem.getDouble(currentInsParams+8);
                  const w=wasmMem.getDouble(currentInsParams+16);
                  const h=wasmMem.getDouble(currentInsParams+24);
                  this.ctx.clearRect(x, y, w, h);
               }
                  break;
               
               case D2DType.D2D_SCALE:
               {
                  const x=wasmMem.getDouble(currentInsParams);
                  const y=wasmMem.getDouble(currentInsParams+8);
                  this.ctx.scale(x, y);
               }
                  break;
               
               case D2DType.D2D_TRANSLATE:
               {
                  const x=wasmMem.getDouble(currentInsParams);
                  const y=wasmMem.getDouble(currentInsParams+8);
                  this.ctx.translate(x, y);
               }
                  break;
                  
               case D2DType.D2D_ROTATE:
               {
                  const angle=wasmMem.getDouble(currentInsParams);
                  this.ctx.rotate(angle);
               }
                  break;

               case D2DType.D2D_GETTRANSFORM:
               {
                  const matrix_ptr=wasmMem.getLong(currentInsParams);
                  const transform=this.ctx.getTransform();
                  wasmMem.setDouble(matrix_ptr+0, transform.a);
                  wasmMem.setDouble(matrix_ptr+8, transform.b);
                  wasmMem.setDouble(matrix_ptr+16, transform.c);
                  wasmMem.setDouble(matrix_ptr+24, transform.d);
                  wasmMem.setDouble(matrix_ptr+32, transform.e);
                  wasmMem.setDouble(matrix_ptr+40, transform.f);
               }
                  break;
               
               case D2DType.D2D_SETTRANSFORM:
               {
                  const a = wasmMem.getDouble(currentInsParams);
                  const b = wasmMem.getDouble(currentInsParams+8);
                  const c = wasmMem.getDouble(currentInsParams+16);
                  const d = wasmMem.getDouble(currentInsParams+24);
                  const e = wasmMem.getDouble(currentInsParams+32);
                  const f = wasmMem.getDouble(currentInsParams+40);

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
                  const x=wasmMem.getDouble(currentInsParams);
                  const y=wasmMem.getDouble(currentInsParams+8);
                  const codePage=wasmMem.getLong(currentInsParams+20);
                  const strPointer = wasmMem.getLong(currentInsParams+16);
                  const str=wasmMem.getString(strPointer, undefined, codePage);
   
                  this.ctx.strokeText(str, x, y);
               }
                  break;
               
               case D2DType.D2D_ROUNDRECT:
               {
                  const x = wasmMem.getDouble(currentInsParams);
                  const y = wasmMem.getDouble(currentInsParams+8);
                  const width = wasmMem.getDouble(currentInsParams+16);
                  const height = wasmMem.getDouble(currentInsParams+24);
                  const radii = wasmMem.getDouble(currentInsParams+32);

                  this.ctx.roundRect(x, y, width, height, radii);
               }
                  break;
               
               case D2DType.D2D_ELLIPSE:
               {
                  const x=wasmMem.getDouble(currentInsParams);
                  const y=wasmMem.getDouble(currentInsParams+8);
                  const radiusX=wasmMem.getDouble(currentInsParams+16);
                  const radiusY=wasmMem.getDouble(currentInsParams+24);
                  const rotation=wasmMem.getDouble(currentInsParams+32);
                  const startAngle=wasmMem.getDouble(currentInsParams+40);
                  const endAngle=wasmMem.getDouble(currentInsParams+48);
                  const counterClockwise= (wasmMem.getLong(currentInsParams+56)!=0);

                  this.ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterClockwise)
               }
                  break;
               
               case D2DType.D2D_QUADRATICCURVETO:
               {
                  const cpx = wasmMem.getDouble(currentInsParams);
                  const cpy = wasmMem.getDouble(currentInsParams+8);
                  const x = wasmMem.getDouble(currentInsParams+16);
                  const y = wasmMem.getDouble(currentInsParams+24);

                  this.ctx.quadraticCurveTo(cpx, cpy, x, y);
               }
                  break;
               
               case D2DType.D2D_SETLINEDASH:
               {
                  const segment_len = wasmMem.getLong(currentInsParams);
                  const seg_ptr = wasmMem.getLong(currentInsParams+4);
                  let segments = [];
                  for (let i = 0; i < segment_len; i++) {
                     segments[i] = wasmMem.getDouble(seg_ptr + i*8);
                  }
                  this.ctx.setLineDash(segments);
               }
                  break;

               case D2DType.D2D_GETLINEDASH:
               {
                  const segments = this.ctx.getLineDash();

                  const buffer_length = wasmMem.getLong(currentInsParams);
                  const buffer_ptr = wasmMem.getLong(currentInsParams+4);
                  const segment_length_ptr = currentInsParams+8;

                  wasmMem.setLong(segment_length_ptr, segments.length);
                  if (segments.length > 0) {
                     for (let i = 0; i < Math.min(segments.length, buffer_length); i++) {
                           wasmMem.setDouble(buffer_ptr + i*8, segments[i]);
                     }
                     if (segments.length > buffer_length) {
                           console.log("warning: D2D_GETLINEDASH exceeded given max_length, truncating excess");
                     }
                  }
               }
                  break;
               
               case D2DType.D2D_ARCTO:
               {
                  const x1 = wasmMem.getDouble(currentInsParams);
                  const y1 = wasmMem.getDouble(currentInsParams+8);
                  const x2 = wasmMem.getDouble(currentInsParams+16);
                  const y2 = wasmMem.getDouble(currentInsParams+24);
                  const radius = wasmMem.getDouble(currentInsParams+32);

                  this.ctx.arcTo(x1, y1, x2, y2, radius);
               }
                  break;
               
               case D2DType.D2D_GETLINEDASHLENGTH:
               {
                  wasmMem.setLong(currentInsParams, this.ctx.getLineDash().length);
               }
                  break;
               
               case D2DType.D2D_DRAWIMAGE:
               {
                  const dx = wasmMem.getDouble(currentInsParams);
                  const dy = wasmMem.getDouble(currentInsParams+8);
                  const id = wasmMem.getLong(currentInsParams+16);

                  if (!(id in this.precomputedObjects)) throw new Error("D2D_DRAWIMAGE with invalid ID: "+id);

                  let img = this.precomputedObjects[id] as HTMLImageElement;
                  this.ctx.drawImage(img, dx, dy);
               }
                  break;
               
               case D2DType.D2D_RECT:
               {
                  const x = wasmMem.getDouble(currentInsParams);
                  const y = wasmMem.getDouble(currentInsParams+8);
                  const width = wasmMem.getDouble(currentInsParams+16);
                  const height = wasmMem.getDouble(currentInsParams+24);

                  this.ctx.rect(x, y, width, height);
               }
                  break;
               
               case D2DType.D2D_TRANSFORM:
               {
                  const a = wasmMem.getDouble(currentInsParams);
                  const b = wasmMem.getDouble(currentInsParams+8);
                  const c = wasmMem.getDouble(currentInsParams+16);
                  const d = wasmMem.getDouble(currentInsParams+24);
                  const e = wasmMem.getDouble(currentInsParams+32);
                  const f = wasmMem.getDouble(currentInsParams+40);

                  this.ctx.transform(a, b, c, d, e, f);
               }
                  break;
               
               case D2DType.D2D_SETLINECAP:
               {
                  const lineCapPtr = wasmMem.getLong(currentInsParams);
                  const lineCap = wasmMem.getString(lineCapPtr);

                  this.ctx.lineCap = lineCap as CanvasLineCap;
               }
                  break;

               case D2DType.D2D_SETLINEJOIN:
               {
                  const lineJoinPtr = wasmMem.getLong(currentInsParams);
                  const lineJoin = wasmMem.getString(lineJoinPtr);

                  this.ctx.lineJoin = lineJoin as CanvasLineJoin;
               }
                  break;
               
               case D2DType.D2D_SETLINEDASHOFFSET:
               {
                  const lineDashOffset = wasmMem.getDouble(currentInsParams);

                  this.ctx.lineDashOffset = lineDashOffset;
               }
                  break;
               
               case D2DType.D2D_GETIMAGEDATA:
               {
                  const x = wasmMem.getDouble(currentInsParams);
                  const y = wasmMem.getDouble(currentInsParams+8);
                  const width = wasmMem.getDouble(currentInsParams+16);
                  const height = wasmMem.getDouble(currentInsParams+24);
                  const id = wasmMem.getLong(currentInsParams+32);
                  
                  const imgData = this.ctx.getImageData(x, y, width, height);

                  if ( id in this.precomputedObjects ) console.log("warning: D2D_GETIMAGEDATA ID already exists.");
                  this.precomputedObjects[id] = imgData;

                  // const memPtr = wasmMem.getLong(currentInsParams+32);
                  // const memLen = wasmMem.getLong(currentInsParams+36);

                  // let imgData = this.ctx.getImageData(x, y, width, height);
                  // const imgLen = imgData.data.byteLength;
                  // if (imgLen > memLen) console.log("Warning: D2D_GETIMAGEDATA was given a buffer smaller than the image size! Extra data is being truncated");
                  // owner.mem8.set(imgData.data.slice(0, Math.min(memLen, imgLen)), memPtr);
               }
                  break;

               case D2DType.D2D_IMAGEDATATOC:
               {
                  const bufferPtr = wasmMem.getLong(currentInsParams);
                  const bufferLen = wasmMem.getLong(currentInsParams+4);
                  const id = wasmMem.getLong(currentInsParams+8);

                  if (!(id in this.precomputedObjects)) throw new Error("D2D_IMAGEDATATOC with invalid ID: "+id);

                  const img = this.precomputedObjects[id] as ImageData;
                  const imgLen = img.data.byteLength;
                  if (imgLen > bufferLen) console.log("Warning: D2D_IMAGEDATATOC was given a buffer smaller than the image size! Extra data is being truncated");
                  wasmMem.mem8.set(img.data.slice(0, Math.min(bufferLen, imgLen)), bufferPtr);
               }
                  break;
               
               case D2DType.D2D_GETCANVASPROPDOUBLE:
               {
                  const valPtr = owner.getLong(currentInsParams);
                  const namePtr = owner.getLong(currentInsParams+4);

                  const propName = owner.getString(namePtr);
                  
                  const val = (this.ctx as {[key: string]: any})[propName];
                  if (typeof val != "number") throw new Error("D2D_GETCANVASPROPDOUBLE with property " + propName + " expected a number, got " + (typeof val) + "!");
                  owner.setDouble(valPtr, val);
               }
                  break;
               
               case D2DType.D2D_GETCANVASPROPSTRING:
               {
                  const valPtr = owner.getLong(currentInsParams);
                  const valMaxLen = owner.getLong(currentInsParams+4);
                  const namePtr = owner.getLong(currentInsParams+8);

                  const propName = owner.getString(namePtr);

                  const val = (this.ctx as {[key: string]: any})[propName];
                  if (typeof val != "string") throw new Error("D2D_GETCANVASPROPSTRING with property " + propName + " expected a string, got " + (typeof val) + "!");
                  
                  const encodedVal = owner.stringToU8(val as string);
                  if (encodedVal.byteLength >= valMaxLen) console.log("Warning: D2D_GETCANVASPROPSTRING was given a buffer smaller than the return value! The extra data is being truncated!");
                  
                  const strLen = Math.min(encodedVal.byteLength, valMaxLen-1); //-1 from valMaxLen for null character
                  owner.mem8.set(encodedVal.slice(0, strLen), valPtr);
                  owner.mem8[strLen + valPtr] = 0; //ensure the null character gets set
               }
                  break;
               
               case D2DType.D2D_SETCANVASPROPDOUBLE:
               {
                  const val = owner.getDouble(currentInsParams);
                  const namePtr = owner.getLong(currentInsParams+8);

                  const propName = owner.getString(namePtr);

                  const prevVal = (this.ctx as {[key: string]: any})[propName];
                  if (typeof prevVal != "number") throw new Error("D2D_SETCANVASPROPDOUBLE with property " + propName + " expected a number, got " + (typeof prevVal) + "!");
                  
                  (this.ctx as {[key: string]: any})[propName] = val;
               }
               break;

               case D2DType.D2D_SETCANVASPROPSTRING:
               {
                  const valPtr = owner.getLong(currentInsParams);
                  const namePtr = owner.getLong(currentInsParams+4);

                  const val = owner.getString(valPtr);
                  const propName = owner.getString(namePtr);

                  const prevVal = (this.ctx as {[key: string]: any})[propName];
                  if (typeof prevVal != "string") throw new Error("D2D_SETCANVASPROPSTRING with property " + propName + " expected a string, got " + (typeof prevVal) + "!");

                  (this.ctx as {[key: string]: any})[propName] = val;
               }
               break;
               
               default:
                  throw new Error ("unimplemented or unknown Sequence Type in drawSeq: "+type);
            }
            nextInsHdr=wasmMem.getLong(currentInsHdr);  /* hdr->next */
            if (nextInsHdr==0) {
                if (currentInsHdr!=lastInsHdr) throw new Error("assert type error in twrcanvas, ins!=lastins");
                break;
            }
            currentInsHdr=nextInsHdr;
            currentInsParams = currentInsHdr + insHdrSize;
        }

      if (this.cmdCompleteSignal) this.cmdCompleteSignal.signal();
      //console.log("Canvas.drawSeq() completed  with instruction count of ", insCount);
   }
}

export class twrConsoleCanvasProxy implements IConsoleCanvasProxy {
   canvasKeys: twrSharedCircularBuffer;
   drawCompleteSignal:twrSignal;
   props: ICanvasProps;
   id:number;
   returnValue: twrSharedCircularBuffer;

   constructor(params:TConsoleCanvasProxyParams) {
      const [className, id, props, signalBuffer,  canvasKeysBuffer, returnBuffer] = params;
      this.drawCompleteSignal = new twrSignal(signalBuffer);
      this.canvasKeys = new twrSharedCircularBuffer(canvasKeysBuffer);
      this.returnValue = new twrSharedCircularBuffer(returnBuffer);
      this.props=props;
      this.id=id;

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

   // note that this implementation does not allow a property to change post creation of an instance of this class
   getProp(propName:keyof ICanvasProps): number {
      return this.props[propName];
   }

   drawSeq(ds:number) {
      this.drawCompleteSignal.reset();
      postMessage(["twrConsole", this.id, "canvas2d-drawseq", ds]);
      this.drawCompleteSignal.wait();
   }

   loadImage(urlPtr: number, imgId: number): number {
    postMessage(["twrConsole", this.id, "canvas2d-loadimage", urlPtr, imgId]);
    return this.returnValue.readWait();
   }
}
