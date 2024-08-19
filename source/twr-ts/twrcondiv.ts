import {twrSharedCircularBuffer} from "./twrcircular.js";
import {twrCodePageToUnicodeCodePoint, codePageUTF32} from "./twrlocale.js"
import {IConsoleDiv, IConsoleDivProxy, IConsoleDivParams, TConsoleDivProxyParams, IOTypes, keyDownUtil, TConsoleMessage} from "./twrcon.js"
import {twrConsoleRegistry} from "./twrconreg.js"
import {IWasmModuleAsync} from "./twrmodasync.js";

export class twrConsoleDiv implements IConsoleDiv {
   element:HTMLDivElement;
   id:number;
   keys?:twrSharedCircularBuffer;
   CURSOR=String.fromCharCode(9611);  // ▋ see https://daniel-hug.github.io/characters/#k_70
   cursorOn:boolean=false;
   lastChar:number=0;
   extraBR:boolean=false;
   cpTranslate:twrCodePageToUnicodeCodePoint;


   constructor(element:HTMLDivElement,  params:IConsoleDivParams) {
      this.element=element;

      if (!(element && element instanceof HTMLDivElement)) 
         throw new Error("Invalid HTMLDivElement parameter in twrConsoleDiv constructor ");

      if (params) {
         if (params.backColor) this.element.style.backgroundColor = params.backColor;
         if (params.foreColor) this.element.style.color = params.foreColor;
         if (params.fontSize) this.element.style.font=params.fontSize.toString()+"px arial";
      }

      this.cpTranslate=new twrCodePageToUnicodeCodePoint();
      this.id=twrConsoleRegistry.registerConsole(this);
   }

   private isHtmlEntityAtEnd(str:string) {
      const entityPattern = /&[^;]+;$/;
      return entityPattern.test(str);
   }

  private removeHtmlEntityAtEnd(str:string) {
   const entityPattern = /&[^;]+;$/;
       return str.replace(entityPattern, '');
   }

/* 
 * add utf-8 or windows-1252 character to div.  Supports the following control codes:
 * any of CRLF, CR (/r), or LF(/n)  will cause a new line
 * 0x8 backspace
 * 0xE cursor on 
 * 0xF cursor off 
*/
   charOut(ch:number, codePage:number) {

      if (!this.element) throw new Error("internal error");

      //console.log("div::charout: ", ch, codePage);

      if (this.extraBR) {
         this.extraBR=false;
         if (this.cursorOn) this.element.innerHTML=this.element.innerHTML.slice(0, -1);
         this.element.innerHTML=this.element.innerHTML.slice(0, -4);
         if (this.cursorOn) this.element.innerHTML +=  this.CURSOR;
      }

      const chnum=this.cpTranslate.convert(ch, codePage);
      if (chnum!=0) {
         switch (chnum) {
            case 10:  // newline
            case 13:  // return
               if (ch==10 && this.lastChar==13) break;  // detect CR LF and treat as single new line
               if (this.cursorOn) this.element.innerHTML=this.element.innerHTML.slice(0, -1);
               this.element.innerHTML +=  "<br><br>";   //2nd break is a place holder for next line (fixes scroll issue at bottom)
               this.extraBR=true;
               if (this.cursorOn) this.element.innerHTML +=  this.CURSOR;
               //element.scrollIntoView();
               //element.scrollTop = element.scrollHeight;
               let p = this.element.getBoundingClientRect();
               window.scrollTo(0, p.height+100);
               break;

            case 8:  // backspace
               if (this.cursorOn) this.element.innerHTML=this.element.innerHTML.slice(0, -1);
               if (this.isHtmlEntityAtEnd(this.element.innerHTML)) 
                  this.element.innerHTML=this.removeHtmlEntityAtEnd(this.element.innerHTML);
               else
                  this.element.innerHTML=this.element.innerHTML.slice(0, -1);
               if (this.cursorOn) this.element.innerHTML +=  this.CURSOR;
               break;

            case 0xE:   // cursor on
               if (!this.cursorOn) {
                  this.cursorOn=true;
                  this.element.innerHTML +=  this.CURSOR;
                  this.element.focus();
               }
               break;

            case 0xF:   // cursor off
               if (this.cursorOn) {
                  this.cursorOn=false;
                  this.element.innerHTML=this.element.innerHTML.slice(0, -1);
               }
               break;
            default:
               if (this.cursorOn) this.element.innerHTML=this.element.innerHTML.slice(0, -1);
               let newchr=String.fromCodePoint(chnum);
               // in html, multiple spaces will be collapsed into one space.  This prevents that behavior.
               if (newchr==' ') newchr="&nbsp;";
               this.element.innerHTML += newchr;
               if (this.cursorOn) this.element.innerHTML +=  this.CURSOR;
               break;
            }

         this.lastChar=chnum;
      }
   }

   getProp(propName: string):number {
      if (propName==="type") return IOTypes.CHARWRITE|IOTypes.CHARREAD;
      console.log("twrConsoleDiv.getProp passed unknown property name: ", propName)
      return 0;
   }

   getProxyParams() : TConsoleDivProxyParams {
      this.keys = new twrSharedCircularBuffer();  // tsconfig, lib must be set to 2017 or higher
      return ["twrConsoleDivProxy", this.id, this.keys.saBuffer];
   }

   keyDown(ev:KeyboardEvent)  {
      keyDownUtil(this, ev);
   }
   

   processMessageFromProxy(msg:TConsoleMessage, mod:IWasmModuleAsync) {
      const [msgClass, id, msgType, ...params]=msg;
      if (id!=this.id) throw new Error("internal error");  // should never happen

      switch (msgType) {
         case "div-charout":
         {
            const [ch, codePage] =  params;
            this.charOut(ch, codePage);
         }
            break;

         case "div-putstr":
         {
            const [str] =  params;
            this.putStr(str);
         }
            break;

         case "div-focus":
         {
            this.element.focus();
         }
            break;

         default:
            throw new Error("internal error");  // should never happen
      }
   }

   putStr(str:string) {
      for (let i=0; i < str.length; i++)
         this.charOut(str.codePointAt(i)||0, codePageUTF32);
   }
}


export class twrConsoleDivProxy implements IConsoleDivProxy {
    keys: twrSharedCircularBuffer;
    id:number;

    constructor(params:TConsoleDivProxyParams) {
        const [className, id, keysBuffer] = params;
        this.keys = new twrSharedCircularBuffer(keysBuffer);
        this.id = id;
    }

    charIn() {  
        return this.keys.readWait();  // wait for a key, then read it
    }
    
    inkey() {
        if (this.keys.isEmpty())
            return 0;
        else
            return this.charIn();    
    }

   charOut(ch:number, codePoint:number) {
      postMessage(["twrConsole", this.id, "div-charout", ch, codePoint]);
   }

   putStr(str:string):void
   {
      postMessage(["twrConsole", this.id, "div-putstr", str]);
   }

   getProp(propName: string) {
      if (propName==="type") return IOTypes.CHARWRITE|IOTypes.CHARREAD;
      console.log("twrConsoleDivProxy.getProp passed unknown property name: ", propName)
      return 0;
   }

   setFocus() {
      postMessage(["twrConsole", this.id, "div-focus"]);
   }
}

