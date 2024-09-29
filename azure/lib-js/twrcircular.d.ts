export declare class twrSharedCircularBuffer {
    saBuffer: SharedArrayBuffer;
    f64Array: Float64Array;
    i32Array: Int32Array;
    constructor(sa?: SharedArrayBuffer);
    private silentWrite;
    writeArray(arr: number[]): void;
    write(n: number): void;
    read(): number | undefined;
    readWait(): number;
    isEmpty(): boolean;
}
//# sourceMappingURL=twrcircular.d.ts.map