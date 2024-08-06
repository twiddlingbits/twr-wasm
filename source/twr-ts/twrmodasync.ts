import {IModOpts} from "./twrmodbase.js";
import {IAllProxyParams} from "./twrmodasyncproxy.js"
import {twrWasmModuleInJSMain} from "./twrmodjsmain.js"
import {twrWaitingCalls} from "./twrwaitingcalls.js"
import {IConsole, keyDown, TConsoleProxyParams} from "./twrcon.js";
import {twrConsoleRegistry} from "./twrconreg.js"

// class twrWasmModuleAsync consist of two parts:
//   twrWasmModuleAsync runs in the main JavaScript event loop
//   twrWasmModuleAsyncProxy runs in a WebWorker thread
//      - the wasm module is loaded by the webworker, and C calls into javascript are handed by proxy classes which call the 'main' class via a message
//      - For example:
//          twrConCharOut (exported from JavaScript to C) might call twrConsoleTerminalProxy.CharOut
//          twrConsoleTerminalProxy.CharOut will send the message "term-charout".  
//          Ths message is received by twrWasmModuleAsync.processMsg(), which dispatches a call to twrConsoleTerminal.CharOut().

export type TModAsyncProxyStartupMsg = {
   urlToLoad: string,
   allProxyParams: IAllProxyParams,
};

// Interface for the error event
interface WorkerErrorEvent extends ErrorEvent {
   filename: string;
   lineno: number;
   colno: number;
   message: string;
   error: Error | null;
}
      
export class twrWasmModuleAsync extends twrWasmModuleInJSMain {
   myWorker:Worker;
   malloc:(size:number)=>Promise<number>;
   loadWasmResolve?: (value: void) => void;
   loadWasmReject?: (reason?: any) => void;
   callCResolve?: (value: unknown) => void;
   callCReject?: (reason?: any) => void;
   initLW=false;
   waitingcalls:twrWaitingCalls;
   // d2dcanvas?:twrCanvas; - defined in twrWasmModuleInJSMain
   // io:{[key:string]: IConsole}; - defined in twrWasmModuleInJSMain

   constructor(opts?:IModOpts) {
      super(opts);

      this.malloc=(size:number)=>{throw new Error("Error - un-init malloc called.")};

      if (!window.Worker) throw new Error("This browser doesn't support web workers.");
      this.myWorker = new Worker(new URL('twrmodasyncproxy.js', import.meta.url), {type: "module" });
      this.myWorker.onerror = (event: WorkerErrorEvent) => {
         console.log("this.myWorker.onerror (undefined message typically means Worker failed to load)");
         console.log("event.message: "+event.message)
         throw event;
      };
      this.myWorker.onmessage= this.processMsg.bind(this);

      this.waitingcalls=new twrWaitingCalls();  // handle's calls that cross the worker thread - main js thread boundary

   }

   // overrides base implementation
   async loadWasm(pathToLoad:string) {
      if (this.initLW) 	throw new Error("twrWasmAsyncModule::loadWasm can only be called once per twrWasmAsyncModule instance");
      this.initLW=true;

      return new Promise<void>((resolve, reject)=>{
         this.loadWasmResolve=resolve;
         this.loadWasmReject=reject;

         this.malloc = (size:number) => {
            return this.callCImpl("malloc", [size]) as Promise<number>;
         }

         // base class twrWasmModuleInJSMain member variables include:
         // d2dcanvas:twrCanvas, io:{ [key:string]:IConsole }
         // io.stdio & io.stderr are required to exist and be valid
         // d2dcanvas is optional 
         
         // everything needed to create Proxy versions of all IConsoles, and create the proxy registry
         let conProxyParams:TConsoleProxyParams[] = [];
         for (let i=0; i<twrConsoleRegistry.consoles.length; i++) {
            conProxyParams.push(twrConsoleRegistry.consoles[i].getProxyParams());
         }

         const allProxyParams={
            conProxyParams: conProxyParams,
            ioNamesToID: this.ioNamesToID,
            waitingCallsProxyParams: this.waitingcalls.getProxyParams(),
         };
         const urlToLoad = new URL(pathToLoad, document.URL);
         const startMsg:TModAsyncProxyStartupMsg={ urlToLoad: urlToLoad.href, allProxyParams: allProxyParams};
         this.myWorker.postMessage(['startup', startMsg]);
      });
   }

   async callC(params:[string, ...(string|number|bigint|Uint8Array)[]]) {
      const cparams=await this.preCallC(params); // will also validate params[0]
      const retval=await this.callCImpl(params[0], cparams);
      await this.postCallC(cparams, params);
      return retval;
   }	

   async callCImpl(fname:string, cparams:(number|bigint)[]=[]) {
      return new Promise((resolve, reject)=>{
         this.callCResolve=resolve;
         this.callCReject=reject;
         this.myWorker.postMessage(['callC', fname, cparams]);
      });
   }
   
   // this function is deprecated and here for backward compatibility
   keyDownDiv(ev:KeyboardEvent) {
      let destinationCon:IConsole;
      if (this.io.stdio.element && this.io.stdio.element.id==='twr_iodiv')
         destinationCon=this.io.stdio;
      else if (this.io.stderr.element && this.io.stderr.element.id==='twr_iodiv')
         destinationCon=this.io.stdio;
      else
         return;

      keyDown(destinationCon, ev);
   }

   // this function is deprecated and here for backward compatibility
   keyDownCanvas(ev:KeyboardEvent) {
      let destinationCon:IConsole;
      if (this.io.stdio.element && this.io.stdio.element.id==='twr_iocanvas')
         destinationCon=this.io.stdio;
      else if (this.io.stderr.element && this.io.stderr.element.id==='twr_iocanvas')
         destinationCon=this.io.stdio;
      else
         return;

      keyDown(destinationCon, ev);
   }

   processMsg(event: MessageEvent) {
      const msgType=event.data[0] as string;
      const d=event.data[1];

      //console.log("twrWasmAsyncModule - got message: "+event.data)

      switch (msgType) {
         case "setmemory":
            this.memory=d;
            if (!this.memory) throw new Error("unexpected error - undefined memory");
            this.mem8 = new Uint8Array(this.memory.buffer);
            this.mem32 = new Uint32Array(this.memory.buffer);
            this.memD = new Float64Array(this.memory.buffer);
            //console.log("memory set",this.mem8.length);
            break;

         case "startupFail":
            if (this.loadWasmReject)
               this.loadWasmReject(d);
            else
               throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined loadWasmReject)");
            break;

         case "startupOkay":

            if (this.loadWasmResolve)
               this.loadWasmResolve(undefined);
            else
               throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined loadWasmResolve)");
            break;

         case "callCFail":
            if (this.callCReject)
               this.callCReject(d);
            else
               throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined callCReject)");
            break;

         case "callCOkay":
            if (this.callCResolve)
               this.callCResolve(d);
            else
               throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined callCResolve)");
            break;

         default:
            if (!this.waitingcalls) throw new Error ("internal error: this.waitingcalls undefined.")
            if (this.waitingcalls.processMessage(msgType, d)) break;
            // here if a console  message
            // console messages are an array with the first entry as the console ID
            const con=twrConsoleRegistry.getConsole(d[0]);
            if (con.processMessage(msgType, d, this)) break;
            throw new Error("twrWasmAsyncModule - unknown and unexpected msgType: "+msgType);
      }
   }
}
