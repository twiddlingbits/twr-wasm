export declare class twrSharedCircularBuffer {
    sharedArray: SharedArrayBuffer;
    buf: Int32Array;
    constructor(sa?: SharedArrayBuffer);
    write(n: number): void;
    read(): number;
    readWait(): number;
    isEmpty(): boolean;
}
//# sourceMappingURL=twrcircular.d.ts.map