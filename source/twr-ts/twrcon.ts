//TODO:
//	struct IoDisplay: need to add a setc32 equiv for back/fore color
// fix ionull.header.type=0;
// add io_get_type
// is there an io_get_width?  add?  (type, width, height are pre-cached)
// i can't figure out how to have this param be a keyof instead of string, with separate params for Stream and Terminal:  getProp: (propName: string)=>number;
// change printf, and other optimizations if they exist, to call io_putstr
// implement or deprecate io_begin_draw 
// get rid of IoConsoleWindow, and just use IoConsole for everything?
// add a typedef for struct IoConsole
// update docs for IModOpts / stdin,out, etc
// remove from IModParams: imports:{[index:string]:Function},
// implement 	//	IModOpts.imports in twrWasmModuleInJSMain
// term set colors are all RGB 24.  No A.  that was the docs, and sort of the case.  io_set_colors doc was RGB.  But i unified this in more cases.
// fix malloc_unit_test: FAIL
// update docs for these now removed functions:  twr_divcon(void), twr_debugcon(void), twr_windowcon(void);  OR re-implement?
// think about divLog.  Should it 'log'  be part of each console class (new base class?)
// add ability to determine if a console has the input focus
// remove support for io:{[key:string]: IConsole};
// add fputs
// this file contains code common to Consoles
// add codepage as arg to charout.io_putc to make it more flexible and to align with how setc32 works in io_functions
// add ability to set a max size for a div con, or to trim it.
// add helloworld-b to index.html?
// finish inkey

import {twrConsoleTerminalProxy, TConsoleTerminalProxyParams, IConsoleTerminal, IConsoleTerminalProxy, IConsoleTerminalNewFunctions, IConsoleTerminalProps} from "./twrconterm.js"
import {twrSharedCircularBuffer} from "./twrcircular.js"
import {twrConsoleDivProxy, TConsoleDivProxyParams} from "./twrcondiv.js"
import {twrConsoleDebugProxy, TConsoleDebugProxyParams} from "./twrcondebug.js"

//export type TStdioVals="div"|"canvas"|"null"|"debug";

 export type TConsoleProxyParams = TConsoleTerminalProxyParams | TConsoleDivProxyParams | TConsoleDebugProxyParams;
 export type TConsoleProxyClass = typeof twrConsoleTerminalProxy | typeof twrConsoleDivProxy | typeof twrConsoleDebugProxy;
 //export type TConsoleProxyClass = new (params: TConsoleProxyParams) => IConsoleProxy;

export interface IConsole extends IConsoleStream,  Partial<IConsoleTerminalNewFunctions> {}
export interface IConsoleProxy extends IConsoleStreamProxy,  Partial<IConsoleTerminalNewFunctions> {}

// must match IO_TYPEs in twr_io.h
export class IOTypes {
   static readonly  CHARREAD = (1<<0);  // Stream In
   static readonly  CHARWRITE = (1<<1);  // Stream Out
   static readonly  ADDRESSABLE_DISPLAY = (1<<2);  	// IoDisplay is enabled
   static readonly  CANVAS2D = (1<<3);   // unimplemented yet
   static readonly  EVENTS = (1<<4);  // unimplemented yet

  // Private constructor to prevent instantiation
  private constructor() {}
}

export interface IOBaseProps {
   type: number,   // a constant from class IOTypes
   [key: string]: number;  // required because I access with a string. 
}

export interface IConsoleStream {
   getProp: (propName: string)=>number;
   charOut: (c:number, codePage:number)=>void;
   putStr: (str:string)=>void;
   getProxyParams: ()=> TConsoleProxyParams;
   processMessage(msgType:string, data:[number, ...any[]]):boolean;

	keyDown: (ev:KeyboardEvent)=>void;

   element:HTMLElement|null;
	id:number;   // returned by twrConsoleRegistry.registerConsole()
   keys?: twrSharedCircularBuffer;  // only created if getProxyParams is called 
}

export interface IConsoleStreamProxy {
   getProp: (propName: string)=>number;
   charOut: (c:number, codePage:number)=>void;
   putStr: (str:string)=>void;
   charIn: ()=>number;
	setFocus: ()=>void;

	id:number;   
}

function keyEventProcess(ev:KeyboardEvent) {
	if ( !ev.isComposing  && !ev.metaKey && ev.key!="Control" && ev.key!="Alt" ) {
		//console.log("keyDownDiv: ",ev.key, ev.code, ev.key.codePointAt(0), ev);
		if (ev.key.length==1)
			return ev.key.codePointAt(0);
		else {
			switch(ev.key) {
				case 'Backspace': return 8;
				case 'Enter': 		return 10;
				case 'Escape': 	return 0x1B;
				case 'Delete': 	return 0x7F;
				case 'ArrowLeft':	return 0x2190;
				case 'ArrowUp':	return 0x2191;
				case 'ArrowRight':return 0x2192;
				case 'ArrowDown':	return 0x2193;
			}
			console.log("keyEventProcess SKIPPED: ",ev.key, ev.code, ev.key.codePointAt(0), ev);
		}
	}
	else {
		console.log("keyEventProcess SKIPPED-2: ",ev.key, ev.code, ev.key.codePointAt(0), ev);
	}

	return undefined;
}

// this is a utility function used by console classes, and should be called from HTML "keydown" event 
export function keyDown(destinationCon:IConsole, ev:KeyboardEvent)  {
	if (!destinationCon.keys)
		throw new Error("keyDown requires twrModuleAsync");
	else {
		const r=keyEventProcess(ev);
		if (r) destinationCon.keys.write(r);
	}
}

