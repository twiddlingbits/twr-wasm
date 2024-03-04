
let logline="";
export function twrDebugLogImpl(char:number) {
	if (char==10) {
		console.log(logline);
		logline="";
	}
	else {
		logline=logline+String.fromCharCode(char);
		if (logline.length>=100) {
			console.log(logline);
			logline="";
		}
	}
}

// ************************************************************************
// debugLog doesn't currently wait for the message to log, it returns immediately.
// I could move this to be in the twrWaitingCalls class
export function twrDebugLogProxy(ch:number) {
    postMessage(["debug", ch]);
}

