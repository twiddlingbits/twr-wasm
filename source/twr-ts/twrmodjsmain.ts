// This class extends base to handle options when called in the main Java Script thread

import {twrConsoleDiv} from "./twrcondiv.js"
import {IModOpts, twrWasmModuleBase} from "./twrmodbase.js"
import {twrConsoleCanvas} from "./twrcanvas.js"
import {IConsole} from "./twrcon.js"
import {twrConsoleTerminal} from "./twrconterm.js"
import {codePageUTF32} from "./twrlocale.js"
import {twrConsoleDebug} from "./twrcondebug.js"


export abstract class twrWasmModuleInJSMain extends twrWasmModuleBase {
   io:{[key:string]: IConsole};
   ioNamesToID: {[key: string]: number};

   constructor(opts:IModOpts={}) {
      super();
      if (typeof document === 'undefined')
         throw new Error ("twrWasmModuleJSMain should only be created in JavaScript Main.");

      // io contains a mapping of names to IConsole
      // stdio, stderr are required (but if they are not passed in, we will find defaults here)
      // there can be an arbitrary number of IConsoles passed to a module for use by the module
      if (opts.io) {
         this.io=opts.io;
      }
      else {
         this.io={};
      }
      
      if (!this.io.stdio) {
         const eiodiv=document.getElementById("twr_iodiv") as HTMLDivElement; 
         const eiocanvas=document.getElementById("twr_iocanvas") as HTMLCanvasElement;
         if (opts.stdio) {
            this.io.stdio=opts.stdio;
         } 
         else if (eiodiv) {
            this.io.stdio=new twrConsoleDiv(eiodiv, {foreColor: opts.forecolor, backColor: opts.backcolor, fontSize: opts.fontsize}); 
         }
         else if (eiocanvas) {
            this.io.stdio=new twrConsoleTerminal(eiocanvas, {
               foreColor: opts.forecolor, 
               backColor: opts.backcolor, 
               fontSize: opts.fontsize, 
               widthInChars: opts.windim?.[0],
               heightInChars: opts.windim?.[1],
            }); 
         }
         else {
            this.io.stdio=new twrConsoleDebug();
            console.log("Stdio console is not specified.  Using twrConsoleDebug.")
         }
      }

      if (!this.io.stderr) {
         this.io.stderr=new twrConsoleDebug();
      }

      if (!this.io.std2d) {
         if (opts.d2dcanvas) {
            this.io.std2d=opts.d2dcanvas;
         }  
         else {
            const ed2dcanvas=document.getElementById("twr_d2dcanvas") as HTMLCanvasElement;
            if (ed2dcanvas) this.io.std2d=new twrConsoleCanvas(ed2dcanvas);
         }
      }

      // each module has a mapping of names to console.id
      this.ioNamesToID={};
      Object.keys(this.io).forEach(key => {
         this.ioNamesToID[key]=this.io[key].id;
      });

   }

   divLog(...params: string[]) {
      for (var i = 0; i < params.length; i++) {
         this.io.stdio.putStr!(params[i].toString());
         this.io.stdio.charOut!(32, codePageUTF32); // space
      }
      this.io.stdio.charOut!(10, codePageUTF32);
     }
}