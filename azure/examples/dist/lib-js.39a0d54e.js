function e(e,t,r,s){Object.defineProperty(e,t,{get:r,set:s,enumerable:!0,configurable:!0})}var t=globalThis,r={},s={},i=t.parcelRequire8dfc;null==i&&((i=function(e){if(e in r)return r[e].exports;if(e in s){var t=s[e];delete s[e];var i={id:e,exports:{}};return r[e]=i,t.call(i.exports,i,i.exports),i.exports}var o=Error("Cannot find module '"+e+"'");throw o.code="MODULE_NOT_FOUND",o}).register=function(e,t){s[e]=t},t.parcelRequire8dfc=i);var o=i.register;o("eZoLj",function(t,r){e(t.exports,"register",()=>s,e=>s=e);var s,i=new Map;s=function(e,t){for(var r=0;r<t.length-1;r+=2)i.set(t[r],{baseUrl:e,path:t[r+1]})}}),o("57pKS",function(t,r){e(t.exports,"twrWasmModule",()=>i("5baAq").twrWasmModule),e(t.exports,"twrWasmModuleAsync",()=>i("U6Thw").twrWasmModuleAsync),i("5baAq"),i("U6Thw")}),o("5baAq",function(t,r){e(t.exports,"twrWasmModule",()=>l);var s=i("3mJs2"),o=i("1Yd7N"),n=i("5savl"),a=i("7qrGZ");class l extends o.twrWasmModuleInJSMain{malloc;constructor(e={}){let t;super(e,!0),this.malloc=e=>{throw Error("error - un-init malloc called")},t=this.d2dcanvas.isValid()?this.d2dcanvas:this.iocanvas,this.modParams.imports={twrDebugLog:s.twrDebugLogImpl,twrTimeEpoch:n.twrTimeEpochImpl,twrTimeTmLocal:(0,a.twrTimeTmLocalImpl).bind(this),twrUserLconv:(0,a.twrUserLconvImpl).bind(this),twrUserLanguage:(0,a.twrUserLanguageImpl).bind(this),twrRegExpTest1252:(0,a.twrRegExpTest1252Impl).bind(this),twrToLower1252:(0,a.twrToLower1252Impl).bind(this),twrToUpper1252:(0,a.twrToUpper1252Impl).bind(this),twrStrcoll:(0,a.twrStrcollImpl).bind(this),twrUnicodeCodePointToCodePage:(0,a.twrUnicodeCodePointToCodePageImpl).bind(this),twrCodePageToUnicodeCodePoint:(0,a.twrCodePageToUnicodeCodePointImpl).bind(this),twrGetDtnames:(0,a.twrGetDtnamesImpl).bind(this),twrDivCharOut:this.iodiv.charOut.bind(this.iodiv),twrCanvasGetProp:t.getProp.bind(t),twrCanvasDrawSeq:t.drawSeq.bind(t),twrCanvasCharIn:this.null,twrCanvasInkey:this.null,twrDivCharIn:this.null,twrSleep:this.null,twrSin:Math.sin,twrCos:Math.cos,twrTan:Math.tan,twrFAbs:Math.abs,twrACos:Math.acos,twrASin:Math.asin,twrATan:Math.atan,twrExp:Math.exp,twrFloor:Math.floor,twrCeil:Math.ceil,twrFMod:function(e,t){return e%t},twrLog:Math.log,twrPow:Math.pow,twrSqrt:Math.sqrt,twrTrunc:Math.trunc,twrDtoa:this.floatUtil.dtoa.bind(this.floatUtil),twrToFixed:this.floatUtil.toFixed.bind(this.floatUtil),twrToExponential:this.floatUtil.toExponential.bind(this.floatUtil),twrAtod:this.floatUtil.atod.bind(this.floatUtil),twrFcvtS:this.floatUtil.fcvtS.bind(this.floatUtil)}}null(e){throw Error("call to unimplemented twrXXX import in twrWasmModule.  Use twrWasmModuleAsync ?")}}}),o("3mJs2",function(t,r){e(t.exports,"twrDebugLogImpl",()=>i);let s="";function i(e){10==e||3==e?(console.log(s),s=""):(s+=String.fromCodePoint(e)).length>=300&&(console.log(s),s="")}}),o("1Yd7N",function(t,r){e(t.exports,"twrWasmModuleInJSMain",()=>l);var s=i("kXrGb"),o=i("jhM3f"),n=i("eDJ4i"),a=i("7qrGZ");class l extends o.twrWasmModuleBase{iocanvas;d2dcanvas;iodiv;modParams;constructor(e={},t=!1){if(super(t),"undefined"==typeof document)throw Error("twrWasmModuleJSMain should only be created in JavaScript Main.");let r=document.getElementById("twr_iodiv"),i=document.getElementById("twr_iocanvas"),o=document.getElementById("twr_d2dcanvas");if(i&&o)throw Error("Both twr_iocanvas and twr_d2dcanvas defined. Currently only one canvas allowed.");if("div"==e.stdio&&!r)throw Error("twrWasmModuleBase opts=='div' but twr_iodiv not defined");if("canvas"==e.stdio&&!i)throw Error("twrWasmModuleBase, opts=='canvas' but twr_iocanvas not defined");if(e.isd2dcanvas&&!o)throw Error("twrWasmModuleBase, opts.isd2dcanvas==true but twr_d2dcanvas not defined");e=r?{stdio:"div",...e}:i?{stdio:"canvas",...e}:{stdio:"debug",...e},r||i?console.log("twr-wasm: stdio set to: ",e.stdio):console.log("Since neither twr_iocanvas nor twr_iodiv is defined, stdout directed to debug console."),(e=i?{windim:[64,16],...e}:{windim:[0,0],...e}).imports||(e.imports={});let a=!1;e.backcolor||(a=!0,e.backcolor="black"),e.forecolor||(a=!0,e.forecolor="white"),e.fontsize||(a=!0,e.fontsize=16),void 0===e.isd2dcanvas&&(o?e.isd2dcanvas=!0:e.isd2dcanvas=!1),this.modParams={stdio:e.stdio,windim:e.windim,imports:e.imports,forecolor:e.forecolor,backcolor:e.backcolor,styleIsDefault:a,fontsize:e.fontsize,isd2dcanvas:e.isd2dcanvas},this.iodiv=new s.twrDiv(r,this.modParams,this),this.iocanvas=new n.twrCanvas(i,this.modParams,this),this.d2dcanvas=new n.twrCanvas(o,this.modParams,this)}divLog(...e){for(var t=0;t<e.length;t++)this.iodiv.stringOut(e[t].toString()),this.iodiv.charOut(32,a.codePageUTF32);this.iodiv.charOut(10,a.codePageUTF32)}}}),o("kXrGb",function(t,r){e(t.exports,"twrDiv",()=>n);var s=i("dRr3I"),o=i("7qrGZ");class n{div;divKeys;CURSOR=String.fromCharCode(9611);cursorOn=!1;lastChar=0;extraBR=!1;owner;constructor(e,t,r){this.div=e,this.owner=r,this.owner.isWasmModule||(this.divKeys=new s.twrSharedCircularBuffer),this.div&&!t.styleIsDefault&&(this.div.style.backgroundColor=t.backcolor,this.div.style.color=t.forecolor,this.div.style.font=t.fontsize.toString()+"px arial")}isValid(){return!!this.div}getProxyParams(){if(!this.divKeys)throw Error("internal error in getProxyParams.");return[this.divKeys.sharedArray]}charOut(e,t){if(!this.div)return;this.extraBR&&(this.extraBR=!1,this.cursorOn&&(this.div.innerHTML=this.div.innerHTML.slice(0,-1)),this.div.innerHTML=this.div.innerHTML.slice(0,-4),this.cursorOn&&(this.div.innerHTML+=this.CURSOR));let r=(0,o.twrCodePageToUnicodeCodePointImpl)(e,t);if(0!=r){switch(r){case 10:case 13:if(10==e&&13==this.lastChar)break;this.cursorOn&&(this.div.innerHTML=this.div.innerHTML.slice(0,-1)),this.div.innerHTML+="<br><br>",this.extraBR=!0,this.cursorOn&&(this.div.innerHTML+=this.CURSOR);let t=this.div.getBoundingClientRect();window.scrollTo(0,t.height+100);break;case 8:this.cursorOn&&(this.div.innerHTML=this.div.innerHTML.slice(0,-1)),this.div.innerHTML=this.div.innerHTML.slice(0,-1),this.cursorOn&&(this.div.innerHTML+=this.CURSOR);break;case 14:this.cursorOn||(this.cursorOn=!0,this.div.innerHTML+=this.CURSOR,this.div.focus());break;case 15:this.cursorOn&&(this.cursorOn=!1,this.div.innerHTML=this.div.innerHTML.slice(0,-1));break;default:this.cursorOn&&(this.div.innerHTML=this.div.innerHTML.slice(0,-1));let s=String.fromCodePoint(r);" "==s&&(s="&nbsp;"),this.div.innerHTML+=s,this.cursorOn&&(this.div.innerHTML+=this.CURSOR)}this.lastChar=r}}stringOut(e){for(let t=0;t<e.length;t++)this.charOut(e.codePointAt(t)||0,o.codePageUTF32)}}}),o("dRr3I",function(t,r){e(t.exports,"twrSharedCircularBuffer",()=>s);class s{sharedArray;buf;constructor(e){if("undefined"!=typeof window&&!crossOriginIsolated&&"file:"!==window.location.protocol)throw Error("twrSharedCircularBuffer constructor, crossOriginIsolated="+crossOriginIsolated+". See SharedArrayBuffer docs.");e?this.sharedArray=e:this.sharedArray=new SharedArrayBuffer(1032),this.buf=new Int32Array(this.sharedArray),this.buf[256]=0,this.buf[257]=0}write(e){let t=this.buf[257];this.buf[t]=e,256==++t&&(t=0),this.buf[257]=t,Atomics.notify(this.buf,257)}read(){if(this.isEmpty())return -1;{let e=this.buf[256],t=this.buf[e];return e++,this.buf[256]=e,t}}readWait(){if(this.isEmpty()){let e=this.buf[256];Atomics.wait(this.buf,257,e)}return this.read()}isEmpty(){return this.buf[256]==this.buf[257]}}}),o("7qrGZ",function(t,r){e(t.exports,"codePageASCII",()=>s),e(t.exports,"codePage1252",()=>i),e(t.exports,"codePageUTF8",()=>o),e(t.exports,"codePageUTF32",()=>n),e(t.exports,"twrCodePageToUnicodeCodePointImpl",()=>c),e(t.exports,"twrUnicodeCodePointToCodePageImpl",()=>h),e(t.exports,"twrUserLanguageImpl",()=>d),e(t.exports,"twrRegExpTest1252Impl",()=>u),e(t.exports,"to1252",()=>m),e(t.exports,"toASCII",()=>w),e(t.exports,"twrToLower1252Impl",()=>g),e(t.exports,"twrToUpper1252Impl",()=>f),e(t.exports,"twrStrcollImpl",()=>p),e(t.exports,"twrTimeTmLocalImpl",()=>D),e(t.exports,"twrUserLconvImpl",()=>b),e(t.exports,"twrGetDtnamesImpl",()=>v);let s=0,i=1252,o=65001,n=12e3,a=new TextDecoder("utf-8"),l=new TextDecoder("windows-1252");function c(e,t){let r;if(t==o)r=a.decode(new Uint8Array([e]),{stream:!0});else if(t==i)r=l.decode(new Uint8Array([e]));else if(t==s)r=e>127?"":String.fromCharCode(e);else if(t==n)r=String.fromCodePoint(e);else throw Error("unsupported CodePage: "+t);return r.codePointAt(0)||0}function h(e,t,r){return function(e,t,r,s){let i=e.stringToU8(r,s);return e.mem8.set(i,t),i.length}(this,e,String.fromCodePoint(t),r)}function d(){return T(this,navigator.language,s)}function u(e,t){let r=RegExp(this.getString(e),"u"),s=l.decode(new Uint8Array([t]));return r.test(s)?1:0}function m(e){if(8239==e.codePointAt(0))return 32;let t=e.codePointAt(0)||0;switch(t){case 338:return 140;case 339:return 156;case 352:return 138;case 353:return 154;case 376:return 159;case 381:return 142;case 382:return 158;case 402:return 131;case 710:return 136}switch(e.normalize()){case"€":return 128;case"‚":return 130;case"ƒ":return 131;case"„":return 132;case"…":return 133;case"†":return 134;case"‡":return 135;case"ˆ":return 136;case"‰":return 137;case"Š":return 138;case"‹":return 139;case"Œ":return 140;case"Ž":return 142;case"‘":return 145;case"’":return 146;case"“":return 147;case"”":return 148;case"•":return 149;case"–":return 150;case"—":return 151;case"˜":return 152;case"™":return 153;case"š":return 154;case"›":return 155;case"œ":return 156;case"ž":return 158;case"Ÿ":return 159}return t>255&&(console.log("twr-wasm.to1252(): unable to convert: ",e,t),t=0),t}function w(e){if("ƒ"==e)return 102;if(8239==e.codePointAt(0))return 32;let t=e.codePointAt(0)||0;return t>127?63:t}function g(e){let t=l.decode(new Uint8Array([e]));return RegExp("^\\p{Letter}$","u").test(t)?m(t.toLocaleLowerCase()):e}function f(e){let t=l.decode(new Uint8Array([e]));return 402==t.codePointAt(0)||181==t.codePointAt(0)||223==t.codePointAt(0)||"µ"==t||"ƒ"==t||"ß"==t?e:RegExp("^\\p{Letter}$","u").test(t)?m(t.toLocaleUpperCase()):e}function p(e,t,r){let s=this.getString(e,void 0,r),i=this.getString(t,void 0,r);return new Intl.Collator().compare(s,i)}function D(e,t){let r=new Date(1e3*t);this.setLong(e,r.getSeconds()),this.setLong(e+4,r.getMinutes()),this.setLong(e+8,r.getHours()),this.setLong(e+12,r.getDate()),this.setLong(e+16,r.getMonth()),this.setLong(e+20,r.getFullYear()-1900),this.setLong(e+24,r.getDay()),this.setLong(e+28,function(e){let t=new Date(e.getFullYear(),0,1);return Math.floor((e.getTime()-t.getTime())/864e5)}(r)),this.setLong(e+32,new Date().toLocaleTimeString("en-US",{timeZoneName:"long"}).includes("Daylight")?1:0),this.setLong(e+36,-(60*r.getTimezoneOffset())),this.setLong(e+40,T(this,r.toLocaleTimeString("en-US",{timeZoneName:"short"}).split(" ").pop()||"UTC",s))}function E(e,t,r,s){let i=T(e,r,s);e.setLong(t,i)}function T(e,t,r){let s=e.stringToU8(t,r),i=(0,e.exports.malloc)(s.length+1);return e.mem8.set(s,i),e.mem8[i+s.length]=0,i}function b(e,t){let r=new Intl.NumberFormat().format(1.1).replace(/[0-9]/g,"").charAt(0),s=new Intl.NumberFormat(void 0,{minimumFractionDigits:0}).format(1e3).replace(/[0-9]/g,"").charAt(0);E(this,e+0,r,t),E(this,e+4,s,t),E(this,e+20,r,t),E(this,e+24,s,t),E(this,e+24,s,t),E(this,e+24,s,t),E(this,e+32,"+",t),E(this,e+36,"-",t),E(this,e+12,y(),t),E(this,e+16,y(),t)}function y(){switch(navigator.language){case"en-US":case"en-CA":case"fr-CA":case"en-AU":case"es-MX":case"es-AR":case"es-CL":case"es-CO":case"es-EC":case"en-GY":case"nl-SR":case"es-UY":case"en-BZ":case"es-SV":case"es-PA":return"$";case"es-BO":case"es-VE":return"Bs.";case"es-PY":return"₲";case"es-PE":return"S/";case"es-CR":return"₡";case"es-GT":return"Q";case"es-HN":return"L";case"es-NI":return"C$";case"en-GB":return"£";case"en-IE":case"de-DE":case"fr-FR":case"de-AT":case"nl-BE":case"fr-BE":case"el-CY":case"et-EE":case"fi-FI":case"sv-FI":case"el-GR":case"it-IT":case"lv-LV":case"lt-LT":case"fr-LU":case"de-LU":case"lb-LU":case"mt-MT":case"nl-NL":case"pt-PT":case"sk-SK":case"sl-SI":case"es-ES":return"€";case"ja-JP":case"zh-CN":return"¥";case"de-CH":case"fr-CH":case"it-CH":return"CHF";case"sv-SE":case"da-DK":case"nb-NO":return"kr";case"ru-RU":return"₽";case"ko-KR":return"₩";case"en-IN":return"₹";case"pt-BR":return"R$";case"he-IL":return"₪";case"tr-TR":return"₺";default:return""}}function v(e){let t=(0,this.exports.malloc)(160);for(let r=0;r<7;r++)E(this,t+4*r,L(r,"long"),e);for(let r=0;r<7;r++)E(this,t+(r+7)*4,L(r,"short"),e);for(let r=0;r<12;r++)E(this,t+(r+14)*4,A(r,"long"),e);for(let r=0;r<12;r++)E(this,t+(r+14+12)*4,A(r,"short"),e);return E(this,t+152,function(){let e=new Date(2e3,0,1,9,0,0),t=new Intl.DateTimeFormat(void 0,{hour:"numeric",hour12:!0}).formatToParts(e).find(e=>"dayPeriod"===e.type);return t?t.value:""}(),e),E(this,t+156,function(){let e=new Date(2e3,0,1,15,0,0),t=new Intl.DateTimeFormat(void 0,{hour:"numeric",hour12:!0}).formatToParts(e).find(e=>"dayPeriod"===e.type);return t?t.value:""}(),e),t}function L(e,t){let r=new Date;return r.setDate(r.getDate()-r.getDay()+e),new Intl.DateTimeFormat(void 0,{weekday:t}).format(r)}function A(e,t){let r=new Intl.DateTimeFormat(void 0,{month:t}),s=new Date(2e3,e,1);return r.format(s)}}),o("jhM3f",function(t,r){e(t.exports,"twrWasmModuleBase",()=>n);var s=i("8k9qF"),o=i("7qrGZ");class n{memory;mem8;mem32;memD;exports;isAsyncProxy=!1;isWasmModule;floatUtil;constructor(e=!1){this.isWasmModule=e,this.mem8=new Uint8Array,this.mem32=new Uint32Array,this.memD=new Float64Array,this.floatUtil=new s.twrFloatUtil(this)}async loadWasm(e){let t;try{t=await fetch(e)}catch(t){throw console.log("loadWasm() failed to fetch: "+e),t}if(!t.ok)throw Error("fetch response error on file '"+e+"'\n"+t.statusText);try{let e=await t.arrayBuffer(),r={...this.modParams.imports},s=await WebAssembly.instantiate(e,{env:r});if(this.exports=s.instance.exports,!this.exports)throw Error("Unexpected error - undefined instance.exports");if(this.memory)throw Error("unexpected error -- this.memory already set");if(this.memory=this.exports.memory,!this.memory)throw Error("Unexpected error - undefined exports.memory");this.mem8=new Uint8Array(this.memory.buffer),this.mem32=new Uint32Array(this.memory.buffer),this.memD=new Float64Array(this.memory.buffer),this.isAsyncProxy&&(this.memory.buffer instanceof ArrayBuffer&&console.log("twrWasmModuleAsync requires shared Memory. Add wasm-ld --shared-memory --no-check-features (see docs)"),postMessage(["setmemory",this.memory])),!this.isWasmModule||this.memory.buffer instanceof ArrayBuffer||console.log("twrWasmModule does not require shared Memory. Okay to remove wasm-ld --shared-memory --no-check-features"),this.malloc=e=>new Promise(t=>{let r=this.exports.malloc;t(r(e))}),this.init()}catch(e){throw console.log("Wasm instantiate error: "+e+(e.stack?"\n"+e.stack:"")),e}}init(){let e;switch(this.modParams.stdio){case"debug":default:e=0;break;case"div":e=1;break;case"canvas":e=2;break;case"null":e=3}(0,this.exports.twr_wasm_init)(e,this.mem8.length)}async callC(e){let t=await this.preCallC(e),r=await this.callCImpl(e[0],t);return await this.postCallC(t,e),r}async callCImpl(e,t=[]){if(!this.exports)throw Error("this.exports undefined");if(!this.exports[e])throw Error("callC: function '"+e+"' not in export table.  Use --export wasm-ld flag.");return(0,this.exports[e])(...t)}async preCallC(e){if(e.constructor!==Array)throw Error("callC: params must be array, first arg is function name");if(0==e.length)throw Error("callC: missing function name");let t=[],r=0;for(let s=1;s<e.length;s++){let i=e[s];switch(typeof i){case"number":case"bigint":t[r++]=i;break;case"string":t[r++]=await this.putString(i);break;case"object":if(i instanceof URL){let e=await this.fetchAndPutURL(i);t[r++]=e[0],t[r++]=e[1];break}if(i instanceof ArrayBuffer){let e=await this.putArrayBuffer(i);t[r++]=e;break}default:throw Error("callC: invalid object type passed in")}}return t}async postCallC(e,t){let r=0;for(let s=1;s<t.length;s++){let i=t[s];switch(typeof i){case"number":case"bigint":r++;break;case"string":await this.callCImpl("free",[e[r]]),r++;break;case"object":if(i instanceof URL){await this.callCImpl("free",[e[r]]),r+=2;break}if(i instanceof ArrayBuffer){let t=new Uint8Array(i),s=e[r];for(let e=0;e<t.length;e++)t[e]=this.mem8[s+e];await this.callCImpl("free",[s]),r++;break}throw Error("postCallC: internal error A");default:throw Error("postCallC: internal error B")}}return e}stringToU8(e,t=o.codePageUTF8){let r;if(t==o.codePageUTF8)r=new TextEncoder().encode(e);else if(t==o.codePage1252){r=new Uint8Array(e.length);for(let t=0;t<e.length;t++)r[t]=(0,o.to1252)(e[t])}else if(t==o.codePageASCII){r=new Uint8Array(e.length);for(let t=0;t<e.length;t++){let s=(0,o.toASCII)(e[t]);r[t]=s}}else throw Error("unknown codePage: "+t);return r}copyString(e,t,r,s=o.codePageUTF8){let i;if(t<1)throw Error("copyString buffer_size must have length > 0 (room for terminating 0): "+t);let n=this.stringToU8(r,s);for(i=0;i<n.length&&i<t-1;i++)this.mem8[e+i]=n[i];this.mem8[e+i]=0}async putString(e,t=o.codePageUTF8){let r=this.stringToU8(e,t),s=await this.malloc(r.length+1);return this.mem8.set(r,s),this.mem8[s+r.length]=0,s}async putU8(e){let t=await this.malloc(e.length);return this.mem8.set(e,t),t}async putArrayBuffer(e){let t=new Uint8Array(e);return this.putU8(t)}async fetchAndPutURL(e){if(!("object"==typeof e&&e instanceof URL))throw Error("fetchAndPutURL param must be URL");try{let t=await fetch(e),r=await t.arrayBuffer(),s=new Uint8Array(r);return[await this.putU8(s),s.length]}catch(t){throw console.log("fetchAndPutURL Error. URL: "+e+"\n"+t+(t.stack?"\n"+t.stack:"")),t}}getLong(e){let t=Math.floor(e/4);if(4*t!=e)throw Error("getLong passed non long aligned address");if(t<0||t>=this.mem32.length)throw Error("invalid index passed to getLong: "+e+", this.mem32.length: "+this.mem32.length);return this.mem32[t]}setLong(e,t){let r=Math.floor(e/4);if(4*r!=e)throw Error("setLong passed non long aligned address");if(r<0||r>=this.mem32.length-1)throw Error("invalid index passed to setLong: "+e+", this.mem32.length: "+this.mem32.length);this.mem32[r]=t}getDouble(e){let t=Math.floor(e/8);if(8*t!=e)throw Error("getLong passed non Float64 aligned address");return this.memD[t]}setDouble(e,t){let r=Math.floor(e/8);if(8*r!=e)throw Error("setDouble passed non Float64 aligned address");this.memD[r]=t}getShort(e){if(e<0||e>=this.mem8.length)throw Error("invalid index passed to getShort: "+e);return this.mem8[e]+256*this.mem8[e+1]}getString(e,t,r=o.codePageUTF8){let s;if(e<0||e>=this.mem8.length)throw Error("invalid strIndex passed to getString: "+e);if(t){if(t<0||t+e>this.mem8.length)throw Error("invalid len  passed to getString: "+t)}else{if(-1==(t=this.mem8.indexOf(0,e)))throw Error("string is not null terminated");t-=e}if(r==o.codePageUTF8)s="utf-8";else if(r==o.codePage1252)s="windows-1252";else throw Error("Unsupported codePage: "+r);let i=new TextDecoder(s),n=new Uint8Array(this.mem8.buffer,e,t);if(this.mem8.buffer instanceof ArrayBuffer)return i.decode(n);{let e=new Uint8Array(new ArrayBuffer(t));return e.set(n),i.decode(e)}}getU8Arr(e){if(e<0||e>=this.mem8.length)throw Error("invalid index passed to getU8: "+e);let t=new Uint32Array(this.mem8.slice(e,e+8).buffer),r=t[0],s=t[1];if(s<0||s>=this.mem8.length)throw Error("invalid idx.dataptr passed to getU8");if(r<0||r>this.mem8.length-s)throw Error("invalid idx.size passed to  getU8");return this.mem8.slice(s,s+r)}getU32Arr(e){if(e<0||e>=this.mem8.length)throw Error("invalid index passed to getU32: "+e);let t=new Uint32Array(this.mem8.slice(e,e+8).buffer),r=t[0],s=t[1];if(s<0||s>=this.mem8.length)throw Error("invalid idx.dataptr passed to getU32");if(r<0||r>this.mem8.length-s)throw Error("invalid idx.size passed to  getU32");if(r%4!=0)throw Error("idx.size is not an integer number of 32 bit words");return new Uint32Array(this.mem8.slice(s,s+r).buffer)}}}),o("8k9qF",function(t,r){e(t.exports,"twrFloatUtil",()=>s);class s{mod;constructor(e){this.mod=e}atod(e,t){let r=this.mod.getString(e,t),s=r.trimStart().toUpperCase();return"INF"==s||"+INF"==s||"INFINITY"==s||"+INFINITY"==s?Number.POSITIVE_INFINITY:"-INF"==s||"-INFINITY"==s?Number.NEGATIVE_INFINITY:Number.parseFloat(r.replaceAll("D","e").replaceAll("d","e"))}dtoa(e,t,r,s){if(-1==s){let s=r.toString();this.mod.copyString(e,t,s)}else{let i=r.toString();i.length>s&&(i=r.toPrecision(s)),this.mod.copyString(e,t,i)}}toFixed(e,t,r,s){let i=r.toFixed(s);this.mod.copyString(e,t,i)}toExponential(e,t,r,s){let i=r.toExponential(s);this.mod.copyString(e,t,i)}fcvtS(e,t,r,s,i,o){let n,a;if(0==e||0==o||0==i||t<1)return 1;let l=0;if(Number.isNaN(r))n="1#QNAN00000000000000000000000000000".slice(0,s+1),a=1;else if(Number.isFinite(r)){if(0==r)n="000000000000000000000000000000000000".slice(0,s),a=0;else{if(r<0&&(l=1,r=Math.abs(r)),s>100||r>1e21||r<1e-99)return this.mod.copyString(e,t,""),this.mod.mem32[i]=0,1;let[o="",c=""]=r.toFixed(s).split(".");"0"==o&&(o=""),o.length>0?(a=o.length,n=o+c):a=(n=c.replace(/^0+/,"")).length-c.length}}else n="1#INF00000000000000000000000000000".slice(0,s+1),a=1;return t-1<n.length?1:(this.mod.copyString(e,t,n),this.mod.setLong(i,a),this.mod.setLong(o,l),0)}}}),o("eDJ4i",function(t,r){e(t.exports,"twrCanvas",()=>l);var s,o,n=i("dRr3I"),a=i("3k1GP");(s=o||(o={}))[s.D2D_FILLRECT=1]="D2D_FILLRECT",s[s.D2D_FILLCODEPOINT=5]="D2D_FILLCODEPOINT",s[s.D2D_SETLINEWIDTH=10]="D2D_SETLINEWIDTH",s[s.D2D_SETFILLSTYLERGBA=11]="D2D_SETFILLSTYLERGBA",s[s.D2D_SETFONT=12]="D2D_SETFONT",s[s.D2D_BEGINPATH=13]="D2D_BEGINPATH",s[s.D2D_MOVETO=14]="D2D_MOVETO",s[s.D2D_LINETO=15]="D2D_LINETO",s[s.D2D_FILL=16]="D2D_FILL",s[s.D2D_STROKE=17]="D2D_STROKE",s[s.D2D_SETSTROKESTYLERGBA=18]="D2D_SETSTROKESTYLERGBA",s[s.D2D_ARC=19]="D2D_ARC",s[s.D2D_STROKERECT=20]="D2D_STROKERECT",s[s.D2D_FILLTEXT=21]="D2D_FILLTEXT",s[s.D2D_IMAGEDATA=22]="D2D_IMAGEDATA",s[s.D2D_PUTIMAGEDATA=23]="D2D_PUTIMAGEDATA",s[s.D2D_BEZIERTO=24]="D2D_BEZIERTO",s[s.D2D_MEASURETEXT=25]="D2D_MEASURETEXT",s[s.D2D_SAVE=26]="D2D_SAVE",s[s.D2D_RESTORE=27]="D2D_RESTORE",s[s.D2D_CREATERADIALGRADIENT=28]="D2D_CREATERADIALGRADIENT",s[s.D2D_SETCOLORSTOP=29]="D2D_SETCOLORSTOP",s[s.D2D_SETFILLSTYLEGRADIENT=30]="D2D_SETFILLSTYLEGRADIENT",s[s.D2D_RELEASEID=31]="D2D_RELEASEID",s[s.D2D_CREATELINEARGRADIENT=32]="D2D_CREATELINEARGRADIENT",s[s.D2D_SETFILLSTYLE=33]="D2D_SETFILLSTYLE",s[s.D2D_SETSTROKESTYLE=34]="D2D_SETSTROKESTYLE";class l{ctx;props={charWidth:0,charHeight:0,foreColor:0,backColor:0,widthInChars:0,heightInChars:0,canvasHeight:0,canvasWidth:0};owner;cmdCompleteSignal;canvasKeys;precomputedObjects;constructor(e,t,r){let{forecolor:s,backcolor:i,fontsize:o,isd2dcanvas:l}=t;if(this.owner=r,this.props.widthInChars=t.windim[0],this.props.heightInChars=t.windim[1],this.owner.isWasmModule||(this.cmdCompleteSignal=new a.twrSignal,this.canvasKeys=new n.twrSharedCircularBuffer),this.precomputedObjects={},e){if(!e.getContext)throw Error("attempted to create new twrCanvas with an element that is not a valid HTMLCanvasElement");let t=e.getContext("2d");if(!t)throw Error("canvas 2D context not found in twrCanvasConstructor");t.font=o.toString()+"px Courier New",t.textBaseline="top";let r="          ",n=t.measureText(r);this.props.charWidth=Math.ceil(n.width/r.length);let a=t.measureText("X");this.props.charHeight=Math.ceil(a.fontBoundingBoxAscent+a.fontBoundingBoxDescent),l||(e.width=this.props.charWidth*this.props.widthInChars,e.height=this.props.charHeight*this.props.heightInChars),this.props.canvasHeight=e.height,this.props.canvasWidth=e.width;let c=e.getContext("2d");if(!c)throw Error("canvas 2D context not found in twrCanvas.constructor (2nd time)");this.ctx=c,this.ctx.font=o.toString()+"px Courier New",this.ctx.textBaseline="top",c.fillStyle=i,this.props.backColor=Number("0x"+c.fillStyle.slice(1)),c.fillStyle=s,this.props.foreColor=Number("0x"+c.fillStyle.slice(1))}}isValid(){return!!this.ctx}getProxyParams(){if(!this.cmdCompleteSignal||!this.canvasKeys)throw Error("internal error in getProxyParams.");return[this.props,this.cmdCompleteSignal.sharedArray,this.canvasKeys.sharedArray]}getProp(e){this.isValid()||console.log("internal error - getProp called on invalid twrCanvas");let t=this.owner.getString(e);return this.props[t]}drawSeq(e){let t;if(this.isValid()||console.log("internal error - drawSeq called on invalid twrCanvas"),!this.ctx)return;let r=this.owner.getLong(e),s=this.owner.getLong(e+4);for(;;){let e=this.owner.getLong(r+4);switch(e){case o.D2D_FILLRECT:{let e=this.owner.getDouble(r+8),t=this.owner.getDouble(r+16),s=this.owner.getDouble(r+24),i=this.owner.getDouble(r+32);this.ctx.fillRect(e,t,s,i)}break;case o.D2D_STROKERECT:{let e=this.owner.getDouble(r+8),t=this.owner.getDouble(r+16),s=this.owner.getDouble(r+24),i=this.owner.getDouble(r+32);this.ctx.strokeRect(e,t,s,i)}break;case o.D2D_FILLCODEPOINT:{let e=this.owner.getDouble(r+8),t=this.owner.getDouble(r+16),s=String.fromCodePoint(this.owner.getLong(r+24));this.ctx.fillText(s,e,t)}break;case o.D2D_FILLTEXT:{let e=this.owner.getDouble(r+8),t=this.owner.getDouble(r+16),s=this.owner.getLong(r+28),i=this.owner.getString(this.owner.getLong(r+24),void 0,s);this.ctx.fillText(i,e,t)}break;case o.D2D_MEASURETEXT:{let e=this.owner.getLong(r+16),t=this.owner.getString(this.owner.getLong(r+8),void 0,e),s=this.owner.getLong(r+12),i=this.ctx.measureText(t);this.owner.setDouble(s+0,i.actualBoundingBoxAscent),this.owner.setDouble(s+8,i.actualBoundingBoxDescent),this.owner.setDouble(s+16,i.actualBoundingBoxLeft),this.owner.setDouble(s+24,i.actualBoundingBoxRight),this.owner.setDouble(s+32,i.fontBoundingBoxAscent),this.owner.setDouble(s+40,i.fontBoundingBoxDescent),this.owner.setDouble(s+48,i.width)}break;case o.D2D_SETFONT:{let e=this.owner.getString(this.owner.getLong(r+8));this.ctx.font=e}break;case o.D2D_SETFILLSTYLERGBA:{let e="#"+("00000000"+this.owner.getLong(r+8).toString(16)).slice(-8);this.ctx.fillStyle=e}break;case o.D2D_SETSTROKESTYLERGBA:{let e="#"+("00000000"+this.owner.getLong(r+8).toString(16)).slice(-8);this.ctx.strokeStyle=e}break;case o.D2D_SETFILLSTYLE:{let e=this.owner.getString(this.owner.getLong(r+8));this.ctx.fillStyle=e}break;case o.D2D_SETSTROKESTYLE:{let e=this.owner.getString(this.owner.getLong(r+8));this.ctx.strokeStyle=e}break;case o.D2D_SETLINEWIDTH:{let e=this.owner.getShort(r+8);this.ctx.lineWidth=e}break;case o.D2D_MOVETO:{let e=this.owner.getDouble(r+8),t=this.owner.getDouble(r+16);this.ctx.moveTo(e,t)}break;case o.D2D_LINETO:{let e=this.owner.getDouble(r+8),t=this.owner.getDouble(r+16);this.ctx.lineTo(e,t)}break;case o.D2D_BEZIERTO:{let e=this.owner.getDouble(r+8),t=this.owner.getDouble(r+16),s=this.owner.getDouble(r+24),i=this.owner.getDouble(r+32),o=this.owner.getDouble(r+40),n=this.owner.getDouble(r+48);this.ctx.bezierCurveTo(e,t,s,i,o,n)}break;case o.D2D_BEGINPATH:this.ctx.beginPath();break;case o.D2D_FILL:this.ctx.fill();break;case o.D2D_SAVE:this.ctx.save();break;case o.D2D_RESTORE:this.ctx.restore();break;case o.D2D_STROKE:this.ctx.stroke();break;case o.D2D_ARC:{let e=this.owner.getDouble(r+8),t=this.owner.getDouble(r+16),s=this.owner.getDouble(r+24),i=this.owner.getDouble(r+32),o=this.owner.getDouble(r+40),n=0!=this.owner.getLong(r+48);this.ctx.arc(e,t,s,i,o,n)}break;case o.D2D_IMAGEDATA:{let e=this.owner.getLong(r+8),t=this.owner.getLong(r+12),s=this.owner.getLong(r+16),i=this.owner.getLong(r+20),o=this.owner.getLong(r+24);if(o in this.precomputedObjects&&console.log("warning: D2D_IMAGEDATA ID already exists."),this.owner.isWasmModule){let r=new Uint8ClampedArray(this.owner.memory.buffer,e,t);this.precomputedObjects[o]=new ImageData(r,s,i)}else this.precomputedObjects[o]={mem8:new Uint8Array(this.owner.memory.buffer,e,t),width:s,height:i}}break;case o.D2D_CREATERADIALGRADIENT:{let e=this.owner.getDouble(r+8),t=this.owner.getDouble(r+16),s=this.owner.getDouble(r+24),i=this.owner.getDouble(r+32),o=this.owner.getDouble(r+40),n=this.owner.getDouble(r+48),a=this.owner.getLong(r+56),l=this.ctx.createRadialGradient(e,t,s,i,o,n);a in this.precomputedObjects&&console.log("warning: D2D_CREATERADIALGRADIENT ID already exists."),this.precomputedObjects[a]=l}break;case o.D2D_CREATELINEARGRADIENT:{let e=this.owner.getDouble(r+8),t=this.owner.getDouble(r+16),s=this.owner.getDouble(r+24),i=this.owner.getDouble(r+32),o=this.owner.getLong(r+40),n=this.ctx.createLinearGradient(e,t,s,i);o in this.precomputedObjects&&console.log("warning: D2D_CREATELINEARGRADIENT ID already exists."),this.precomputedObjects[o]=n}break;case o.D2D_SETCOLORSTOP:{let e=this.owner.getLong(r+8),t=this.owner.getLong(r+12),s=this.owner.getString(this.owner.getLong(r+16));if(!(e in this.precomputedObjects))throw Error("D2D_SETCOLORSTOP with invalid ID: "+e);this.precomputedObjects[e].addColorStop(t,s)}break;case o.D2D_SETFILLSTYLEGRADIENT:{let e=this.owner.getLong(r+8);if(!(e in this.precomputedObjects))throw Error("D2D_SETFILLSTYLEGRADIENT with invalid ID: "+e);let t=this.precomputedObjects[e];this.ctx.fillStyle=t}break;case o.D2D_RELEASEID:{let e=this.owner.getLong(r+8);this.precomputedObjects[e]?delete this.precomputedObjects[e]:console.log("warning: D2D_RELEASEID with undefined ID ",e)}break;case o.D2D_PUTIMAGEDATA:{let e;let t=this.owner.getLong(r+8),s=this.owner.getLong(r+12),i=this.owner.getLong(r+16),o=this.owner.getLong(r+20),n=this.owner.getLong(r+24),a=this.owner.getLong(r+28),l=this.owner.getLong(r+32);if(!(t in this.precomputedObjects))throw Error("D2D_PUTIMAGEDATA with invalid ID: "+t);if(this.owner.isWasmModule)e=this.precomputedObjects[t];else{let r=this.precomputedObjects[t];e=new ImageData(Uint8ClampedArray.from(r.mem8),r.width,r.height)}0==a&&0==l?this.ctx.putImageData(e,s,i):this.ctx.putImageData(e,s,i,o,n,a,l)}break;default:throw Error("unimplemented or unknown Sequence Type in drawSeq: "+e)}if(0==(t=this.owner.getLong(r))){if(r!=s)throw Error("assert type error in twrcanvas, ins!=lastins");break}r=t}this.cmdCompleteSignal&&this.cmdCompleteSignal.signal()}}}),o("3k1GP",function(t,r){var s,i;e(t.exports,"twrSignal",()=>o),(i=s||(s={}))[i.WAITING=0]="WAITING",i[i.SIGNALED=1]="SIGNALED";class o{sharedArray;buf;constructor(e){if("undefined"!=typeof window&&!crossOriginIsolated&&"file:"!==window.location.protocol)throw Error("twrSignal constructor, crossOriginIsolated="+crossOriginIsolated+". See SharedArrayBuffer docs.");e?this.sharedArray=e:this.sharedArray=new SharedArrayBuffer(4),this.buf=new Int32Array(this.sharedArray),this.buf[0]=s.WAITING}signal(){this.buf[0]=s.SIGNALED,Atomics.notify(this.buf,0)}wait(){this.buf[0]==s.WAITING&&Atomics.wait(this.buf,0,s.WAITING)}isSignaled(){return this.buf[0]==s.SIGNALED}reset(){this.buf[0]=s.WAITING}}}),o("5savl",function(t,r){e(t.exports,"twrTimeEpochImpl",()=>s);function s(){return Date.now()}}),o("U6Thw",function(t,r){e(t.exports,"twrWasmModuleAsync",()=>a);var s=i("3mJs2"),o=i("1Yd7N"),n=i("eEBf6");class a extends o.twrWasmModuleInJSMain{myWorker;malloc;loadWasmResolve;loadWasmReject;callCResolve;callCReject;initLW=!1;waitingcalls;constructor(e){if(super(e),this.malloc=e=>{throw Error("Error - un-init malloc called.")},!window.Worker)throw Error("This browser doesn't support web workers.");this.myWorker=new Worker(i("ex8lJ")),this.myWorker.onerror=function(e){throw Error("Worker.onerror called (Worker failed to load?): "+e.message)},this.myWorker.onmessage=this.processMsg.bind(this)}async loadWasm(e){if(this.initLW)throw Error("twrWasmAsyncModule::loadWasm can only be called once per twrWasmAsyncModule instance");return this.initLW=!0,new Promise((t,r)=>{let s;this.loadWasmResolve=t,this.loadWasmReject=r,this.malloc=e=>this.callCImpl("malloc",[e]),this.waitingcalls=new n.twrWaitingCalls,s=this.d2dcanvas.isValid()?this.d2dcanvas:this.iocanvas;let i={divProxyParams:this.iodiv.getProxyParams(),canvasProxyParams:s.getProxyParams(),waitingCallsProxyParams:this.waitingcalls.getProxyParams()},o={urlToLoad:new URL(e,document.URL).href,modWorkerParams:i,modParams:this.modParams};this.myWorker.postMessage(["startup",o])})}async callC(e){let t=await this.preCallC(e),r=await this.callCImpl(e[0],t);return await this.postCallC(t,e),r}async callCImpl(e,t=[]){return new Promise((r,s)=>{this.callCResolve=r,this.callCReject=s,this.myWorker.postMessage(["callC",e,t])})}keyEventProcess(e){if(e.isComposing||e.metaKey||"Control"==e.key||"Alt"==e.key)console.log("keyDownDiv SKIPPED-2: ",e.key,e.code,e.key.codePointAt(0),e);else{if(1==e.key.length)return e.key.codePointAt(0);switch(e.key){case"Backspace":return 8;case"Enter":return 10;case"Escape":return 27;case"Delete":return 127;case"ArrowLeft":return 8592;case"ArrowUp":return 8593;case"ArrowRight":return 8594;case"ArrowDown":return 8595}console.log("keyDownDiv SKIPPED: ",e.key,e.code,e.key.codePointAt(0),e)}}keyDownDiv(e){if(!this.iodiv||!this.iodiv.divKeys)throw Error("unexpected undefined twrWasmAsyncModule.divKeys");let t=this.keyEventProcess(e);t&&this.iodiv.divKeys.write(t)}keyDownCanvas(e){if(!this.iocanvas||!this.iocanvas.canvasKeys)throw Error("unexpected undefined twrWasmAsyncModule.canvasKeys");let t=this.keyEventProcess(e);t&&this.iocanvas.canvasKeys.write(t)}processMsg(e){let t=e.data[0],r=e.data[1];switch(t){case"divout":let[i,o]=r;this.iodiv.isValid()?this.iodiv.charOut(i,o):console.log("error - msg divout received but iodiv is undefined.");break;case"debug":(0,s.twrDebugLogImpl)(r);break;case"drawseq":{let[e]=r;if(this.iocanvas.isValid())this.iocanvas.drawSeq(e);else if(this.d2dcanvas.isValid())this.d2dcanvas.drawSeq(e);else throw Error("msg drawseq received but canvas is undefined.");break}case"setmemory":if(this.memory=r,!this.memory)throw Error("unexpected error - undefined memory in startupOkay msg");this.mem8=new Uint8Array(this.memory.buffer),this.mem32=new Uint32Array(this.memory.buffer),this.memD=new Float64Array(this.memory.buffer);break;case"startupFail":if(this.loadWasmReject)this.loadWasmReject(r);else throw Error("twrWasmAsyncModule.processMsg unexpected error (undefined loadWasmReject)");break;case"startupOkay":if(this.loadWasmResolve)this.loadWasmResolve(void 0);else throw Error("twrWasmAsyncModule.processMsg unexpected error (undefined loadWasmResolve)");break;case"callCFail":if(this.callCReject)this.callCReject(r);else throw Error("twrWasmAsyncModule.processMsg unexpected error (undefined callCReject)");break;case"callCOkay":if(this.callCResolve)this.callCResolve(r);else throw Error("twrWasmAsyncModule.processMsg unexpected error (undefined callCResolve)");break;default:if(!this.waitingcalls)throw Error("internal error: this.waitingcalls undefined.");if(!this.waitingcalls.processMessage(t,r))throw Error("twrWasmAsyncModule - unknown and unexpected msgType: "+t)}}}}),o("eEBf6",function(t,r){e(t.exports,"twrWaitingCalls",()=>o);var s=i("3k1GP");class o{callCompleteSignal;parameters;constructor(){this.callCompleteSignal=new s.twrSignal,this.parameters=new Uint32Array(new SharedArrayBuffer(4))}startSleep(e){setTimeout(()=>{this.callCompleteSignal.signal()},e)}getProxyParams(){return[this.callCompleteSignal.sharedArray,this.parameters.buffer]}processMessage(e,t){if("sleep"!==e)return!1;{let[e]=t;this.startSleep(e)}return!0}}}),o("ex8lJ",function(e,t){var r=i("hoqmg");let s=new URL("twrmodasyncproxy.7e7dcc1c.js",import.meta.url);e.exports=r(s.toString(),s.origin,!0)}),o("hoqmg",function(e,t){e.exports=function(e,t,r){if(t===self.location.origin)return e;var s=r?"import "+JSON.stringify(e)+";":"importScripts("+JSON.stringify(e)+");";return URL.createObjectURL(new Blob([s],{type:"application/javascript"}))}}),i("eZoLj").register(new URL("",import.meta.url).toString(),JSON.parse('["fOy2m","lib-js.39a0d54e.js","i021Q","twrmodasyncproxy.7e7dcc1c.js"]')),i("57pKS");
//# sourceMappingURL=lib-js.39a0d54e.js.map
