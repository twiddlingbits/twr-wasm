//TODO:
// add io_get_type?
// i can't figure out how to have this param be a keyof instead of string, with separate params for Stream and Terminal:  getProp: (propName: string)=>number;
// change printf, and other optimizations if they exist, to call io_putstr
// implement or deprecate io_begin_draw 
// remove from IModParams: imports:{[index:string]:Function},
// implement 	//	IModOpts.imports in twrWasmModuleInJSMain
// add ability to determine if a console has the input focus
// remove support for io:{[key:string]: IConsole};
// add codepage as arg to charout.io_putc to make it more flexible and to align with how setc32 works in io_functions
// add ability to set a max size for a div con, or to trim it.
// add helloworld-b to index.html?
// finish inkey
// add io_setrange example/test case
// get rid of this.io and just use ioIDtoNames?
// add ability to use string colors in io_functions and terminal?
// add io_get/set_colors support for div console
// must match IO_TYPEs in twr_io.h
export class IOTypes {
    static CHARREAD = (1 << 0); // Stream In
    static CHARWRITE = (1 << 1); // Stream Out
    static ADDRESSABLE_DISPLAY = (1 << 2); // IoDisplay is enabled
    static CANVAS2D = (1 << 3); // unimplemented yet
    static EVENTS = (1 << 4); // unimplemented yet
    // Private constructor to prevent instantiation
    constructor() { }
}
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
function keyEventProcess(ev) {
    if (!ev.isComposing && !ev.metaKey && ev.key != "Control" && ev.key != "Alt") {
        //console.log("keyDownDiv: ",ev.key, ev.code, ev.key.codePointAt(0), ev);
        if (ev.key.length == 1)
            return ev.key.codePointAt(0);
        else {
            switch (ev.key) {
                case 'Backspace': return 8;
                case 'Enter': return 10;
                case 'Escape': return 0x1B;
                case 'Delete': return 0x7F;
                case 'ArrowLeft': return 0x2190;
                case 'ArrowUp': return 0x2191;
                case 'ArrowRight': return 0x2192;
                case 'ArrowDown': return 0x2193;
            }
            console.log("keyEventProcess SKIPPED: ", ev.key, ev.code, ev.key.codePointAt(0), ev);
        }
    }
    else {
        console.log("keyEventProcess SKIPPED-2: ", ev.key, ev.code, ev.key.codePointAt(0), ev);
    }
    return undefined;
}
// this is a utility function used by console classes, 
// and should be called from HTML "keydown" event 
export function keyDownUtil(destinationCon, ev) {
    if (!destinationCon.keys)
        throw new Error("keyDown requires twrModuleAsync");
    else {
        const r = keyEventProcess(ev);
        if (r)
            destinationCon.keys.write(r);
    }
}
//# sourceMappingURL=twrcon.js.map