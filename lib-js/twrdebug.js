let logline = "";
export function twrDebugLogImpl(char) {
    if (char == 10 || char == 3) { // ASCII 03 is End-of-Text, and is used here to indicate the preceding char should be printed
        console.log(logline); // ideally without a linefeed, but there is no way to not have a LF with console.log API.
        logline = "";
    }
    else {
        logline = logline + String.fromCharCode(char);
        if (logline.length >= 200) {
            console.log(logline);
            logline = "";
        }
    }
}
// ************************************************************************
// debugLog doesn't currently wait for the message to log, it returns immediately.
// I could move this to be in the twrWaitingCalls class
export function twrDebugLogProxy(ch) {
    postMessage(["debug", ch]);
}
//# sourceMappingURL=twrdebug.js.map