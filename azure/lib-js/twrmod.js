import { parseModOptions } from "./twrmodutil.js";
import { logToCon } from "./twrcon.js";
import { twrLibraryInstanceRegistry } from "./twrlibrary.js";
import { twrWasmBase } from "./twrwasmbase.js";
import { twrEventQueueReceive } from "./twreventqueue.js";
import { twrLibBuiltIns } from "./twrlibbuiltin.js";
/*********************************************************************/
export class twrWasmModule extends twrWasmBase {
    io;
    ioNamesToID;
    isTwrWasmModuleAsync = false;
    // divLog is deprecated.  Use IConsole.putStr or log
    divLog;
    log;
    // IWasmMemory
    // These are deprecated, use wasmMem instead.
    memory;
    mem8;
    mem32;
    memD;
    stringToU8;
    copyString;
    getLong;
    setLong;
    getDouble;
    setDouble;
    getShort;
    getString;
    getU8Arr;
    getU32Arr;
    malloc;
    free;
    putString;
    putU8;
    putArrayBuffer;
    /*********************************************************************/
    constructor(opts = {}) {
        super();
        [this.io, this.ioNamesToID] = parseModOptions(opts);
        this.log = logToCon.bind(undefined, this.io.stdio);
        this.divLog = this.log;
    }
    /*********************************************************************/
    async loadWasm(pathToLoad) {
        // load builtin libraries
        await twrLibBuiltIns();
        const twrConGetIDFromNameImpl = (nameIdx) => {
            const name = this.wasmMem.getString(nameIdx);
            const id = this.ioNamesToID[name];
            if (id)
                return id;
            else
                return -1;
        };
        let imports = {};
        for (let i = 0; i < twrLibraryInstanceRegistry.libInterfaceInstances.length; i++) {
            const lib = twrLibraryInstanceRegistry.libInterfaceInstances[i];
            imports = { ...imports, ...lib.getImports(this) };
        }
        imports = {
            ...imports,
            twrConGetIDFromName: twrConGetIDFromNameImpl,
        };
        await super.loadWasm(pathToLoad, imports);
        if (!(this.wasmMem.memory.buffer instanceof ArrayBuffer))
            console.log("twrWasmModule does not require shared Memory. Okay to remove wasm-ld --shared-memory --no-check-features");
        // backwards compatible
        this.memory = this.wasmMem.memory;
        this.mem8 = this.wasmMem.mem8;
        this.mem32 = this.wasmMem.mem32;
        this.memD = this.wasmMem.memD;
        this.malloc = this.wasmMem.malloc;
        this.free = this.wasmMem.free;
        this.stringToU8 = this.wasmMem.stringToU8;
        this.copyString = this.wasmMem.copyString;
        this.getLong = this.wasmMem.getLong;
        this.setLong = this.wasmMem.setLong;
        this.getDouble = this.wasmMem.getDouble;
        this.setDouble = this.wasmMem.setDouble;
        this.getShort = this.wasmMem.getShort;
        this.getString = this.wasmMem.getString;
        this.getU8Arr = this.wasmMem.getU8Arr;
        this.getU32Arr = this.wasmMem.getU32Arr;
        this.putString = this.wasmMem.putString;
        this.putU8 = this.wasmMem.putU8;
        this.putArrayBuffer = this.wasmMem.putArrayBuffer;
        // init C runtime
        const init = this.exports.twr_wasm_init;
        init(this.ioNamesToID.stdio, this.ioNamesToID.stderr, this.ioNamesToID.std2d == undefined ? -1 : this.ioNamesToID.std2d, this.wasmMem.mem8.length);
    }
    /*********************************************************************/
    // given a url, load its contents, and stuff into Wasm memory similar to Unint8Array
    // TODO!! Doc that this is no longer a CallC option, and must be called here manually
    async fetchAndPutURL(fnin) {
        if (!(typeof fnin === 'object' && fnin instanceof URL))
            throw new Error("fetchAndPutURL param must be URL");
        try {
            let response = await fetch(fnin);
            let buffer = await response.arrayBuffer();
            let src = new Uint8Array(buffer);
            let dest = this.wasmMem.putU8(src);
            return [dest, src.length];
        }
        catch (err) {
            console.log('fetchAndPutURL Error. URL: ' + fnin + '\n' + err + (err.stack ? "\n" + err.stack : ''));
            throw err;
        }
    }
    postEvent(eventID, ...params) {
        //TODO!! PostEvent into eventQueueSend, then processEvents -- to enable non callback events when i add them
        if (!(eventID in twrEventQueueReceive.onEventCallbacks))
            throw new Error("twrWasmModule.postEvent called with invalid eventID: " + eventID + ", params: " + params);
        const onEventCallback = twrEventQueueReceive.onEventCallbacks[eventID];
        if (onEventCallback)
            onEventCallback(eventID, ...params);
        else
            throw new Error("twrWasmModule.postEvent called with undefined callback.  eventID: " + eventID + ", params: " + params);
    }
    peekEvent(eventName) {
        // get earliest inserted entry in event Map
        //const ev=this.events.get(eventName)
    }
}
//# sourceMappingURL=twrmod.js.map