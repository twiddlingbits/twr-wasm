import { IConsole, IConsoleProxy } from "./twrcon.js";
export declare class twrConsoleRegistry {
    static consoles: IConsole[];
    static registerConsole(con: IConsole): number;
    static getConsole(id: number): IConsole;
    static getConsoleID(con: IConsole): number;
}
export declare class twrConsoleProxyRegistry {
    static consoles: IConsoleProxy[];
    static registerConsoleProxy(con: IConsoleProxy): number;
    static getConsoleProxy(id: number): IConsoleProxy;
    static getConsoleID(con: IConsoleProxy): number;
}
//# sourceMappingURL=twrconreg.d.ts.map