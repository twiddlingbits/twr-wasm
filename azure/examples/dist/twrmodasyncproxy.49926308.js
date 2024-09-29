let e;function t(e,t,r,s){Object.defineProperty(e,t,{get:r,set:s,enumerable:!0,configurable:!0})}var r=globalThis,s={},i={},n=r.parcelRequire8dfc;null==n&&((n=function(e){if(e in s)return s[e].exports;if(e in i){var t=i[e];delete i[e];var r={id:e,exports:{}};return s[e]=r,t.call(r.exports,r,r.exports),r.exports}var n=Error("Cannot find module '"+e+"'");throw n.code="MODULE_NOT_FOUND",n}).register=function(e,t){i[e]=t},r.parcelRequire8dfc=n);var a=n.register;a("jxXdl",function(e,r){t(e.exports,"twrWasmBase",()=>o);var s=n("3tyux"),i=n("7KBfz"),a=n("6QEzV");class o{exports;wasmMem;wasmCall;callC;getImports(e){return{...e,twr_register_callback:this.registerCallback.bind(this)}}async loadWasm(e,t){let r,n;try{if(!(r=await fetch(e)).ok)throw Error("Fetch response error on file '"+e+"'\n"+r.statusText)}catch(t){throw console.log("loadWasm() failed to fetch: "+e),t}try{let e=await r.arrayBuffer();n=await WebAssembly.instantiate(e,{env:this.getImports(t)})}catch(e){throw console.log("Wasm instantiate error: "+e+(e.stack?"\n"+e.stack:"")),e}if(this.exports)throw Error("Unexpected error -- this.exports already set");if(!n.instance.exports)throw Error("Unexpected error - undefined instance.exports");this.exports=n.instance.exports;let a=this.exports.memory;if(!a)throw Error("Unexpected error - undefined exports.memory");let o=this.exports.malloc,l=this.exports.free;this.wasmMem=new s.twrWasmMemory(a,l,o),this.wasmCall=new i.twrWasmCall(this.wasmMem,this.exports),this.callC=this.wasmCall.callC.bind(this.wasmCall)}registerCallback(e){let t=this.wasmMem.getString(e),r=this.exports[t];return(0,a.twrEventQueueReceive).registerCallback(t,r)}}}),a("3tyux",function(e,r){t(e.exports,"twrWasmMemory",()=>a),t(e.exports,"twrWasmMemoryAsync",()=>o);var s=n("lVt1a");class i{memory;mem8;mem16;mem32;memF;memD;constructor(e){this.memory=e,this.mem8=new Uint8Array(e.buffer),this.mem16=new Uint16Array(e.buffer),this.mem32=new Uint32Array(e.buffer),this.memF=new Float32Array(e.buffer),this.memD=new Float64Array(e.buffer)}stringToU8(e,t=s.codePageUTF8){let r;if(t==s.codePageUTF8)r=new TextEncoder().encode(e);else if(t==s.codePage1252){r=new Uint8Array(e.length);for(let t=0;t<e.length;t++)r[t]=(0,s.to1252)(e[t])}else if(t==s.codePageASCII){r=new Uint8Array(e.length);for(let t=0;t<e.length;t++){let i=(0,s.toASCII)(e[t]);r[t]=i}}else throw Error("unknown codePage: "+t);return r}copyString(e,t,r,i=s.codePageUTF8){let n;if(t<1)throw Error("copyString buffer_size must have length > 0 (room for terminating 0): "+t);let a=this.stringToU8(r,i);for(n=0;n<a.length&&n<t-1;n++)this.mem8[e+n]=a[n];this.mem8[e+n]=0}getLong(e){let t=Math.floor(e/4);if(4*t!=e)throw Error("getLong passed non long aligned address");if(t<0||t>=this.mem32.length)throw Error("invalid index passed to getLong: "+e+", this.mem32.length: "+this.mem32.length);return this.mem32[t]}setLong(e,t){let r=Math.floor(e/4);if(4*r!=e)throw Error("setLong passed non long aligned address");if(r<0||r>=this.mem32.length-1)throw Error("invalid index passed to setLong: "+e+", this.mem32.length: "+this.mem32.length);this.mem32[r]=t}getDouble(e){let t=Math.floor(e/8);if(8*t!=e)throw Error("getLong passed non Float64 aligned address");return this.memD[t]}setDouble(e,t){let r=Math.floor(e/8);if(8*r!=e)throw Error("setDouble passed non Float64 aligned address");this.memD[r]=t}getShort(e){if(e<0||e>=this.mem8.length)throw Error("invalid index passed to getShort: "+e);return this.mem8[e]+256*this.mem8[e+1]}getString(e,t,r=s.codePageUTF8){let i;if(e<0||e>=this.mem8.length)throw Error("invalid strIndex passed to getString: "+e);if(t){if(t<0||t+e>this.mem8.length)throw Error("invalid len  passed to getString: "+t)}else{if(-1==(t=this.mem8.indexOf(0,e)))throw Error("string is not null terminated");t-=e}if(r==s.codePageUTF8)i="utf-8";else if(r==s.codePage1252)i="windows-1252";else throw Error("Unsupported codePage: "+r);let n=new TextDecoder(i),a=new Uint8Array(this.mem8.buffer,e,t);if(this.mem8.buffer instanceof ArrayBuffer)return n.decode(a);{let e=new Uint8Array(new ArrayBuffer(t));return e.set(a),n.decode(e)}}getU8Arr(e){if(e<0||e>=this.mem8.length)throw Error("invalid index passed to getU8: "+e);let t=new Uint32Array(this.mem8.slice(e,e+8).buffer),r=t[0],s=t[1];if(s<0||s>=this.mem8.length)throw Error("invalid idx.dataptr passed to getU8");if(r<0||r>this.mem8.length-s)throw Error("invalid idx.size passed to  getU8");return this.mem8.slice(s,s+r)}getU32Arr(e){if(e<0||e>=this.mem8.length)throw Error("invalid index passed to getU32: "+e);let t=new Uint32Array(this.mem8.slice(e,e+8).buffer),r=t[0],s=t[1];if(s<0||s>=this.mem8.length)throw Error("invalid idx.dataptr passed to getU32");if(r<0||r>this.mem8.length-s)throw Error("invalid idx.size passed to  getU32");if(r%4!=0)throw Error("idx.size is not an integer number of 32 bit words");return new Uint32Array(this.mem8.slice(s,s+r).buffer)}}class a extends i{malloc;free;constructor(e,t,r){super(e),this.free=t,this.malloc=r}putString(e,t=s.codePageUTF8){let r=this.stringToU8(e,t),i=this.malloc(r.length+1);return this.mem8.set(r,i),this.mem8[i+r.length]=0,i}putU8(e){let t=this.malloc(e.length);return this.mem8.set(e,t),t}putArrayBuffer(e){let t=new Uint8Array(e);return this.putU8(t)}}class o extends i{malloc;free;constructor(e,t,r){super(e),this.free=e=>r("free",[e]),this.malloc=t}async putString(e,t=s.codePageUTF8){let r=this.stringToU8(e,t),i=await this.malloc(r.length+1);return this.mem8.set(r,i),this.mem8[i+r.length]=0,i}async putU8(e){let t=await this.malloc(e.length);return this.mem8.set(e,t),t}async putArrayBuffer(e){let t=new Uint8Array(e);return this.putU8(t)}}}),a("lVt1a",function(e,r){t(e.exports,"codePageASCII",()=>i),t(e.exports,"codePage1252",()=>a),t(e.exports,"codePageUTF8",()=>o),t(e.exports,"codePageUTF32",()=>l),t(e.exports,"default",()=>c),t(e.exports,"twrCodePageToUnicodeCodePoint",()=>u),t(e.exports,"to1252",()=>m),t(e.exports,"toASCII",()=>h);var s=n("9lAov");let i=0,a=1252,o=65001,l=12e3;class c extends s.twrLibrary{id;imports={twrUnicodeCodePointToCodePage:{isCommonCode:!0},twrCodePageToUnicodeCodePoint:{isCommonCode:!0},twrUserLanguage:{isCommonCode:!0},twrTimeTmLocal:{isCommonCode:!0},twrUserLconv:{isCommonCode:!0},twrRegExpTest1252:{isCommonCode:!0},twrToUpper1252:{isCommonCode:!0},twrToLower1252:{isCommonCode:!0},twrStrcoll:{isCommonCode:!0},twrGetDtnames:{isCommonCode:!0}};libSourcePath=new URL("file:///../lib-js/twrliblocale.js").pathname;cpTranslate=new u;cpTranslate2=new u;constructor(){super(),this.id=(0,s.twrLibraryInstanceRegistry).register(this)}twrCodePageToUnicodeCodePoint(e,t,r){return this.cpTranslate2.convert(t,r)}twrUnicodeCodePointToCodePage(e,t,r,s){let i=e.wasmMem.stringToU8(String.fromCodePoint(r),s);return e.wasmMem.mem8.set(i,t),i.length}twrUserLanguage(e){return e.wasmMem.putString(navigator.language,i)}twrRegExpTest1252(e,t,r){let s=RegExp(e.wasmMem.getString(t),"u"),i=this.cpTranslate.decoder1252.decode(new Uint8Array([r]));return s.test(i)?1:0}twrToLower1252(e,t){let r=this.cpTranslate.decoder1252.decode(new Uint8Array([t]));return RegExp("^\\p{Letter}$","u").test(r)?m(r.toLocaleLowerCase()):t}twrToUpper1252(e,t){let r=this.cpTranslate.decoder1252.decode(new Uint8Array([t]));return 402==r.codePointAt(0)||181==r.codePointAt(0)||223==r.codePointAt(0)||"µ"==r||"ƒ"==r||"ß"==r?t:RegExp("^\\p{Letter}$","u").test(r)?m(r.toLocaleUpperCase()):t}twrStrcoll(e,t,r,s){let i=e.wasmMem.getString(t,void 0,s),n=e.wasmMem.getString(r,void 0,s);return new Intl.Collator().compare(i,n)}twrTimeTmLocal(e,t,r){let s=new Date(1e3*r);e.wasmMem.setLong(t,s.getSeconds()),e.wasmMem.setLong(t+4,s.getMinutes()),e.wasmMem.setLong(t+8,s.getHours()),e.wasmMem.setLong(t+12,s.getDate()),e.wasmMem.setLong(t+16,s.getMonth()),e.wasmMem.setLong(t+20,s.getFullYear()-1900),e.wasmMem.setLong(t+24,s.getDay()),e.wasmMem.setLong(t+28,this.getDayOfYear(s)),e.wasmMem.setLong(t+32,this.isDst()),e.wasmMem.setLong(t+36,-(60*s.getTimezoneOffset())),e.wasmMem.setLong(t+40,e.wasmMem.putString(this.getTZ(s),i))}getDayOfYear(e){let t=new Date(e.getFullYear(),0,1);return Math.floor((e.getTime()-t.getTime())/864e5)}isDst(){return new Date().toLocaleTimeString("en-US",{timeZoneName:"long"}).includes("Daylight")?1:0}getTZ(e){return e.toLocaleTimeString("en-US",{timeZoneName:"short"}).split(" ").pop()||"UTC"}setAndPutString(e,t,r,s){let i=e.putString(r,s);e.setLong(t,i)}twrUserLconv(e,t,r){let s=this.getLocaleDecimalPoint(),i=this.getLocaleThousandsSeparator();this.setAndPutString(e.wasmMem,t+0,s,r),this.setAndPutString(e.wasmMem,t+4,i,r),this.setAndPutString(e.wasmMem,t+20,s,r),this.setAndPutString(e.wasmMem,t+24,i,r),this.setAndPutString(e.wasmMem,t+24,i,r),this.setAndPutString(e.wasmMem,t+24,i,r),this.setAndPutString(e.wasmMem,t+32,"+",r),this.setAndPutString(e.wasmMem,t+36,"-",r),this.setAndPutString(e.wasmMem,t+12,this.getLocalCurrencySymbol(),r),this.setAndPutString(e.wasmMem,t+16,this.getLocalCurrencySymbol(),r)}getLocaleDecimalPoint(){return new Intl.NumberFormat().format(1.1).replace(/[0-9]/g,"").charAt(0)}getLocaleThousandsSeparator(){return new Intl.NumberFormat(void 0,{minimumFractionDigits:0}).format(1e3).replace(/[0-9]/g,"").charAt(0)}getLocaleCurrencyDecimalPoint(){let e=new Intl.NumberFormat(void 0,{style:"currency",currency:"USD"}).resolvedOptions().currency;return new Intl.NumberFormat(void 0,{style:"currency",currency:e}).format(1.1).replace(/[0-9]/g,"").charAt(1)}getLocalCurrencySymbol(){switch(navigator.language){case"en-US":case"en-CA":case"fr-CA":case"en-AU":case"es-MX":case"es-AR":case"es-CL":case"es-CO":case"es-EC":case"en-GY":case"nl-SR":case"es-UY":case"en-BZ":case"es-SV":case"es-PA":return"$";case"es-BO":case"es-VE":return"Bs.";case"es-PY":return"₲";case"es-PE":return"S/";case"es-CR":return"₡";case"es-GT":return"Q";case"es-HN":return"L";case"es-NI":return"C$";case"en-GB":return"£";case"en-IE":case"de-DE":case"fr-FR":case"de-AT":case"nl-BE":case"fr-BE":case"el-CY":case"et-EE":case"fi-FI":case"sv-FI":case"el-GR":case"it-IT":case"lv-LV":case"lt-LT":case"fr-LU":case"de-LU":case"lb-LU":case"mt-MT":case"nl-NL":case"pt-PT":case"sk-SK":case"sl-SI":case"es-ES":return"€";case"ja-JP":case"zh-CN":return"¥";case"de-CH":case"fr-CH":case"it-CH":return"CHF";case"sv-SE":case"da-DK":case"nb-NO":return"kr";case"ru-RU":return"₽";case"ko-KR":return"₩";case"en-IN":return"₹";case"pt-BR":return"R$";case"he-IL":return"₪";case"tr-TR":return"₺";default:return""}}twrGetDtnames(e,t){let r=(0,e.wasmMem.malloc)(160);for(let s=0;s<7;s++)this.setAndPutString(e.wasmMem,r+4*s,this.getLocalizedDayName(s,"long"),t);for(let s=0;s<7;s++)this.setAndPutString(e.wasmMem,r+(s+7)*4,this.getLocalizedDayName(s,"short"),t);for(let s=0;s<12;s++)this.setAndPutString(e.wasmMem,r+(s+14)*4,this.getLocalizedMonthNames(s,"long"),t);for(let s=0;s<12;s++)this.setAndPutString(e.wasmMem,r+(s+14+12)*4,this.getLocalizedMonthNames(s,"short"),t);return this.setAndPutString(e.wasmMem,r+152,this.getLocalizedAM(),t),this.setAndPutString(e.wasmMem,r+156,this.getLocalizedPM(),t),r}getLocalizedDayName(e,t){let r=new Date;return r.setDate(r.getDate()-r.getDay()+e),new Intl.DateTimeFormat(void 0,{weekday:t}).format(r)}getLocalizedMonthNames(e,t){let r=new Intl.DateTimeFormat(void 0,{month:t}),s=new Date(2e3,e,1);return r.format(s)}getLocalizedAM(){let e=new Date(2e3,0,1,9,0,0),t=new Intl.DateTimeFormat(void 0,{hour:"numeric",hour12:!0}).formatToParts(e).find(e=>"dayPeriod"===e.type);return t?t.value:""}getLocalizedPM(){let e=new Date(2e3,0,1,15,0,0),t=new Intl.DateTimeFormat(void 0,{hour:"numeric",hour12:!0}).formatToParts(e).find(e=>"dayPeriod"===e.type);return t?t.value:""}}function m(e){if(8239==e.codePointAt(0))return 32;let t=e.codePointAt(0)||0;switch(t){case 338:return 140;case 339:return 156;case 352:return 138;case 353:return 154;case 376:return 159;case 381:return 142;case 382:return 158;case 402:return 131;case 710:return 136}switch(e.normalize()){case"€":return 128;case"‚":return 130;case"ƒ":return 131;case"„":return 132;case"…":return 133;case"†":return 134;case"‡":return 135;case"ˆ":return 136;case"‰":return 137;case"Š":return 138;case"‹":return 139;case"Œ":return 140;case"Ž":return 142;case"‘":return 145;case"’":return 146;case"“":return 147;case"”":return 148;case"•":return 149;case"–":return 150;case"—":return 151;case"˜":return 152;case"™":return 153;case"š":return 154;case"›":return 155;case"œ":return 156;case"ž":return 158;case"Ÿ":return 159}return t>255&&(console.log("twr-wasm.to1252(): unable to convert: ",e,t),t=0),t}function h(e){if("ƒ"==e)return 102;if(8239==e.codePointAt(0))return 32;let t=e.codePointAt(0)||0;return t>127?63:t}class u{decoderUTF8=new TextDecoder("utf-8");decoder1252=new TextDecoder("windows-1252");convert(e,t){let r;if(t==o)r=this.decoderUTF8.decode(new Uint8Array([e]),{stream:!0});else if(t==a)r=this.decoder1252.decode(new Uint8Array([e]));else if(t==i)r=e>127?"":String.fromCharCode(e);else if(t==l)r=String.fromCodePoint(e);else throw Error("unsupported CodePage: "+t);return r.codePointAt(0)||0}}}),a("9lAov",function(e,r){t(e.exports,"twrLibrary",()=>i),t(e.exports,"twrLibraryInstanceRegistry",()=>o),t(e.exports,"twrLibraryProxy",()=>a),t(e.exports,"twrLibraryInstanceProxyRegistry",()=>l);var s=n("6QEzV");class i{interfaceName;constructor(){}getImports(e){if(e.isTwrWasmModuleAsync)throw Error("unsupported module type (expecting twrWasmModule");let t={};if(void 0===this.imports)throw Error("twrLibrary derived class is missing imports.");if(void 0===this.libSourcePath)throw Error("twrLibrary derived class is missing libSourcePath.");for(let r in this.imports)if(this.imports[r].isModuleAsyncOnly){let e=()=>{throw Error("Invalid call to unimplemented twrLibrary 'import' function (isModuleAsyncOnly was used): "+r)};t[r]=e}else{if(!this[r])throw Error("twrLibrary 'import' function is missing: "+r);if(this.interfaceName){let s=(e,t,r,...s)=>{let i=o.getLibraryInstance(r),n=i[e];if(!n)throw Error(`Library function not found. id=${r}, funcName=${e}`);return n.call(i,t,...s)};t[r]=s.bind(null,r,e)}else t[r]=this[r].bind(this,e)}return t}getProxyParams(){return["twrLibraryProxy",this.id,this.imports,this.libSourcePath,this.interfaceName]}async processMessageFromProxy(e,t){let r;let[s,i,n,a,l,...c]=e;if(this.interfaceName&&o.getLibraryInstance(i).libSourcePath!=this.libSourcePath||i!=this.id||!t.isTwrWasmModuleAsync)throw Error("internal error");let m=o.getLibraryInstance(i);if(!m[n])throw Error("twrLibrary derived class missing 'import' function: "+n);r=a?await m[n](t,...c):m[n](t,...c),l>-1&&t.eventQueueSend.postEvent(l,r)}}class a{id;imports;libSourcePath;interfaceName;called=!1;constructor(e){let[t,r,s,i,n]=e;this.id=r,this.imports=s,this.libSourcePath=i,this.interfaceName=n}remoteProcedureCall(e,t,r,s,i,...n){if(postMessage(i?["twrLibrary",n[0],t,r,s,...n.slice(1)]:["twrLibrary",this.id,t,r,s,...n]),-1==s)return 0;let[a,o]=e.eventQueueReceive.waitEvent(s);if(a!=s||1!=o.length)throw Error("internal error");return o[0]}async getProxyImports(e){let t;if(!0===this.called)throw Error("getProxyImports should only be called once per twrLibraryProxy instance");this.called=!0;let r={};for(let i in this.imports)if(this.imports[i].isCommonCode){if(this.imports[i].isAsyncFunction)throw Error("isAsyncFunction can not be used with isCommonCode");if(void 0===t){if(void 0===this.libSourcePath)throw Error("undefined libSourcePath");t=new(await import(this.libSourcePath)).default}r[i]=t[i].bind(t,e)}else this.imports[i].isAsyncFunction?r[i]=this.remoteProcedureCall.bind(this,e,i+"_async",!!this.imports[i].isAsyncFunction,this.imports[i].noBlock?-1:(0,s.twrEventQueueReceive).registerEvent(),this.interfaceName):r[i]=this.remoteProcedureCall.bind(this,e,i,!!this.imports[i].isAsyncFunction,this.imports[i].noBlock?-1:(0,s.twrEventQueueReceive).registerEvent(),this.interfaceName);return r}}class o{static libInstances=[];static libInterfaceInstances=[];static register(e){if(void 0===e.imports)throw Error("twrLibrary derived class is missing imports.");if(void 0===e.libSourcePath)throw Error("twrLibrary derived class is missing libSourcePath.");o.libInstances.push(e);let t=o.libInstances.length-1;if(e.interfaceName){let t=this.getLibraryInstanceByInterfaceName(e.interfaceName);if(void 0===t)o.libInterfaceInstances.push(e);else{let r=o.libInterfaceInstances[t];for(let t=0;t<o.libInterfaceInstances.length;t++)if(o.libInterfaceInstances[t].interfaceName===e.interfaceName&&!function(e,t){let r=Object.keys(e),s=Object.keys(t);for(let s=0;s<r.length;s++){let i=r[s];if(t[i]&&!c(e[i],t[i]))return!1}for(let r=0;r<s.length;r++){let i=s[r];if(e[i]&&!c(e[i],t[i]))return!1}return!0}(o.libInterfaceInstances[t].imports,e.imports))throw Error(`interface definitions (imports) ${e.interfaceName} are not compatible between class ${e.libSourcePath} and ${r.libSourcePath}`);Object.keys(e.imports).length>Object.keys(r.imports).length&&(o.libInterfaceInstances[t]=e)}}else{if(this.getLibraryInstanceByClass(e.libSourcePath))throw Error("A second twrLibrary instance was registered but interfaceName===undefined");o.libInterfaceInstances.push(e)}return t}static getLibraryInstance(e){if(e<0||e>=o.libInstances.length)throw Error("Invalid console ID: "+e);return o.libInstances[e]}static getLibraryInstanceByInterfaceName(e){for(let t=0;t<o.libInterfaceInstances.length;t++)if(o.libInterfaceInstances[t].interfaceName===e)return t}static getLibraryInstanceByClass(e){for(let t=0;t<o.libInterfaceInstances.length;t++)if(o.libInstances[t].libSourcePath===e)return o.libInstances}static getLibraryInstanceID(e){for(let t=0;t<o.libInstances.length;t++)if(o.libInstances[t]==e)return t;throw Error("libInstance not in registry")}}class l{static libProxyInstances=[];static registerProxy(e){return l.libProxyInstances[e.id]=e,e.id}static getLibraryInstanceProxy(e){if(e<0||e>=l.libProxyInstances.length)throw Error("Invalid console ID: "+e);return l.libProxyInstances[e]}static getLibraryInstanceID(e){for(let t=0;t<l.libProxyInstances.length;t++)if(l.libProxyInstances[t]==e)return t;throw Error("libProxyInstance not in registry")}}function c(e,t){let r=Object.keys(e),s=Object.keys(t);return r.length===s.length&&r.every(r=>e[r]===t[r])}}),a("6QEzV",function(e,r){t(e.exports,"twrEventQueueSend",()=>i),t(e.exports,"twrEventQueueReceive",()=>a);var s=n("dRr3I");class i{circBuffer=new s.twrSharedCircularBuffer;postEvent(e,...t){this.circBuffer.writeArray([1749422294,e,t.length,...t])}postMalloc(e,t){this.circBuffer.writeArray([1368691589,e,t])}}class a{circBuffer;pendingEventIDs;pendingEventArgs;ownerMod;static unqiueInt=1;static onEventCallbacks=[];constructor(e,t){this.circBuffer=new s.twrSharedCircularBuffer(t),this.pendingEventIDs=[],this.pendingEventArgs=[],this.ownerMod=e}readEventRemainder(){let e=this.circBuffer.read();if(void 0===e)throw Error("internal error");let t=this.circBuffer.read();if(void 0===t)throw Error("internal error");let r=[];for(let e=0;e<t;e++){let e=this.circBuffer.read();if(void 0===e)throw Error("internal error");r.push(e)}if(!(e in a.onEventCallbacks))throw Error("internal error");this.pendingEventIDs.push(e),this.pendingEventArgs.push(r)}readMallocRemainder(){let e=this.circBuffer.read();if(void 0===e)throw Error("internal error");let t=this.circBuffer.read();if(void 0===t)throw Error("internal error");postMessage(["twrWasmModule",e,"callCOkay",this.ownerMod.wasmMem.malloc(t)])}readCommandRemainder(e){if(1749422294===e)this.readEventRemainder();else if(1368691589===e)this.readMallocRemainder();else throw Error("internal error -- eventMarker or mallocMarker expected but not found")}readCommand(){let e=this.circBuffer.read();this.readCommandRemainder(e)}readWaitCommand(){let e=this.circBuffer.readWait();this.readCommandRemainder(e)}findEvent(e){if(void 0===e)return[this.pendingEventIDs.shift(),this.pendingEventArgs.shift(),0];let t=this.pendingEventIDs.indexOf(e);return -1!=t?[this.pendingEventIDs.splice(t,1)[0],this.pendingEventArgs.splice(t,1)[0],t]:[void 0,void 0,void 0]}waitEvent(e){for(;;){for(;!this.circBuffer.isEmpty();)this.readCommand();let[t,r,s]=this.findEvent(e);if(t&&r)return[t,r];this.readWaitCommand()}}doCallbacks(e){let t=e||this.pendingEventIDs.length;for(let e=0;e<t;e++){let t=this.pendingEventIDs[e],r=this.pendingEventArgs[e],s=a.onEventCallbacks[t];s&&(s(t,...r),this.pendingEventIDs.splice(e,1),this.pendingEventArgs.splice(e,1))}}processIncomingCommands(){for(;!this.circBuffer.isEmpty();)this.readCommand();this.doCallbacks()}static registerCallback(e,t){if(!t)throw Error("registerCallback called with a function name that is not exported from the module");return this.onEventCallbacks[++this.unqiueInt]=t,this.unqiueInt}static registerEvent(){return this.onEventCallbacks[++this.unqiueInt]=void 0,this.unqiueInt}}}),a("dRr3I",function(e,r){t(e.exports,"twrSharedCircularBuffer",()=>s);class s{saBuffer;f64Array;i32Array;constructor(e){if("undefined"!=typeof window&&!crossOriginIsolated&&"file:"!==window.location.protocol)throw Error("twrSharedCircularBuffer constructor, crossOriginIsolated="+crossOriginIsolated+". See SharedArrayBuffer docs.");e?this.saBuffer=e:this.saBuffer=new SharedArrayBuffer(2056),this.f64Array=new Float64Array(this.saBuffer,8),this.i32Array=new Int32Array(this.saBuffer,0,2),this.i32Array[0]=0,this.i32Array[1]=0}silentWrite(e){let t=this.i32Array[1];this.f64Array[t]=e,256==++t&&(t=0),this.i32Array[1]=t}writeArray(e){if(e.length>0){for(let t=0;t<e.length;t++)this.silentWrite(e[t]);Atomics.notify(this.i32Array,1)}}write(e){this.silentWrite(e),Atomics.notify(this.i32Array,1)}read(){if(!this.isEmpty()){let e=this.i32Array[0],t=this.f64Array[e];return 256==++e&&(e=0),this.i32Array[0]=e,t}}readWait(){let e=this.read();if(void 0!==e)return e;let t=this.i32Array[0];if(Atomics.wait(this.i32Array,1,t),void 0===(e=this.read()))throw Error("internal error");return e}isEmpty(){return this.i32Array[0]==this.i32Array[1]}}}),a("7KBfz",function(e,r){t(e.exports,"twrWasmCall",()=>s),t(e.exports,"twrWasmModuleCallAsync",()=>i);class s{exports;mem;constructor(e,t){if(!t)throw Error("WebAssembly.Exports undefined");this.exports=t,this.mem=e}callCImpl(e,t=[]){if(!this.exports[e])throw Error("callC: function '"+e+"' not in export table.  Use --export wasm-ld flag.");return(0,this.exports[e])(...t)}callC(e){let t=this.preCallC(e),r=this.callCImpl(e[0],t);return this.postCallC(t,e),r}preCallC(e){if(e.constructor!==Array)throw Error("callC: params must be array, first arg is function name");if(0==e.length)throw Error("callC: missing function name");let t=[],r=0;for(let s=1;s<e.length;s++){let i=e[s];switch(typeof i){case"number":case"bigint":t[r++]=i;break;case"string":t[r++]=this.mem.putString(i);break;case"object":if(i instanceof URL)throw Error("URL arg in callC is no longer supported directly.  use module.fetchAndPutURL");if(i instanceof ArrayBuffer){let e=this.mem.putArrayBuffer(i);t[r++]=e;break}default:throw Error("callC: invalid object type passed in")}}return t}postCallC(e,t){let r=0;for(let s=1;s<t.length;s++){let i=t[s];switch(typeof i){case"number":case"bigint":r++;break;case"string":this.callCImpl("free",[e[r]]),r++;break;case"object":if(i instanceof URL)throw Error("internal error");if(i instanceof ArrayBuffer){let t=new Uint8Array(i),s=e[r];for(let e=0;e<t.length;e++)t[e]=this.mem.mem8[s+e];this.callCImpl("free",[s]),r++;break}throw Error("postCallC: internal error A");default:throw Error("postCallC: internal error B")}}return e}}class i{mem;callCImpl;constructor(e,t){this.mem=e,this.callCImpl=t}async preCallC(e){if(e.constructor!==Array)throw Error("callC: params must be array, first arg is function name");if(0==e.length)throw Error("callC: missing function name");let t=[],r=0;for(let s=1;s<e.length;s++){let i=e[s];switch(typeof i){case"number":case"bigint":t[r++]=i;break;case"string":t[r++]=await this.mem.putString(i);break;case"object":if(i instanceof URL)throw Error("URL arg in callC is no longer supported directly.  use module.fetchAndPutURL");if(i instanceof ArrayBuffer){let e=await this.mem.putArrayBuffer(i);t[r++]=e;break}default:throw Error("callC: invalid object type passed in")}}return t}async postCallC(e,t){let r=0;for(let s=1;s<t.length;s++){let i=t[s];switch(typeof i){case"number":case"bigint":r++;break;case"string":await this.callCImpl("free",[e[r]]),r++;break;case"object":if(i instanceof URL)throw Error("internal error");if(i instanceof ArrayBuffer){let t=new Uint8Array(i),s=e[r];for(let e=0;e<t.length;e++)t[e]=this.mem.mem8[s+e];await this.callCImpl("free",[s]),r++;break}throw Error("postCallC: internal error A");default:throw Error("postCallC: internal error B")}}return e}}}),t({},"twrWasmModuleAsyncProxy",()=>m);var o=n("jxXdl"),l=n("9lAov"),c=n("6QEzV");self.onmessage=function(t){let[r,...s]=t.data;if("startup"===r){let[t]=s;(e=new m(t.allProxyParams)).loadWasm(t.urlToLoad).then(()=>{postMessage(["twrWasmModule",void 0,"startupOkay"])}).catch(e=>{console.log(".catch: ",e),postMessage(["twrWasmModule",void 0,"startupFail",e])})}else if("callC"===r){let[t,r,i]=s;try{let s=e.wasmCall.callCImpl(r,i);postMessage(["twrWasmModule",t,"callCOkay",s])}catch(e){console.log("exception in callC in 'twrmodasyncproxy.js': \n",s),console.log(e),postMessage(["twrWasmModule",t,"callCFail",e])}}else"tickleEventLoop"===r?e.eventQueueReceive.processIncomingCommands():console.log("twrmodasyncproxy.js: unknown message: "+t)};class m extends o.twrWasmBase{allProxyParams;ioNamesToID;libimports={};eventQueueReceive;constructor(e){super(),this.allProxyParams=e,this.ioNamesToID=e.ioNamesToID,this.eventQueueReceive=new c.twrEventQueueReceive(this,e.eventQueueBuffer)}async loadWasm(e){for(let e=0;e<this.allProxyParams.libProxyParams.length;e++){let t=this.allProxyParams.libProxyParams[e],r=new l.twrLibraryProxy(t);(0,l.twrLibraryInstanceProxyRegistry).registerProxy(r),this.libimports={...this.libimports,...await r.getProxyImports(this)}}let t={...this.libimports,twrConGetIDFromName:e=>{let t=this.wasmMem.getString(e);return this.ioNamesToID[t]||-1}};if(await super.loadWasm(e,t),this.wasmMem.memory.buffer instanceof ArrayBuffer)throw Error("twrWasmModuleAsync requires shared Memory. Add wasm-ld --shared-memory --no-check-features (see docs)");postMessage(["twrWasmModule",void 0,"setmemory",this.wasmMem.memory]),(0,this.exports.twr_wasm_init)(this.ioNamesToID.stdio,this.ioNamesToID.stderr,void 0==this.ioNamesToID.std2d?-1:this.ioNamesToID.std2d,this.wasmMem.mem8.length)}}
//# sourceMappingURL=twrmodasyncproxy.49926308.js.map