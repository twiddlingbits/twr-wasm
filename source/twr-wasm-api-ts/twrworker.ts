//
// this script is the WebWorker thead used by class twrWasmAsyncModule
//

import {twrWasmModule, ItwrModOpts} from "./twrmod.js";
import {twrSharedCircularBuffer} from "./twrcircular.js";
import { ICanvasMetrics } from "./twrcanvas.js";

let divKeys:twrSharedCircularBuffer;
let canvasKeys:twrSharedCircularBuffer;
let canvasTextMetrics:ICanvasMetrics;
let mod:twrWasmModule;

onmessage = function(e) {
    //console.log('twrworker.js: message received from main script: '+e.data);

    if (e.data[0]=='startup') {
        const memory:WebAssembly.Memory=e.data[1]
        divKeys = new twrSharedCircularBuffer(e.data[2]);
        canvasKeys = new twrSharedCircularBuffer(e.data[3]);
        const wasmFile = e.data[4];
        let opts = e.data[5] as ItwrModOpts;
        canvasTextMetrics=e.data[6];
        
        const myimports={
            twrDebugLog:proxyDebugLog,
            twrDivCharOut:proxyDivCharOut, 
            twrDivCharIn:proxDivCharIn,      
            twrCanvasCharIn:proxyCanvasCharIn,
            twrCanvasCharOut:proxyCanvasCharOut,
            twrCanvasInkey:proxyCanvasInkey,
            twrCanvasGetAvgCharWidth:proxyCanvasGetAvgCharWidth,
            twrCanvasGetCharHeight:proxyCanvasGetCharHeight,
            twrCanvasGetColorWhite:proxyCanvasGetColorWhite,
            twrCanvasGetColorBlack:proxyCanvasGetColorBlack,
            twrCanvasFillRect:proxyCanvasFillRect
        };

        mod=new twrWasmModule({memory: memory, ...opts});

        mod.loadWasm(wasmFile, myimports).then( ()=> {
            postMessage(["startupOkay"]);
        }).catch( (ex)=> {
            console.log(".catch: ", ex);
            postMessage(["startupFail", ex]);
        });
    }
    else if (e.data[0]=='executeC') {
         mod.executeCImpl(e.data[1], e.data[2]).then( (rc)=> {
            postMessage(["executeCOkay", rc]);
        }).catch(e => {
            console.log("exception in executeC twrworker.js\n");
            console.log(e);
            postMessage(["executeCFail", e]);
        });
    }
    else {
        console.log("twrworker.js: unknown message: "+e);
    }
}

// ************************************************************************
// These are the WebAssembly.ModuleImports that the twr_wasm_* C code calls
// iostd.c
// ************************************************************************
function proxyDivCharOut(ch:number) {
    postMessage(["divout", ch]);
}

function  proxDivCharIn() {  
    return divKeys.readWait();  // wait for a key, then read it
}

// ************************************************************************
// These are the WebAssembly.ModuleImports that the twr_wasm_* C code calls
// iodebug.c
// ************************************************************************

function proxyDebugLog(ch:number) {
    postMessage(["debug", ch]);
}


// ************************************************************************
// These are the WebAssembly.ModuleImports that the twr_wasm_* C code calls
// iowindow.c
// ************************************************************************

function  proxyCanvasCharIn() {  
   //ctx.commit(); not avail in chrome

   //postMessage(["debug", 'x']);


    return canvasKeys.readWait();  // wait for a key, then read it
}

function proxyCanvasInkey() {
    if (canvasKeys.isEmpty())
        return 0;
    else
        return proxyCanvasCharIn();    
}

function proxyCanvasGetAvgCharWidth() {
    return canvasTextMetrics.charWidth;
}

function proxyCanvasGetCharHeight() {
    return canvasTextMetrics.charHeight;
}

function proxyCanvasGetColorWhite() {
    return canvasTextMetrics.white;
}

function proxyCanvasGetColorBlack() {
    return canvasTextMetrics.black;
}

function proxyCanvasFillRect(x:number, y:number, w:number, h:number, color:number) {
    postMessage(["fillrect", [x,y,w,h,color]]);
}

function proxyCanvasCharOut(x:number, y:number, ch:number)   // the way this is used, it could be implemented as 1 char which would be simpler
{
    postMessage(["filltext", [x,y,ch]]);
}