import { twrEventQueueReceive } from "./twreventqueue.js";
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
export class twrLibrary {
    // set to unique name if multiple instances allowed (must all expose the same interface) (e.g. consoles).  
    // When true, APIs will expect first arg to be library ID.
    interfaceName;
    constructor() {
    }
    // the actual twrLibrary is created outside of a specific wasm module, so isn't paired to a specific module
    // however, each call to getImports is paired to a specific wasm module
    // getImports returns Wasm Module imports that will be added to this wasm module's WebAssembly.ModuleImports
    // getImports expects that the derived class has created a "this.import" with a list of function names (as strings)
    // getImports is called by twrWasmModule
    getImports(callingMod) {
        if (callingMod.isTwrWasmModuleAsync)
            throw new Error("unsupported module type (expecting twrWasmModule");
        let wasmImports = {};
        const derivedInstanceThis = this;
        if (this.imports === undefined)
            throw new Error("twrLibrary derived class is missing imports.");
        if (this.libSourcePath === undefined)
            throw new Error("twrLibrary derived class is missing libSourcePath.");
        for (let funcName in this.imports) {
            if (this.imports[funcName].isModuleAsyncOnly) {
                const nullFun = () => {
                    throw new Error("Invalid call to unimplemented twrLibrary 'import' function (isModuleAsyncOnly was used): " + funcName);
                };
                wasmImports[funcName] = nullFun;
            }
            else {
                if (!derivedInstanceThis[funcName])
                    throw new Error("twrLibrary 'import' function is missing: " + funcName);
                if (this.interfaceName) {
                    // in this case, this particular instance represents the class
                    // but the actual instance needs to be retrieved at runtime using the libID & registry
                    // since only once set of WasmImports is created for each class
                    const libFunc = (funcName, mod, libID, ...params) => {
                        const lib = twrLibraryInstanceRegistry.getLibraryInstance(libID);
                        const derivedLib = lib;
                        const f = derivedLib[funcName];
                        if (!f)
                            throw new Error(`Library function not found. id=${libID}, funcName=${funcName}`);
                        return f.call(derivedLib, mod, ...params);
                    };
                    wasmImports[funcName] = libFunc.bind(null, funcName, callingMod); // rest of function args are also passed to libFunc when using bind
                }
                else {
                    wasmImports[funcName] = derivedInstanceThis[funcName].bind(this, callingMod);
                }
            }
        }
        return wasmImports;
    }
    // this function is called by twrWasmModuleAsync, and sent to the corresponding twrWasmModuleAsyncProxy
    getProxyParams() {
        return ["twrLibraryProxy", this.id, this.imports, this.libSourcePath, this.interfaceName];
    }
    // called by twrWasmModuleAsync
    async processMessageFromProxy(msg, mod) {
        const [msgClass, libID, funcName, doAwait, returnValueEventID, ...params] = msg;
        if (this.interfaceName && twrLibraryInstanceRegistry.getLibraryInstance(libID).libSourcePath != this.libSourcePath)
            throw new Error("internal error"); // should never happen
        else if (libID != this.id)
            throw new Error("internal error"); // should never happen
        if (!mod.isTwrWasmModuleAsync)
            throw new Error("internal error");
        const libThis = twrLibraryInstanceRegistry.getLibraryInstance(libID);
        const derivedInstance = libThis;
        if (!derivedInstance[funcName])
            throw new Error("twrLibrary derived class missing 'import' function: " + funcName);
        let retVal;
        if (doAwait)
            retVal = await derivedInstance[funcName](mod, ...params);
        else
            retVal = derivedInstance[funcName](mod, ...params);
        if (returnValueEventID > -1) // -1 means noBlock true
            mod.eventQueueSend.postEvent(returnValueEventID, retVal);
    }
}
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
export class twrLibraryProxy {
    id;
    imports;
    libSourcePath;
    interfaceName;
    called = false;
    //every module instance has its own twrLibraryProxy
    constructor(params) {
        const [className, id, imports, libSourcePath, interfaceName] = params;
        this.id = id;
        this.imports = imports;
        this.libSourcePath = libSourcePath;
        this.interfaceName = interfaceName;
    }
    remoteProcedureCall(ownerMod, funcName, isAsyncFunction, returnValueEventID, interfaceName, ...args) {
        let msg;
        if (interfaceName)
            msg = ["twrLibrary", args[0], funcName, isAsyncFunction, returnValueEventID, ...args.slice(1)];
        else
            msg = ["twrLibrary", this.id, funcName, isAsyncFunction, returnValueEventID, ...args];
        // postMessage sends message to the JS Main thread that created the twrModAsyncProxy thread
        // the message processing code discriminates the destination instance by:  "twrLibrary", this.id,
        postMessage(msg);
        //TODO!! a void return type isn't particularly supported -- it will presumably returned undefined from the JS function, 
        //which will put a zero into the Int32Array used for returnValue
        if (returnValueEventID == -1) { // -1 means noBlock true
            return 0;
        }
        const [id, retVals] = ownerMod.eventQueueReceive.waitEvent(returnValueEventID);
        if (id != returnValueEventID)
            throw new Error("internal error");
        if (retVals.length != 1)
            throw new Error("internal error");
        return retVals[0];
    }
    // getProxyImports is called by twrWasmModuleAsyncProxy
    // it provides the functions that the twrWasmModuleAsync's C code will call
    // these will RPC to the JS main thread (unless isCommonCode set) and then wait for a return value (unless noBlock) 
    async getProxyImports(ownerMod) {
        if (this.called === true)
            throw new Error("getProxyImports should only be called once per twrLibraryProxy instance");
        this.called = true;
        let wasmImports = {};
        let libClass;
        // now for each twrLibrary import, create the functions that will be added to wasm module imports
        for (let funcName in this.imports) {
            if (this.imports[funcName].isCommonCode) {
                if (this.imports[funcName].isAsyncFunction)
                    throw new Error("isAsyncFunction can not be used with isCommonCode");
                if (libClass === undefined) {
                    if (this.libSourcePath === undefined)
                        throw new Error("undefined libSourcePath");
                    const libMod = await import(this.libSourcePath);
                    libClass = new libMod.default;
                }
                wasmImports[funcName] = libClass[funcName].bind(libClass, ownerMod);
            }
            else {
                if (this.imports[funcName].isAsyncFunction) {
                    wasmImports[funcName] = this.remoteProcedureCall.bind(this, ownerMod, funcName + "_async", this.imports[funcName].isAsyncFunction ? true : false, this.imports[funcName].noBlock ? -1 : twrEventQueueReceive.registerEvent(), this.interfaceName);
                }
                else {
                    wasmImports[funcName] = this.remoteProcedureCall.bind(this, ownerMod, funcName, this.imports[funcName].isAsyncFunction ? true : false, this.imports[funcName].noBlock ? -1 : twrEventQueueReceive.registerEvent(), this.interfaceName);
                }
            }
        }
        return wasmImports;
    }
}
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
// this is global in the JS main thread address space
// all libraries are registered here
export class twrLibraryInstanceRegistry {
    // every twrLibrary instance goes here
    static libInstances = [];
    // Each unique interface has one representative and arbitrary instance in libInterfaceInstances.
    // A unique interfaceName represents a unique interface.  Multiple classes may have the same interfaceName.
    // (A class is identified by libSourcePath)
    // An undefined interfaceName (anonymous interface) means that only one instance of that class is allowed
    // and also means that the class has a unique anonymous interface.
    static libInterfaceInstances = [];
    // create a pairing between an instance of type ILibraryBase and an integer ID
    static register(libInstance) {
        if (libInstance.imports === undefined)
            throw new Error("twrLibrary derived class is missing imports.");
        if (libInstance.libSourcePath === undefined)
            throw new Error("twrLibrary derived class is missing libSourcePath.");
        // register the new instance
        twrLibraryInstanceRegistry.libInstances.push(libInstance);
        const id = twrLibraryInstanceRegistry.libInstances.length - 1;
        // if this has a named interface, add it to the interface list, but only add it once.
        if (libInstance.interfaceName) {
            const interfaceID = this.getLibraryInstanceByInterfaceName(libInstance.interfaceName);
            if (interfaceID === undefined)
                twrLibraryInstanceRegistry.libInterfaceInstances.push(libInstance);
            else {
                // verify the interface are compatible.  If they don't its a coding error
                const alreadyRegisteredLibInstance = twrLibraryInstanceRegistry.libInterfaceInstances[interfaceID];
                for (let i = 0; i < twrLibraryInstanceRegistry.libInterfaceInstances.length; i++)
                    if (twrLibraryInstanceRegistry.libInterfaceInstances[i].interfaceName === libInstance.interfaceName)
                        if (!CompareImports(twrLibraryInstanceRegistry.libInterfaceInstances[i].imports, libInstance.imports))
                            throw new Error(`interface definitions (imports) ${libInstance.interfaceName} are not compatible between class ${libInstance.libSourcePath} and ${alreadyRegisteredLibInstance.libSourcePath}`);
                // TODO!!  This is here to make twrcondummy.ts work correctly (a console without a complete interface might be loaded before twrcondummy.ts)
                if (Object.keys(libInstance.imports).length > Object.keys(alreadyRegisteredLibInstance.imports).length)
                    twrLibraryInstanceRegistry.libInterfaceInstances[interfaceID] = libInstance;
            }
        }
        // else this the type of Class that should only have a single instance
        else {
            // then check for the error where a Class is registered more than once
            if (this.getLibraryInstanceByClass(libInstance.libSourcePath))
                throw new Error("A second twrLibrary instance was registered but interfaceName===undefined");
            // if no error, than add anonymous interface to the list
            twrLibraryInstanceRegistry.libInterfaceInstances.push(libInstance);
        }
        return id;
    }
    static getLibraryInstance(id) {
        if (id < 0 || id >= twrLibraryInstanceRegistry.libInstances.length)
            throw new Error("Invalid console ID: " + id);
        return twrLibraryInstanceRegistry.libInstances[id];
    }
    static getLibraryInstanceByInterfaceName(name) {
        for (let i = 0; i < twrLibraryInstanceRegistry.libInterfaceInstances.length; i++)
            if (twrLibraryInstanceRegistry.libInterfaceInstances[i].interfaceName === name)
                return i;
        return undefined;
    }
    static getLibraryInstanceByClass(path) {
        for (let i = 0; i < twrLibraryInstanceRegistry.libInterfaceInstances.length; i++)
            if (twrLibraryInstanceRegistry.libInstances[i].libSourcePath === path)
                return twrLibraryInstanceRegistry.libInstances;
        return undefined;
    }
    static getLibraryInstanceID(libInstance) {
        for (let i = 0; i < twrLibraryInstanceRegistry.libInstances.length; i++)
            if (twrLibraryInstanceRegistry.libInstances[i] == libInstance)
                return i;
        throw new Error("libInstance not in registry");
    }
}
// this is created in each twrWasmModuleAsyncProxy Worker thread
// if there are multiple twrWasmModuleAsyncProxy instances, there will one Registry in each Worker
// TODO!! This isn't used or probably correct
export class twrLibraryInstanceProxyRegistry {
    static libProxyInstances = [];
    // create a pairing between an instance of type IConsole and an integer ID
    static registerProxy(libProxyInstance) {
        twrLibraryInstanceProxyRegistry.libProxyInstances[libProxyInstance.id] = libProxyInstance;
        return libProxyInstance.id;
    }
    static getLibraryInstanceProxy(id) {
        if (id < 0 || id >= twrLibraryInstanceProxyRegistry.libProxyInstances.length)
            throw new Error("Invalid console ID: " + id);
        return twrLibraryInstanceProxyRegistry.libProxyInstances[id];
    }
    static getLibraryInstanceID(libProxyInstance) {
        for (let i = 0; i < twrLibraryInstanceProxyRegistry.libProxyInstances.length; i++)
            if (twrLibraryInstanceProxyRegistry.libProxyInstances[i] == libProxyInstance)
                return i;
        throw new Error("libProxyInstance not in registry");
    }
}
function shallowEqual(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    // If the objects have different numbers of keys, they aren't equal
    if (keys1.length !== keys2.length) {
        return false;
    }
    // Check if all keys and their values are equal
    return keys1.every(key => obj1[key] === obj2[key]);
}
function CompareImports(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    // they don't have to have the same number of imports, but every import that exists in both needs to match
    for (let i = 0; i < keys1.length; i++) {
        const k = keys1[i];
        if (obj2[k] && !shallowEqual(obj1[k], obj2[k]))
            return false;
    }
    for (let i = 0; i < keys2.length; i++) {
        const k = keys2[i];
        if (obj1[k] && !shallowEqual(obj1[k], obj2[k]))
            return false;
    }
    return true;
}
//# sourceMappingURL=twrlibrary.js.map