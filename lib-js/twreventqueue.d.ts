import { twrSharedCircularBuffer } from "./twrcircular.js";
import { twrWasmModuleAsyncProxy } from "./twrmodasyncproxy.js";
export declare class twrEventQueueSend {
    circBuffer: twrSharedCircularBuffer;
    postEvent(eventID: number, ...params: number[]): void;
    postMalloc(mallocID: number, size: number): void;
}
export type TOnEventCallback = (eventID: number, ...args: number[]) => void;
export declare class twrEventQueueReceive {
    circBuffer: twrSharedCircularBuffer;
    pendingEventIDs: number[];
    pendingEventArgs: (number[])[];
    ownerMod: twrWasmModuleAsyncProxy;
    static unqiueInt: number;
    static onEventCallbacks: (TOnEventCallback | undefined)[];
    constructor(ownerMod: twrWasmModuleAsyncProxy, eventQueueBuffer: SharedArrayBuffer);
    private readEventRemainder;
    private readMallocRemainder;
    private readCommandRemainder;
    private readCommand;
    private readWaitCommand;
    private findEvent;
    waitEvent(filterEvent: number): [eventID: number, args: number[]];
    private doCallbacks;
    processIncomingCommands(): void;
    static registerCallback(funcName: string, onEventCallback: TOnEventCallback): number;
    static registerEvent(): number;
}
//# sourceMappingURL=twreventqueue.d.ts.map