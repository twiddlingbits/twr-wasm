(()=>{var e,t,r,s;let n;class i{sharedArray;buf;constructor(e){if("undefined"!=typeof window&&!crossOriginIsolated&&"file:"!==window.location.protocol)throw Error("twrSharedCircularBuffer constructor, crossOriginIsolated="+crossOriginIsolated+". See SharedArrayBuffer docs.");e?this.sharedArray=e:this.sharedArray=new SharedArrayBuffer(1032),this.buf=new Int32Array(this.sharedArray),this.buf[256]=0,this.buf[257]=0}write(e){let t=this.buf[257];this.buf[t]=e,256==++t&&(t=0),this.buf[257]=t,Atomics.notify(this.buf,257)}read(){if(this.isEmpty())return -1;{let e=this.buf[256],t=this.buf[e];return e++,this.buf[256]=e,t}}readWait(){if(this.isEmpty()){let e=this.buf[256];Atomics.wait(this.buf,257,e)}return this.read()}isEmpty(){return this.buf[256]==this.buf[257]}}(r=e||(e={}))[r.WAITING=0]="WAITING",r[r.SIGNALED=1]="SIGNALED";class a{sharedArray;buf;constructor(t){if("undefined"!=typeof window&&!crossOriginIsolated&&"file:"!==window.location.protocol)throw Error("twrSignal constructor, crossOriginIsolated="+crossOriginIsolated+". See SharedArrayBuffer docs.");t?this.sharedArray=t:this.sharedArray=new SharedArrayBuffer(4),this.buf=new Int32Array(this.sharedArray),this.buf[0]=e.WAITING}signal(){this.buf[0]=e.SIGNALED,Atomics.notify(this.buf,0)}wait(){this.buf[0]==e.WAITING&&Atomics.wait(this.buf,0,e.WAITING)}isSignaled(){return this.buf[0]==e.SIGNALED}reset(){this.buf[0]=e.WAITING}}(s=t||(t={}))[s.D2D_FILLRECT=1]="D2D_FILLRECT",s[s.D2D_FILLCODEPOINT=5]="D2D_FILLCODEPOINT",s[s.D2D_SETLINEWIDTH=10]="D2D_SETLINEWIDTH",s[s.D2D_SETFILLSTYLERGBA=11]="D2D_SETFILLSTYLERGBA",s[s.D2D_SETFONT=12]="D2D_SETFONT",s[s.D2D_BEGINPATH=13]="D2D_BEGINPATH",s[s.D2D_MOVETO=14]="D2D_MOVETO",s[s.D2D_LINETO=15]="D2D_LINETO",s[s.D2D_FILL=16]="D2D_FILL",s[s.D2D_STROKE=17]="D2D_STROKE",s[s.D2D_SETSTROKESTYLERGBA=18]="D2D_SETSTROKESTYLERGBA",s[s.D2D_ARC=19]="D2D_ARC",s[s.D2D_STROKERECT=20]="D2D_STROKERECT",s[s.D2D_FILLTEXT=21]="D2D_FILLTEXT",s[s.D2D_IMAGEDATA=22]="D2D_IMAGEDATA",s[s.D2D_PUTIMAGEDATA=23]="D2D_PUTIMAGEDATA",s[s.D2D_BEZIERTO=24]="D2D_BEZIERTO",s[s.D2D_MEASURETEXT=25]="D2D_MEASURETEXT",s[s.D2D_SAVE=26]="D2D_SAVE",s[s.D2D_RESTORE=27]="D2D_RESTORE",s[s.D2D_CREATERADIALGRADIENT=28]="D2D_CREATERADIALGRADIENT",s[s.D2D_SETCOLORSTOP=29]="D2D_SETCOLORSTOP",s[s.D2D_SETFILLSTYLEGRADIENT=30]="D2D_SETFILLSTYLEGRADIENT",s[s.D2D_RELEASEID=31]="D2D_RELEASEID",s[s.D2D_CREATELINEARGRADIENT=32]="D2D_CREATELINEARGRADIENT",s[s.D2D_SETFILLSTYLE=33]="D2D_SETFILLSTYLE",s[s.D2D_SETSTROKESTYLE=34]="D2D_SETSTROKESTYLE";class o{canvasKeys;drawCompleteSignal;props;owner;constructor(e,t){let[r,s,n]=e;this.drawCompleteSignal=new a(s),this.canvasKeys=new i(n),this.props=r,this.owner=t}charIn(){return this.canvasKeys.readWait()}inkey(){return this.canvasKeys.isEmpty()?0:this.charIn()}getProp(e){let t=this.owner.getString(e);return this.props[t]}drawSeq(e){this.drawCompleteSignal.reset(),postMessage(["drawseq",[e]]),this.drawCompleteSignal.wait()}}let l=new TextDecoder("utf-8"),h=new TextDecoder("windows-1252");function c(e,t){let r;if(65001==t)r=l.decode(new Uint8Array([e]),{stream:!0});else if(1252==t)r=h.decode(new Uint8Array([e]));else if(0==t)r=e>127?"":String.fromCharCode(e);else if(12e3==t)r=String.fromCodePoint(e);else throw Error("unsupported CodePage: "+t);return r.codePointAt(0)||0}function u(e,t,r){return function(e,t,r,s){let n=e.stringToU8(r,s);return e.mem8.set(n,t),n.length}(this,e,String.fromCodePoint(t),r)}function m(){return A(this,navigator.language,0)}function d(e,t){let r=RegExp(this.getString(e),"u"),s=h.decode(new Uint8Array([t]));return r.test(s)?1:0}function f(e){if(8239==e.codePointAt(0))return 32;let t=e.codePointAt(0)||0;switch(t){case 338:return 140;case 339:return 156;case 352:return 138;case 353:return 154;case 376:return 159;case 381:return 142;case 382:return 158;case 402:return 131;case 710:return 136}switch(e.normalize()){case"€":return 128;case"‚":return 130;case"ƒ":return 131;case"„":return 132;case"…":return 133;case"†":return 134;case"‡":return 135;case"ˆ":return 136;case"‰":return 137;case"Š":return 138;case"‹":return 139;case"Œ":return 140;case"Ž":return 142;case"‘":return 145;case"’":return 146;case"“":return 147;case"”":return 148;case"•":return 149;case"–":return 150;case"—":return 151;case"˜":return 152;case"™":return 153;case"š":return 154;case"›":return 155;case"œ":return 156;case"ž":return 158;case"Ÿ":return 159}return t>255&&(console.log("twr-wasm.to1252(): unable to convert: ",e,t),t=0),t}function g(e){let t=h.decode(new Uint8Array([e]));return RegExp("^\\p{Letter}$","u").test(t)?f(t.toLocaleLowerCase()):e}function w(e){let t=h.decode(new Uint8Array([e]));return 402==t.codePointAt(0)||181==t.codePointAt(0)||223==t.codePointAt(0)||"µ"==t||"ƒ"==t||"ß"==t?e:RegExp("^\\p{Letter}$","u").test(t)?f(t.toLocaleUpperCase()):e}function D(e,t,r){let s=this.getString(e,void 0,r),n=this.getString(t,void 0,r);return new Intl.Collator().compare(s,n)}function E(e,t){let r=new Date(1e3*t);this.setLong(e,r.getSeconds()),this.setLong(e+4,r.getMinutes()),this.setLong(e+8,r.getHours()),this.setLong(e+12,r.getDate()),this.setLong(e+16,r.getMonth()),this.setLong(e+20,r.getFullYear()-1900),this.setLong(e+24,r.getDay()),this.setLong(e+28,function(e){let t=new Date(e.getFullYear(),0,1);return Math.floor((e.getTime()-t.getTime())/864e5)}(r)),this.setLong(e+32,new Date().toLocaleTimeString("en-US",{timeZoneName:"long"}).includes("Daylight")?1:0),this.setLong(e+36,-(60*r.getTimezoneOffset())),this.setLong(e+40,A(this,r.toLocaleTimeString("en-US",{timeZoneName:"short"}).split(" ").pop()||"UTC",0))}function p(e,t,r,s){let n=A(e,r,s);e.setLong(t,n)}function A(e,t,r){let s=e.stringToU8(t,r),n=(0,e.exports.malloc)(s.length+1);return e.mem8.set(s,n),e.mem8[n+s.length]=0,n}function T(e,t){let r=new Intl.NumberFormat().format(1.1).replace(/[0-9]/g,"").charAt(0),s=new Intl.NumberFormat(void 0,{minimumFractionDigits:0}).format(1e3).replace(/[0-9]/g,"").charAt(0);p(this,e+0,r,t),p(this,e+4,s,t),p(this,e+20,r,t),p(this,e+24,s,t),p(this,e+24,s,t),p(this,e+24,s,t),p(this,e+32,"+",t),p(this,e+36,"-",t),p(this,e+12,y(),t),p(this,e+16,y(),t)}function y(){switch(navigator.language){case"en-US":case"en-CA":case"fr-CA":case"en-AU":case"es-MX":case"es-AR":case"es-CL":case"es-CO":case"es-EC":case"en-GY":case"nl-SR":case"es-UY":case"en-BZ":case"es-SV":case"es-PA":return"$";case"es-BO":case"es-VE":return"Bs.";case"es-PY":return"₲";case"es-PE":return"S/";case"es-CR":return"₡";case"es-GT":return"Q";case"es-HN":return"L";case"es-NI":return"C$";case"en-GB":return"£";case"en-IE":case"de-DE":case"fr-FR":case"de-AT":case"nl-BE":case"fr-BE":case"el-CY":case"et-EE":case"fi-FI":case"sv-FI":case"el-GR":case"it-IT":case"lv-LV":case"lt-LT":case"fr-LU":case"de-LU":case"lb-LU":case"mt-MT":case"nl-NL":case"pt-PT":case"sk-SK":case"sl-SI":case"es-ES":return"€";case"ja-JP":case"zh-CN":return"¥";case"de-CH":case"fr-CH":case"it-CH":return"CHF";case"sv-SE":case"da-DK":case"nb-NO":return"kr";case"ru-RU":return"₽";case"ko-KR":return"₩";case"en-IN":return"₹";case"pt-BR":return"R$";case"he-IL":return"₪";case"tr-TR":return"₺";default:return""}}function I(e){let t=(0,this.exports.malloc)(160);for(let r=0;r<7;r++)p(this,t+4*r,S(r,"long"),e);for(let r=0;r<7;r++)p(this,t+(r+7)*4,S(r,"short"),e);for(let r=0;r<12;r++)p(this,t+(r+14)*4,L(r,"long"),e);for(let r=0;r<12;r++)p(this,t+(r+14+12)*4,L(r,"short"),e);return p(this,t+152,function(){let e=new Date(2e3,0,1,9,0,0),t=new Intl.DateTimeFormat(void 0,{hour:"numeric",hour12:!0}).formatToParts(e).find(e=>"dayPeriod"===e.type);return t?t.value:""}(),e),p(this,t+156,function(){let e=new Date(2e3,0,1,15,0,0),t=new Intl.DateTimeFormat(void 0,{hour:"numeric",hour12:!0}).formatToParts(e).find(e=>"dayPeriod"===e.type);return t?t.value:""}(),e),t}function S(e,t){let r=new Date;return r.setDate(r.getDate()-r.getDay()+e),new Intl.DateTimeFormat(void 0,{weekday:t}).format(r)}function L(e,t){let r=new Intl.DateTimeFormat(void 0,{month:t}),s=new Date(2e3,e,1);return r.format(s)}class b{divKeys;constructor(e){let[t]=e;this.divKeys=new i(t)}charIn(){return this.divKeys.readWait()}inkey(){return this.divKeys.isEmpty()?0:this.charIn()}charOut(e,t){postMessage(["divout",[e,t]])}}function C(e){postMessage(["debug",e])}class U{mod;constructor(e){this.mod=e}atod(e,t){let r=this.mod.getString(e,t),s=r.trimStart().toUpperCase();return"INF"==s||"+INF"==s||"INFINITY"==s||"+INFINITY"==s?Number.POSITIVE_INFINITY:"-INF"==s||"-INFINITY"==s?Number.NEGATIVE_INFINITY:Number.parseFloat(r.replaceAll("D","e").replaceAll("d","e"))}dtoa(e,t,r,s){if(-1==s){let s=r.toString();this.mod.copyString(e,t,s)}else{let n=r.toString();n.length>s&&(n=r.toPrecision(s)),this.mod.copyString(e,t,n)}}toFixed(e,t,r,s){let n=r.toFixed(s);this.mod.copyString(e,t,n)}toExponential(e,t,r,s){let n=r.toExponential(s);this.mod.copyString(e,t,n)}fcvtS(e,t,r,s,n,i){let a,o;if(0==e||0==i||0==n||t<1)return 1;let l=0;if(Number.isNaN(r))a="1#QNAN00000000000000000000000000000".slice(0,s+1),o=1;else if(Number.isFinite(r)){if(0==r)a="000000000000000000000000000000000000".slice(0,s),o=0;else{if(r<0&&(l=1,r=Math.abs(r)),s>100||r>1e21||r<1e-99)return this.mod.copyString(e,t,""),this.mod.mem32[n]=0,1;let[i="",h=""]=r.toFixed(s).split(".");"0"==i&&(i=""),i.length>0?(o=i.length,a=i+h):o=(a=h.replace(/^0+/,"")).length-h.length}}else a="1#INF00000000000000000000000000000".slice(0,s+1),o=1;return t-1<a.length?1:(this.mod.copyString(e,t,a),this.mod.setLong(n,o),this.mod.setLong(i,l),0)}}class R{memory;mem8;mem32;memD;exports;isWorker=!1;isWasmModule;floatUtil;constructor(e=!1){this.isWasmModule=e,this.mem8=new Uint8Array,this.mem32=new Uint32Array,this.memD=new Float64Array,this.floatUtil=new U(this)}async loadWasm(e){let t;try{t=await fetch(e)}catch(t){throw console.log("loadWasm() failed to fetch: "+e),t}if(!t.ok)throw Error("fetch response error on file '"+e+"'\n"+t.statusText);try{let e=await t.arrayBuffer(),r={...this.modParams.imports},s=await WebAssembly.instantiate(e,{env:r});if(this.exports=s.instance.exports,!this.exports)throw Error("Unexpected error - undefined instance.exports");if(this.memory)throw Error("unexpected error -- this.memory already set");if(this.memory=this.exports.memory,!this.memory)throw Error("Unexpected error - undefined exports.memory");this.mem8=new Uint8Array(this.memory.buffer),this.mem32=new Uint32Array(this.memory.buffer),this.memD=new Float64Array(this.memory.buffer),this.isWorker&&(this.memory.buffer instanceof ArrayBuffer&&console.log("twrWasmModuleAsync requires shared Memory. Add wasm-ld --shared-memory --no-check-features (see docs)"),postMessage(["setmemory",this.memory])),!this.isWasmModule||this.memory.buffer instanceof ArrayBuffer||console.log("twrWasmModule does not require shared Memory. Okay to remove wasm-ld --shared-memory --no-check-features"),this.malloc=e=>new Promise(t=>{let r=this.exports.malloc;t(r(e))}),this.init()}catch(e){throw console.log("WASM instantiate error: "+e+(e.stack?"\n"+e.stack:"")),e}}init(){let e;switch(this.modParams.stdio){case"debug":default:e=0;break;case"div":e=1;break;case"canvas":e=2;break;case"null":e=3}(0,this.exports.twr_wasm_init)(e,this.mem8.length)}async callC(e){let t=await this.preCallC(e),r=this.callCImpl(e[0],t);return this.postCallC(t,e),r}async callCImpl(e,t=[]){if(!this.exports)throw Error("this.exports undefined");if(!this.exports[e])throw Error("callC: function '"+e+"' not in export table.  Use --export wasm-ld flag.");return(0,this.exports[e])(...t)}async preCallC(e){if(e.constructor!==Array)throw Error("callC: params must be array, first arg is function name");if(0==e.length)throw Error("callC: missing function name");let t=[],r=0;for(let s=1;s<e.length;s++){let n=e[s];switch(typeof n){case"number":t[r++]=n;break;case"string":t[r++]=await this.putString(n);break;case"object":if(n instanceof URL){let e=await this.fetchAndPutURL(n);t[r++]=e[0],t[r++]=e[1];break}if(n instanceof ArrayBuffer){let e=await this.putArrayBuffer(n);t[r++]=e;break}default:throw Error("callC: invalid object type passed in")}}return t}async postCallC(e,t){let r=0;for(let s=1;s<t.length;s++){let n=t[s];switch(typeof n){case"number":r++;break;case"string":this.callCImpl("free",[e[r]]),r++;break;case"object":if(n instanceof URL){this.callCImpl("free",[e[r]]),r+=2;break}if(n instanceof ArrayBuffer){let t=new Uint8Array(n);for(let s=0;s<t.length;s++)t[s]=this.mem8[e[r]+s];this.callCImpl("free",[e[r]]),r++;break}throw Error("postCallC: internal error A");default:throw Error("postCallC: internal error B")}}return e}stringToU8(e,t=65001){let r;if(65001==t)r=new TextEncoder().encode(e);else if(1252==t){r=new Uint8Array(e.length);for(let t=0;t<e.length;t++)r[t]=f(e[t])}else if(0==t){r=new Uint8Array(e.length);for(let t=0;t<e.length;t++){let s=function(e){if("ƒ"==e)return 102;if(8239==e.codePointAt(0))return 32;let t=e.codePointAt(0)||0;return t>127?63:t}(e[t]);r[t]=s}}else throw Error("unknown codePage: "+t);return r}copyString(e,t,r,s=65001){let n;if(t<1)throw Error("copyString buffer_size must have length > 0 (room for terminating 0): "+t);let i=this.stringToU8(r,s);for(n=0;n<i.length&&n<t-1;n++)this.mem8[e+n]=i[n];this.mem8[e+n]=0}async putString(e,t=65001){let r=this.stringToU8(e,t),s=await this.malloc(r.length+1);return this.mem8.set(r,s),this.mem8[s+r.length]=0,s}async putU8(e){let t=await this.malloc(e.length);return this.mem8.set(e,t),t}async putArrayBuffer(e){let t=new Uint8Array(e);return this.putU8(t)}async fetchAndPutURL(e){if(!("object"==typeof e&&e instanceof URL))throw Error("fetchAndPutURL param must be URL");try{let t=await fetch(e),r=await t.arrayBuffer(),s=new Uint8Array(r);return[await this.putU8(s),s.length]}catch(t){throw console.log("fetchAndPutURL Error. URL: "+e+"\n"+t+(t.stack?"\n"+t.stack:"")),t}}getLong(e){let t=Math.floor(e/4);if(4*t!=e)throw Error("getLong passed non long aligned address");if(t<0||t>=this.mem32.length)throw Error("invalid index passed to getLong: "+e+", this.mem32.length: "+this.mem32.length);return this.mem32[t]}setLong(e,t){let r=Math.floor(e/4);if(4*r!=e)throw Error("setLong passed non long aligned address");if(r<0||r>=this.mem32.length-1)throw Error("invalid index passed to setLong: "+e+", this.mem32.length: "+this.mem32.length);this.mem32[r]=t}getDouble(e){let t=Math.floor(e/8);if(8*t!=e)throw Error("getLong passed non Float64 aligned address");return this.memD[t]}setDouble(e,t){let r=Math.floor(e/8);if(8*r!=e)throw Error("setDouble passed non Float64 aligned address");this.memD[r]=t}getShort(e){if(e<0||e>=this.mem8.length)throw Error("invalid index passed to getShort: "+e);return this.mem8[e]+256*this.mem8[e+1]}getString(e,t,r=65001){let s;if(e<0||e>=this.mem8.length)throw Error("invalid strIndex passed to getString: "+e);if(t){if(t<0||t+e>this.mem8.length)throw Error("invalid len  passed to getString: "+t)}else{if(-1==(t=this.mem8.indexOf(0,e)))throw Error("string is not null terminated");t-=e}if(65001==r)s="utf-8";else if(1252==r)s="windows-1252";else throw Error("Unsupported codePage: "+r);let n=new TextDecoder(s),i=new Uint8Array(this.mem8.buffer,e,t);if(this.mem8.buffer instanceof ArrayBuffer)return n.decode(i);{let e=new Uint8Array(new ArrayBuffer(t));return e.set(i),n.decode(e)}}getU8Arr(e){if(e<0||e>=this.mem8.length)throw Error("invalid index passed to getU8: "+e);let t=new Uint32Array(this.mem8.slice(e,e+8).buffer),r=t[0],s=t[1];if(s<0||s>=this.mem8.length)throw Error("invalid idx.dataptr passed to getU8");if(r<0||r>this.mem8.length-s)throw Error("invalid idx.size passed to  getU8");return this.mem8.slice(s,s+r)}getU32Arr(e){if(e<0||e>=this.mem8.length)throw Error("invalid index passed to getU32: "+e);let t=new Uint32Array(this.mem8.slice(e,e+8).buffer),r=t[0],s=t[1];if(s<0||s>=this.mem8.length)throw Error("invalid idx.dataptr passed to getU32");if(r<0||r>this.mem8.length-s)throw Error("invalid idx.size passed to  getU32");if(r%4!=0)throw Error("idx.size is not an integer number of 32 bit words");return new Uint32Array(this.mem8.slice(s,s+r).buffer)}}class N{callCompleteSignal;parameters;constructor(e){this.callCompleteSignal=new a(e[0]),this.parameters=new Uint32Array(e[1])}sleep(e){this.callCompleteSignal.reset(),postMessage(["sleep",[e]]),this.callCompleteSignal.wait()}}function _(){return Date.now()}onmessage=function(e){if("startup"==e.data[0]){let t=e.data[1];(n=new P(t.modParams,t.modWorkerParams)).loadWasm(t.urlToLoad).then(()=>{postMessage(["startupOkay"])}).catch(e=>{console.log(".catch: ",e),postMessage(["startupFail",e])})}else"callC"==e.data[0]?n.callCImpl(e.data[1],e.data[2]).then(e=>{postMessage(["callCOkay",e])}).catch(e=>{console.log("exception in callC twrworker.js\n"),console.log(e),postMessage(["callCFail",e])}):console.log("twrworker.js: unknown message: "+e)};class P extends R{malloc;modParams;constructor(e,t){super(),this.isWorker=!0,this.malloc=e=>{throw Error("error - un-init malloc called")},this.modParams=e;let r=new o(t.canvasProxyParams,this),s=new b(t.divProxyParams),n=new N(t.waitingCallsProxyParams);this.modParams.imports={twrDebugLog:C,twrTimeEpoch:_,twrTimeTmLocal:E.bind(this),twrUserLconv:T.bind(this),twrUserLanguage:m.bind(this),twrRegExpTest1252:d.bind(this),twrToLower1252:g.bind(this),twrToUpper1252:w.bind(this),twrStrcoll:D.bind(this),twrUnicodeCodePointToCodePage:u.bind(this),twrCodePageToUnicodeCodePoint:c.bind(this),twrGetDtnames:I.bind(this),twrSleep:n.sleep.bind(n),twrDivCharOut:s.charOut.bind(s),twrDivCharIn:s.charIn.bind(s),twrCanvasCharIn:r.charIn.bind(r),twrCanvasInkey:r.inkey.bind(r),twrCanvasGetProp:r.getProp.bind(r),twrCanvasDrawSeq:r.drawSeq.bind(r),twrSin:Math.sin,twrCos:Math.cos,twrTan:Math.tan,twrFAbs:Math.abs,twrACos:Math.acos,twrASin:Math.asin,twrATan:Math.atan,twrExp:Math.exp,twrFloor:Math.floor,twrCeil:Math.ceil,twrFMod:function(e,t){return e%t},twrLog:Math.log,twrPow:Math.pow,twrSqrt:Math.sqrt,twrTrunc:Math.trunc,twrDtoa:this.floatUtil.dtoa.bind(this.floatUtil),twrToFixed:this.floatUtil.toFixed.bind(this.floatUtil),twrToExponential:this.floatUtil.toExponential.bind(this.floatUtil),twrAtod:this.floatUtil.atod.bind(this.floatUtil),twrFcvtS:this.floatUtil.fcvtS.bind(this.floatUtil)}}}})();
//# sourceMappingURL=twrmodworker.8f60cbfd.js.map
