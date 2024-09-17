//
// This class implements a circular buffer that the main javascript thread can write to, 
// and a blocking WebWorker thread can read from.  This allows keyboard characters to be transferred from the main JS thread to a WebWorker thread.
// The WebWorker can use the readWait() function to sleep, w/o participating in the normal 
// async callback dispatch method.  This allows a C program that is a single blocking loop to receive input from the primary javascript thread.
// readWait() is used used when io_getc32() or io_mbgetstr() is called from a C function.
//

const RDIDX=0;
const WRIDX=1;
const LEN=256;

// A single thread can read and a separate single thread can write.  With these constraints Atomic operations are not needed.
// the first 256 array entries are the circular buffer
// the next two are used for the read and write index

//!!!! I am using --enable-features=SharedArrayBuffer; see the SharedArrayBuffer docs for COR issues when going to a live web server

export class twrSharedCircularBuffer {
   saBuffer:SharedArrayBuffer;
   f64Array:Float64Array;
   i32Array:Int32Array;
 
   constructor (sa?:SharedArrayBuffer) {
      if (typeof window !== 'undefined') {  // this check only works if window defined (not a worker thread)
         if (!crossOriginIsolated && !(window.location.protocol === 'file:')) 
            throw new Error("twrSharedCircularBuffer constructor, crossOriginIsolated="+crossOriginIsolated+". See SharedArrayBuffer docs.");
      }
      if (sa) this.saBuffer=sa;
      else this.saBuffer=new SharedArrayBuffer(LEN*8+4+4);  // LEN Float64's + RDIDX and WRIDX (both Int32)
      this.f64Array=new Float64Array(this.saBuffer, 8);
      this.i32Array=new Int32Array(this.saBuffer, 0, 2);
      this.i32Array[RDIDX]=0;
      this.i32Array[WRIDX]=0;
   }

   private silentWrite(n:number) {
      let i=this.i32Array[WRIDX];
      this.f64Array[i]=n;
      i++;
      if (i==LEN) i=0;
      this.i32Array[WRIDX]=i;  
   }

   writeArray(arr:number[]) {
      if (arr.length>0) {
         for (let i=0; i<arr.length; i++)
            this.silentWrite(arr[i]);
         Atomics.notify(this.i32Array, WRIDX);
      }
   }

   write(n:number) {
      this.silentWrite(n);
      Atomics.notify(this.i32Array, WRIDX);   
   }

   read() {
        if (!this.isEmpty()) {
            let i=this.i32Array[RDIDX];
            let n=this.f64Array[i];
            i++;
            if (i==LEN) i=0;
            this.i32Array[RDIDX]=i;
            return n;
        }
      else
         return undefined;
   }

   readWait():number {
      let retVal=this.read();
      if (retVal!==undefined) return retVal;

      const rdptr=this.i32Array[RDIDX];
      // verifies that a shared memory location still contains a given value and if so sleeps until notified.
      Atomics.wait(this.i32Array, WRIDX, rdptr);
      retVal=this.read();
      if (retVal===undefined) throw new Error("internal error");
      return retVal;
   }

    isEmpty():boolean {
        return this.i32Array[RDIDX]==this.i32Array[WRIDX];
    }
}
