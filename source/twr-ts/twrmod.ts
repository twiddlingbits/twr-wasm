import {twrDebugLogImpl} from "./twrdebug.js"
import {IModOpts} from "./twrmodbase.js";
import {twrWasmModuleInJSMain} from "./twrmodjsmain.js"
import {twrCanvas} from "./twrcanvas.js";
import {twrTimeEpochImpl} from "./twrdate.js"
import {twrTimeTmLocalImpl, twrUserLconvImpl, twrUserLanguageImpl, twrRegExpTest1252Impl, twrToLower1252Impl, twrToUpper1252Impl} from "./twrlocale.js"



export class twrWasmModule extends twrWasmModuleInJSMain {
	 malloc:(size:number)=>Promise<number>;


	constructor(opts:IModOpts={}) {
		super(opts, true);
		this.malloc=(size:number)=>{throw new Error("error - un-init malloc called")};
		
		let canvas:twrCanvas;
		if (this.d2dcanvas.isValid()) canvas=this.d2dcanvas;
		else canvas=this.iocanvas;

		this.modParams.imports={
			twrDebugLog:twrDebugLogImpl,
			twrTimeEpoch:twrTimeEpochImpl,
			twrTimeTmLocal:twrTimeTmLocalImpl.bind(this),
			twrUserLconv:twrUserLconvImpl.bind(this),
			twrUserLanguage:twrUserLanguageImpl.bind(this),
			twrRegExpTest1252:twrRegExpTest1252Impl.bind(this),
			twrToLower1252:twrToLower1252Impl.bind(this),
			twrToUpper1252:twrToUpper1252Impl.bind(this),
			
			twrDivCharOut:this.iodiv.charOut.bind(this.iodiv),
			twrCanvasGetProp:canvas.getProp.bind(canvas),
			twrCanvasDrawSeq:canvas.drawSeq.bind(canvas),
			twrCanvasCharIn:this.null,
			twrCanvasInkey:this.null,
			twrDivCharIn:this.null,
			twrSleep:this.null,

			twrSin:Math.sin,
			twrCos:Math.cos,
			twrTan: Math.tan,
			twrFAbs: Math.abs,
			twrACos: Math.acos,
			twrASin: Math.asin,
			twrATan: Math.atan,
			twrExp: Math.exp,
			twrFloor: Math.floor,
			twrCeil: Math.ceil,
			twrFMod: function(x:number, y:number) {return x%y},
			twrLog: Math.log,
			twrPow: Math.pow,
			twrSqrt: Math.sqrt,
			twrTrunc: Math.trunc,

			twrDtoa: this.floatUtil.dtoa.bind(this.floatUtil),
			twrToFixed: this.floatUtil.toFixed.bind(this.floatUtil),
			twrToExponential: this.floatUtil.toExponential.bind(this.floatUtil),
			twrAtod: this.floatUtil.atod.bind(this.floatUtil),
			twrFcvtS: this.floatUtil.fcvtS.bind(this.floatUtil),
		}
	}

	null(inval?:any) {
		throw new Error("call to unimplemented twrXXX import in twrWasmModule.  Use twrWasmModuleAsync ?");
	}
}




