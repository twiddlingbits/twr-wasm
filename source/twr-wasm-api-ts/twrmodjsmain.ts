// This class extends base to handle options when called in the main Java Script thread

import {twrDiv} from "./twrdiv.js"
import {IModParams, IModOpts, twrWasmModuleBase} from "./twrmodbase.js"
import {twrCanvas} from "./twrcanvas.js"


export abstract class twrWasmModuleInJSMain extends twrWasmModuleBase {
	iocanvas:twrCanvas;
	iodiv:twrDiv;
	modParams:IModParams;

   constructor(opts:IModOpts={}) {
		super();
		let de,ce;
		if (typeof document === 'undefined')
			throw new Error ("twrWasmModuleJSMain should only be created in JavaScript Main");

		de=document.getElementById("twr_iodiv") as HTMLDivElement;
		ce=document.getElementById("twr_iocanvas") as HTMLCanvasElement;

		if (opts.stdio=='div' && !de) throw new Error("twrWasmModuleBase opts=='div' but twr_iodiv not defined");
		if (opts.stdio=='canvas' && !ce) throw new Error("twrWasmModuleBase, opts=='canvas' but twr_iocanvas not defined");

		// set default opts based on elements found
		if (de) opts={stdio:"div", ...opts};
		else if (ce) opts={stdio:"canvas",  ...opts};
		else opts={stdio:"debug", ...opts};

		if (opts.stdio=='canvas') opts={windim:[64, 16], ...opts};
		else opts={windim:[0, 0], ...opts};

		if (!opts.imports) opts.imports={};
		if (!opts.backcolor) opts.backcolor="black"; 
		if (!opts.forecolor) opts.forecolor="white";
		if (!opts.fontsize) opts.fontsize=16;

		this.modParams={
			stdio:opts.stdio!, 
			windim:opts.windim!, 
			imports:opts.imports, 
			forecolor:opts.forecolor, 
			backcolor:opts.backcolor, 
			fontsize:opts.fontsize
		};

		this.iocanvas=new twrCanvas(ce, this.modParams.windim[0], this.modParams.windim[1],  this.modParams.forecolor, this.modParams.backcolor, this.modParams.fontsize, this);
		this.iodiv=new twrDiv(de, this.modParams.forecolor, this.modParams.backcolor, this.modParams.fontsize,);

	}
}