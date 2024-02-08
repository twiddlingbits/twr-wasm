export interface ICanvasMetrics {
    charWidth: number;
    charHeight: number;
    white: number;
    black: number;
}
export declare class twrCanvas {
    ctx: CanvasRenderingContext2D | undefined;
    charWidth: number;
    charHeight: number;
    constructor(element: HTMLCanvasElement | null | undefined);
    isvalid(): boolean;
    syncGetMetrics(): ICanvasMetrics;
    getAvgCharWidth(): number;
    getCharHeight(): number;
    getColorWhite(): number;
    getColorBlack(): number;
    fillRect(x: number, y: number, w: number, h: number, color: number): void;
    charOut(x: number, y: number, ch: number): void;
}
//# sourceMappingURL=twrcanvas.d.ts.map