import { bindCanvasEvents, CanvasEventTypes, ICanvasEvents } from "./twrcanvasevents.js";
import { IConsole, IConsoleBaseProps, IConsoleEvents, IConsoleWindow } from "./twrcon.js";
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

enum twrWindowEvents {
   CLOSE,
   
}

const BUTTON_FONT = "16px Serif";
const BUTTON_PADDING_Y = 2.5;
const BUTTON_PADDING_X = 5;
const BUTTON_HEIGHT = 5;
class Button {
   text: string;
   minWidth: number;
   events: Map<number, [IWasmModule|IWasmModuleAsync, Map<number, number>]> = new Map();

   constructor(text: string, ctx: CanvasRenderingContext2D) {
      this.text = text;

      ctx.save();
      
      ctx.font = BUTTON_FONT;
      const measure = ctx.measureText(text);
      this.minWidth = measure.width + BUTTON_PADDING_X*2.0;

      ctx.restore();
   }

   addEvent(mod: IWasmModule|IWasmModuleAsync, eventID: number, extraPtr: number) {
      if (!(mod.id in this.events))
         this.events.set(mod.id, [mod, new Map()]);

      const [_, event_map] = this.events.get(mod.id)!;

      if (eventID in event_map)
         throw new Error(`Error: button addEvent was given an eventID (${eventID}) that's already been registered!`);
      
      event_map.set(eventID, extraPtr);
   }

   removeEvent(mod: IWasmModule|IWasmModuleAsync, eventID: number) {
      if (!(mod.id in this.events))
         throw new Error(`Error: button removeEvent tried to remove event from a module (${mod.id}) that's never registered one!`);
      
      const [_, event_map] = this.events.get(mod.id)!;

      if (!(eventID in event_map))
         throw new Error(`Error: button removeEvent tried to remove an eventID (${eventID}) that isn't registered!`);

      event_map.delete(eventID);
   }

   removeAllModEvents(mod: IWasmModule|IWasmModuleAsync) {
      if (!(mod.id in this.events))
         throw new Error(`Error: button removeAllModEvents trying to remove events from a module (${mod.id}) that's never registered any!`);

      this.events.delete(mod.id);
   }
}

const MENU_TEXT_FONT = "20px Serif";
const MENU_PADDING_X = 5;
const MENU_PADDING_Y = 4;
const TOP_BAR_SIZE: number = 30;
const BORDER_SIZE: number = 5;
const MENU_START_X = BORDER_SIZE;
class Menu {
   text: string;
   buttons: number[] = [];
   
   xOffset = MENU_PADDING_X;
   width: number;
   yOffset: number;

   hovering: boolean = false;
   selected: boolean = false;

   constructor(text: string, ctx: CanvasRenderingContext2D) {
      this.text = text;
      ctx.save();
      
      ctx.font = MENU_TEXT_FONT;
      const measure = ctx.measureText(text);

      ctx.restore();

      this.width = MENU_PADDING_X*2 + measure.width;
      // console.log(`menu: ${measure.actualBoundingBoxAscent}, ${measure.actualBoundingBoxDescent}`);
      this.yOffset = (TOP_BAR_SIZE + measure.actualBoundingBoxAscent)/2;
   }

   addButton(buttonID: number, buttons: Map<number, Button>) {
      if (!(buttonID in buttons))
         throw new Error(`Error! Menu addButton was given an unregisted buttonID ${buttonID}!`);


   }

}

export class twrConsoleWindow extends twrLibrary implements ICanvasEvents, IConsoleWindow {
   id: number;
   props: IConsoleBaseProps;

   element: HTMLCanvasElement;
   ctx: CanvasRenderingContext2D;
   
   appCanvasWidth: number;
   appCanvasHeight: number;
   readonly appCanvas: twrConsoleCanvas;

   buttons: Map<number, Button> = new Map();
   nextButtonID: number = 0;

   menus: Map<number, Menu> = new Map();
   nextMenuID: number = 0;
   

   imports: TLibImports = {
      twrGetAppCanvasJSID: {},
      twrWindowAddMenu: {},
   };

   // every library should have this line
   libSourcePath = new URL(import.meta.url).pathname;

   constructor(canvas: HTMLCanvasElement, selfRegisterEvents: boolean = true) {
      // all library constructors should start with these two lines
      super();
      this.id=twrLibraryInstanceRegistry.register(this);

      this.element = canvas;
      this.ctx = canvas.getContext("2d")!;

      // const perimiterThickness = Math.min(canvas.height, canvas.width) * 0.025;
      // const menuThickness = Math.min(canvas.height, canvas.width) * 0.1;

      this.appCanvasHeight = Math.floor(canvas.height - BORDER_SIZE - TOP_BAR_SIZE);
      this.appCanvasWidth = Math.floor(canvas.width - BORDER_SIZE*2.0);

      // this.topBarSize = menuThickness;
      // this.borderSize = perimiterThickness;

      const appCanvas = document.createElement("canvas");
      appCanvas.height = this.appCanvasHeight;
      appCanvas.width = this.appCanvasWidth;

      this.appCanvas = new twrConsoleCanvas(appCanvas, undefined, false);

      if (selfRegisterEvents)
         bindCanvasEvents(this, this.element);

      this.props = {
         //TODO: Figure out what type to add/use here
         type: 0
      };
   }

   getProp(propName: string) {
      return this.props[propName];
   };

   twrConGetProp(callingMod: IWasmModule | IWasmModuleAsync, pn: number) {
      const propName=callingMod.wasmMem.getString(pn);
      return this.getProp(propName);
   };

   twrRegisterEvent(callingMod: IWasmModuleAsync | IWasmModule, eventType: number, eventID: number) {

   }
   twrUnregisterEvent(callingMod: IWasmModuleAsync | IWasmModule, eventType: number, eventID: number) {

   }
   twrUnregisterAllEvents(callingMod: IWasmModuleAsync | IWasmModule) {

   }

   handleCanvasKeyEvent(event: CanvasEventTypes, key: number) {
      this.appCanvas.handleCanvasKeyEvent(event, key);
      return true;
   }

   mouseWasOnTopBar: boolean = false;
   handleCanvasMouseEvent(event: CanvasEventTypes, x: number, y: number) {
      const n_x = x - BORDER_SIZE;
      const n_y = y - TOP_BAR_SIZE;
      let topBar = false;
      if (
         n_x >= 0 && n_y >= 0
         && n_x <= this.appCanvasWidth
         && n_y <= this.appCanvasHeight
      ) {
         this.appCanvas.handleCanvasMouseEvent(event, n_x, n_y);
      } else if (y <= TOP_BAR_SIZE) {
         topBar = true;
         this.mouseWasOnTopBar = true;
         let widthOffset = MENU_START_X;
         for (const menu of this.menus.values()) {
            menu.hovering = x >= widthOffset
               && x < widthOffset+menu.width;
            // console.log(`${x >= widthOffset}, ${x < widthOffset+menu.width}, ${menu.hovering}`);

            widthOffset += menu.width;
         }
      }

      if (!topBar && this.mouseWasOnTopBar) {
         this.mouseWasOnTopBar = false;
         for (const menu of this.menus.values()) {
            menu.hovering = false;
         }
      }
      return true;
   }
   handleCanvasWheelEvent(event: CanvasEventTypes, deltaX: number, deltaY: number, deltaZ: number, deltaMode: number) {
      this.appCanvas.handleCanvasWheelEvent(event, deltaX, deltaY, deltaZ, deltaMode);
      return true;
   }
   handleCanvasAnimationFrameEvent(event: CanvasEventTypes, delta: number) {
      this.appCanvas.handleCanvasAnimationFrameEvent(event, delta);

      this.ctx.reset();
      //draw "app" canvas
      this.ctx.drawImage(this.appCanvas.element, BORDER_SIZE, TOP_BAR_SIZE);

      const SELECT_GREY = "#D0D0D0";
      //draw border around it
      this.ctx.fillStyle = "#B0B0B0";
      this.ctx.fillRect(0, 0, BORDER_SIZE, this.element.height);
      this.ctx.fillRect(this.element.width - BORDER_SIZE, 0, this.element.width, this.element.height);
      this.ctx.fillRect(0, this.element.height - BORDER_SIZE, this.element.width, this.element.height);
      
      this.ctx.fillRect(0, 0, this.element.width, TOP_BAR_SIZE);

      this.ctx.fillStyle = "grey";
      this.ctx.lineWidth = 1.0;
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, TOP_BAR_SIZE - this.ctx.lineWidth/2.0);
      this.ctx.lineTo(this.element.width, TOP_BAR_SIZE - this.ctx.lineWidth/2.0);
      this.ctx.stroke();
      this.ctx.closePath();

      this.ctx.fillStyle = "black";
      this.ctx.font = MENU_TEXT_FONT;
      let widthOffset = MENU_START_X; 
      for (const menu of this.menus.values()) {
         // console.log(`${widthOffset + menu.xOffset}, ${menu.yOffset}`);
         if (menu.hovering ) {
            this.ctx.save();
            this.ctx.fillStyle = SELECT_GREY;

            this.ctx.beginPath();
            this.ctx.roundRect(widthOffset, MENU_PADDING_Y, menu.width, TOP_BAR_SIZE - MENU_PADDING_Y*2.0, Math.PI);
            this.ctx.fill();
            this.ctx.closePath();

            this.ctx.restore();
         }
         this.ctx.fillText(
            menu.text, 
            widthOffset + menu.xOffset,
            menu.yOffset,
         );

         widthOffset += menu.width;
      }
   }

   twrGetAppCanvasJSID(mod:IWasmModule|IWasmModuleAsync) {
      return this.appCanvas.id;
   }

   twrWindowAddMenu(mod: IWasmModuleAsync | IWasmModule, textPtr: number) {
      const text = mod.getString(textPtr);

      const id = ++this.nextButtonID;

      this.menus.set(id, new Menu(text, this.ctx));

      return id;
   }


}