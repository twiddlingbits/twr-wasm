//TODO:
//	struct IoDisplay: need to add a setc32 equiv for back/fore color
// add io_get_type
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
// this file contains code common to Consoles
// add codepage as arg to charout.io_putc to make it more flexible and to align with how setc32 works in io_functions
// add ability to set a max size for a div con, or to trim it.
// add helloworld-b to index.html?
// finish inkey
// add io_setrange example
// get rid of this.io and just use ioIDtoNames?

import {twrSharedCircularBuffer} from "./twrcircular.js"
import {twrWasmModuleBase} from "./twrmodbase.js"

// Params are passed to the console constructor
export interface IConsoleDivParams {
   foreColor?: string,
   backColor?: string,
   fontSize?: number,
   name?:string,
}

export interface IConsoleTerminalParams extends IConsoleDivParams {
   widthInChars?: number,
   heightInChars?: number,
}

// Props of a console can be queried 
export interface IOBaseProps {
   type: number,   // a constant from class IOTypes
   [key: string]: number;  // required because I access with a string. 
}

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

export interface ICanvasProps extends IOBaseProps{
   canvasWidth:number,
   canvasHeight:number
}

// Interface for Consoles
export interface IConsoleBase {
   getProp: (propName: string)=>number;
   getProxyParams: ()=> TConsoleProxyParams;
   processMessage(msgType:string, data:[number, ...any[]], callingModule:twrWasmModuleBase):boolean;

	id:number;   // returned by twrConsoleRegistry.registerConsole()
   element?:HTMLElement;   // debug console does not have an element
}

export interface IConsoleBaseProxy {
   getProp: (propName: string)=>number;
	id:number;   // returned by twrConsoleRegistry.registerConsole()
}

export interface IConsoleStream {
   charOut: (c:number, codePage:number)=>void;
   putStr: (str:string)=>void;
	keyDown: (ev:KeyboardEvent)=>void;

   keys?: twrSharedCircularBuffer;  // only created if getProxyParams is called 
}

export interface IConsoleStreamProxy {
   charOut: (c:number, codePage:number)=>void;
   putStr: (str:string)=>void;
   charIn: ()=>number;
	setFocus: ()=>void;
}

export interface IConsoleAddressable {
   cls: ()=>void;
   setRange: (start:number, values:[])=>void;
   setC32: (location:number, char:number)=>void;
   setReset: (x:number, y:number, isset:boolean)=>void;
   point: (x:number, y:number)=>boolean;
   setCursor: (pos:number)=>void;
   setCursorXY: (x:number, y:number)=>void;
   setColors: (foreground:number, background:number)=>void;
}

export interface IConsoleDrawable {
    drawSeq: (ds:number, owner:twrWasmModuleBase)=>void,
 }

 export interface IConsoleDrawableProxy {
   drawSeq: (ds:number)=>void,
}

export interface IConsoleTerminal extends IConsoleBase, IConsoleStream, IConsoleAddressable {}
export interface IConsoleTerminalProxy extends IConsoleBaseProxy, IConsoleStreamProxy, IConsoleAddressable {}

export interface IConsoleDiv extends IConsoleBase, IConsoleStream {}
export interface IConsoleDivProxy extends IConsoleBaseProxy, IConsoleStreamProxy  {}

export interface IConsoleDebug extends IConsoleBase, IConsoleStream {}
export interface IConsoleDebugProxy extends IConsoleBaseProxy, IConsoleStreamProxy  {}

export interface IConsoleCanvas extends IConsoleBase, IConsoleDrawable {}
export interface IConsoleCanvasProxy extends IConsoleBaseProxy, IConsoleDrawableProxy {}

export interface IConsole extends IConsoleBase, Partial<IConsoleStream>, Partial<IConsoleAddressable>, Partial<IConsoleDrawable> {}
export interface IConsoleProxy extends IConsoleBaseProxy, Partial<IConsoleStreamProxy>, Partial<IConsoleAddressable>, Partial<IConsoleDrawableProxy> {}


// ProxyParams are the info needed to instantiate the proxy version of a console
export type TConsoleDebugProxyParams = ["twrConsoleDebugProxy", number];
export type TConsoleDivProxyParams = ["twrConsoleDivProxy", number, SharedArrayBuffer];
export type TConsoleTerminalProxyParams = ["twrConsoleTerminalProxy", number, SharedArrayBuffer, SharedArrayBuffer];
export type TConsoleCanvasProxyParams = ["twrConsoleCanvasProxy", number, ICanvasProps, SharedArrayBuffer, SharedArrayBuffer];
export type TConsoleProxyParams = TConsoleTerminalProxyParams | TConsoleDivProxyParams | TConsoleDebugProxyParams | TConsoleCanvasProxyParams;

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

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

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

