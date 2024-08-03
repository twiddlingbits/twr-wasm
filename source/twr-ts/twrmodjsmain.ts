// This class extends base to handle options when called in the main Java Script thread

import {twrConsoleDiv, IConsoleDivParams} from "./twrcondiv.js"
import {IModOpts, twrWasmModuleBase} from "./twrmodbase.js"
import {twrCanvas} from "./twrcanvas.js"
import {IConsole} from "./twrcon.js"
import {twrConsoleTerminal} from "./twrconterm.js"
import {codePageUTF32} from "./twrlocale.js"
import {twrConsoleDebug} from "./twrcondebug.js"


export abstract class twrWasmModuleInJSMain extends twrWasmModuleBase {
   d2dcanvas?:twrCanvas;
   stdio:IConsole;
   stderr:IConsole;

   constructor(opts:IModOpts={}) {
      super();
      if (typeof document === 'undefined')
         throw new Error ("twrWasmModuleJSMain should only be created in JavaScript Main.");


		let consoleParams:IConsoleDivParams={};
      
      if (opts.stdio) {
         this.stdio=opts.stdio;
      }
      else {
         const eiodiv=document.getElementById("twr_iodiv") as HTMLDivElement; 
         if (eiodiv) {
            this.stdio=new twrConsoleDiv(eiodiv, {foreColor: opts.forecolor, backColor: opts.backcolor, fontSize: opts.fontsize}); 
         }
         else {
            const eiocanvas=document.getElementById("twr_iocanvas") as HTMLCanvasElement;
            if (eiocanvas) {
               this.stdio=new twrConsoleTerminal(eiocanvas, {
							foreColor: opts.forecolor, 
							backColor: opts.backcolor, 
							fontSize: opts.fontsize, 
							widthInChars: opts.windim?.[0],
							heightInChars: opts.windim?.[1],
						 }); 
            }
            else {
					this.stdio=new twrConsoleDebug();
               console.log("Stdio console is not specified.  Using twrConsoleDebug.")
            }
         }
      }

      if (opts.stderr) {
         this.stderr=opts.stderr;
      }
      else {
         this.stderr=new twrConsoleDebug();
      }

      if (opts.d2dcanvas) {
         this.d2dcanvas=opts.d2dcanvas;
      }  
      else {
         const ed2dcanvas=document.getElementById("twr_d2dcanvas") as HTMLCanvasElement;
         if (ed2dcanvas) this.d2dcanvas=new twrCanvas(ed2dcanvas, this);
      }

   }

   divLog(...params: string[]) {
      for (var i = 0; i < params.length; i++) {
         this.stdio.stringOut(params[i].toString());
         this.stdio.charOut(32, codePageUTF32); // space
      }
      this.stdio.charOut(10, codePageUTF32);
     }
}