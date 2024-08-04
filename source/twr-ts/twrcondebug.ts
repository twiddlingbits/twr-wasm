

import {IConsoleStream, IConsoleStreamProxy, IOTypes} from "./twrcon.js"
import {twrCodePageToUnicodeCodePointImpl, codePageUTF32} from "./twrlocale.js"
import {twrConsoleRegistry} from "./twrconreg.js"

export type TConsoleDebugProxyParams = ["twrConsoleDebugProxy", number];
export type TConsoleDebugProxyClass = typeof twrConsoleDebugProxy;

export class twrConsoleDebug implements IConsoleStream {
	logline="";
	element=null;
	id:number;

	constructor() {
		this.id=twrConsoleRegistry.registerConsole(this);
	}

	charOut(ch:number, codePage:number) {
      const char=twrCodePageToUnicodeCodePointImpl(ch, codePage);

		if (char==10 || char==3) {  // ASCII 03 is End-of-Text, and is used here to indicate the preceding char should be printed
			console.log(this.logline);	// ideally without a linefeed, but there is no way to not have a LF with console.log API.
			this.logline="";
		}
		else {
			this.logline=this.logline+String.fromCodePoint(char);
			if (this.logline.length>=300) {
				console.log(this.logline);
				this.logline="";
			}
		}
	}

	getProp(propName: string):number {
		if (propName==="type") return IOTypes.CHARWRITE;  
		console.log("twrConsoleDebug.getProp passed unknown property name: ", propName)
		return 0;
	}

	getProxyParams() : TConsoleDebugProxyParams {
		return ["twrConsoleDebugProxy", this.id];
	}

	keyDown(ev:KeyboardEvent)  {
		throw new Error("twrConsoleDebug does not support character input");
	}

   processMessage(msgType:string, data:[number, ...any[]]):boolean {
		const [id, ...params] = data;
		if (id!=this.id) return false;

		switch (msgType) {
			case "debug-charout":
			{
				const [ch, codePage] =  params;
				this.charOut(ch, codePage);
			}
				break;

			case "debug-stringout":
			{
				const [str] =  params;
				this.stringOut(str);
			}
				break;

			default:
				return false;
		}

		return true;
	}

	stringOut(str:string) {
		for (let i=0; i < str.length; i++)
			this.charOut(str.codePointAt(i)||0, codePageUTF32);
	}
}


export class twrConsoleDebugProxy implements IConsoleStreamProxy {
	id:number;

	constructor(params:TConsoleDebugProxyParams) {
		this.id=params[1];
	}

	charIn() {  
		return 0;
	}
	
	charOut(ch:number, codePoint:number) {
		postMessage(["debug-charout", [this.id, ch, codePoint]]);
	}

	stringOut(str:string):void
	{
		postMessage(["debug-stringout", [this.id, str]]);
	}

	getProp(propName: string) {
		if (propName==="type") return IOTypes.CHARWRITE;
		console.log("twrConsoleDebugProxy.getProp passed unknown property name: ", propName)
		return 0;
	}
}


// ************************************************************************
// debugLog doesn't currently wait for the message to log, it returns immediately.
// I could move this to be in the twrWaitingCalls class
