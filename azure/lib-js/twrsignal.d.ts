export declare class twrSignal {
    saBuffer: SharedArrayBuffer;
    i32Array: Int32Array;
    constructor(sa?: SharedArrayBuffer);
    signal(): void;
    wait(): void;
    isSignaled(): boolean;
    reset(): void;
}
//# sourceMappingURL=twrsignal.d.ts.map