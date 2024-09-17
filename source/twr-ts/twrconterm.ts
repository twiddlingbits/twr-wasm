import {twrCodePageToUnicodeCodePoint, codePageUTF32} from "./twrliblocale.js"
import {IConsoleTerminal, IConsoleTerminalProps, IConsoleTerminalParams, keyEventToCodePoint} from "./twrcon.js"
import {IOTypes} from "./twrcon.js"
import {IWasmModuleAsync} from "./twrmodasync.js";
import {IWasmModule} from "./twrmod.js"
import {twrLibrary, TLibImports, twrLibraryInstanceRegistry} from "./twrlibrary.js";

const TRS80_GRAPHIC_MARKER=0xE000;
const TRS80_GRAPHIC_MARKER_MASK=0xFF00;
const TRS80_GRAPHIC_CHAR_MASK=0x003F;    // would be 0xC0 if we included the graphics marker bit 0x80

// Term Canvas have a size that will be set based on the character width x height.
// The display size for a canvas is set in the HTML/JS like this:
//    canvas.style.width = "700px";
//    canvas.style.height = "500px";


export class twrConsoleTerminal extends twrLibrary implements IConsoleTerminal  {
   id:number;
   element:HTMLElement;
   ctx:CanvasRenderingContext2D;
   props:IConsoleTerminalProps;
   size:number;
   cellWidth:number;
   cellHeight:number;
   cellW1:number;
   cellW2:number; 
   cellH1:number;
   cellH2:number;
   cellH3:number;
   isCursorVisible:boolean;
   videoMem: number[];
   foreColorMem: number[];
   backColorMem: number[];
	cpTranslate:twrCodePageToUnicodeCodePoint;
   keyBuffer:KeyboardEvent[]=[];
   keyWaiting?:(key:number)=>void;

   imports:TLibImports = {
      twrConCharOut:{noBlock:true},
      twrConGetProp:{},
      twrConPutStr:{noBlock:true},
      twrConCharIn:{isAsyncFunction: true, isModuleAsyncOnly: true},
      twrConSetFocus:{noBlock:true},
      twrConSetC32:{noBlock:true},
      twrConCls:{noBlock:true},
      twrConSetRange:{noBlock:true},
      twrConSetReset:{noBlock:true},
      twrConPoint:{},
      twrConSetCursor:{noBlock:true},
      twrConSetCursorXY:{noBlock:true},
      twrConSetColors:{noBlock:true},
   };

   libSourcePath = new URL(import.meta.url).pathname;
   interfaceName = "twrConsole";

    constructor (canvasElement:HTMLCanvasElement, params:IConsoleTerminalParams={}) {
      // all library constructors should start with these two lines
      super();
      this.id=twrLibraryInstanceRegistry.register(this);
  
      const {foreColor="white", backColor="black", fontSize=16, widthInChars=80, heightInChars=25} = params; 

      // canvasElement is where we will draw the terminal
      this.element=canvasElement;

      if (!(canvasElement && canvasElement instanceof HTMLCanvasElement && canvasElement.getContext)) 
         throw new Error("Invalid HTMLCanvasElement parameter in twrConsoleTerminal constructor ");

      let c=canvasElement.getContext("2d");
      if (!c) throw new Error("canvasElement.getContext('2d') failed");

      c.font = fontSize.toString()+"px Courier New";
      c.textBaseline="top";
      const sampleText="          ";
      //const sampleText=String.fromCharCode(2593).repeat(6);   // this shaded block is typically full width in a font
      const tm=c.measureText(sampleText);
      const charWidth=Math.ceil(tm.width / sampleText.length);   // ceil rounds up (eg .9 -> 1)
      let fM = c.measureText("X"); 
      const charHeight = Math.ceil(fM.fontBoundingBoxAscent + fM.fontBoundingBoxDescent);

      canvasElement.width=charWidth*widthInChars;
      canvasElement.height=charHeight*heightInChars;

      const canvasHeight=canvasElement.height;
      const canvasWidth=canvasElement.width;
      //console.log("this.props.canvasHeight, this.props.canvasWidth",this.props.canvasHeight,this.props.canvasWidth);

      // reset after dims changed.  Not sure if ctx is needed to reset, but others do
      let c2=canvasElement.getContext("2d");
      if (!c2) throw new Error("canvas 2D context not found in twrCanvas.constructor (2nd time)");
      this.ctx=c2;
      this.ctx.font = fontSize.toString()+"px Courier New";
      this.ctx.textBaseline="top";

      c2.fillStyle=backColor;
      const backColorAsRGB=Number("0x"+c2.fillStyle.slice(1));

      c2.fillStyle=foreColor;
      const foreColorAsRGB=Number("0x"+c2.fillStyle.slice(1));

      const cursorPos=0;
      const type=IOTypes.CHARWRITE|IOTypes.CHARREAD|IOTypes.ADDRESSABLE_DISPLAY;

      this.props={type, cursorPos, foreColorAsRGB, backColorAsRGB, fontSize, widthInChars, heightInChars, canvasHeight, canvasWidth, charWidth, charHeight};

      this.isCursorVisible=false;
      this.size=this.props.widthInChars*this.props.heightInChars;
      this.videoMem=new Array(this.size);
      this.foreColorMem=new Array(this.size);
      this.backColorMem=new Array(this.size);

      this.cellWidth = this.props.charWidth;
      this.cellHeight = this.props.charHeight;
      if (this.cellWidth<=0) throw new Error("invalid cellWidth");
      if (this.cellHeight<=0) throw new Error("invalid cellHeight");
   
      // Calc each cell separately to avoid rounding errors
      this.cellW1 = Math.floor(this.cellWidth / 2);  
      this.cellW2 = this.cellWidth - this.cellW1;  
      this.cellH1 = Math.floor(this.cellHeight / 3);
      this.cellH2 = this.cellH1;
      this.cellH3 = this.cellHeight - this.cellH1 - this.cellH2;

		this.twrConCls();

		this.cpTranslate=new twrCodePageToUnicodeCodePoint();
   }

   getProp(propName: string): number {
      return this.props[propName];
   }
   
   twrConGetProp(callingMod:IWasmModule|IWasmModuleAsync, pn:number):number {
      const propName=callingMod.wasmMem.getString(pn);
      return this.getProp(propName);
   }

   keyDown(ev:KeyboardEvent)  {
      if (this.keyWaiting) {
         const r=keyEventToCodePoint(ev);
         if (r) {
            this.keyWaiting(r);
            this.keyWaiting=undefined;
         }
      }
      else {
         this.keyBuffer.push(ev);
      }
   }

   private RGB_TO_RGBA(x:number) {
      return  ((x)<<8) | 0xFF;  // JavaScript uses 32-bit signed integers for bitwise operations, which means the leftmost bit is the sign bit. 
   }

   private eraseLine()
   {
      for (let i=this.props.cursorPos; i < Math.floor(this.props.cursorPos/this.props.widthInChars)*this.props.widthInChars+this.props.widthInChars; i++)
         this.setC32(i, " ");
   }
      
   twrConCharOut(callingMod:any, c:number, codePage:number)
   {

      const c32=this.cpTranslate.convert(c, codePage);
      if (c32===0) return;

      this.charOut(String.fromCodePoint(c32));
   }

   charOut(c32:string) {

      if (c32.length>1) 
         throw new Error("charOut takes an empty or single char string");
      
      if (c32==="\n")	// newline
      {
         if (this.isCursorVisible)
            this.setC32(this.props.cursorPos, " ");
         
         this.props.cursorPos = Math.floor(this.props.cursorPos/this.props.widthInChars);
         this.props.cursorPos = this.props.cursorPos*this.props.widthInChars;
         this.props.cursorPos = this.props.cursorPos + this.props.widthInChars;
         
         /* if return put us on a new line that isn't a scroll, erase the line */
         if (this.props.cursorPos < this.size)	
            this.eraseLine();
      }
      else if (c32==="\x08")	// backspace
      {
         if (this.props.cursorPos > 0)
         {
            if (this.isCursorVisible)
               this.setC32(this.props.cursorPos, " ");
            this.props.cursorPos--;
            this.setC32(this.props.cursorPos, " ");
         }
      }
      else if (c32==="\x0E")	// Turn on cursor, TRS-80 CODE, should probably update to ANSI
      {
         this.isCursorVisible = true;
      }
      else if (c32==="\x0F")	// Turn off cursor, TRS-80 code
      {
         this.setC32(this.props.cursorPos, " ");
         this.isCursorVisible = false;
      }
      else if (c32===String.fromCharCode(24))	/* backspace cursor*/
      {
         if (this.props.cursorPos > 0)
            this.props.cursorPos--;
      }
      else if (c32===String.fromCharCode(25))	/* advance cursor*/
      {
         if (this.props.cursorPos < (this.size-1))
            this.props.cursorPos++;
      }
      else if (c32===String.fromCharCode(26))	/* cursor down one line */
      {
         if (this.props.cursorPos < this.props.widthInChars*(this.props.heightInChars-1))
            this.props.cursorPos+=this.props.widthInChars;
      }
      else if (c32===String.fromCharCode(27))	/* cursor up one line */
      {
         if (this.props.cursorPos >= this.props.widthInChars)
            this.props.cursorPos-=this.props.widthInChars;
      }
      else if (c32===String.fromCharCode(28))	/* home */
      {
         this.props.cursorPos=0;
      }
      else if (c32===String.fromCharCode(29))	/* beginning of line */
      {
         this.props.cursorPos=(this.props.cursorPos/this.props.widthInChars)*this.props.widthInChars;
      }
      else if (c32===String.fromCharCode(30))	/* erase to end of line */
      {
         this.eraseLine();
      }
      else if (c32===String.fromCharCode(31))	/* erase to end of frame */
      {
         for (let i=this.props.cursorPos; i < this.size; i++)
            this.setC32(i, " ");
      }
      else
      {
         this.setC32(this.props.cursorPos, c32);
         this.props.cursorPos++;
      }

      // Do we need to scroll?
      if (this.props.cursorPos == this.size)	
      {
         this.props.cursorPos = this.props.widthInChars*(this.props.heightInChars-1);
         for (let i=0; i < (this.props.widthInChars*(this.props.heightInChars-1)); i++) {
            this.videoMem[i] = this.videoMem[i+this.props.widthInChars];
            this.backColorMem[i] = this.backColorMem[i+this.props.widthInChars];
            this.foreColorMem[i] = this.foreColorMem[i+this.props.widthInChars];
         }

         for (let i=0; i < this.props.widthInChars; i++) {
            this.videoMem[this.size-i-1] = 32;
            this.backColorMem[this.size-i-1] = this.props.backColorAsRGB;
            this.foreColorMem[this.size-i-1] = this.props.foreColorAsRGB;
         }

         this.drawRange(0, this.size-1);
      }

      if (this.isCursorVisible)
         this.setC32(this.props.cursorPos, String.fromCodePoint(9611));  // 9611 is graphic block -- same cursor i use in class twrDiv

      if (this.props.cursorPos >= this.size)
      {
         throw new Error("internal error: this.props.cursorPos >= this.size");
      }
   }

   //*************************************************

   putStr(str:string) {
      for (let i=0; i < str.length; i++)
         this.twrConCharOut(undefined, str.codePointAt(i)||0, codePageUTF32);
   }

   twrConPutStr(callingMod:IWasmModule|IWasmModuleAsync, chars:number, codePage:number) {
      const str=callingMod.wasmMem.getString(chars, undefined, codePage);
      for (let i=0; i < str.length; i++)
         this.twrConCharOut(callingMod, str.codePointAt(i)||0, codePageUTF32);
   }

   //*************************************************
   setC32(location:number, str:string) : void {
      if (str.length>1) 
         throw new Error("setC32 takes an empty or single char string");

      this.twrConSetC32(undefined, location, str.codePointAt(0)||0)
   }

   twrConSetC32(callingMod:any, location:number, c32:number) : void
   {
      if (!(location>=0 && location<this.size)) 
         throw new Error("Invalid location passed to setC32")

      this.videoMem[location]=c32;
      this.backColorMem[location]=this.props.backColorAsRGB;
      this.foreColorMem[location]=this.props.foreColorAsRGB;
      
      // draw one before and one after to fix any character rendering overlap.  
      // Can happen with anti-aliasing on graphic chars that fill the cell
      let start=location-1;
      if (start<0) start=0;
      let end=location+1;
      if (end >= this.size) end=this.size-1;
      this.drawRange(start, end);

      // draw one line above and below as well to fix any character rendering overlap.  
      // the block cursor typically can cause an issue
      const startSave=start;
      const endSave=end;
      start=start-this.props.widthInChars;
      end=end-this.props.widthInChars;
      if (start<0) start=0;
      if (end<0) end=0;
      this.drawRange(start, end);  

      start=startSave+this.props.widthInChars;
      end=endSave+this.props.widthInChars;
      if (start >= this.size) start=this.size-1;
      if (end >= this.size) end=this.size-1;
      this.drawRange(start, end);    
   }

   //*************************************************

   twrConCls()
   {
      for (let i=0; i < this.size; i++) {
         this.videoMem[i]=32;
         this.backColorMem[i]=this.props.backColorAsRGB;
         this.foreColorMem[i]=this.props.foreColorAsRGB;
      }

      this.props.cursorPos = 0;
      this.isCursorVisible = false;

      this.drawRange(0, this.size-1);
   }

   private setFillStyleRGB(color:number) {
      // const cssColor= "#"+("00000000" + color.toString(16)).slice(-8);  RGBA
		const cssColor = `#${color.toString(16).padStart(6, '0')}`;
      this.ctx.fillStyle = cssColor;
   }

   private drawTrs80Graphic(offset:number, val:number, fgc:number, bgc:number)
   {
      let x, y;
   
      x = (offset%this.props.widthInChars)*this.cellWidth;
      y = Math.floor(offset/this.props.widthInChars)*this.cellHeight;
   
      this.setFillStyleRGB(bgc);
      this.ctx.fillRect(x, y, this.cellWidth, this.cellHeight);
   
      if (val == 32)
         return;
   
      this.setFillStyleRGB(fgc);
   
      if (val&1)
         this.ctx.fillRect(x, y, this.cellW1, this.cellH1);
   
      y=y+this.cellH1;
   
      if (val&4)
         this.ctx.fillRect(x, y, this.cellW1, this.cellH2);
   
      y=y+this.cellH2;
   
      if (val&16)
         this.ctx.fillRect(x, y, this.cellW1, this.cellH3);
   
      x=x+this.cellW1;
   
      if (val&32)
         this.ctx.fillRect(x, y, this.cellW2, this.cellH3);
   
      y=y-this.cellH2;
   
      if (val&8)
         this.ctx.fillRect(x, y, this.cellW2, this.cellH2);
   
      y=y-this.cellH1;
   
      if (val&2)
         this.ctx.fillRect(x, y, this.cellW2, this.cellH1);
   
   } 
   
   //**************************************************
   
   private drawCell(offset:number, value:number, fgc:number, bgc:number)
   {
      if ( (value&TRS80_GRAPHIC_MARKER_MASK)==TRS80_GRAPHIC_MARKER || value==32)
      {
         this.drawTrs80Graphic(offset, value&TRS80_GRAPHIC_CHAR_MASK, fgc, bgc);
      }
      else
      {
         let x, y;
   
         x = (offset%this.props.widthInChars)*this.cellWidth;
         y = Math.floor(offset/this.props.widthInChars)*this.cellHeight;
   
         this.setFillStyleRGB(bgc);
         this.ctx.fillRect(x, y, this.cellWidth, this.cellHeight);
         if (value!=32) {
            this.setFillStyleRGB(fgc);
            const txt=String.fromCodePoint(value);
            this.ctx.fillText(txt, x, y);
         }
      }
   }
   
   //*************************************************
   // !!TODO add ability to setRange colors
   // !! should this take a bytearray?
   // !! need to add "getRange" to match
   setRangeJS(start:number, values:number[])
   {
      let k=0;
      for (let i=start; i < start+values.length; i++) {
         this.videoMem[i]=values[k++];
      }
      this.drawRange(start, start+values.length-1)
   }

   twrConSetRange(callingMod:IWasmModule|IWasmModuleAsync, chars:number, start:number, len:number) {
      let values:number[]=[];
      for (let i=start; i<start+len; i++) {
         values.push(callingMod.wasmMem.getLong(i));
      }
      this.setRangeJS(start, values);
   }

   private drawRange(start:number, end:number)
   {
      for (let i=start; i <= end; i++) {
         this.drawCell(i, this.videoMem[i], this.foreColorMem[i], this.backColorMem[i] );
      }
   }

   /*************************************************/

   twrConSetReset(callingMod:IWasmModule|IWasmModuleAsync, x:number, y:number, isset:boolean) : void
   {
      const loc = Math.floor(x/2)+this.props.widthInChars*Math.floor(y/3);
      const cellx = x%2;
      const celly = y%3;

      if (x<0 || x>this.props.widthInChars*2) throw new Error("setReset: invalid x value");
      if (y<0 || y>this.props.heightInChars*3) throw new Error("setReset: invalid y value");

      if (!((this.videoMem[loc]&TRS80_GRAPHIC_MARKER_MASK)==TRS80_GRAPHIC_MARKER)) {
         this.videoMem[loc]= TRS80_GRAPHIC_MARKER;	/* set to a cleared graphics value */
         this.backColorMem[loc]=this.props.backColorAsRGB;
         this.foreColorMem[loc]=this.props.foreColorAsRGB;
      }

      if (isset)
         this.videoMem[loc]|= (1<<(celly*2+cellx));
      else
         this.videoMem[loc]&= ~(1<<(celly*2+cellx));

      this.drawRange(loc, loc);
   }

   //*************************************************

   twrConPoint(callingMod:IWasmModule|IWasmModuleAsync, x:number, y:number) : boolean
   {
      const loc = Math.floor(x/2)+this.props.widthInChars*Math.floor(y/3);
      const cellx = x%2;
      const celly = y%3;

      if (x<0 || x>this.props.widthInChars*2) throw new Error("Point: invalid x value");
      if (y<0 || y>this.props.heightInChars*3) throw new Error("Point: invalid y value");

      if (!((this.videoMem[loc]&TRS80_GRAPHIC_MARKER_MASK)==TRS80_GRAPHIC_MARKER))
         return false;	/* not a graphic cell, so false */

      if (this.videoMem[loc]&(1<<(celly*2+cellx)))
         return true;
      else 
         return false;
   }


   //*************************************************

   twrConSetCursor(callingMod:IWasmModule|IWasmModuleAsync, location:number) : void
   {
      if (location<0 || location>=this.size) throw new Error("setCursor: invalid location: "+location);

      this.props.cursorPos = location;
   }

   //*************************************************

   twrConSetCursorXY(callingMod:IWasmModule|IWasmModuleAsync, x:number, y:number) {
      if (x<0 || y<0 || this.props.widthInChars*y+x >= this.size) throw new Error("setCursorXY: invalid parameter(s)");
      this.twrConSetCursor(callingMod, this.props.widthInChars*y+x); 
   }

   //*************************************************

   twrConSetColors(callingMod:IWasmModule|IWasmModuleAsync, foreground:number, background:number) : void 
   {
      this.props.foreColorAsRGB=foreground;
      this.props.backColorAsRGB=background;
   }

   // TODO!! Should keyBuffer be flushed?  Is keyBuffer needed?
   async twrConCharIn_async(callingMod: IWasmModuleAsync):Promise<number> {
      let ev:KeyboardEvent|undefined;

      return new Promise( (resolve) => {
         if (this.keyWaiting)
            throw new Error("internal error");
         while (ev=this.keyBuffer.shift()) {
            const r=keyEventToCodePoint(ev);
            if (r) {
               resolve(r);
               return;
            }
         }

         this.keyWaiting=resolve;

      });
   }

   twrConSetFocus() {
      this.element.focus();
   }
}

export default twrConsoleTerminal;
   
//TODO!!  Most of these member functions could benefit from a FireAndForget option


   