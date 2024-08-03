//TODO:
//	struct IoDisplay: need to add a setc32 equiv for back/fore color
//- in twrWasmModule, twrWasmModuleAsync create the twrTerm or twrDiv or twrDebug as appropriate, then enter them into a JSID table, and pass in JSID to initwasm
// fix ionull.header.type=0;
// add io_get_type
// is there an io_get_width?  add?  (type, width, height are pre-cached)
// i can't figure out how to have this param be a keyof instead of string, with separate params for Stream and Terminal:  getProp: (propName: string)=>number;
// why do i have to do this in the proxy classes:	constructor(params:SharedArrayBuffer[]/*TConsoleDebugProxyParams*/) {
// change printf, and other optimizations if they exist, to call io_putstr
// implement or deprecate io_begin_draw 
// get rid of IoConsoleWindow, and just use IoConsole for everything?
// add a typedef for struct IoConsole
// update docs for IModOpts / stdin,out, etc
// change (check what it used to be) terminal and div console font defaults
// remove from IModParams: imports:{[index:string]:Function},
// implement 	//	IModOpts.imports in twrWasmModuleInJSMain
// term set colors are all RGB 24.  No A.  that was the docs, and sort of the case.  io_set_colors doc was RGB.  But i unified this in more cases.
// fix malloc_unit_test: FAIL
// update docs for these now removed functions:  twr_divcon(void), twr_debugcon(void), twr_windowcon(void);  OR re-implement?

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
   [key: string]: number;  // required because I access with a string.  But would be nice to figure out how to get rid of this.
}

export interface IConsoleStream {
   getProp: (propName: string)=>number;
   charOut: (c:number, codePage:number)=>void,
   stringOut: (str:string)=>void;
   getProxyParams: ()=> TConsoleProxyParams,
   getProxyClassName: ()=> string,
   processMessage: (msgType:string, data:any[]) =>boolean

   element:HTMLElement|null;
   keys?: twrSharedCircularBuffer;  // only created if getProxyParams is called 
}

export interface IConsoleStreamProxy {
   getProp: (propName: string)=>number;
   charOut: (c:number, codePage:number)=>void,
   stringOut: (str:string)=>void;
   charIn: ()=>number,
}

