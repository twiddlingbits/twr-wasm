import {codePageUTF8, codePage1252, codePageASCII, to1252, toASCII} from "./twrliblocale.js"

// IWasmMemoryBase operate on shared memory, so they will function in any WasmModule 
export interface IWasmMemoryBase {
   memory:WebAssembly.Memory;
   mem8u:Uint8Array;
   mem16u:Uint16Array;
   mem32u:Uint32Array;
   memF:Float32Array;
   memD:Float64Array;
   stringToU8(sin:string, codePage?:number):Uint8Array;
   copyString(buffer:number, buffer_size:number, sin:string, codePage?:number):void;
   getLong(idx:number): number;
   setLong(idx:number, value:number):void;
   getDouble(idx:number): number;
   setDouble(idx:number, value:number):void;
   getShort(idx:number): number;
   getString(strIndex:number, len?:number, codePage?:number): string;
   getU8Arr(idx:number): Uint8Array;
   getU32Arr(idx:number): Uint32Array;
}

// IWasmMemory does not support await, and so will only work in a thread that has the module loaded
// That would be twrWasmModule, twrWasmModuleAsyncProxy
export interface IWasmMemory extends IWasmMemoryBase {
   malloc:(size:number)=>number;
   free:(size:number)=>void;
   putString(sin:string, codePage?:number):number;
   putU8(u8a:Uint8Array):number;
   putArrayBuffer(ab:ArrayBuffer):number;
}

// IWasmMemoryAsync must be used from an async function since await is needed
export interface IWasmMemoryAsync extends IWasmMemoryBase {
   malloc:(size:number)=>Promise<number>;
   free:(size:number)=>Promise<void>;
   putString(sin:string, codePage?:number):Promise<number>;
   putU8(u8a:Uint8Array):Promise<number>;
   putArrayBuffer(ab:ArrayBuffer):Promise<number>;
}

/**********************************************************************************************/
/**********************************************************************************************/
/**********************************************************************************************/
/**********************************************************************************************/

export class twrWasmMemoryBase implements IWasmMemoryBase {
   memory:WebAssembly.Memory;
   mem8u:Uint8Array;
   mem16u:Uint16Array;
   mem32u:Uint32Array;
   memF:Float32Array;
   memD:Float64Array;

   constructor(memory:WebAssembly.Memory) {
      this.memory=memory;
      this.mem8u = new Uint8Array(memory.buffer);
      this.mem16u = new Uint16Array(memory.buffer);
      this.mem32u = new Uint32Array(memory.buffer);
      this.memF = new Float32Array(memory.buffer);
      this.memD = new Float64Array(memory.buffer);
   }

   // convert a Javascript string into byte sequence that encodes the string using UTF8, or the requested codePage
   stringToU8(sin:string, codePage=codePageUTF8) {

      let ru8:Uint8Array;
      if (codePage==codePageUTF8) {
         const encoder = new TextEncoder();
         ru8=encoder.encode(sin);
      }
      else if (codePage==codePage1252) {
         ru8=new Uint8Array(sin.length);
         for (let i = 0; i < sin.length; i++) {
            ru8[i]=to1252(sin[i]);
          }
      }
      else if (codePage==codePageASCII) {
         ru8=new Uint8Array(sin.length);
         for (let i = 0; i < sin.length; i++) {
            const r=toASCII(sin[i]);
            ru8[i]=r;
          }
      }
      else {
         throw new Error("unknown codePage: "+codePage);
      }

      return ru8;
   }

   // copy a string into existing buffer in the webassembly module memory as utf8 (or specified codePage)
   // result always null terminated
   copyString(buffer:number, buffer_size:number, sin:string, codePage=codePageUTF8):void {
      if (buffer_size<1) throw new Error("copyString buffer_size must have length > 0 (room for terminating 0): "+buffer_size);
      
      const ru8=this.stringToU8(sin, codePage);

      let i;
      for (i=0; i<ru8.length && i<buffer_size-1; i++)
         this.mem8u[buffer+i]=ru8[i];

      this.mem8u[buffer+i]=0;
   }

   getLong(idx:number): number {
      const idx32=Math.floor(idx/4);
      if (idx32*4!=idx) throw new Error("getLong passed non long aligned address")
      if (idx32<0 || idx32 >= this.mem32u.length) throw new Error("invalid index passed to getLong: "+idx+", this.mem32.length: "+this.mem32u.length);
      const long:number = this.mem32u[idx32];
      return long;
   }
   
   setLong(idx:number, value:number) {
        const idx32 = Math.floor(idx / 4);
        if (idx32 * 4 != idx)
            throw new Error("setLong passed non long aligned address");
        if (idx32 < 0 || idx32 >= this.mem32u.length-1)
            throw new Error("invalid index passed to setLong: " + idx + ", this.mem32.length: " + this.mem32u.length);
        this.mem32u[idx32]=value;
    }

   getDouble(idx:number): number {
      const idx64=Math.floor(idx/8);
      if (idx64*8!=idx) throw new Error("getLong passed non Float64 aligned address")
      const long:number = this.memD[idx64];
      return long;
   }

   setDouble(idx:number, value:number) {
      const idx64=Math.floor(idx/8);
      if (idx64*8!=idx) throw new Error("setDouble passed non Float64 aligned address")
      this.memD[idx64]=value;
   }

   getShort(idx:number): number {
      if (idx<0 || idx>= this.mem8u.length) throw new Error("invalid index passed to getShort: "+idx);
      const short:number = this.mem8u[idx]+this.mem8u[idx+1]*256;
      return short;
   }

   // get a string out of module memory
   // null terminated, up until max of (optional) len bytes
   // len may be longer than the number of characters, if characters are utf-8 encoded
   getString(strIndex:number, len?:number, codePage=codePageUTF8): string {
      if (strIndex<0 || strIndex >= this.mem8u.length) throw new Error("invalid strIndex passed to getString: "+strIndex);

      if (len) {
         if (len<0 || len+strIndex > this.mem8u.length) throw new Error("invalid len  passed to getString: "+len);
      }
      else {
         len = this.mem8u.indexOf(0, strIndex);
         if (len==-1) throw new Error("string is not null terminated");
         len=len-strIndex;
      }

      let encodeFormat;
      if (codePage==codePageUTF8) encodeFormat='utf-8';
      else if (codePage==codePage1252) encodeFormat='windows-1252';
      else throw new Error("Unsupported codePage: "+codePage);

      const td=new TextDecoder(encodeFormat);
      const u8todecode=new Uint8Array(this.mem8u.buffer, strIndex, len);

   // chrome throws exception when using TextDecoder on SharedArrayBuffer
   // BUT, instanceof SharedArrayBuffer doesn't work when crossOriginIsolated not enable, and will cause a runtime error, so don't check directly
      if (this.mem8u.buffer instanceof ArrayBuffer) { 
         const sout:string = td.decode(u8todecode);
         return sout;
      }
      else {  // must be SharedArrayBuffer
         const regularArrayBuffer = new ArrayBuffer(len);
         const regularUint8Array = new Uint8Array(regularArrayBuffer);
         regularUint8Array.set(u8todecode);
         const sout:string = td.decode(regularUint8Array);
         return sout;
      }
   }

   // get a byte array out of module memory when passed in index to [size, dataptr]
   getU8Arr(idx:number): Uint8Array {
      if (idx<0 || idx>= this.mem8u.length) throw new Error("invalid index passed to getU8: "+idx);

      const rv = new Uint32Array( (this.mem8u.slice(idx, idx+8)).buffer );
      let size:number=rv[0];
      let dataptr:number=rv[1];

      if (dataptr <0 || dataptr >= (this.mem8u.length)) throw new Error("invalid idx.dataptr passed to getU8")
      if (size <0 || size > (this.mem8u.length-dataptr)) throw new Error("invalid idx.size passed to  getU8")

      const u8=this.mem8u.slice(dataptr, dataptr+size);
      return u8;
   }

   // get a int32 array out of module memory when passed in index to [size, dataptr]
   getU32Arr(idx:number): Uint32Array {
      if (idx<0 || idx>= this.mem8u.length) throw new Error("invalid index passed to getU32: "+idx);

      const rv = new Uint32Array( (this.mem8u.slice(idx, idx+8)).buffer );
      let size:number=rv[0];
      let dataptr:number=rv[1];

      if (dataptr <0 || dataptr >= (this.mem8u.length)) throw new Error("invalid idx.dataptr passed to getU32")
      if (size <0 || size > (this.mem8u.length-dataptr)) throw new Error("invalid idx.size passed to  getU32")

      if (size%4!=0) throw new Error("idx.size is not an integer number of 32 bit words");

      const u32 = new Uint32Array( (this.mem8u.slice(dataptr, dataptr+size)).buffer );
      return u32;
   }
}

/**********************************************************************************************/
/**********************************************************************************************/
/**********************************************************************************************/
/**********************************************************************************************/

export class twrWasmMemory extends twrWasmMemoryBase implements IWasmMemory {
   malloc:(size:number)=>number;
   free:(size:number)=>void;

   constructor(memory:WebAssembly.Memory, free:(size:number)=>void, malloc:(size:number)=>number) {
      super(memory);
      this.free=free;
      this.malloc=malloc;
   }

   // allocate and copy a string into the webassembly module memory as utf8 (or the specified codePage)
   putString(sin:string, codePage=codePageUTF8) {
      const ru8=this.stringToU8(sin, codePage);
      const strIndex:number=this.malloc(ru8.length+1);
      this.mem8u.set(ru8, strIndex);
      this.mem8u[strIndex+ru8.length]=0;

      return strIndex;
   }

   // allocate and copy a Uint8Array into Wasm mod memory
   putU8(u8a:Uint8Array) {
      let dest:number=this.malloc(u8a.length); 
      this.mem8u.set(u8a, dest);
      return dest;
   }

   putArrayBuffer(ab:ArrayBuffer) {
      const u8=new Uint8Array(ab);
      return this.putU8(u8);
   }
}

/**********************************************************************************************/
/**********************************************************************************************/
/**********************************************************************************************/
/**********************************************************************************************/

export class twrWasmMemoryAsync extends twrWasmMemoryBase implements IWasmMemoryAsync {
   malloc:(size:number)=>Promise<number>;
   free:(size:number)=>Promise<void>;

   constructor(memory:WebAssembly.Memory, mallocImpl:(size:number)=>Promise<number>, callCImpl:(funcName:string, any:[...any])=>Promise<any>) {
      super(memory);
      this.free = (size:number) => {
         return callCImpl("free", [size]) as Promise<void>;
      }
      this.malloc = mallocImpl;
   }

   // allocate and copy a string into the webassembly module memory as utf8 (or the specified codePage)
   async putString(sin:string, codePage=codePageUTF8) {
      const ru8=this.stringToU8(sin, codePage);
      const strIndex:number=await this.malloc(ru8.length+1);
      this.mem8u.set(ru8, strIndex);
      this.mem8u[strIndex+ru8.length]=0;

      return strIndex;
   }

   // allocate and copy a Uint8Array into Wasm mod memory
   async putU8(u8a:Uint8Array) {
      let dest:number=await this.malloc(u8a.length); 
      this.mem8u.set(u8a, dest);
      return dest;
   }

  async putArrayBuffer(ab:ArrayBuffer) {
      const u8=new Uint8Array(ab);
      return this.putU8(u8);
   }
}

























