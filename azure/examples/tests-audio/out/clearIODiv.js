import { twrLibrary, twrLibraryInstanceRegistry } from "twr-wasm";
// Libraries use default export
export default class clearIODivLib extends twrLibrary {
    id;
    imports = {
        clearIODiv: {},
    };
    // every library should have this line
    libSourcePath = new URL(import.meta.url).pathname;
    constructor() {
        // all library constructors should start with these two lines
        super();
        this.id = twrLibraryInstanceRegistry.register(this);
    }
    clearIODiv(mod) {
        const ioDiv = document.getElementById("twr_iodiv");
        if (!ioDiv)
            throw new Error("clearIODiv couldn't find twr_iodiv!");
        ioDiv.innerText = "";
    }
}
//# sourceMappingURL=clearIODiv.js.map