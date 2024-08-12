import {IModOpts, twrWasmModule, twrWasmModuleAsync} from "twr-wasm";

let getMod: () => twrWasmModule | twrWasmModuleAsync;
async function sha256(memPtr: number, ) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);                    

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string                  
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

const is_async = window.location.hash=="#async";

const opts: IModOpts = {imports: {test_func: ()=>10}};
const mod = is_async ? new twrWasmModuleAsync(opts) : new twrWasmModule(opts);
getMod = () => mod;
await mod.loadWasm(is_async ? "./tests-a.wasm" : "./tests.wasm");

await mod.callC(["test"]);