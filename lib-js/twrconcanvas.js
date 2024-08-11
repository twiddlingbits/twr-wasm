import { twrSharedCircularBuffer } from "./twrcircular.js";
import { twrSignal } from "./twrsignal.js";
import { IOTypes } from "./twrcon.js";
import { twrConsoleRegistry } from "./twrconreg.js";
var D2DType;
(function (D2DType) {
    D2DType[D2DType["D2D_FILLRECT"] = 1] = "D2D_FILLRECT";
    D2DType[D2DType["D2D_FILLCODEPOINT"] = 5] = "D2D_FILLCODEPOINT";
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
    D2DType[D2DType["D2D_CLOSEPATH"] = 35] = "D2D_CLOSEPATH";
    D2DType[D2DType["D2D_RESET"] = 36] = "D2D_RESET";
    D2DType[D2DType["D2D_CLEARRECT"] = 37] = "D2D_CLEARRECT";
    D2DType[D2DType["D2D_SCALE"] = 38] = "D2D_SCALE";
    D2DType[D2DType["D2D_TRANSLATE"] = 39] = "D2D_TRANSLATE";
    D2DType[D2DType["D2D_ROTATE"] = 40] = "D2D_ROTATE";
    D2DType[D2DType["D2D_GETTRANSFORM"] = 41] = "D2D_GETTRANSFORM";
    D2DType[D2DType["D2D_SETTRANSFORM"] = 42] = "D2D_SETTRANSFORM";
    D2DType[D2DType["D2D_RESETTRANSFORM"] = 43] = "D2D_RESETTRANSFORM";
    D2DType[D2DType["D2D_STROKETEXT"] = 44] = "D2D_STROKETEXT";
    D2DType[D2DType["D2D_ROUNDRECT"] = 45] = "D2D_ROUNDRECT";
    D2DType[D2DType["D2D_ELLIPSE"] = 46] = "D2D_ELLIPSE";
    D2DType[D2DType["D2D_QUADRATICCURVETO"] = 47] = "D2D_QUADRATICCURVETO";
    D2DType[D2DType["D2D_SETLINEDASH"] = 48] = "D2D_SETLINEDASH";
    D2DType[D2DType["D2D_GETLINEDASH"] = 49] = "D2D_GETLINEDASH";
    D2DType[D2DType["D2D_ARCTO"] = 50] = "D2D_ARCTO";
    D2DType[D2DType["D2D_GETLINEDASHLENGTH"] = 51] = "D2D_GETLINEDASHLENGTH";
    D2DType[D2DType["D2D_DRAWIMAGE"] = 52] = "D2D_DRAWIMAGE";
    D2DType[D2DType["D2D_RECT"] = 53] = "D2D_RECT";
    D2DType[D2DType["D2D_TRANSFORM"] = 54] = "D2D_TRANSFORM";
    D2DType[D2DType["D2D_SETLINECAP"] = 55] = "D2D_SETLINECAP";
    D2DType[D2DType["D2D_SETLINEJOIN"] = 56] = "D2D_SETLINEJOIN";
    D2DType[D2DType["D2D_SETLINEDASHOFFSET"] = 57] = "D2D_SETLINEDASHOFFSET";
    D2DType[D2DType["D2D_GETIMAGEDATA"] = 58] = "D2D_GETIMAGEDATA";
})(D2DType || (D2DType = {}));
export class twrConsoleCanvas {
    ctx;
    id;
    element;
    props;
    cmdCompleteSignal;
    canvasKeys;
    returnValue;
    isAsyncMod;
    precomputedObjects;
    constructor(element) {
        this.isAsyncMod = false; // set to true if getProxyParams called
        this.precomputedObjects = {};
        if (!(element && element instanceof HTMLCanvasElement && element.getContext))
            throw new Error("Invalid HTMLCanvasElement parameter in twrConsoleCanvas constructor ");
        this.element = element;
        const c = element.getContext("2d");
        if (!c)
            throw new Error("Canvas 2D context not found.");
        this.ctx = c;
        // these two lines are for backwards compatibility with prior version of twr-wasm
        c.font = "16 px Courier New";
        c.textBaseline = "top";
        this.props = { canvasHeight: element.height, canvasWidth: element.width, type: IOTypes.CANVAS2D };
        this.id = twrConsoleRegistry.registerConsole(this);
    }
    // these are the parameters needed to create a twrConsoleCanvasProxy, paired to us
    getProxyParams() {
        this.cmdCompleteSignal = new twrSignal();
        this.canvasKeys = new twrSharedCircularBuffer(); // tsconfig, lib must be set to 2017 or higher
        this.returnValue = new twrSharedCircularBuffer();
        this.isAsyncMod = true;
        return ["twrConsoleCanvasProxy", this.id, this.props, this.cmdCompleteSignal.sharedArray, this.canvasKeys.sharedArray, this.returnValue.sharedArray];
    }
    getProp(name) {
        return this.props[name];
    }
    // process messages sent from twrConsoleCanvasProxy
    // these are used to "remote procedure call" from the worker thread to the JS Main thread
    processMessage(msgType, data, callingModule) {
        const [id, ...params] = data;
        if (id != this.id)
            throw new Error("internal error"); // should never happen
        switch (msgType) {
            case "canvas2d-drawseq":
                {
                    const [ds] = params;
                    this.drawSeq(ds, callingModule);
                    break;
                }
            case "canvas2d-loadimage":
                {
                    const [urlPtr, id] = params;
                    this.loadImage(urlPtr, id, callingModule);
                    break;
                }
            default:
                return false;
        }
        return true;
    }
    loadImage(urlPtr, id, owner) {
        const url = owner.getString(urlPtr);
        if (id in this.precomputedObjects)
            console.log("warning: D2D_LOADIMAGE ID already exists.");
        const img = new Image();
        const errorMsg = "`private loadImage` either has an internal error or is being misused";
        img.onload = () => {
            if (this.returnValue) {
                this.returnValue.write(1);
            }
            else
                throw new Error(errorMsg);
        };
        img.onerror = () => {
            if (this.returnValue) {
                console.log("Warning: D2D_LOADIMAGE: failed to load image " + url);
                this.returnValue.write(0);
            }
            else
                throw new Error(errorMsg);
        };
        img.src = url;
        this.precomputedObjects[id] = img;
    }
    /* see draw2d.h for structs that match */
    drawSeq(ds, owner) {
        //console.log("twr::Canvas enter drawSeq");
        if (!this.ctx)
            return;
        const insHdrSize = 16;
        let currentInsHdr = owner.getLong(ds); /* ds->start */
        const lastInsHdr = owner.getLong(ds + 4); /* ds->last */
        let currentInsParams = currentInsHdr + insHdrSize;
        //console.log("instruction start, last ",ins.toString(16), lastins.toString(16));
        let nextInsHdr;
        //let insCount=0;
        while (1) {
            //insCount++;
            const type = owner.getLong(currentInsHdr + 4); /* hdr->type */
            if (0 /*type!=D2DType.D2D_FILLRECT*/) {
                console.log("ins", currentInsHdr);
                console.log("hdr.next", owner.mem8[currentInsHdr], owner.mem8[currentInsHdr + 1], owner.mem8[currentInsHdr + 2], owner.mem8[currentInsHdr + 3]);
                console.log("hdr.type", owner.mem8[currentInsHdr + 4], owner.mem8[currentInsHdr + 5]);
                console.log("next 4 bytes", owner.mem8[currentInsHdr + 6], owner.mem8[currentInsHdr + 7], owner.mem8[currentInsHdr + 8], owner.mem8[currentInsHdr + 9]);
                console.log("and 4 more ", owner.mem8[currentInsHdr + 10], owner.mem8[currentInsHdr + 11], owner.mem8[currentInsHdr + 12], owner.mem8[currentInsHdr + 13]);
                //console.log("ins, type, next is ", ins.toString(16), type.toString(16), next.toString(16));
            }
            switch (type) {
                case D2DType.D2D_FILLRECT:
                    {
                        const x = owner.getDouble(currentInsParams);
                        const y = owner.getDouble(currentInsParams + 8);
                        const w = owner.getDouble(currentInsParams + 16);
                        const h = owner.getDouble(currentInsParams + 24);
                        this.ctx.fillRect(x, y, w, h);
                    }
                    break;
                case D2DType.D2D_STROKERECT:
                    {
                        const x = owner.getDouble(currentInsParams);
                        const y = owner.getDouble(currentInsParams + 8);
                        const w = owner.getDouble(currentInsParams + 16);
                        const h = owner.getDouble(currentInsParams + 24);
                        this.ctx.strokeRect(x, y, w, h);
                    }
                    break;
                case D2DType.D2D_FILLCODEPOINT:
                    {
                        const x = owner.getDouble(currentInsParams);
                        const y = owner.getDouble(currentInsParams + 8);
                        const c = owner.getLong(currentInsParams + 16);
                        let txt = String.fromCodePoint(c);
                        this.ctx.fillText(txt, x, y);
                    }
                    break;
                case D2DType.D2D_FILLTEXT:
                    {
                        const x = owner.getDouble(currentInsParams);
                        const y = owner.getDouble(currentInsParams + 8);
                        const codePage = owner.getLong(currentInsParams + 20);
                        const strPointer = owner.getLong(currentInsParams + 16);
                        const str = owner.getString(strPointer, undefined, codePage);
                        //console.log("filltext ",x,y,str)
                        this.ctx.fillText(str, x, y);
                    }
                    break;
                case D2DType.D2D_MEASURETEXT:
                    {
                        const codePage = owner.getLong(currentInsParams + 8);
                        const str = owner.getString(owner.getLong(currentInsParams), undefined, codePage);
                        const tmidx = owner.getLong(currentInsParams + 4);
                        const tm = this.ctx.measureText(str);
                        owner.setDouble(tmidx + 0, tm.actualBoundingBoxAscent);
                        owner.setDouble(tmidx + 8, tm.actualBoundingBoxDescent);
                        owner.setDouble(tmidx + 16, tm.actualBoundingBoxLeft);
                        owner.setDouble(tmidx + 24, tm.actualBoundingBoxRight);
                        owner.setDouble(tmidx + 32, tm.fontBoundingBoxAscent);
                        owner.setDouble(tmidx + 40, tm.fontBoundingBoxDescent);
                        owner.setDouble(tmidx + 48, tm.width);
                    }
                    break;
                case D2DType.D2D_SETFONT:
                    {
                        const fontPointer = owner.getLong(currentInsParams);
                        const str = owner.getString(fontPointer);
                        this.ctx.font = str;
                    }
                    break;
                case D2DType.D2D_SETFILLSTYLERGBA:
                    {
                        const color = owner.getLong(currentInsParams);
                        const cssColor = "#" + ("00000000" + color.toString(16)).slice(-8);
                        this.ctx.fillStyle = cssColor;
                        //console.log("fillstyle: ", this.ctx.fillStyle, ":", cssColor,":", color)
                    }
                    break;
                case D2DType.D2D_SETSTROKESTYLERGBA:
                    {
                        const color = owner.getLong(currentInsParams);
                        const cssColor = "#" + ("00000000" + color.toString(16)).slice(-8);
                        this.ctx.strokeStyle = cssColor;
                    }
                    break;
                case D2DType.D2D_SETFILLSTYLE:
                    {
                        const cssColorPointer = owner.getLong(currentInsParams);
                        const cssColor = owner.getString(cssColorPointer);
                        this.ctx.fillStyle = cssColor;
                    }
                    break;
                case D2DType.D2D_SETSTROKESTYLE:
                    {
                        const cssColorPointer = owner.getLong(currentInsParams);
                        const cssColor = owner.getString(cssColorPointer);
                        this.ctx.strokeStyle = cssColor;
                    }
                    break;
                case D2DType.D2D_SETLINEWIDTH:
                    {
                        const width = owner.getDouble(currentInsParams);
                        this.ctx.lineWidth = width;
                        //console.log("twrCanvas D2D_SETLINEWIDTH: ", this.ctx.lineWidth);
                    }
                    break;
                case D2DType.D2D_MOVETO:
                    {
                        const x = owner.getDouble(currentInsParams);
                        const y = owner.getDouble(currentInsParams + 8);
                        this.ctx.moveTo(x, y);
                    }
                    break;
                case D2DType.D2D_LINETO:
                    {
                        const x = owner.getDouble(currentInsParams);
                        const y = owner.getDouble(currentInsParams + 8);
                        this.ctx.lineTo(x, y);
                    }
                    break;
                case D2DType.D2D_BEZIERTO:
                    {
                        const cp1x = owner.getDouble(currentInsParams);
                        const cp1y = owner.getDouble(currentInsParams + 8);
                        const cp2x = owner.getDouble(currentInsParams + 16);
                        const cp2y = owner.getDouble(currentInsParams + 24);
                        const x = owner.getDouble(currentInsParams + 32);
                        const y = owner.getDouble(currentInsParams + 40);
                        this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
                    }
                    break;
                case D2DType.D2D_BEGINPATH:
                    {
                        this.ctx.beginPath();
                    }
                    break;
                case D2DType.D2D_FILL:
                    {
                        this.ctx.fill();
                    }
                    break;
                case D2DType.D2D_SAVE:
                    {
                        this.ctx.save();
                    }
                    break;
                case D2DType.D2D_RESTORE:
                    {
                        this.ctx.restore();
                    }
                    break;
                case D2DType.D2D_STROKE:
                    {
                        this.ctx.stroke();
                    }
                    break;
                case D2DType.D2D_ARC:
                    {
                        const x = owner.getDouble(currentInsParams);
                        const y = owner.getDouble(currentInsParams + 8);
                        const radius = owner.getDouble(currentInsParams + 16);
                        const startAngle = owner.getDouble(currentInsParams + 24);
                        const endAngle = owner.getDouble(currentInsParams + 32);
                        const counterClockwise = (owner.getLong(currentInsParams + 40) != 0);
                        this.ctx.arc(x, y, radius, startAngle, endAngle, counterClockwise);
                    }
                    break;
                case D2DType.D2D_IMAGEDATA:
                    {
                        const start = owner.getLong(currentInsParams);
                        const length = owner.getLong(currentInsParams + 4);
                        const width = owner.getLong(currentInsParams + 8);
                        const height = owner.getLong(currentInsParams + 12);
                        const id = owner.getLong(currentInsParams + 16);
                        if (id in this.precomputedObjects)
                            console.log("warning: D2D_IMAGEDATA ID already exists.");
                        if (this.isAsyncMod) { // Uint8ClampedArray doesn't support shared memory
                            this.precomputedObjects[id] = { mem8: new Uint8Array(owner.memory.buffer, start, length), width: width, height: height };
                        }
                        else {
                            const z = new Uint8ClampedArray(owner.memory.buffer, start, length);
                            this.precomputedObjects[id] = new ImageData(z, width, height);
                        }
                    }
                    break;
                case D2DType.D2D_CREATERADIALGRADIENT:
                    {
                        const x0 = owner.getDouble(currentInsParams);
                        const y0 = owner.getDouble(currentInsParams + 8);
                        const radius0 = owner.getDouble(currentInsParams + 16);
                        const x1 = owner.getDouble(currentInsParams + 24);
                        const y1 = owner.getDouble(currentInsParams + 32);
                        const radius1 = owner.getDouble(currentInsParams + 40);
                        const id = owner.getLong(currentInsParams + 48);
                        let gradient = this.ctx.createRadialGradient(x0, y0, radius0, x1, y1, radius1);
                        if (id in this.precomputedObjects)
                            console.log("warning: D2D_CREATERADIALGRADIENT ID already exists.");
                        this.precomputedObjects[id] = gradient;
                    }
                    break;
                case D2DType.D2D_CREATELINEARGRADIENT:
                    {
                        const x0 = owner.getDouble(currentInsParams);
                        const y0 = owner.getDouble(currentInsParams + 8);
                        const x1 = owner.getDouble(currentInsParams + 16);
                        const y1 = owner.getDouble(currentInsParams + 24);
                        const id = owner.getLong(currentInsParams + 32);
                        let gradient = this.ctx.createLinearGradient(x0, y0, x1, y1);
                        if (id in this.precomputedObjects)
                            console.log("warning: D2D_CREATELINEARGRADIENT ID already exists.");
                        this.precomputedObjects[id] = gradient;
                    }
                    break;
                case D2DType.D2D_SETCOLORSTOP:
                    {
                        const id = owner.getLong(currentInsParams);
                        const pos = owner.getLong(currentInsParams + 4);
                        const cssColorPointer = owner.getLong(currentInsParams + 8);
                        const cssColor = owner.getString(cssColorPointer);
                        if (!(id in this.precomputedObjects))
                            throw new Error("D2D_SETCOLORSTOP with invalid ID: " + id);
                        const gradient = this.precomputedObjects[id];
                        gradient.addColorStop(pos, cssColor);
                    }
                    break;
                case D2DType.D2D_SETFILLSTYLEGRADIENT:
                    {
                        const id = owner.getLong(currentInsParams);
                        if (!(id in this.precomputedObjects))
                            throw new Error("D2D_SETFILLSTYLEGRADIENT with invalid ID: " + id);
                        const gradient = this.precomputedObjects[id];
                        this.ctx.fillStyle = gradient;
                    }
                    break;
                case D2DType.D2D_RELEASEID:
                    {
                        const id = owner.getLong(currentInsParams);
                        if (this.precomputedObjects[id])
                            delete this.precomputedObjects[id];
                        else
                            console.log("warning: D2D_RELEASEID with undefined ID ", id);
                    }
                    break;
                case D2DType.D2D_PUTIMAGEDATA:
                    {
                        const id = owner.getLong(currentInsParams);
                        const dx = owner.getLong(currentInsParams + 4);
                        const dy = owner.getLong(currentInsParams + 8);
                        const dirtyX = owner.getLong(currentInsParams + 12);
                        const dirtyY = owner.getLong(currentInsParams + 16);
                        const dirtyWidth = owner.getLong(currentInsParams + 20);
                        const dirtyHeight = owner.getLong(currentInsParams + 24);
                        if (!(id in this.precomputedObjects))
                            throw new Error("D2D_PUTIMAGEDATA with invalid ID: " + id);
                        //console.log("D2D_PUTIMAGEDATA",start, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight, this.imageData[start]);
                        let imgData;
                        if (this.isAsyncMod) { // Uint8ClampedArray doesn't support shared memory, so copy the memory
                            //console.log("D2D_PUTIMAGEDATA wasmModuleAsync");
                            const z = this.precomputedObjects[id]; // Uint8Array
                            const ca = Uint8ClampedArray.from(z.mem8); // shallow copy
                            imgData = new ImageData(ca, z.width, z.height);
                        }
                        else {
                            imgData = this.precomputedObjects[id];
                        }
                        if (dirtyWidth == 0 && dirtyHeight == 0) {
                            this.ctx.putImageData(imgData, dx, dy);
                        }
                        else {
                            this.ctx.putImageData(imgData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
                        }
                    }
                    break;
                case D2DType.D2D_CLOSEPATH:
                    {
                        this.ctx.closePath();
                    }
                    break;
                case D2DType.D2D_RESET:
                    {
                        this.ctx.reset();
                    }
                    break;
                case D2DType.D2D_CLEARRECT:
                    {
                        const x = owner.getDouble(currentInsParams);
                        const y = owner.getDouble(currentInsParams + 8);
                        const w = owner.getDouble(currentInsParams + 16);
                        const h = owner.getDouble(currentInsParams + 24);
                        this.ctx.clearRect(x, y, w, h);
                    }
                    break;
                case D2DType.D2D_SCALE:
                    {
                        const x = owner.getDouble(currentInsParams);
                        const y = owner.getDouble(currentInsParams + 8);
                        this.ctx.scale(x, y);
                    }
                    break;
                case D2DType.D2D_TRANSLATE:
                    {
                        const x = owner.getDouble(currentInsParams);
                        const y = owner.getDouble(currentInsParams + 8);
                        this.ctx.translate(x, y);
                    }
                    break;
                case D2DType.D2D_ROTATE:
                    {
                        const angle = owner.getDouble(currentInsParams);
                        this.ctx.rotate(angle);
                    }
                    break;
                case D2DType.D2D_GETTRANSFORM:
                    {
                        const matrix_ptr = owner.getLong(currentInsParams);
                        const transform = this.ctx.getTransform();
                        owner.setDouble(matrix_ptr + 0, transform.a);
                        owner.setDouble(matrix_ptr + 8, transform.b);
                        owner.setDouble(matrix_ptr + 16, transform.c);
                        owner.setDouble(matrix_ptr + 24, transform.d);
                        owner.setDouble(matrix_ptr + 32, transform.e);
                        owner.setDouble(matrix_ptr + 40, transform.f);
                    }
                    break;
                case D2DType.D2D_SETTRANSFORM:
                    {
                        const a = owner.getDouble(currentInsParams);
                        const b = owner.getDouble(currentInsParams + 8);
                        const c = owner.getDouble(currentInsParams + 16);
                        const d = owner.getDouble(currentInsParams + 24);
                        const e = owner.getDouble(currentInsParams + 32);
                        const f = owner.getDouble(currentInsParams + 40);
                        this.ctx.setTransform(a, b, c, d, e, f);
                    }
                    break;
                case D2DType.D2D_RESETTRANSFORM:
                    {
                        this.ctx.resetTransform();
                    }
                    break;
                case D2DType.D2D_STROKETEXT:
                    {
                        const x = owner.getDouble(currentInsParams);
                        const y = owner.getDouble(currentInsParams + 8);
                        const codePage = owner.getLong(currentInsParams + 20);
                        const strPointer = owner.getLong(currentInsParams + 16);
                        const str = owner.getString(strPointer, undefined, codePage);
                        this.ctx.strokeText(str, x, y);
                    }
                    break;
                case D2DType.D2D_ROUNDRECT:
                    {
                        const x = owner.getDouble(currentInsParams);
                        const y = owner.getDouble(currentInsParams + 8);
                        const width = owner.getDouble(currentInsParams + 16);
                        const height = owner.getDouble(currentInsParams + 24);
                        const radii = owner.getDouble(currentInsParams + 32);
                        this.ctx.roundRect(x, y, width, height, radii);
                    }
                    break;
                case D2DType.D2D_ELLIPSE:
                    {
                        const x = owner.getDouble(currentInsParams);
                        const y = owner.getDouble(currentInsParams + 8);
                        const radiusX = owner.getDouble(currentInsParams + 16);
                        const radiusY = owner.getDouble(currentInsParams + 24);
                        const rotation = owner.getDouble(currentInsParams + 32);
                        const startAngle = owner.getDouble(currentInsParams + 40);
                        const endAngle = owner.getDouble(currentInsParams + 48);
                        const counterClockwise = (owner.getLong(currentInsParams + 56) != 0);
                        this.ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterClockwise);
                    }
                    break;
                case D2DType.D2D_QUADRATICCURVETO:
                    {
                        const cpx = owner.getDouble(currentInsParams);
                        const cpy = owner.getDouble(currentInsParams + 8);
                        const x = owner.getDouble(currentInsParams + 16);
                        const y = owner.getDouble(currentInsParams + 24);
                        this.ctx.quadraticCurveTo(cpx, cpy, x, y);
                    }
                    break;
                case D2DType.D2D_SETLINEDASH:
                    {
                        const segment_len = owner.getLong(currentInsParams);
                        const seg_ptr = owner.getLong(currentInsParams + 4);
                        let segments = [];
                        for (let i = 0; i < segment_len; i++) {
                            segments[i] = owner.getDouble(seg_ptr + i * 8);
                        }
                        this.ctx.setLineDash(segments);
                    }
                    break;
                case D2DType.D2D_GETLINEDASH:
                    {
                        const segments = this.ctx.getLineDash();
                        const buffer_length = owner.getLong(currentInsParams);
                        const buffer_ptr = owner.getLong(currentInsParams + 4);
                        const segment_length_ptr = currentInsParams + 8;
                        owner.setLong(segment_length_ptr, segments.length);
                        if (segments.length > 0) {
                            for (let i = 0; i < Math.min(segments.length, buffer_length); i++) {
                                owner.setDouble(buffer_ptr + i * 8, segments[i]);
                            }
                            if (segments.length > buffer_length) {
                                console.log("warning: D2D_GETLINEDASH exceeded given max_length, truncating excess");
                            }
                        }
                    }
                    break;
                case D2DType.D2D_ARCTO:
                    {
                        const x1 = owner.getDouble(currentInsParams);
                        const y1 = owner.getDouble(currentInsParams + 8);
                        const x2 = owner.getDouble(currentInsParams + 16);
                        const y2 = owner.getDouble(currentInsParams + 24);
                        const radius = owner.getDouble(currentInsParams + 32);
                        this.ctx.arcTo(x1, y1, x2, y2, radius);
                    }
                    break;
                case D2DType.D2D_GETLINEDASHLENGTH:
                    {
                        owner.setLong(currentInsParams, this.ctx.getLineDash().length);
                    }
                    break;
                case D2DType.D2D_DRAWIMAGE:
                    {
                        const dx = owner.getDouble(currentInsParams);
                        const dy = owner.getDouble(currentInsParams + 8);
                        const id = owner.getLong(currentInsParams + 16);
                        if (!(id in this.precomputedObjects))
                            throw new Error("D2D_DRAWIMAGE with invalid ID: " + id);
                        let img = this.precomputedObjects[id];
                        this.ctx.drawImage(img, dx, dy);
                    }
                    break;
                case D2DType.D2D_RECT:
                    {
                        const x = owner.getDouble(currentInsParams);
                        const y = owner.getDouble(currentInsParams + 8);
                        const width = owner.getDouble(currentInsParams + 16);
                        const height = owner.getDouble(currentInsParams + 24);
                        this.ctx.rect(x, y, width, height);
                    }
                    break;
                case D2DType.D2D_TRANSFORM:
                    {
                        const a = owner.getDouble(currentInsParams);
                        const b = owner.getDouble(currentInsParams + 8);
                        const c = owner.getDouble(currentInsParams + 16);
                        const d = owner.getDouble(currentInsParams + 24);
                        const e = owner.getDouble(currentInsParams + 32);
                        const f = owner.getDouble(currentInsParams + 40);
                        this.ctx.transform(a, b, c, d, e, f);
                    }
                    break;
                case D2DType.D2D_SETLINECAP:
                    {
                        const lineCapPtr = owner.getLong(currentInsParams);
                        const lineCap = owner.getString(lineCapPtr);
                        this.ctx.lineCap = lineCap;
                    }
                    break;
                case D2DType.D2D_SETLINEJOIN:
                    {
                        const lineJoinPtr = owner.getLong(currentInsParams);
                        const lineJoin = owner.getString(lineJoinPtr);
                        this.ctx.lineJoin = lineJoin;
                    }
                    break;
                case D2DType.D2D_SETLINEDASHOFFSET:
                    {
                        const lineDashOffset = owner.getDouble(currentInsParams);
                        this.ctx.lineDashOffset = lineDashOffset;
                    }
                    break;
                case D2DType.D2D_GETIMAGEDATA:
                    {
                        const x = owner.getDouble(currentInsParams);
                        const y = owner.getDouble(currentInsParams + 8);
                        const width = owner.getDouble(currentInsParams + 16);
                        const height = owner.getDouble(currentInsParams + 24);
                        const memPtr = owner.getLong(currentInsParams + 32);
                        const memLen = owner.getLong(currentInsParams + 36);
                        let imgData = this.ctx.getImageData(x, y, width, height);
                        const imgLen = imgData.data.byteLength;
                        console.log("img len: ", imgLen);
                        if (imgLen > memLen)
                            console.log("Warning: D2D_GETIMAGEDATA was given a buffer smaller than the image size! Extra data is being truncated");
                        owner.mem8.set(imgData.data.slice(0, Math.min(memLen, imgLen)), memPtr);
                    }
                    break;
                default:
                    throw new Error("unimplemented or unknown Sequence Type in drawSeq: " + type);
            }
            nextInsHdr = owner.getLong(currentInsHdr); /* hdr->next */
            if (nextInsHdr == 0) {
                if (currentInsHdr != lastInsHdr)
                    throw new Error("assert type error in twrcanvas, ins!=lastins");
                break;
            }
            currentInsHdr = nextInsHdr;
            currentInsParams = currentInsHdr + insHdrSize;
        }
        if (this.cmdCompleteSignal)
            this.cmdCompleteSignal.signal();
        //console.log("Canvas.drawSeq() completed  with instruction count of ", insCount);
    }
}
export class twrConsoleCanvasProxy {
    canvasKeys;
    drawCompleteSignal;
    props;
    id;
    returnValue;
    constructor(params) {
        const [className, id, props, signalBuffer, canvasKeysBuffer, returnBuffer] = params;
        this.drawCompleteSignal = new twrSignal(signalBuffer);
        this.canvasKeys = new twrSharedCircularBuffer(canvasKeysBuffer);
        this.returnValue = new twrSharedCircularBuffer(returnBuffer);
        this.props = props;
        this.id = id;
        //console.log("Create New twrCanvasProxy: ",this.props)
    }
    charIn() {
        //ctx.commit(); not avail in chrome
        //postMessage(["debug", 'x']);
        return this.canvasKeys.readWait(); // wait for a key, then read it
    }
    inkey() {
        if (this.canvasKeys.isEmpty())
            return 0;
        else
            return this.charIn();
    }
    // note that this implementation does not allow a property to change post creation of an instance of this class
    getProp(propName) {
        return this.props[propName];
    }
    drawSeq(ds) {
        this.drawCompleteSignal.reset();
        postMessage(["canvas2d-drawseq", [this.id, ds]]);
        this.drawCompleteSignal.wait();
    }
    loadImage(urlPtr, id) {
        postMessage(["canvas2d-loadimage", [this.id, urlPtr, id]]);
        return this.returnValue.readWait();
    }
}
//# sourceMappingURL=twrconcanvas.js.map