export declare class twrSignal {
    sharedArray: SharedArrayBuffer;
    buf: Int32Array;
    constructor(sa?: SharedArrayBuffer);
    signal(): void;
    wait(): void;
    isSignaled(): boolean;
    reset(): void;
}
//# sourceMappingURL=twrsignal.d.ts.map