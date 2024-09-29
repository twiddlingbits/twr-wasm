import { twrLibrary, twrLibraryInstanceRegistry } from "./twrlibrary.js";
//TODO!! Add more Date functions (as alternatives to std c lib)?
// add built-in Libraries (like this one) to twrLibBultins
// libraries use the default export
export default class twrLibDate extends twrLibrary {
    id;
    imports = {
        twrTimeEpoch: { isCommonCode: true }
    };
    libSourcePath = new URL(import.meta.url).pathname;
    constructor() {
        // all library constructors should start with these two lines
        super();
        this.id = twrLibraryInstanceRegistry.register(this);
    }
    // return ms since epoch as int64_t
    twrTimeEpoch(callingMod) {
        return BigInt(Date.now());
    }
}
//# sourceMappingURL=twrlibdate.js.map