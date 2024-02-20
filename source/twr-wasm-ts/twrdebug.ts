
let logline="";
export function debugLogImpl(char:number) {
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
// debugLog doesnt currently wait for the message to log, it returns immediaty.
// I could move this to be in the twrWaitingCalls class
export function debugLogProxy(ch:number) {
    postMessage(["debug", ch]);
}

