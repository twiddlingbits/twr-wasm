(() => {
var $aa244d35ccfd862e$exports = {};
// this script is the WebWorker thead used by class twrWasmAsyncModule
//
// This class implements a circular buffer that the main javascript thread can write to, 
// and a blocking WebWorker thread can read from.  This allows keyboard characters to be transferred from the main JS thread to a WebWorker thread.
// The WebWorker can use the readWait() function to sleep, w/o participating in the normal 
// async callback dispatch method.  This allows a C program that is a single blocking loop to receive input from the primary javascript thread.
// readWait() is used used when io_getc() or io_getstr() is called from a C function.
//
const $735e56e0330b5ced$var$RDIDX = 256;
const $735e56e0330b5ced$var$WRIDX = 257;
const $735e56e0330b5ced$var$LEN = 256;
class $735e56e0330b5ced$export$a01cca24f011573a {
    sharedArray;
    buf;
    constructor(sa){
        if (typeof window !== "undefined") {
            if (!crossOriginIsolated && !(window.location.protocol === "file:")) throw new Error("twrSharedCircularBuffer constructor, crossOriginIsolated=" + crossOriginIsolated + ". See SharedArrayBuffer docs.");
        }
        if (sa) this.sharedArray = sa;
        else this.sharedArray = new SharedArrayBuffer(1032);
        this.buf = new Int32Array(this.sharedArray);
        this.buf[$735e56e0330b5ced$var$RDIDX] = 0;
        this.buf[$735e56e0330b5ced$var$WRIDX] = 0;
    }
    write(n) {
        let i = this.buf[$735e56e0330b5ced$var$WRIDX];
        this.buf[i] = n;
        i++;
        if (i == $735e56e0330b5ced$var$LEN) i = 0;
        this.buf[$735e56e0330b5ced$var$WRIDX] = i;
        Atomics.notify(this.buf, $735e56e0330b5ced$var$WRIDX);
    }
    read() {
        if (!this.isEmpty()) {
            let i = this.buf[$735e56e0330b5ced$var$RDIDX];
            let n = this.buf[i];
            i++;
            this.buf[$735e56e0330b5ced$var$RDIDX] = i;
            return n;
        } else return -1;
    }
    readWait() {
        if (this.isEmpty()) {
            const rdptr = this.buf[$735e56e0330b5ced$var$RDIDX];
            // verifies that a shared memory location still contains a given value and if so sleeps until notified.
            Atomics.wait(this.buf, $735e56e0330b5ced$var$WRIDX, rdptr);
        }
        return this.read();
    }
    isEmpty() {
        return this.buf[$735e56e0330b5ced$var$RDIDX] == this.buf[$735e56e0330b5ced$var$WRIDX];
    }
}


//
// This class implements a simple signal/wait mechanism
// It is used by the WebWorker thread to block/wait, and the main JS thread to signal when to unblock
//
var $f80bae3199eb5b51$var$twrSignalState;
(function(twrSignalState) {
    twrSignalState[twrSignalState["WAITING"] = 0] = "WAITING";
    twrSignalState[twrSignalState["SIGNALED"] = 1] = "SIGNALED";
})($f80bae3199eb5b51$var$twrSignalState || ($f80bae3199eb5b51$var$twrSignalState = {}));
class $f80bae3199eb5b51$export$e37a7b7b851b97f3 {
    sharedArray;
    buf;
    constructor(sa){
        if (typeof window !== "undefined") {
            if (!crossOriginIsolated && !(window.location.protocol === "file:")) throw new Error("twrSignal constructor, crossOriginIsolated=" + crossOriginIsolated + ". See SharedArrayBuffer docs.");
        }
        if (sa) this.sharedArray = sa;
        else this.sharedArray = new SharedArrayBuffer(4);
        this.buf = new Int32Array(this.sharedArray);
        this.buf[0] = $f80bae3199eb5b51$var$twrSignalState.WAITING;
    }
    signal() {
        this.buf[0] = $f80bae3199eb5b51$var$twrSignalState.SIGNALED;
        //console.log("about to signal");
        Atomics.notify(this.buf, 0);
    }
    wait() {
        if (this.buf[0] == $f80bae3199eb5b51$var$twrSignalState.WAITING) //console.log("waiting...");
        Atomics.wait(this.buf, 0, $f80bae3199eb5b51$var$twrSignalState.WAITING);
    }
    isSignaled() {
        return this.buf[0] == $f80bae3199eb5b51$var$twrSignalState.SIGNALED;
    }
    reset() {
        this.buf[0] = $f80bae3199eb5b51$var$twrSignalState.WAITING;
    }
}


var $8471d8029890ba44$var$D2DType;
(function(D2DType) {
    D2DType[D2DType["D2D_FILLRECT"] = 1] = "D2D_FILLRECT";
    D2DType[D2DType["D2D_FILLCHAR"] = 5] = "D2D_FILLCHAR";
    D2DType[D2DType["D2D_SETLINEWIDTH"] = 10] = "D2D_SETLINEWIDTH";
    D2DType[D2DType["D2D_SETFILLSTYLERGBA"] = 11] = "D2D_SETFILLSTYLERGBA";
    D2DType[D2DType["D2D_SETFONT"] = 12] = "D2D_SETFONT";
    D2DType[D2DType["D2D_BEGINPATH"] = 13] = "D2D_BEGINPATH";
    D2DType[D2DType["D2D_MOVETO"] = 14] = "D2D_MOVETO";
    D2DType[D2DType["D2D_LINETO"] = 15] = "D2D_LINETO";
    D2DType[D2DType["D2D_FILL"] = 16] = "D2D_FILL";
    D2DType[D2DType["D2D_STROKE"] = 17] = "D2D_STROKE";
    D2DType[D2DType["D2D_SETSTROKESTYLERGBA"] = 18] = "D2D_SETSTROKESTYLERGBA";
    D2DType[D2DType["D2D_ARC"] = 19] = "D2D_ARC";
    D2DType[D2DType["D2D_STROKERECT"] = 20] = "D2D_STROKERECT";
    D2DType[D2DType["D2D_FILLTEXT"] = 21] = "D2D_FILLTEXT";
    D2DType[D2DType["D2D_IMAGEDATA"] = 22] = "D2D_IMAGEDATA";
    D2DType[D2DType["D2D_PUTIMAGEDATA"] = 23] = "D2D_PUTIMAGEDATA";
    D2DType[D2DType["D2D_BEZIERTO"] = 24] = "D2D_BEZIERTO";
    D2DType[D2DType["D2D_MEASURETEXT"] = 25] = "D2D_MEASURETEXT";
    D2DType[D2DType["D2D_SAVE"] = 26] = "D2D_SAVE";
    D2DType[D2DType["D2D_RESTORE"] = 27] = "D2D_RESTORE";
    D2DType[D2DType["D2D_CREATERADIALGRADIENT"] = 28] = "D2D_CREATERADIALGRADIENT";
    D2DType[D2DType["D2D_SETCOLORSTOP"] = 29] = "D2D_SETCOLORSTOP";
    D2DType[D2DType["D2D_SETFILLSTYLEGRADIENT"] = 30] = "D2D_SETFILLSTYLEGRADIENT";
    D2DType[D2DType["D2D_RELEASEID"] = 31] = "D2D_RELEASEID";
    D2DType[D2DType["D2D_CREATELINEARGRADIENT"] = 32] = "D2D_CREATELINEARGRADIENT";
    D2DType[D2DType["D2D_SETFILLSTYLE"] = 33] = "D2D_SETFILLSTYLE";
    D2DType[D2DType["D2D_SETSTROKESTYLE"] = 34] = "D2D_SETSTROKESTYLE";
})($8471d8029890ba44$var$D2DType || ($8471d8029890ba44$var$D2DType = {}));
class $8471d8029890ba44$export$2f298dd69cef3c34 {
    ctx;
    props = {
        charWidth: 0,
        charHeight: 0,
        foreColor: 0,
        backColor: 0,
        widthInChars: 0,
        heightInChars: 0,
        canvasHeight: 0,
        canvasWidth: 0
    };
    owner;
    cmdCompleteSignal;
    canvasKeys;
    precomputedObjects;
    constructor(element, modParams, modbase){
        const { forecolor: forecolor, backcolor: backcolor, fontsize: fontsize, isd2dcanvas: isd2dcanvas } = modParams;
        this.owner = modbase;
        this.props.widthInChars = modParams.windim[0];
        this.props.heightInChars = modParams.windim[1];
        if (!this.owner.isWasmModule) {
            this.cmdCompleteSignal = new (0, $f80bae3199eb5b51$export$e37a7b7b851b97f3)();
            this.canvasKeys = new (0, $735e56e0330b5ced$export$a01cca24f011573a)(); // tsconfig, lib must be set to 2017 or higher
        }
        this.precomputedObjects = {};
        if (element) {
            if (!element.getContext) throw new Error("attempted to create new twrCanvas with an element that is not a valid HTMLCanvasElement");
            let c = element.getContext("2d");
            if (!c) throw new Error("canvas 2D context not found in twrCanvasConstructor");
            c.font = fontsize.toString() + "px Courier New";
            c.textBaseline = "top";
            const sampleText = "          ";
            const tm = c.measureText(sampleText);
            this.props.charWidth = Math.ceil(tm.width / sampleText.length); // ceil rounds up (eg .9 -> 1)
            let fM = c.measureText("X");
            this.props.charHeight = Math.ceil(fM.fontBoundingBoxAscent + fM.fontBoundingBoxDescent);
            if (!isd2dcanvas) {
                element.width = this.props.charWidth * this.props.widthInChars;
                element.height = this.props.charHeight * this.props.heightInChars;
            }
            this.props.canvasHeight = element.height;
            this.props.canvasWidth = element.width;
            //console.log("this.props.canvasHeight, this.props.canvasWidth",this.props.canvasHeight,this.props.canvasWidth);
            // reset after dims changed.  Not sure if ctx is needed to reset, but others do
            let c2 = element.getContext("2d");
            if (!c2) throw new Error("canvas 2D context not found in twrCanvas.constructor (2nd time)");
            this.ctx = c2;
            this.ctx.font = fontsize.toString() + "px Courier New";
            this.ctx.textBaseline = "top";
            c2.fillStyle = backcolor;
            this.props.backColor = Number("0x" + c2.fillStyle.slice(1));
            c2.fillStyle = forecolor;
            this.props.foreColor = Number("0x" + c2.fillStyle.slice(1));
        }
    //console.log("Create New twrCanvas: ",this.isValid(), element, this);
    //console.log("twrCanvas.constructor props: ", this.props);
    }
    isValid() {
        return !!this.ctx;
    }
    getProxyParams() {
        if (!this.cmdCompleteSignal || !this.canvasKeys) throw new Error("internal error in getProxyParams.");
        return [
            this.props,
            this.cmdCompleteSignal.sharedArray,
            this.canvasKeys.sharedArray
        ];
    }
    getProp(pn) {
        if (!this.isValid()) console.log("internal error - getProp called on invalid twrCanvas");
        const propName = this.owner.getString(pn);
        //console.log("enter twrCanvas.getprop: ", pn, propName, this.props[propName], this.props);
        return this.props[propName];
    }
    /* see draw2d.h for structs that match */ drawSeq(ds) {
        //console.log("twr::Canvas enter drawSeq");
        if (!this.isValid()) console.log("internal error - drawSeq called on invalid twrCanvas");
        if (!this.ctx) return;
        let ins = this.owner.getLong(ds); /* ds->start */ 
        const lastins = this.owner.getLong(ds + 4); /* ds->last */ 
        //console.log("instruction start, last ",ins.toString(16), lastins.toString(16));
        let next;
        //let insCount=0;
        while(true){
            //insCount++;
            const type = this.owner.getLong(ins + 4); /* hdr->type */ 
            switch(type){
                case $8471d8029890ba44$var$D2DType.D2D_FILLRECT:
                    {
                        const x = this.owner.getDouble(ins + 8);
                        const y = this.owner.getDouble(ins + 16);
                        const w = this.owner.getDouble(ins + 24);
                        const h = this.owner.getDouble(ins + 32);
                        this.ctx.fillRect(x, y, w, h);
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_STROKERECT:
                    {
                        const x = this.owner.getDouble(ins + 8);
                        const y = this.owner.getDouble(ins + 16);
                        const w = this.owner.getDouble(ins + 24);
                        const h = this.owner.getDouble(ins + 32);
                        this.ctx.strokeRect(x, y, w, h);
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_FILLCHAR:
                    {
                        const x = this.owner.getDouble(ins + 8);
                        const y = this.owner.getDouble(ins + 16);
                        const c = this.owner.getShort(ins + 24);
                        let txt = String.fromCharCode(c);
                        this.ctx.fillText(txt, x, y);
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_FILLTEXT:
                    {
                        const x = this.owner.getDouble(ins + 8);
                        const y = this.owner.getDouble(ins + 16);
                        const str = this.owner.getString(this.owner.getLong(ins + 24));
                        //console.log("filltext ",x,y,str)
                        this.ctx.fillText(str, x, y);
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_MEASURETEXT:
                    {
                        const str = this.owner.getString(this.owner.getLong(ins + 8));
                        const tmidx = this.owner.getLong(ins + 12);
                        const tm = this.ctx.measureText(str);
                        this.owner.setDouble(tmidx + 0, tm.actualBoundingBoxAscent);
                        this.owner.setDouble(tmidx + 8, tm.actualBoundingBoxDescent);
                        this.owner.setDouble(tmidx + 16, tm.actualBoundingBoxLeft);
                        this.owner.setDouble(tmidx + 24, tm.actualBoundingBoxRight);
                        this.owner.setDouble(tmidx + 32, tm.fontBoundingBoxAscent);
                        this.owner.setDouble(tmidx + 40, tm.fontBoundingBoxDescent);
                        this.owner.setDouble(tmidx + 48, tm.width);
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_SETFONT:
                    {
                        const str = this.owner.getString(this.owner.getLong(ins + 8));
                        this.ctx.font = str;
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_SETFILLSTYLERGBA:
                    {
                        const color = this.owner.getLong(ins + 8);
                        const cssColor = "#" + ("00000000" + color.toString(16)).slice(-8);
                        this.ctx.fillStyle = cssColor;
                    //console.log("fillstyle: ", this.ctx.fillStyle, ":", cssColor,":", color)
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_SETSTROKESTYLERGBA:
                    {
                        const color = this.owner.getLong(ins + 8);
                        const cssColor = "#" + ("00000000" + color.toString(16)).slice(-8);
                        this.ctx.strokeStyle = cssColor;
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_SETFILLSTYLE:
                    {
                        const cssColor = this.owner.getString(this.owner.getLong(ins + 8));
                        this.ctx.fillStyle = cssColor;
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_SETSTROKESTYLE:
                    {
                        const cssColor = this.owner.getString(this.owner.getLong(ins + 8));
                        this.ctx.strokeStyle = cssColor;
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_SETLINEWIDTH:
                    {
                        const width = this.owner.getShort(ins + 8);
                        this.ctx.lineWidth = width;
                    //console.log("twrCanvas D2D_SETLINEWIDTH: ", this.ctx.lineWidth);
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_MOVETO:
                    {
                        const x = this.owner.getDouble(ins + 8);
                        const y = this.owner.getDouble(ins + 16);
                        this.ctx.moveTo(x, y);
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_LINETO:
                    {
                        const x = this.owner.getDouble(ins + 8);
                        const y = this.owner.getDouble(ins + 16);
                        this.ctx.lineTo(x, y);
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_BEZIERTO:
                    {
                        const cp1x = this.owner.getDouble(ins + 8);
                        const cp1y = this.owner.getDouble(ins + 16);
                        const cp2x = this.owner.getDouble(ins + 24);
                        const cp2y = this.owner.getDouble(ins + 32);
                        const x = this.owner.getDouble(ins + 40);
                        const y = this.owner.getDouble(ins + 48);
                        this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_BEGINPATH:
                    this.ctx.beginPath();
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_FILL:
                    this.ctx.fill();
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_SAVE:
                    this.ctx.save();
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_RESTORE:
                    this.ctx.restore();
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_STROKE:
                    this.ctx.stroke();
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_ARC:
                    {
                        const x = this.owner.getDouble(ins + 8);
                        const y = this.owner.getDouble(ins + 16);
                        const radius = this.owner.getDouble(ins + 24);
                        const startAngle = this.owner.getDouble(ins + 32);
                        const endAngle = this.owner.getDouble(ins + 40);
                        const counterClockwise = this.owner.getLong(ins + 48) != 0;
                        this.ctx.arc(x, y, radius, startAngle, endAngle, counterClockwise);
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_IMAGEDATA:
                    {
                        const start = this.owner.getLong(ins + 8);
                        const length = this.owner.getLong(ins + 12);
                        const width = this.owner.getLong(ins + 16);
                        const height = this.owner.getLong(ins + 20);
                        const id = this.owner.getLong(ins + 24);
                        if (id in this.precomputedObjects) console.log("warning: D2D_IMAGEDATA ID already exists.");
                        if (this.owner.isWasmModule) {
                            const z = new Uint8ClampedArray(this.owner.memory.buffer, start, length);
                            this.precomputedObjects[id] = new ImageData(z, width, height);
                        } else this.precomputedObjects[id] = {
                            mem8: new Uint8Array(this.owner.memory.buffer, start, length),
                            width: width,
                            height: height
                        };
                    //console.log("D2D_IMAGEDATA",start, length, width, height, this.imageData[start]);
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_CREATERADIALGRADIENT:
                    {
                        const x0 = this.owner.getDouble(ins + 8);
                        const y0 = this.owner.getDouble(ins + 16);
                        const radius0 = this.owner.getDouble(ins + 24);
                        const x1 = this.owner.getDouble(ins + 32);
                        const y1 = this.owner.getDouble(ins + 40);
                        const radius1 = this.owner.getDouble(ins + 48);
                        const id = this.owner.getLong(ins + 56);
                        let gradient = this.ctx.createRadialGradient(x0, y0, radius0, x1, y1, radius1);
                        if (id in this.precomputedObjects) console.log("warning: D2D_CREATERADIALGRADIENT ID already exists.");
                        this.precomputedObjects[id] = gradient;
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_CREATELINEARGRADIENT:
                    {
                        const x0 = this.owner.getDouble(ins + 8);
                        const y0 = this.owner.getDouble(ins + 16);
                        const x1 = this.owner.getDouble(ins + 24);
                        const y1 = this.owner.getDouble(ins + 32);
                        const id = this.owner.getLong(ins + 40);
                        let gradient = this.ctx.createLinearGradient(x0, y0, x1, y1);
                        if (id in this.precomputedObjects) console.log("warning: D2D_CREATELINEARGRADIENT ID already exists.");
                        this.precomputedObjects[id] = gradient;
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_SETCOLORSTOP:
                    {
                        const id = this.owner.getLong(ins + 8);
                        const pos = this.owner.getLong(ins + 12);
                        const cssColor = this.owner.getString(this.owner.getLong(ins + 16));
                        if (!(id in this.precomputedObjects)) throw new Error("D2D_SETCOLORSTOP with invalid ID: " + id);
                        const gradient = this.precomputedObjects[id];
                        gradient.addColorStop(pos, cssColor);
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_SETFILLSTYLEGRADIENT:
                    {
                        const id = this.owner.getLong(ins + 8);
                        if (!(id in this.precomputedObjects)) throw new Error("D2D_SETFILLSTYLEGRADIENT with invalid ID: " + id);
                        const gradient = this.precomputedObjects[id];
                        this.ctx.fillStyle = gradient;
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_RELEASEID:
                    {
                        const id = this.owner.getLong(ins + 8);
                        if (this.precomputedObjects[id]) delete this.precomputedObjects[id];
                        else console.log("warning: D2D_RELEASEID with undefined ID ", id);
                    }
                    break;
                case $8471d8029890ba44$var$D2DType.D2D_PUTIMAGEDATA:
                    {
                        const id = this.owner.getLong(ins + 8);
                        const dx = this.owner.getLong(ins + 12);
                        const dy = this.owner.getLong(ins + 16);
                        const dirtyX = this.owner.getLong(ins + 20);
                        const dirtyY = this.owner.getLong(ins + 24);
                        const dirtyWidth = this.owner.getLong(ins + 28);
                        const dirtyHeight = this.owner.getLong(ins + 32);
                        if (!(id in this.precomputedObjects)) throw new Error("D2D_PUTIMAGEDATA with invalid ID: " + id);
                        //console.log("D2D_PUTIMAGEDATA",start, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight, this.imageData[start]);
                        let imgData;
                        if (this.owner.isWasmModule) //console.log("D2D_PUTIMAGEDATA isWasmModule");
                        imgData = this.precomputedObjects[id];
                        else {
                            //console.log("D2D_PUTIMAGEDATA wasmModuleAsync");
                            const z = this.precomputedObjects[id]; // Uint8Array
                            const ca = Uint8ClampedArray.from(z.mem8); // shallow copy
                            imgData = new ImageData(ca, z.width, z.height);
                        }
                        if (dirtyWidth == 0 && dirtyHeight == 0) this.ctx.putImageData(imgData, dx, dy);
                        else this.ctx.putImageData(imgData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
                    }
                    break;
                default:
                    throw new Error("unimplemented or unknown Sequence Type in drawSeq: " + type);
            }
            next = this.owner.getLong(ins); /* hdr->next */ 
            if (next == 0) {
                if (ins != lastins) throw new Error("assert type error in twrcanvas, ins!=lastins");
                break;
            }
            ins = next;
        }
        if (this.cmdCompleteSignal) this.cmdCompleteSignal.signal();
    //console.log("Canvas.drawSeq() completed  with instruction count of ", insCount);
    }
}
class $8471d8029890ba44$export$c779b2cd00544976 {
    canvasKeys;
    drawCompleteSignal;
    props;
    owner;
    constructor(params, owner){
        const [props, signalBuffer, canvasKeysBuffer] = params;
        this.drawCompleteSignal = new (0, $f80bae3199eb5b51$export$e37a7b7b851b97f3)(signalBuffer);
        this.canvasKeys = new (0, $735e56e0330b5ced$export$a01cca24f011573a)(canvasKeysBuffer);
        this.props = props;
        this.owner = owner;
    //console.log("Create New twrCanvasProxy: ",this.props)
    }
    charIn() {
        //ctx.commit(); not avail in chrome
        //postMessage(["debug", 'x']);
        return this.canvasKeys.readWait(); // wait for a key, then read it
    }
    inkey() {
        if (this.canvasKeys.isEmpty()) return 0;
        else return this.charIn();
    }
    getProp(pn) {
        const propName = this.owner.getString(pn);
        //console.log("enter twrCanvasProxy.getprop: ", pn, propName, this.props[propName], this.props);
        return this.props[propName];
    }
    drawSeq(ds) {
        this.drawCompleteSignal.reset();
        postMessage([
            "drawseq",
            [
                ds
            ]
        ]);
        this.drawCompleteSignal.wait();
    }
}



class $1861d00dfa0aef1a$export$dd376bb3f10f6896 {
    div;
    divKeys;
    CURSOR = String.fromCharCode(9611);
    cursorOn = false;
    lastChar = 0;
    extraBR = false;
    owner;
    constructor(element, modParams, modbase){
        this.div = element;
        this.owner = modbase;
        if (!this.owner.isWasmModule) this.divKeys = new (0, $735e56e0330b5ced$export$a01cca24f011573a)(); // tsconfig, lib must be set to 2017 or higher
        if (this.div && !modParams.styleIsDefault) {
            this.div.style.backgroundColor = modParams.backcolor;
            this.div.style.color = modParams.forecolor;
            this.div.style.font = modParams.fontsize.toString() + "px arial";
        }
    }
    isValid() {
        return !!this.div;
    }
    getProxyParams() {
        if (!this.divKeys) throw new Error("internal error in getProxyParams.");
        return [
            this.divKeys.sharedArray
        ];
    }
    /*
     * add character to div.  Supports the following control codes:
     * any of CRLF, CR (/r), or LF(/n)  will cause a new line
     * 0xE cursor on
     * 0x8 backspace
     * 0xF cursor off
    */ charOut(ch) {
        if (!this.div) return;
        //console.log("div::charout: ", ch);
        if (this.extraBR) {
            this.extraBR = false;
            if (this.cursorOn) this.div.innerHTML = this.div.innerHTML.slice(0, -1);
            this.div.innerHTML = this.div.innerHTML.slice(0, -4);
            if (this.cursorOn) this.div.innerHTML += this.CURSOR;
        }
        switch(ch){
            case 10:
            case 13:
                if (ch == 10 && this.lastChar == 13) break; // detect CR LF and treat as single new line
                if (this.cursorOn) this.div.innerHTML = this.div.innerHTML.slice(0, -1);
                this.div.innerHTML += "<br><br>"; //2nd break is a place holder for next line (fixes scroll issue at bottom)
                this.extraBR = true;
                if (this.cursorOn) this.div.innerHTML += this.CURSOR;
                //element.scrollIntoView();
                //element.scrollTop = element.scrollHeight;
                let p = this.div.getBoundingClientRect();
                window.scrollTo(0, p.height + 100);
                break;
            case 8:
                if (this.cursorOn) this.div.innerHTML = this.div.innerHTML.slice(0, -1);
                this.div.innerHTML = this.div.innerHTML.slice(0, -1);
                if (this.cursorOn) this.div.innerHTML += this.CURSOR;
                break;
            case 0xE:
                if (!this.cursorOn) {
                    this.cursorOn = true;
                    this.div.innerHTML += this.CURSOR;
                    this.div.focus();
                }
                break;
            case 0xF:
                if (this.cursorOn) {
                    this.cursorOn = false;
                    this.div.innerHTML = this.div.innerHTML.slice(0, -1);
                }
                break;
            default:
                if (this.cursorOn) this.div.innerHTML = this.div.innerHTML.slice(0, -1);
                this.div.innerHTML += String.fromCharCode(ch);
                if (this.cursorOn) this.div.innerHTML += this.CURSOR;
                break;
        }
        this.lastChar = ch;
    }
    stringOut(str) {
        for(let i = 0; i < str.length; i++)this.charOut(str.charCodeAt(i));
    }
}
class $1861d00dfa0aef1a$export$b377f0bbf2c7581e {
    divKeys;
    constructor(params){
        const [divKeysBuffer] = params;
        this.divKeys = new (0, $735e56e0330b5ced$export$a01cca24f011573a)(divKeysBuffer);
    }
    charIn() {
        return this.divKeys.readWait(); // wait for a key, then read it
    }
    inkey() {
        if (this.divKeys.isEmpty()) return 0;
        else return this.charIn();
    }
    charOut(ch) {
        postMessage([
            "divout",
            ch
        ]);
    }
}


let $0dadee6679ec6e66$var$logline = "";
function $0dadee6679ec6e66$export$16b4216ec014493d(char) {
    if (char == 10 || char == 3) {
        console.log($0dadee6679ec6e66$var$logline); // ideally without a linefeed, but there is no way to not have a LF with console.log API.
        $0dadee6679ec6e66$var$logline = "";
    } else {
        $0dadee6679ec6e66$var$logline = $0dadee6679ec6e66$var$logline + String.fromCharCode(char);
        if ($0dadee6679ec6e66$var$logline.length >= 300) {
            console.log($0dadee6679ec6e66$var$logline);
            $0dadee6679ec6e66$var$logline = "";
        }
    }
}
function $0dadee6679ec6e66$export$485af4d0039b3389(ch) {
    postMessage([
        "debug",
        ch
    ]);
}


class $1edf7d15143e967e$export$918ffb7e046a537b {
    mod;
    constructor(mod){
        this.mod = mod;
    }
    atod(strptr) {
        const str = this.mod.getString(strptr);
        const upper = str.trimStart().toUpperCase();
        if (upper == "INF" || upper == "+INF") return Number.POSITIVE_INFINITY;
        else if (upper == "-INF") return Number.NEGATIVE_INFINITY;
        else {
            // allow D for exponent -- old microsoft format they still support in fctv and I support in my awbasic
            const r = Number.parseFloat(str.replaceAll("D", "e").replaceAll("d", "e"));
            return r;
        }
    }
    dtoa(buffer, buffer_size, value, max_precision) {
        if (max_precision == -1) {
            const r = value.toString();
            this.mod.copyString(buffer, buffer_size, r);
        } else {
            let r = value.toString();
            if (r.length > max_precision) r = value.toPrecision(max_precision);
            this.mod.copyString(buffer, buffer_size, r);
        }
    }
    toFixed(buffer, buffer_size, value, decdigits) {
        const r = value.toFixed(decdigits);
        this.mod.copyString(buffer, buffer_size, r);
    }
    toExponential(buffer, buffer_size, value, decdigits) {
        const r = value.toExponential(decdigits);
        this.mod.copyString(buffer, buffer_size, r);
    }
    // emulates the C lib function -fcvt_s, but doesn't support all ranges of number.
    // Number.toFixed() has a max size of 100 fractional digits,  and values must be less than 1e+21
    // Negative exponents must be now smaller than 1e-99
    // fully-function C version also int he source, but this is the version enabled by default
    fcvtS(buffer, sizeInBytes, value, fracpart_numdigits, dec, sign // int *
    ) {
        if (buffer == 0 || sign == 0 || dec == 0 || sizeInBytes < 1) return 1;
        let digits;
        let decpos;
        let s = 0; // default to positive
        if (Number.isNaN(value)) {
            digits = "1#QNAN00000000000000000000000000000".slice(0, fracpart_numdigits + 1);
            decpos = 1;
        } else if (!Number.isFinite(value)) {
            digits = "1#INF00000000000000000000000000000".slice(0, fracpart_numdigits + 1);
            decpos = 1;
        } else if (value == 0) {
            digits = "000000000000000000000000000000000000".slice(0, fracpart_numdigits);
            decpos = 0;
        } else {
            if (value < 0) {
                s = 1; // negative
                value = Math.abs(value);
            }
            if (fracpart_numdigits > 100 || value > 1e+21 || value < 1e-99) {
                this.mod.copyString(buffer, sizeInBytes, "");
                this.mod.mem32[dec] = 0;
                return 1;
            }
            const roundValStr = value.toFixed(fracpart_numdigits);
            let [intPart = "", fracPart = ""] = roundValStr.split(".");
            if (intPart == "0") intPart = "";
            if (intPart.length > 0) {
                decpos = intPart.length;
                digits = intPart + fracPart;
            } else {
                digits = fracPart.replace(/^0+/, ""); // remove leading zeros
                decpos = digits.length - fracPart.length;
            }
        }
        if (sizeInBytes - 1 < digits.length) return 1;
        this.mod.copyString(buffer, sizeInBytes, digits);
        this.mod.setLong(dec, decpos);
        this.mod.setLong(sign, s);
        return 0;
    /*
        this version 'works' with larger numbers than using toFixed, but doesn't round correctly

        let decpos=0;
        let digits:string;
        if (value!=0) decpos=Math.floor(Math.log10(value))+1;
    
        if (decpos>0) { // has integer part
            const intlen=Math.max(decpos, 0);
            console.log("intlen=",intlen, "decpos=",decpos);
            const [nonExponent, exponent=0] = value.toPrecision(intlen+fracpart_numdigits).split('e');
            digits=nonExponent.replace('.', '');
            digits=digits.replace(/^0+/,"");  // remove leading zeros
        }
        else { // only a fraction
            const intpart=Math.trunc(value);
            const fracpart=value-intpart;
            const prec=fracpart_numdigits- (-decpos);
            console.log("prec=",prec);
            if (prec<1) {
                digits="";
            }
            else {
                const [nonExponent, exponent=0] = fracpart.toPrecision(prec).split('e');
                digits=nonExponent.replace('.', '');
                digits=digits.replace(/^0+/,"");
            }
        }

        console.log("fcvtS value",value,"fracpart_numdigits",fracpart_numdigits);
        console.log('digits=',digits);
        console.log('dec=',decpos);
        console.log("sign=",s);
    */ }
}


class $2be400e48a71fb79$export$c83a0a3bffe07399 {
    memory;
    mem8;
    mem32;
    memD;
    exports;
    isWorker = false;
    isWasmModule;
    floatUtil;
    constructor(isWasmModule = false){
        this.isWasmModule = isWasmModule; // as opposed to twrWasmModuleAsync, twrWasmModuleInWorker
        this.mem8 = new Uint8Array(); // avoid type errors
        this.mem32 = new Uint32Array(); // avoid type errors
        this.memD = new Float64Array(); // avoid type errors
        this.floatUtil = new (0, $1edf7d15143e967e$export$918ffb7e046a537b)(this);
    //console.log("size of mem8 after constructor",this.mem8.length);
    }
    /*********************************************************************/ /*********************************************************************/ async loadWasm(pathToLoad) {
        //console.log("fileToLoad",fileToLoad)
        let response;
        try {
            response = await fetch(pathToLoad);
        } catch (err) {
            console.log("loadWasm() failed to fetch: " + pathToLoad);
            throw err;
        }
        if (!response.ok) throw new Error("fetch response error on file '" + pathToLoad + "'\n" + response.statusText);
        try {
            let wasmBytes = await response.arrayBuffer();
            let allimports = {
                ...this.modParams.imports
            };
            let instance = await WebAssembly.instantiate(wasmBytes, {
                env: allimports
            });
            this.exports = instance.instance.exports;
            if (!this.exports) throw new Error("Unexpected error - undefined instance.exports");
            if (this.memory) throw new Error("unexpected error -- this.memory already set");
            this.memory = this.exports.memory;
            if (!this.memory) throw new Error("Unexpected error - undefined exports.memory");
            this.mem8 = new Uint8Array(this.memory.buffer);
            this.mem32 = new Uint32Array(this.memory.buffer);
            this.memD = new Float64Array(this.memory.buffer);
            // instanceof SharedArrayBuffer doesn't work when crossOriginIsolated not enable, and will cause a runtime error
            if (this.isWorker) {
                if (this.memory.buffer instanceof ArrayBuffer) console.log("twrWasmModuleAsync requires shared Memory. Add wasm-ld --shared-memory --no-check-features (see docs)");
                postMessage([
                    "setmemory",
                    this.memory
                ]);
            }
            if (this.isWasmModule) // here if twrWasmModule, twrWasmModuleAsync overrides this function
            // instanceof SharedArrayBuffer doesn't work when crossOriginIsolated not enable, and will cause a runtime error
            {
                if (!(this.memory.buffer instanceof ArrayBuffer)) console.log("twrWasmModule does not require shared Memory. Okay to remove wasm-ld --shared-memory --no-check-features");
            }
            this.malloc = (size)=>{
                return new Promise((resolve)=>{
                    const m = this.exports.twr_malloc;
                    resolve(m(size));
                });
            };
            this.init();
        } catch (err) {
            console.log("WASM instantiate error: " + err + (err.stack ? "\n" + err.stack : ""));
            throw err;
        }
    }
    init() {
        //console.log("loadWasm.init() enter")
        let p;
        switch(this.modParams.stdio){
            case "debug":
                p = 0;
                break;
            case "div":
                p = 1;
                break;
            case "canvas":
                p = 2;
                break;
            case "null":
                p = 3;
                break;
            default:
                p = 0; // debug
        }
        const twrInit = this.exports.twr_wasm_init;
        //console.log("twrInit:",twrInit)
        twrInit(p, this.mem8.length);
    }
    /* callC takes an array where:
    * the first entry is the name of the C function in the wasm module to call (must be exported, typically via the --export clang flag)
    * and the next entries are a variable number of parameters to pass to the C function, of type
    * number - converted to int32 or float64 as appropriate
    * string - converted to a an index (ptr) into a module Memory returned via stringToMem()
    * URL - the file contents are loaded into module Memory via urlToMem(), and two C parameters are generated - index (pointer) to the memory, and length
    * Uint8Array - the array is loaded into module memory via uint8ArrayToMem(), and two parameters are generated - index (pointer) to the memory, and length
    */ async callC(params) {
        const cparams = await this.preCallC(params);
        let retval = this.callCImpl(params[0], cparams);
        this.postCallC(cparams, params);
        return retval;
    }
    async callCImpl(fname, cparams = []) {
        if (!this.exports) throw new Error("this.exports undefined");
        if (!this.exports[fname]) throw new Error("callC: function '" + fname + "' not in export table.  Use --export wasm-ld flag.");
        const f = this.exports[fname];
        let cr = f(...cparams);
        return cr;
    }
    // convert an array of parameters to numbers by stuffing contents into malloc'd wasm memory
    async preCallC(params) {
        if (!(params.constructor === Array)) throw new Error("callC: params must be array, first arg is function name");
        if (params.length == 0) throw new Error("callC: missing function name");
        let cparams = [];
        let ci = 0;
        for(let i = 1; i < params.length; i++){
            const p = params[i];
            switch(typeof p){
                case "number":
                    cparams[ci++] = p;
                    break;
                case "string":
                    cparams[ci++] = await this.putString(p);
                    break;
                case "object":
                    if (p instanceof URL) {
                        const r = await this.fetchAndPutURL(p);
                        cparams[ci++] = r[0]; // mem index
                        cparams[ci++] = r[1]; // len
                        break;
                    } else if (p instanceof ArrayBuffer) {
                        const r = await this.putArrayBuffer(p);
                        cparams[ci++] = r; // mem index
                        break;
                    }
                default:
                    throw new Error("callC: invalid object type passed in");
            }
        }
        return cparams;
    }
    // free the mallocs; copy array buffer data from malloc back to arraybuffer
    async postCallC(cparams, params) {
        let ci = 0;
        for(let i = 1; i < params.length; i++){
            const p = params[i];
            switch(typeof p){
                case "number":
                    ci++;
                    break;
                case "string":
                    this.callCImpl("twr_free", [
                        cparams[ci]
                    ]);
                    ci++;
                    break;
                case "object":
                    if (p instanceof URL) {
                        this.callCImpl("twr_free", [
                            cparams[ci]
                        ]);
                        ci = ci + 2;
                        break;
                    } else if (p instanceof ArrayBuffer) {
                        let u8 = new Uint8Array(p);
                        for(let j = 0; j < u8.length; j++)u8[j] = this.mem8[cparams[ci] + j]; // mod.mem8 is a Uint8Array view of the module's Web Assembly Memory
                        this.callCImpl("twr_free", [
                            cparams[ci]
                        ]);
                        ci++;
                        break;
                    } else throw new Error("postCallC: internal error A");
                default:
                    throw new Error("postCallC: internal error B");
            }
        }
        return cparams;
    }
    /*********************************************************************/ /*********************************************************************/ // copy a string into existing buffer in the webassembly module memory
    copyString(buffer, buffer_size, sin) {
        let i;
        for(i = 0; i < sin.length && i < buffer_size - 1; i++)this.mem8[buffer + i] = sin.charCodeAt(i);
        this.mem8[buffer + i] = 0;
    }
    // allocate and copy a string into the webassembly module memory
    async putString(sin) {
        let strIndex = await this.malloc(sin.length);
        this.copyString(strIndex, sin.length, sin);
        return strIndex;
    }
    async putU8(u8a) {
        let dest = await this.malloc(u8a.length);
        for(let i = 0; i < u8a.length; i++)this.mem8[dest + i] = u8a[i];
        return dest;
    }
    async putArrayBuffer(ab) {
        const u8 = new Uint8Array(ab);
        return this.putU8(u8);
    }
    // given a url, load its contents, and stuff into wasm memory similar to Unint8Array
    async fetchAndPutURL(fnin) {
        if (!(typeof fnin === "object" && fnin instanceof URL)) throw new Error("fetchAndPutURL param must be URL");
        try {
            let response = await fetch(fnin);
            let buffer = await response.arrayBuffer();
            let src = new Uint8Array(buffer);
            let dest = await this.putU8(src);
            return [
                dest,
                src.length
            ];
        } catch (err) {
            console.log("fetchAndPutURL Error. URL: " + fnin + "\n" + err + (err.stack ? "\n" + err.stack : ""));
            throw err;
        }
    }
    getLong(idx) {
        const idx32 = Math.floor(idx / 4);
        if (idx32 * 4 != idx) throw new Error("getLong passed non long aligned address");
        if (idx32 < 0 || idx32 >= this.mem32.length) throw new Error("invalid index passed to getLong: " + idx + ", this.mem32.length: " + this.mem32.length);
        const long = this.mem32[idx32];
        return long;
    }
    setLong(idx, value) {
        const idx32 = Math.floor(idx / 4);
        if (idx32 * 4 != idx) throw new Error("setLong passed non long aligned address");
        if (idx32 < 0 || idx32 >= this.mem32.length) throw new Error("invalid index passed to setLong: " + idx + ", this.mem32.length: " + this.mem32.length);
        this.mem32[idx32] = value;
    }
    getDouble(idx) {
        const idx64 = Math.floor(idx / 8);
        if (idx64 * 8 != idx) throw new Error("getLong passed non Float64 aligned address");
        const long = this.memD[idx64];
        return long;
    }
    setDouble(idx, value) {
        const idx64 = Math.floor(idx / 8);
        if (idx64 * 8 != idx) throw new Error("setDouble passed non Float64 aligned address");
        this.memD[idx64] = value;
    }
    getShort(idx) {
        if (idx < 0 || idx >= this.mem8.length) throw new Error("invalid index passed to getShort: " + idx);
        const short = this.mem8[idx] + this.mem8[idx + 1] * 256;
        return short;
    }
    // get a string out of module memory
    // null terminated, up until max of (optional) len
    getString(strIndex, len) {
        let sout = "";
        let i = 0;
        while(this.mem8[strIndex + i] && (len === undefined ? true : i < len) && strIndex + i < this.mem8.length){
            sout = sout + String.fromCharCode(this.mem8[strIndex + i]);
            i++;
        }
        return sout;
    }
    // get a byte array out of module memory when passed in index to [size, dataptr]
    getU8Arr(idx) {
        if (idx < 0 || idx >= this.mem8.length) throw new Error("invalid index passed to getU8: " + idx);
        const rv = new Uint32Array(this.mem8.slice(idx, idx + 8).buffer);
        let size = rv[0];
        let dataptr = rv[1];
        if (dataptr < 0 || dataptr >= this.mem8.length) throw new Error("invalid idx.dataptr passed to getU8");
        if (size < 0 || size > this.mem8.length - dataptr) throw new Error("invalid idx.size passed to  getU8");
        const u8 = this.mem8.slice(dataptr, dataptr + size);
        return u8;
    }
    // get a int32 array out of module memory when passed in index to [size, dataptr]
    getU32Arr(idx) {
        if (idx < 0 || idx >= this.mem8.length) throw new Error("invalid index passed to getU32: " + idx);
        const rv = new Uint32Array(this.mem8.slice(idx, idx + 8).buffer);
        let size = rv[0];
        let dataptr = rv[1];
        if (dataptr < 0 || dataptr >= this.mem8.length) throw new Error("invalid idx.dataptr passed to getU32");
        if (size < 0 || size > this.mem8.length - dataptr) throw new Error("invalid idx.size passed to  getU32");
        if (size % 4 != 0) throw new Error("idx.size is not an integer number of 32 bit words");
        const u32 = new Uint32Array(this.mem8.slice(dataptr, dataptr + size).buffer);
        return u32;
    }
}



function $37aa69a2127fb2cf$export$78724cdcf7ebea1d() {
    return Date.now();
}


class $df1a8ef029dd3012$export$9e37856d1928d388 {
    callCompleteSignal;
    parameters;
    constructor(){
        this.callCompleteSignal = new (0, $f80bae3199eb5b51$export$e37a7b7b851b97f3)();
        this.parameters = new Uint32Array(new SharedArrayBuffer(4));
    }
    startSleep(ms) {
        setTimeout(()=>{
            this.callCompleteSignal.signal();
        }, ms);
    }
    time() {
        const ms = (0, $37aa69a2127fb2cf$export$78724cdcf7ebea1d)();
        this.parameters[0] = ms;
        this.callCompleteSignal.signal();
    }
    getProxyParams() {
        return [
            this.callCompleteSignal.sharedArray,
            this.parameters.buffer
        ];
    }
    processMessage(msgType, data) {
        switch(msgType){
            case "sleep":
                const [ms] = data;
                this.startSleep(ms);
                break;
            case "time":
                this.time();
                break;
            default:
                return false;
        }
        return true;
    }
}
class $df1a8ef029dd3012$export$78d2a4633fe89379 {
    callCompleteSignal;
    parameters;
    constructor(params){
        this.callCompleteSignal = new (0, $f80bae3199eb5b51$export$e37a7b7b851b97f3)(params[0]);
        this.parameters = new Uint32Array(params[1]);
    }
    sleep(ms) {
        this.callCompleteSignal.reset();
        postMessage([
            "sleep",
            [
                ms
            ]
        ]);
        this.callCompleteSignal.wait();
    }
    time() {
        this.callCompleteSignal.reset();
        postMessage([
            "time"
        ]);
        this.callCompleteSignal.wait();
        return this.parameters[0];
    }
}


let $aa244d35ccfd862e$var$mod;
onmessage = function(e) {
    //console.log('twrworker.js: message received from main script: '+e.data);
    if (e.data[0] == "startup") {
        const params = e.data[1];
        //console.log("Worker startup params:",params);
        $aa244d35ccfd862e$var$mod = new $aa244d35ccfd862e$var$twrWasmModuleInWorker(params.modParams, params.modWorkerParams);
        $aa244d35ccfd862e$var$mod.loadWasm(params.urlToLoad).then(()=>{
            postMessage([
                "startupOkay"
            ]);
        }).catch((ex)=>{
            console.log(".catch: ", ex);
            postMessage([
                "startupFail",
                ex
            ]);
        });
    } else if (e.data[0] == "callC") $aa244d35ccfd862e$var$mod.callCImpl(e.data[1], e.data[2]).then((rc)=>{
        postMessage([
            "callCOkay",
            rc
        ]);
    }).catch((e)=>{
        console.log("exception in callC twrworker.js\n");
        console.log(e);
        postMessage([
            "callCFail",
            e
        ]);
    });
    else console.log("twrworker.js: unknown message: " + e);
};
// ************************************************************************
class $aa244d35ccfd862e$var$twrWasmModuleInWorker extends (0, $2be400e48a71fb79$export$c83a0a3bffe07399) {
    malloc;
    modParams;
    constructor(modParams, modInWorkerParams){
        super();
        this.isWorker = true;
        this.malloc = (size)=>{
            throw new Error("error - un-init malloc called");
        };
        this.modParams = modParams;
        //console.log("twrWasmModuleInWorker: ", modInWorkerParams.canvasProxyParams)
        const canvasProxy = new (0, $8471d8029890ba44$export$c779b2cd00544976)(modInWorkerParams.canvasProxyParams, this);
        const divProxy = new (0, $1861d00dfa0aef1a$export$b377f0bbf2c7581e)(modInWorkerParams.divProxyParams);
        const waitingCallsProxy = new (0, $df1a8ef029dd3012$export$78d2a4633fe89379)(modInWorkerParams.waitingCallsProxyParams);
        this.modParams.imports = {
            twrDebugLog: (0, $0dadee6679ec6e66$export$485af4d0039b3389),
            twrSleep: waitingCallsProxy.sleep.bind(waitingCallsProxy),
            twrTime: waitingCallsProxy.time.bind(waitingCallsProxy),
            twrDivCharOut: divProxy.charOut.bind(divProxy),
            twrDivCharIn: divProxy.charIn.bind(divProxy),
            twrCanvasCharIn: canvasProxy.charIn.bind(canvasProxy),
            twrCanvasInkey: canvasProxy.inkey.bind(canvasProxy),
            twrCanvasGetProp: canvasProxy.getProp.bind(canvasProxy),
            twrCanvasDrawSeq: canvasProxy.drawSeq.bind(canvasProxy),
            twrSin: Math.sin,
            twrCos: Math.cos,
            twrTan: Math.tan,
            twrFAbs: Math.abs,
            twrACos: Math.acos,
            twrASin: Math.asin,
            twrATan: Math.atan,
            twrExp: Math.exp,
            twrFloor: Math.floor,
            twrCeil: Math.ceil,
            twrFMod: function(x, y) {
                return x % y;
            },
            twrLog: Math.log,
            twrPow: Math.pow,
            twrSqrt: Math.sqrt,
            twrTrunc: Math.trunc,
            twrDtoa: this.floatUtil.dtoa.bind(this.floatUtil),
            twrToFixed: this.floatUtil.toFixed.bind(this.floatUtil),
            twrToExponential: this.floatUtil.toExponential.bind(this.floatUtil),
            twrAtod: this.floatUtil.atod.bind(this.floatUtil),
            twrFcvtS: this.floatUtil.fcvtS.bind(this.floatUtil)
        };
    }
}

})();
//# sourceMappingURL=twrmodworker.dfe73fd0.js.map
