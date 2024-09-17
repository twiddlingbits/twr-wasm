//TODO:
// add io_get_type?
// i can't figure out how to have this param be a keyof instead of string, with separate params for Stream and Terminal:  getProp: (propName: string)=>number;
// change printf, and other optimizations if they exist, to call io_putstr
// implement or deprecate io_begin_draw 
// remove from IModParams: imports:{[index:string]:Function},
// implement 	//	IModOpts.imports in twrWasmModuleInJSMain
// add ability to determine if a console has the input focus
// remove support for io:{[key:string]: IConsole};
// add codepage as arg to charout.io_putc to make it more flexible and to align with how setc32 works in io_functions
// add ability to set a max size for a div con, or to trim it.
// add helloworld-b to index.html?
// finish inkey
// add io_setrange example/test case
// get rid of this.io and just use ioIDtoNames?
// add ability to use string colors in io_functions and terminal?
// add io_get/set_colors support for div console

import {IWasmModuleAsync} from "./twrmodasync.js";
import {IWasmModule} from "./twrmod.js";

// Params are passed to the console constructor
export interface IConsoleDivParams {
   foreColor?: string,
   backColor?: string,
   fontSize?: number,
}

export interface IConsoleTerminalParams extends IConsoleDivParams {
   widthInChars?: number,
   heightInChars?: number,
}

// Props of a console can be queried with getProp
export interface IConsoleBaseProps {
   type: number,   // a constant from class IOTypes
   [key: string]: number;  // required because I access with a string. 
}

export interface IConsoleTerminalProps extends IConsoleBaseProps {
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

export interface ICanvasProps extends IConsoleBaseProps{
   canvasWidth:number,
   canvasHeight:number
}

// Interface for Consoles
export interface IConsoleBase {
   getProp: (propName: string)=>number;
   twrConGetProp: (callingMod:IWasmModule|IWasmModuleAsync, pn:number)=>number;

	id:number;  
   element?:HTMLElement;   // debug console does not have an element
}

export interface IConsoleStreamOut {
   twrConCharOut: (callingMod:IWasmModule|IWasmModuleAsync, c:number, codePage:number)=>void;
   twrConPutStr: (callingMod:IWasmModule|IWasmModuleAsync,  chars:number, codePage:number)=>void;
   charOut: (ch:string)=>void;
   putStr: (str:string)=>void;
}

export interface IConsoleStreamIn {
   twrConCharIn_async: (callingMod:IWasmModuleAsync)=>Promise<number>;
	twrConSetFocus: (callingMod:IWasmModuleAsync)=>void;

   //this should be called by JSMain thread to inject key events
	keyDown: (ev:KeyboardEvent)=>void;
}

export interface IConsoleAddressable {
   twrConCls: (callingMod:IWasmModule|IWasmModuleAsync)=>void;
   setRangeJS: (start:number, values:[])=>void;
   twrConSetRange: (callingMod:IWasmModule|IWasmModuleAsync, chars:number, start:number, len:number)=>void;
   twrConSetC32: (callingMod:IWasmModule|IWasmModuleAsync, location:number, char:number)=>void;
   twrConSetReset: (callingMod:IWasmModule|IWasmModuleAsync,x:number, y:number, isset:boolean)=>void;
   twrConPoint: (callingMod:IWasmModule|IWasmModuleAsync, x:number, y:number)=>boolean;
   twrConSetCursor: (callingMod:IWasmModule|IWasmModuleAsync, pos:number)=>void;
   twrConSetCursorXY: (callingMod:IWasmModule|IWasmModuleAsync, x:number, y:number)=>void;
   twrConSetColors: (callingMod:IWasmModule|IWasmModuleAsync, foreground:number, background:number)=>void;
}

export interface IConsoleDrawable {
    twrConDrawSeq: (mod:IWasmModuleAsync|IWasmModule, ds:number)=>void,
    twrConLoadImage_async: (mod:IWasmModuleAsync, urlPtr: number, id: number)=>Promise<number>,
   }

export interface IConsoleTerminal extends IConsoleBase, IConsoleStreamOut, IConsoleStreamIn, IConsoleAddressable {}
export interface IConsoleDiv extends IConsoleBase, IConsoleStreamOut, IConsoleStreamIn {}
export interface IConsoleDebug extends IConsoleBase, IConsoleStreamOut {}
export interface IConsoleCanvas extends IConsoleBase, IConsoleDrawable {}

export interface IConsole extends IConsoleBase, Partial<IConsoleStreamOut>, Partial<IConsoleStreamIn>, Partial<IConsoleAddressable>, Partial<IConsoleDrawable> {}


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

export function keyEventToCodePoint(ev:KeyboardEvent) {
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

export function logToCon(con:IConsole, ...params: string[]) {
   for (var i = 0; i < params.length; i++) {
      con.putStr!(params[i].toString());
      con.charOut!(' '); // space
   }
   con.charOut!('\n');
}

