export interface ICanvasMetrics {
    charWidth: number;
    charHeight: number;
    white: number;
    black: number;
}
export declare class twrCanvas {
    ctx: CanvasRenderingContext2D;
    charWidth: number;
    charHeight: number;
    constructor(element: HTMLCanvasElement);
    syncGetMetrics(): ICanvasMetrics;
    getAvgCharWidth(): number;
    getCharHeight(): number;
    getColorWhite(): number;
    getColorBlack(): number;
    fillRect(x: number, y: number, w: number, h: number, color: number): void;
    charOut(x: number, y: number, ch: number): void;
}
//# sourceMappingURL=twrcanvas.d.ts.map