import { bindCanvasEvents, CanvasEventTypes, ICanvasEvents } from "./twrcanvasevents.js";
import { IConsole, IConsoleEvents } from "./twrcon.js";
import twrConsoleCanvas from "./twrconcanvas.js";
import { TLibImports, twrLibrary, twrLibraryInstanceRegistry } from "./twrlibrary.js";
import { IWasmModule } from "./twrmod";
import { IWasmModuleAsync } from "./twrmodasync";


type FullID = number;

function calculateID(mod:IWasmModule|IWasmModuleAsync, id: number): FullID {
   if (mod.id >= (2**20)) throw new Error("twrlibaudio was given a module ID greater than 20 bits long!");
   if (id >= (2**32)) throw new Error("twrlibaudio was given an object ID greater than 32 bits!");
   //should be equivalent to (mod.id << 32) | id
   //can't use shift operations without being limited to 32-bit signed integers or using bignumber
   return ((mod.id & (2**20 - 1)) * 2**32 + id) as FullID;
}

export default class twrConsoleWindow extends twrLibrary implements ICanvasEvents {
   id: number;

   element: HTMLCanvasElement;
   ctx: CanvasRenderingContext2D;
   readonly borderSizes: [number, number];
   readonly appCanvas: twrConsoleCanvas;

   imports: TLibImports = {
      
   };

   // every library should have this line
   libSourcePath = new URL(import.meta.url).pathname;

   constructor(canvas: HTMLCanvasElement, selfRegisterEvents: boolean = true) {
      // all library constructors should start with these two lines
      super();
      this.id=twrLibraryInstanceRegistry.register(this);

      this.element = canvas;
      this.ctx = canvas.getContext("2d")!;

      const perimiterThickness = Math.min(canvas.height, canvas.width) * 0.05;
      const menuThickness = Math.min(canvas.height, canvas.width) * 0.1;

      const appCanvasHeight = Math.floor(canvas.height - perimiterThickness - menuThickness);
      const appCanvasWidth = Math.floor(canvas.width - menuThickness*2.0);

      this.borderSizes = [perimiterThickness, menuThickness];

      const appCanvas = new HTMLCanvasElement();
      appCanvas.height = appCanvasHeight;
      appCanvas.width = appCanvasWidth;

      this.appCanvas = new twrConsoleCanvas(appCanvas, false);

      bindCanvasEvents(this, this.element);
   }

   handleCanvasKeyEvent(event: CanvasEventTypes, key: number) {
      this.appCanvas.handleCanvasKeyEvent(event, key);
   }
   handleCanvasMouseEvent(event: CanvasEventTypes, x: number, y: number) {
      this.appCanvas.handleCanvasMouseEvent(event, x, y);
   }
   handleCanvasWheelEvent(event: CanvasEventTypes, deltaX: number, deltaY: number, deltaZ: number, deltaMode: number) {
      this.appCanvas.handleCanvasWheelEvent(event, deltaX, deltaY, deltaZ, deltaMode);
   }
   handleCanvasAnimationFrameEvent(event: CanvasEventTypes, delta: number) {
      this.appCanvas.handleCanvasAnimationFrameEvent(event, delta);

      //draw "app" canvas
      this.ctx.drawImage(this.appCanvas.element, this.borderSizes[0], this.borderSizes[1]);

      //draw border around it
      this.ctx.fillStyle = "blue";
      this.ctx.fillRect(0, 0, this.borderSizes[1], this.element.height);
      this.ctx.fillRect(this.element.width - this.borderSizes[1], 0, this.element.width, this.element.height);
      this.ctx.fillRect(0, this.element.height - this.borderSizes[1], this.element.width, this.element.height);
      
      this.ctx.fillRect(0, 0, this.element.width, this.borderSizes[0]);
   }

   twrGetAppCanvas(mod:IWasmModule|IWasmModuleAsync) {
      return this.appCanvas.id;
   }


}