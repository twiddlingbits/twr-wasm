import { IConsole, IConsoleBase, IConsoleStreamOut, IConsoleCanvas } from "./twrcon.js";
export interface IModOpts {
    stdio?: IConsoleStreamOut & IConsoleBase;
    d2dcanvas?: IConsoleCanvas & IConsoleBase;
    io?: {
        [key: string]: IConsole;
    };
    windim?: [number, number];
    forecolor?: string;
    backcolor?: string;
    fontsize?: number;
    imports?: {};
}
export type IParseModOptsResult = [{
    [key: string]: IConsole;
}, {
    [key: string]: number;
}];
export declare function parseModOptions(opts?: IModOpts): IParseModOptsResult;
//# sourceMappingURL=twrmodutil.d.ts.map