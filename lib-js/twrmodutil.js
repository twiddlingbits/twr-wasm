// This class extends base to handle options when called in the main Java Script thread
import { twrConsoleDiv } from "./twrcondiv.js";
import { twrConsoleCanvas } from "./twrconcanvas.js";
import { twrConsoleTerminal } from "./twrconterm.js";
import { twrConsoleDebug } from "./twrcondebug.js";
export function parseModOptions(opts = {}) {
    let io;
    let ioNamesToID;
    if (typeof document === 'undefined')
        throw new Error("twrWasmModuleJSMain should only be created in JavaScript Main.");
    // io contains a mapping of names to IConsole
    // stdio, stderr are required (but if they are not passed in, we will find defaults here)
    // there can be an arbitrary number of IConsoles passed to a module for use by the module
    if (opts.io) {
        io = opts.io;
    }
    else {
        io = {};
    }
    if (!io.stdio) {
        const eiodiv = document.getElementById("twr_iodiv");
        const eiocanvas = document.getElementById("twr_iocanvas");
        if (opts.stdio) {
            io.stdio = opts.stdio;
        }
        else if (eiodiv) {
            io.stdio = new twrConsoleDiv(eiodiv, { foreColor: opts.forecolor, backColor: opts.backcolor, fontSize: opts.fontsize });
        }
        else if (eiocanvas) {
            io.stdio = new twrConsoleTerminal(eiocanvas, {
                foreColor: opts.forecolor,
                backColor: opts.backcolor,
                fontSize: opts.fontsize,
                widthInChars: opts.windim?.[0],
                heightInChars: opts.windim?.[1],
            });
        }
        else {
            io.stdio = new twrConsoleDebug();
            console.log("Stdio console is not specified.  Using twrConsoleDebug.");
        }
    }
    if (!io.stderr) {
        io.stderr = new twrConsoleDebug();
    }
    if (!io.std2d) {
        if (opts.d2dcanvas) {
            io.std2d = opts.d2dcanvas;
        }
        else {
            const ed2dcanvas = document.getElementById("twr_d2dcanvas");
            if (ed2dcanvas)
                io.std2d = new twrConsoleCanvas(ed2dcanvas);
        }
    }
    // each module has a mapping of names to console.id
    ioNamesToID = {};
    Object.keys(io).forEach(key => {
        ioNamesToID[key] = io[key].id;
    });
    return [io, ioNamesToID];
}
//# sourceMappingURL=twrmodutil.js.map