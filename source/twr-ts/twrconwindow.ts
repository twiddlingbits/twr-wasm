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

enum MenuItemEvents {
   HOVERING,
   UNHOVERED,
   CLICKED,
   MOUSE_MOVE,
}
type MenuItemEventData = [ MenuItemEvents.HOVERING ]
   | [ MenuItemEvents.UNHOVERED ]
   | [ MenuItemEvents.CLICKED ]
   | [ MenuItemEvents.MOUSE_MOVE, number, number ];

interface MenuItem {
   id: number;
   getMinSize: (ctx: CanvasRenderingContext2D) => [number, number];
   render: (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => void;
   getRequiredMenuEvents: () => MenuItemEvents[];
   handleMenuEvent: (event: MenuItemEventData) => void;
}

interface WidgetEvents {
   addEvent: (callback: () => void) => void;
   removeEvent: (callback: () => void) => void;
}
const BUTTON_FONT = "16px Serif";
const BUTTON_PADDING_Y = 2.5;
const BUTTON_PADDING_X = 5;
const BUTTON_HEIGHT = 5;
class Button implements MenuItem, WidgetEvents {
   id: number;

   text: string;
   font: string;
   text_color: string;
   background_color: string;
   selected_color: string;
   minWidth: number;
   minHeight: number;
   events: (() => void)[] = [];

   constructor(
      id: number,
      ctx: CanvasRenderingContext2D, 
      text: string, 
      font: string = "16px Serif", 
      text_color: string = "white", 
      background_color: string = "light_gray", 
      selected_color: string = "gray"
   ) {
      this.id = id;
      this.text = text;
      this.font = font;
      this.text_color = text_color;
      this.background_color = background_color;
      this.selected_color = selected_color;

      ctx.save();
      
      ctx.font = this.font;
      const measure = ctx.measureText(text);
      this.minWidth = measure.width;
      this.minHeight = measure.actualBoundingBoxAscent;

      ctx.restore();
   }
   getRequiredMenuEvents() {
      return [
         MenuItemEvents.CLICKED,
         MenuItemEvents.HOVERING,
         MenuItemEvents.UNHOVERED,
      ];
   }

   selected: boolean = false;
   handleMenuEvent(event: MenuItemEventData) {
      switch (event[0]) {
         case MenuItemEvents.CLICKED:
         {
            for (const handler of this.events) {
               handler();
            }
         }
         break;

         case MenuItemEvents.HOVERING:
         {
            this.selected = true;
         }
         break;

         case MenuItemEvents.UNHOVERED:
         {
            this.selected = false;
         }
         break;
         
         default:
         {
            throw new Error(`Button handleMenuEvent was given an unexpected event (${event})!`);
         }
         break;
      } 
   };
   addEvent(callback: () => void) {
      this.events.push(callback);
   }
   removeEvent(callback: () => void) {
      const index = this.events.findIndex(callback);
      if (index == -1) throw new Error(`Error: Button removeEvent was given a callback that wasn't registered!`);
      this.events.splice(index, 1);
   }

   getMinSize(ctx: CanvasRenderingContext2D): [number, number] {
      return [this.minWidth, this.minHeight];
   };

   render(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
      ctx.save();
      ctx.font = this.font;
      
      console.log(this.text, this.selected);
      ctx.fillStyle = this.selected ? this.selected_color : this.background_color ;
      ctx.fillRect(x, y, width, height);

      ctx.fillStyle = this.text_color;
      ctx.fillText(this.text, x + (width - this.minWidth)/2, y + (height + this.minHeight)/2);

      ctx.restore();
   }
   
}

const MENU_TEXT_FONT = "20px Serif";
const MENU_PADDING_X = 5;
const MENU_PADDING_Y = 4;
const TOP_BAR_SIZE: number = 30;
const BORDER_SIZE: number = 5;
const MENU_START_X = BORDER_SIZE;
class Menu {
   items: MenuItem[] = [];
   
   constructor() {

   }

   render(ctx: CanvasRenderingContext2D, x: number, y: number) {
      ctx.save();

      let maxWidth = 0;
      let maxHeight = 0;
      for (const item of this.items) {
         const [width, height] = item.getMinSize(ctx);
         if (width > maxWidth)
            maxWidth = width;
         if (height > maxHeight)
            maxHeight = height;
      }
      const width = maxWidth + MENU_PADDING_X*2;
      const height = (maxHeight + MENU_PADDING_Y)*this.items.length - MENU_PADDING_Y;

      ctx.fillStyle = "light_gray";
      ctx.fillRect(x, y, width, height);

      let currentHeight = 0;
      for (const item of this.items) {
         item.render(ctx, x+MENU_PADDING_X, currentHeight, maxWidth, maxHeight);
         currentHeight += maxHeight + MENU_PADDING_Y;
      }

      ctx.restore();
   }

   addItem(menuItem: MenuItem) {
      if (this.items.indexOf(menuItem) != -1)
         throw new Error(`Menu addItem was given a MenuItem that's already on the menu!`);
      this.items.push(menuItem);
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

   menuItems: Map<number, MenuItem> = new Map();
   nextMenuItem: number = 0;

   menus: Map<number, [Button, Menu]> = new Map();
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
            // menu.hovering = x >= widthOffset
            //    && x < widthOffset+menu.width;
            const width = menu[0].getMinSize(this.ctx)[0] + MENU_PADDING_X*2;
            
            if (
               x >= widthOffset
               && x < widthOffset+width
            ) {
               menu[0].handleMenuEvent([MenuItemEvents.HOVERING]);
            }

            widthOffset += width;
         }
      }

      if (!topBar && this.mouseWasOnTopBar) {
         this.mouseWasOnTopBar = false;
         for (const menu of this.menus.values()) {
            menu[0].handleMenuEvent([MenuItemEvents.UNHOVERED]);
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

      // this.ctx.fillStyle = "black";
      // this.ctx.font = MENU_TEXT_FONT;
      // let widthOffset = MENU_START_X; 
      // for (const menu of this.menus.values()) {
      //    // console.log(`${widthOffset + menu.xOffset}, ${menu.yOffset}`);
      //    if (menu.hovering ) {
      //       this.ctx.save();
      //       this.ctx.fillStyle = SELECT_GREY;

      //       this.ctx.beginPath();
      //       this.ctx.roundRect(widthOffset, MENU_PADDING_Y, menu.width, TOP_BAR_SIZE - MENU_PADDING_Y*2.0, Math.PI);
      //       this.ctx.fill();
      //       this.ctx.closePath();

      //       this.ctx.restore();
      //    }
      //    this.ctx.fillText(
      //       menu.text, 
      //       widthOffset + menu.xOffset,
      //       menu.yOffset,
      //    );

      //    widthOffset += menu.width;
      // }
      let widthOffset = MENU_START_X;
      for (const menu of this.menus.values()) {
         const width = menu[0].getMinSize(this.ctx)[0] + MENU_PADDING_X*2;

         menu[0].render(this.ctx, widthOffset, 0, width, TOP_BAR_SIZE);

         widthOffset += width;
      }

   }

   twrGetAppCanvasJSID(mod:IWasmModule|IWasmModuleAsync) {
      return this.appCanvas.id;
   }

   twrWindowAddMenu(mod: IWasmModuleAsync | IWasmModule, textPtr: number) {
      const text = mod.getString(textPtr);

      const id = ++this.nextMenuID;

      this.menus.set(id, [new Button(id, this.ctx, text), new Menu()]);

      return id;
   }


}