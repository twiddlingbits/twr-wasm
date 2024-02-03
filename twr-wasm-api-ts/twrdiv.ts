
// These are the WebAssembly.ModuleImports that the twr_wasm_* C code calls
export function syncCharToStdout(ch:number) {
	if (document.getElementById("twr_stdout"))
		divPrint("twr_stdout", ch )
	else
		console.log(String.fromCharCode(ch));
}

export function syncDebugLog(char:number) {
	console.log(String.fromCharCode(char));
}

/* 
 * add character to div.  Supports the following control codes:
 * any of CRLF, CR (/r), or LF(/n)  will cause a new line
 * 0xE cursor on 
 * 0x8 backspace
 * 0xF cursor off 
*/

const CURSOR='█';
const divVars:{[key:string]:{cursorOn:boolean, lastChar:number}}={};

// divPrint() - prints characters to div, with some control code support.  Not generally used directly.

export function divPrint(todiv:string, ch:number)
{
	const element=document.getElementById(todiv);
	if (element) {
		if (!divVars[todiv]) {
			divVars[todiv]={
				cursorOn:false,
				lastChar:0
			};
		}
		switch (ch) {
			case 10:  // newline
			case 13:  // return
				if (ch==10 && divVars[todiv].lastChar==13) break;  // detect CR LF and treat as single new line
				if (divVars[todiv].cursorOn) element.innerHTML=element.innerHTML.slice(0, -1);
				element.innerHTML +=  "<br><br>";   //2nd break is a place holder for next line
				if (divVars[todiv].cursorOn) element.innerHTML +=  CURSOR;
				//element.scrollIntoView();
				//element.scrollTop = element.scrollHeight;
				let p = element.getBoundingClientRect();
				window.scrollTo(0, p.height+100);
				break;

			case 8:  // backspace
				element.innerHTML=element.innerHTML.slice(0, -1);
				break;

			case 0xE:   // cursor on
				if (!divVars[todiv].cursorOn) {
					divVars[todiv].cursorOn=true;
					element.innerHTML +=  CURSOR;
					element.focus();
				}
				break;

			case 0xF:   // cursor off
				if (divVars[todiv].cursorOn) {
					divVars[todiv].cursorOn=false;
					element.innerHTML=element.innerHTML.slice(0, -1);
				}
				break;
			default:
				if (divVars[todiv].cursorOn) element.innerHTML=element.innerHTML.slice(0, -1);
				if (element.innerHTML.endsWith("<br>")) // start of a new line, remove place holder <br>
					element.innerHTML=element.innerHTML.slice(0, -4);

				element.innerHTML +=  String.fromCharCode(ch);
				if (divVars[todiv].cursorOn) element.innerHTML +=  CURSOR;
				break;
			}

		divVars[todiv].lastChar=ch;
	}
	else 
		console.log('element '+todiv+' not found in twrDivPrint: '+String.fromCharCode(ch));
}

