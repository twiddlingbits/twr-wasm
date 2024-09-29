import { twrWasmMemory } from './twrwasmmem.js';
import { twrWasmCall } from "./twrwasmcall.js";
import { twrEventQueueReceive } from './twreventqueue.js';
export class twrWasmBase {
    exports;
    wasmMem;
    wasmCall;
    callC;
    /*********************************************************************/
    getImports(imports) {
        return {
            ...imports,
            twr_register_callback: this.registerCallback.bind(this)
        };
    }
    async loadWasm(pathToLoad, imports) {
        let response;
        try {
            response = await fetch(pathToLoad);
            if (!response.ok)
                throw new Error("Fetch response error on file '" + pathToLoad + "'\n" + response.statusText);
        }
        catch (err) {
            console.log('loadWasm() failed to fetch: ' + pathToLoad);
            throw err;
        }
        let instance;
        try {
            const wasmBytes = await response.arrayBuffer();
            instance = await WebAssembly.instantiate(wasmBytes, { env: this.getImports(imports) });
        }
        catch (err) {
            console.log('Wasm instantiate error: ' + err + (err.stack ? "\n" + err.stack : ''));
            throw err;
        }
        if (this.exports)
            throw new Error("Unexpected error -- this.exports already set");
        if (!instance.instance.exports)
            throw new Error("Unexpected error - undefined instance.exports");
        this.exports = instance.instance.exports;
        const memory = this.exports.memory;
        if (!memory)
            throw new Error("Unexpected error - undefined exports.memory");
        const malloc = this.exports.malloc;
        const free = this.exports.free;
        this.wasmMem = new twrWasmMemory(memory, free, malloc);
        this.wasmCall = new twrWasmCall(this.wasmMem, this.exports);
        this.callC = this.wasmCall.callC.bind(this.wasmCall);
    }
    //see twrWasmModule.constructor - imports - twr_register_callback:this.registerCallback.bind(this), 
    registerCallback(funcNameIdx) {
        const funcName = this.wasmMem.getString(funcNameIdx);
        const onEventCallback = this.exports[funcName];
        return twrEventQueueReceive.registerCallback(funcName, onEventCallback);
    }
}
//# sourceMappingURL=twrwasmbase.js.map