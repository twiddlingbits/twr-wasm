//
// This class implements a simple signal/wait mechanism
// It is used by the WebWorker thread to block/wait, and the main JS thread to signal when to unblock
//

enum twrSignalState {
    WAITING=0,
    SIGNALED=1
};

export class twrSignal {
	sharedArray:SharedArrayBuffer;
	buf:Int32Array;

 	constructor (sa?:SharedArrayBuffer) {
        if (!crossOriginIsolated && !(window.location.protocol === 'file:')) throw new Error("twrSignal constructor, crossOriginIsolated="+crossOriginIsolated+". See SharedArrayBuffer docs.");
        if (sa) this.sharedArray=sa;
        else this.sharedArray=new SharedArrayBuffer(4);
		this.buf=new Int32Array(this.sharedArray);
        this.buf[0]=twrSignalState.WAITING;
	}

	signal() {
        this.buf[0]=twrSignalState.SIGNALED;  
        //console.log("about to signal");
        Atomics.notify(this.buf, 0);   
	}

    wait() {
        if (this.buf[0]==twrSignalState.WAITING) {
            //console.log("waiting...");
            Atomics.wait(this.buf, 0, twrSignalState.WAITING);
            //console.log("released...");

        }
	}
    isSignaled():boolean {
        return this.buf[0]==twrSignalState.SIGNALED;
    }

    reset() {
        this.buf[0]=twrSignalState.WAITING;
    }
}
