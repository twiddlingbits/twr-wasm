
import {IConsole, IConsoleProxy} from "./twrcon.js"

// this is global in the JS main thread address space
// all consoles are registered here
export class twrConsoleRegistry {

	static consoles: IConsole[]=[];

	// create a pairing between an instance of type IConsole and an integer ID
	static registerConsole(con:IConsole) {
		twrConsoleRegistry.consoles.push(con);
		return twrConsoleRegistry.consoles.length-1;
	}

	static getConsole(id:number) {
		if (id<0 || id >= twrConsoleRegistry.consoles.length)
			throw new Error("Invalid console ID: "+id);

		return twrConsoleRegistry.consoles[id];
	}

	static getConsoleID(con:IConsole) {
		for (let i=0; i<twrConsoleRegistry.consoles.length; i++)
			if (twrConsoleRegistry.consoles[i]==con)
				return i;

		throw new Error("IConsole not in registry");
	}

}

// this is created in each twrWasmModuleAsyncProxy Worker thread
// if there are multiple twrWasmModuleAsyncProxy instances, there will be multiple copies of this in each Worker
export class twrConsoleProxyRegistry {

	static consoles: IConsoleProxy[]=[];

	// create a pairing between an instance of type IConsole and an integer ID
	static registerConsoleProxy(con:IConsoleProxy) {
		twrConsoleProxyRegistry.consoles[con.id]=con;
		return con.id;
	}

	static getConsoleProxy(id:number) {
		if (id<0 || id >= twrConsoleProxyRegistry.consoles.length)
			throw new Error("Invalid console ID: "+id);

		return twrConsoleProxyRegistry.consoles[id];
	}

	static getConsoleID(con:IConsoleProxy) {
		for (let i=0; i<twrConsoleProxyRegistry.consoles.length; i++)
			if (twrConsoleProxyRegistry.consoles[i]==con)
				return i;

		throw new Error("IConsoleProxy not in registry");
	}

}