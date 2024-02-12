//
// This class implements a circular buffer that the main javascript thread can write to, 
// and a blocking WebWorker thread can read from.  This allows keyboard characters to be transferred from the main JS thread to a WebWorker thread.
// The WebWorker can use the readWait() function to sleep, w/o participating in the normal 
// async callback dispatch method.  This allows a C program that is a single blocking loop to receive input from the primary javascript thread.
// readWait() is used used when io_getc() or io_getstr() is called from a C function.
//
const RDIDX = 256;
const WRIDX = 257;
const LEN = 256;
// A single thread can read and a separate single thread can write.  With these constraints Atomic operations are not needed.
// the first 256 array entries are the circular buffer
// the next two are used for the read and write index
//!!!! I am using --enable-features=SharedArrayBuffer; see the SharedArrayBuffer docs for COR issues when going to a live web server
export class twrSharedCircularBuffer {
    constructor(sa) {
        if (!crossOriginIsolated)
            console.log("warning: twrSharedCirclarBuffer constructor, crossOriginIsolated=", crossOriginIsolated);
        if (sa)
            this.sharedArray = sa;
        else
            this.sharedArray = new SharedArrayBuffer(258 * 4);
        this.buf = new Int32Array(this.sharedArray);
        this.buf[RDIDX] = 0;
        this.buf[WRIDX] = 0;
    }
    write(n) {
        let i = this.buf[WRIDX];
        this.buf[i] = n;
        i++;
        if (i == LEN)
            i = 0;
        this.buf[WRIDX] = i;
        Atomics.notify(this.buf, WRIDX);
    }
    read() {
        if (!this.isEmpty()) {
            let i = this.buf[RDIDX];
            let n = this.buf[i];
            i++;
            this.buf[RDIDX] = i;
            return n;
        }
        else
            return -1;
    }
    readWait() {
        if (this.isEmpty()) {
            const rdptr = this.buf[RDIDX];
            // verifies that a shared memory location still contains a given value and if so sleeps until notified.
            Atomics.wait(this.buf, WRIDX, rdptr);
        }
        return this.read();
    }
    isEmpty() {
        return this.buf[RDIDX] == this.buf[WRIDX];
    }
}
//# sourceMappingURL=twrcircular.js.map