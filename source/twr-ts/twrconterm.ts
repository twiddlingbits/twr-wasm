import {twrSharedCircularBuffer} from "./twrcircular.js";
import {twrCodePageToUnicodeCodePointImpl} from "./twrlocale.js"
import {IConsoleStream, IConsoleStreamProxy, IOBaseProps, IOTypes, keyDown} from "./twrcon.js"
import {IConsoleDivParams} from "./twrcondiv.js";
import {codePageUTF32} from "./twrlocale.js"
import {twrConsoleRegistry} from "./twrconreg.js"

const TRS80_GRAPHIC_MARKER=0xE000;
const TRS80_GRAPHIC_MARKER_MASK=0xFF00;
const TRS80_GRAPHIC_CHAR_MASK=0x003F;    // would be 0xC0 if we included the graphics marker bit 0x80

// Term Canvas have a size that will be set based on the character width x height.
// The display size for a canvas is set in the HTML/JS like this:
//    canvas.style.width = "700px";
//    canvas.style.height = "500px";

// params are passed to the constructor
export interface IConsoleTerminalParams extends IConsoleDivParams {
   widthInChars?: number,
   heightInChars?: number,
}

// props can be queried 
export interface IConsoleTerminalProps extends IOBaseProps {
   cursorPos:number,
   charWidth: number,
   charHeight: number,
   foreColorAsRGB: number,
   backColorAsRGB: number,
   widthInChars: number,
   heightInChars: number,
   fontSize: number,
   canvasWidth:number,
   canvasHeight:number
}

export type TConsoleTerminalProxyParams = ["twrConsoleTerminalProxy", number, SharedArrayBuffer, SharedArrayBuffer];
export type TConsoleTerminalProxyClass = typeof twrConsoleTerminalProxy;

export interface IConsoleTerminalNewFunctions {
   cls: ()=>void;
   setRange: (start:number, values:[])=>void;
   setC32: (location:number, char:number)=>void;
   setReset: (x:number, y:number, isset:boolean)=>void;
   point: (x:number, y:number)=>boolean;
   setCursor: (pos:number)=>void;
   setCursorXY: (x:number, y:number)=>void;
   setColors: (foreground:number, background:number)=>void;
}

export interface IConsoleTerminal extends IConsoleStream,  IConsoleTerminalNewFunctions {}
export interface IConsoleTerminalProxy extends IConsoleStreamProxy,  IConsoleTerminalNewFunctions {}

export class twrConsoleTerminal implements IConsoleTerminal  {
   element:HTMLElement|null;
	id:number;
   ctx:CanvasRenderingContext2D;
   keys?: twrSharedCircularBuffer;  // only created if getProxyParams is called 
   returnValue?: twrSharedCircularBuffer;
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

    constructor (canvasElement:HTMLCanvasElement, params:IConsoleTerminalParams) {
  
      const {foreColor="white", backColor="black", fontSize=16, widthInChars=80, heightInChars=25} = params; 

      this.element=canvasElement;

      // canvasElement is where we will draw the terminal
      if (!canvasElement.getContext) throw new Error("canvasElement.getContext invalid");
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

		this.cls();

		this.id=twrConsoleRegistry.registerConsole(this);

   }

   // ProxyParams are used as the constructor options to great the Proxy class as returned by getProxyClassName, in the twrModAsyncProxy WebWorker thread
   getProxyParams() : TConsoleTerminalProxyParams {
      if (this.returnValue || this.keys) throw new Error("internal error -- getProxyParams unexpectedly called twice.");
      // these are used to communicate with twrConsoleTerminalProxy (if it exists)
      // tsconfig, lib must be set to 2017 or higher for SharedArrayBuffer usage
      this.returnValue = new twrSharedCircularBuffer();  
      this.keys = new twrSharedCircularBuffer();  
      return ["twrConsoleTerminalProxy", this.id, this.returnValue.sharedArray, this.keys.sharedArray];
  }

   getProp(propName: string): number {
      return this.props[propName];
   }

	keyDown(ev:KeyboardEvent)  {
		keyDown(this, ev);
	}

   processMessage(msgType:string, data:[number, ...any[]]):boolean {
		const [id, ...params] = data;
		if (id!=this.id) return false;

      switch (msgType) {
         case "term-getprop":
            const [propName] =  params;
				const propVal=this.getProp(propName);
            this.returnValue!.write(propVal);
            break;

         case "term-point":
         {
            const [x, y] =  params;
            const r=this.point(x, y);
            this.returnValue!.write(r?1:0);  // wait for result, then read it

         }
            break;

         case "term-charout":
         {
            const [ch, codePage] =  params;
            this.charOut(ch, codePage);
         }
            break;

         case "term-stringout":
         {
            const [str] =  params;
            this.stringOut(str);
         }
            break;

         case "term-cls":
         {
            this.cls();
         }
         break;

         case "term-setrange":
         {
            const [start, values] =  params;
            this.setRange(start, values);
         }
         break;

         case "term-setc32":
         {
            const [location, char] =  params;
            this.setC32(location, char);
         }
         break;

         case "term-setreset":
         {
            const [x, y, isset] =  params;
            this.setReset(x, y, isset);
         }
         break;

         case "term-setcursor":
         {
            const [pos] =  params;
            this.setCursor(pos);
         }
         break;

         case "term-setcursorxy":
         {
            const [x, y] =  params;
            this.setCursorXY(x, y);
         }
         break;

         case "term-setcolors":
         {
            const [foreground, background] =  params;
            this.setColors(foreground, background);
         }
         break;


         default:
            return false;
      }

      return true;
   }

   private RGB_TO_RGBA(x:number) {
      return  ((x)<<8) | 0xFF;  // JavaScript uses 32-bit signed integers for bitwise operations, which means the leftmost bit is the sign bit. 
   }

   private eraseLine()
   {
      for (let i=this.props.cursorPos; i < Math.floor(this.props.cursorPos/this.props.widthInChars)*this.props.widthInChars+this.props.widthInChars; i++)
         this.setC32(i, 32);
   }
      
   charOut(c:number, codePage:number)
   {
      if (c==13 || c==10)	// return
      {
         if (this.isCursorVisible)
            this.setC32(this.props.cursorPos,32);
         
         this.props.cursorPos = Math.floor(this.props.cursorPos/this.props.widthInChars);
         this.props.cursorPos = this.props.cursorPos*this.props.widthInChars;
         this.props.cursorPos = this.props.cursorPos + this.props.widthInChars;
         
         /* if return put us on a new line that isn't a scroll, erase the line */
         if (this.props.cursorPos < this.size)	
            this.eraseLine();
      }
      else if (c==8)	// backspace
      {
         if (this.props.cursorPos > 0)
         {
            if (this.isCursorVisible)
               this.setC32(this.props.cursorPos,32);
            this.props.cursorPos--;
            this.setC32(this.props.cursorPos,32);
         }
      }
      else if (c==0xE)	// Turn on cursor
      {
         this.isCursorVisible = true;
      }
      else if (c==0xF)	// Turn off cursor
      {
         this.setC32(this.props.cursorPos,32);
         this.isCursorVisible = false;
      }
      else if (c==24)	/* backspace cursor*/
      {
         if (this.props.cursorPos > 0)
            this.props.cursorPos--;
      }
      else if (c==25)	/* advance cursor*/
      {
         if (this.props.cursorPos < (this.size-1))
            this.props.cursorPos++;
      }
      else if (c==26)	/* cursor down one line */
      {
         if (this.props.cursorPos < this.props.widthInChars*(this.props.heightInChars-1))
            this.props.cursorPos+=this.props.widthInChars;
      }
      else if (c==27)	/* cursor up one line */
      {
         if (this.props.cursorPos >= this.props.widthInChars)
            this.props.cursorPos-=this.props.widthInChars;
      }
      else if (c==28)	/* home */
      {
         this.props.cursorPos=0;
      }
      else if (c==29)	/* beginning of line */
      {
         this.props.cursorPos=(this.props.cursorPos/this.props.widthInChars)*this.props.widthInChars;
      }
      else if (c==30)	/* erase to end of line */
      {
         this.eraseLine();
      }
      else if (c==31)	/* erase to end of frame */
      {
         for (let i=this.props.cursorPos; i < this.size; i++)
            this.setC32(i, 32);
      }
      else
      {
         const c32=twrCodePageToUnicodeCodePointImpl(c, codePage);
         if (c32!=0) {
            this.setC32(this.props.cursorPos, c32);
            this.props.cursorPos++;
         }
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
         this.setC32(this.props.cursorPos, 9611);  // 9611 is graphic block -- same cursor i use in class twrDiv

      if (this.props.cursorPos >= this.size)
      {
         throw new Error("twrTerm: assert: this.props.cursorPos >= this.size");
      }
   }


   //*************************************************

   stringOut(str:string) {
      for (let i=0; i < str.length; i++)
         this.charOut(str.codePointAt(i)||0, codePageUTF32);
   }

   //*************************************************

   setC32(location:number, c32:number) : void
   {
      if (!(location>=0 && location<this.size)) throw new Error("Invalid location passed to setc32")

      this.videoMem[location]=c32;
      this.backColorMem[location]=this.props.backColorAsRGB;
      this.foreColorMem[location]=this.props.foreColorAsRGB;
      
      // draw one before and one after to fix any character rendering overlap.  Can happen with anti-aliasing on graphic chars that fill the cell
      let start=location-1;
      if (start<0) start=0;
      let end=location+1;
      if (end >= this.size) end=this.size-1;

      this.drawRange(start, end);
   }

   //*************************************************

   cls()
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

   drawTrs80Graphic(offset:number, val:number, fgc:number, bgc:number)
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
   setRange(start:number, values:[])
   {
      let k=0;
      for (let i=start; i < start+values.length; i++) {
         this.videoMem[i]=values[k++];
      }
      this.drawRange(start, start+values.length-1)
   }

   private drawRange(start:number, end:number)
   {
      for (let i=start; i <= end; i++) {
         this.drawCell(i, this.videoMem[i], this.foreColorMem[i], this.backColorMem[i] );
      }
   }


   /*************************************************/

   setReset(x:number, y:number, isset:boolean) : void
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

   point(x:number, y:number) : boolean
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

   setCursor(location:number) : void
   {
      if (location<0 || location>=this.size) throw new Error("setCursor: invalid location");

      this.props.cursorPos = location;
   }

   //*************************************************

   setCursorXY(x:number, y:number) {
      if (x<0 || y<0 || this.props.widthInChars*y+x >= this.size) throw new Error("setCursorXY: invalid parameter(s)");
      this.setCursor(this.props.widthInChars*y+x); 
   }

   //*************************************************

   setColors(foreground:number, background:number) : void 
   {
      this.props.foreColorAsRGB=foreground;
      this.props.backColorAsRGB=background;
   }
}

//*************************************************

export class twrConsoleTerminalProxy implements IConsoleTerminalProxy {
   keys: twrSharedCircularBuffer;
   returnValue: twrSharedCircularBuffer;
	id:number;

   constructor(params:TConsoleTerminalProxyParams) {
       const [className, id, returnBuffer, keysBuffer] = params;
       this.keys = new twrSharedCircularBuffer(keysBuffer);
       this.returnValue = new twrSharedCircularBuffer(returnBuffer);
		 this.id=id;
   }

   getProp(propName: string):number
   { 
      postMessage(["term-getprop", [this.id, propName]]);
      return this.returnValue.readWait();  // wait for result, then read it
   }
   
   charIn() {  
       return this.keys.readWait();  // wait for a key, then read it
   }

   point(x:number, y:number):boolean
   { 
      postMessage(["term-point", [this.id, x, y]]);
      return this.returnValue.readWait()!=0;  // wait for result, then read it
   }
   
   charOut(ch:number, codePoint:number) {
      postMessage(["term-charout", [this.id, ch, codePoint]]);
   }

   stringOut(str:string):void
   {
      postMessage(["term-stringout", [this.id, str]]);
   }

   cls():void
   { 
      postMessage(["term-cls", [this.id]]);
   }

   setRange(start:number, values:[]):void
   { 
      postMessage(["term-setrange", [this.id, start, values]]);
   }

   setC32(location:number, char:number):void
   { 
      postMessage(["term-setc32", [this.id, location, char]]);
   }

   setReset(x:number, y:number, isset:boolean):void
   { 
      postMessage(["term-setreset", [this.id, x, y, isset]]);
   }

   setCursor(pos:number):void
   { 
      postMessage(["term-setcursor", [this.id, pos]]);
   }

   setCursorXY(x:number, y:number):void
   { 
      postMessage(["term-setcursorxy", [this.id, x, y]]);
   }

   setColors(foreground:number, background:number):void
   {
      postMessage(["term-setcolors", [this.id, foreground, background]]);
   }

}