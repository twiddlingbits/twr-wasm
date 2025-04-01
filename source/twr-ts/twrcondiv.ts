import {codePageUTF32, twrCodePageToUnicodeCodePoint} from "./twrliblocale.js"
import {IConsoleDiv, IConsoleDivParams, IOTypes,  keyEventToCodePoint} from "./twrcon.js"
import {IWasmModuleAsync} from "./twrmodasync.js";
import {IWasmModule} from "./twrmod.js"
import {twrLibrary, TLibImports, twrLibraryInstanceRegistry} from "./twrlibrary.js";

export class twrConsoleDiv extends twrLibrary implements IConsoleDiv {
   id:number;
   element?:HTMLDivElement;
   CURSOR=String.fromCharCode(9611);  // ▋ see https://daniel-hug.github.io/characters/#k_70
   cursorOn:boolean=false;
   lastChar:number=0;
   extraBR:boolean=false;
   cpTranslate?:twrCodePageToUnicodeCodePoint;
   keyBuffer:KeyboardEvent[]=[];
   keyWaiting?:(key:number)=>void;

   imports:TLibImports = {
      twrConCharOut:{noBlock:true},
      twrConGetProp:{},
      twrConPutStr:{noBlock:true},
      twrConCharIn:{isAsyncFunction: true, isModuleAsyncOnly: true},
      twrConSetFocus:{noBlock:true},
   };

   libSourcePath = new URL(import.meta.url).pathname;
   interfaceName = "twrConsole";

   constructor(element?:HTMLDivElement,  params?:IConsoleDivParams) {
      // all library constructors should start with these two lines
      super();
      this.id=twrLibraryInstanceRegistry.register(this);

      // twrLibraryProxy will construct with no element or params.
      // this is triggered by defining a function as isCommonCode.  
      // Such functions should work with undefined constructor args
      // TODO!! Doc this issue
      if (element!==undefined) {

         this.element=element;

         if (!(element && element instanceof HTMLDivElement)) 
            throw new Error("Invalid HTMLDivElement parameter in twrConsoleDiv constructor ");

         if (params) {
            if (params.backColor) this.element.style.backgroundColor = params.backColor;
            if (params.foreColor) this.element.style.color = params.foreColor;
            if (params.fontSize) this.element.style.font=params.fontSize.toString()+"px arial";
         }

         this.cpTranslate=new twrCodePageToUnicodeCodePoint();
      }
   }

   private isHtmlEntityAtEnd(str:string) {
      const entityPattern = /&[^;]+;$/;
      return entityPattern.test(str);
   }

   private removeHtmlEntityAtEnd(str:string) {
      const entityPattern = /&[^;]+;$/;
      return str.replace(entityPattern, '');
   }

   twrConSetFocus() {
      if (this.element===undefined) throw new Error("undefined HTMLDivElement");
      this.element.focus();
   }

   charOut(str:string) {
      if (str.length>1) 
         throw new Error("charOut takes an empty or single char string");

      this.twrConCharOut(undefined, str.codePointAt(0)||0, codePageUTF32);
   }

/* 
 * add utf-8 or windows-1252 character to div.  Supports the following control codes:
 * any of CRLF, CR (/r), or LF(/n)  will cause a new line
 * 0x8 backspace
 * 0xE cursor on 
 * 0xF cursor off 
*/
   twrConCharOut(callingMod:IWasmModule|IWasmModuleAsync|undefined, ch:number, codePage:number) {

      if (!this.element) throw new Error("undefined HTMLDivElement");
      if (!this.cpTranslate) throw new Error("internal error");

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

   twrConGetProp(callingMod:IWasmModule|IWasmModuleAsync, pn:number):number {
      const propName=callingMod.wasmMem.getString(pn);
      return this.getProp(propName);
   }

   getProp(propName: string):number {
      if (propName==="type") return IOTypes.CHARWRITE|IOTypes.CHARREAD;
      console.log("twrConsoleDiv.getProp passed unknown property name: ", propName)
      return 0;
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

   putStr(str:string) {
      for (let i=0; i < str.length; i++)
         this.twrConCharOut(undefined, str.codePointAt(i)!, codePageUTF32);
   }

   twrConPutStr(callingMod:IWasmModule|IWasmModuleAsync,  chars:number, codePage:number) {
      this.putStr(callingMod.wasmMem.getString(chars, undefined, codePage));
   }

}

export default twrConsoleDiv;
