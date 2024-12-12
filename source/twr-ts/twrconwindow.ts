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

interface WidgetManager {
   childUpdated: (widget: Widget, ctx: CanvasRenderingContext2D) => void;
}
interface Widget {
   readonly parent: WidgetManager; 
   readonly id: number;
   getMinSize: (ctx: CanvasRenderingContext2D) => [number, number];
   render: (ctx: CanvasRenderingContext2D, offsetX?: number, offsetY?: number) => void;
   getRequiredMenuEvents: () => MenuItemEvents[];
   handleMenuEvent: (event: MenuItemEventData) => void;
   getDimensions: () => [number, number, number, number];
   setDimensions: (ctx: CanvasRenderingContext2D, x?: number, y?: number, height?: number, width?: number) => void;
}

interface WidgetConstructor {
   parent: WidgetManager;
   id: number;
   x: number;
   y: number;
   width?: number;
   height?: number;
}
interface ButtonWidgetConstructor extends WidgetConstructor {
   text: string;
   textFont?: string;
   textColor?: string;
   buttonColor?: string;
   selectedButtonColor?: string;
}

class NewButton implements Widget, WidgetEvents {
   readonly parent: WidgetManager; 
   readonly id: number;
   private x: number;
   private y: number;
   private width: number;
   private height: number;

   private textOffsets: [number, number];

   private text: string;
   private textFont: string;
   private textColor: string;
   private buttonColor: string;
   private selectedButtonColor: string;

   private selected: boolean = false;
   private events: Set<(() => void)> = new Set();

   constructor(ctx: CanvasRenderingContext2D, cons: ButtonWidgetConstructor) {
      this.parent = cons.parent;
      this.id = cons.id;
      this.x = cons.x;
      this.y = cons.y;

      this.text = cons.text;
      this.textFont = cons.textFont ?? "16px Serif";
      this.textColor = cons.textColor ?? "white";
      this.buttonColor = cons.buttonColor ?? "grey";
      this.selectedButtonColor = cons.selectedButtonColor ?? "darkgrey";

      const [minWidth, minHeight] = this.getMinSize(ctx);

      this.width = cons.width ?? minWidth;
      this.height = cons.height ?? minHeight;
      
      this.textOffsets = this.getTextOffsets(ctx);
   }

   getDimensions(): [number, number, number, number] {
      return [this.x, this.y, this.width, this.height];
   }
   setDimensions(ctx: CanvasRenderingContext2D, x?: number, y?: number, height?: number, width?: number) {
      this.x = x ?? this.x;
      this.y = y ?? this.y;
      this.height = height ?? this.height;
      this.width = width ?? this.width;

      if (height != undefined || width != undefined)
         this.textOffsets = this.getTextOffsets(ctx);
      
      if (x != undefined || y != undefined || height != undefined || width != undefined)
         this.parent.childUpdated(this, ctx);
   }

   getMinSize(ctx: CanvasRenderingContext2D): [number, number] {
      ctx.save();
      ctx.font = this.textFont;

      const measure = ctx.measureText(this.text);
      const minWidth = measure.width;
      const minHeight = measure.actualBoundingBoxAscent;

      ctx.restore();

      return [minWidth, minHeight];
   }
   getTextOffsets(ctx: CanvasRenderingContext2D): [number, number] {
      const [minWidth, minHeight] = this.getMinSize(ctx);

      return [
         (this.width - minWidth)/2.0,
         (this.height + minHeight)/2.0
      ];
   }
   render(ctx: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0) {
      ctx.save();

      const button_color = this.selected ? this.selectedButtonColor : this.buttonColor ;
      ctx.fillStyle = button_color;
      ctx.fillRect(this.x + offsetX, this.y + offsetY, this.width, this.height);

      ctx.font = this.textFont;
      ctx.fillStyle = this.textColor;
      ctx.fillText(
         this.text,
         this.x + this.textOffsets[0] + offsetX,
         this.y + this.textOffsets[1] + offsetY
      );

      ctx.restore();
   }
   getRequiredMenuEvents(): MenuItemEvents[] {
      return [
         MenuItemEvents.CLICKED,
         MenuItemEvents.HOVERING,
         MenuItemEvents.UNHOVERED
      ];
   }
   handleMenuEvent(event: MenuItemEventData) {
      switch (event[0]) {
         case MenuItemEvents.CLICKED:
         {
            for (const callback of this.events.keys()) {
               callback();
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
            throw new Error(`Button handleMenuEvent was given an unrecognized event ${MenuItemEvents[event[0]] ?? event[0]}!`);
      }
   }

   addEvent(callback: () => void) {
      this.events.add(callback);
   }
   removeEvent(callback: () => void) {
      return this.events.delete(callback);
   }
}

class TmpManager implements WidgetManager {
   childUpdated(widget: Widget, ctx: CanvasRenderingContext2D) {

   }
}
const tmpManager = new TmpManager();

interface WidgetEvents {
   addEvent: (callback: () => void) => void;
   removeEvent: (callback: () => void) => void;
}
// const BUTTON_FONT = "16px Serif";
// const BUTTON_PADDING_Y = 2.5;
// const BUTTON_PADDING_X = 5;
// const BUTTON_HEIGHT = 5;
// class Button implements MenuItem, WidgetEvents {
//    id: number;

//    text: string;
//    font: string;
//    text_color: string;
//    background_color: string;
//    selected_color: string;
//    minWidth: number;
//    minHeight: number;
//    events: (() => void)[] = [];

//    constructor(
//       id: number,
//       ctx: CanvasRenderingContext2D, 
//       text: string, 
//       font: string = "16px Serif", 
//       text_color: string = "white", 
//       background_color: string = "light_gray", 
//       selected_color: string = "blue"
//    ) {
//       this.id = id;
//       this.text = text;
//       this.font = font;
//       this.text_color = text_color;
//       this.background_color = background_color;
//       this.selected_color = selected_color;

//       ctx.save();
      
//       ctx.font = this.font;
//       const measure = ctx.measureText(text);
//       this.minWidth = measure.width;
//       this.minHeight = measure.actualBoundingBoxAscent;

//       ctx.restore();
//    }
//    getRequiredMenuEvents() {
//       return [
//          MenuItemEvents.CLICKED,
//          MenuItemEvents.HOVERING,
//          MenuItemEvents.UNHOVERED,
//       ];
//    }

//    selected: boolean = false;
//    handleMenuEvent(event: MenuItemEventData) {
//       switch (event[0]) {
//          case MenuItemEvents.CLICKED:
//          {
//             for (const handler of this.events) {
//                handler();
//             }
//          }
//          break;

//          case MenuItemEvents.HOVERING:
//          {
//             this.selected = true;
//          }
//          break;

//          case MenuItemEvents.UNHOVERED:
//          {
//             this.selected = false;
//          }
//          break;
         
//          default:
//          {
//             throw new Error(`Button handleMenuEvent was given an unexpected event (${event})!`);
//          }
//          break;
//       } 
//    };
//    addEvent(callback: () => void) {
//       this.events.push(callback);
//    }
//    removeEvent(callback: () => void) {
//       const index = this.events.findIndex(callback);
//       if (index == -1) throw new Error(`Error: Button removeEvent was given a callback that wasn't registered!`);
//       this.events.splice(index, 1);
//    }

//    getMinSize(ctx: CanvasRenderingContext2D): [number, number] {
//       return [this.minWidth, this.minHeight];
//    };

//    render(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
//       ctx.save();
//       ctx.font = this.font;
      
//       ctx.fillStyle = this.selected ? this.selected_color : this.background_color ;
//       ctx.fillRect(x, y, width, height);

//       ctx.fillStyle = this.text_color;
//       ctx.fillText(this.text, x + (width - this.minWidth)/2, y + (height + this.minHeight)/2);

//       ctx.restore();
//    }
   
// }


const MENU_TEXT_FONT = "20px Serif";
const MENU_PADDING_X = 5;
const MENU_PADDING_Y = 4;
const TOP_BAR_SIZE: number = 30;
const BORDER_SIZE: number = 5;
const MENU_START_X = BORDER_SIZE;
class Menu {
   items: MenuItem[] = [];
   events: Map<MenuItemEvents, Set<MenuItem>> = new Map();
   
   constructor() {

   }

   render(ctx: CanvasRenderingContext2D, x: number, y: number, minWidth: number, minHeight: number) {
      ctx.save();

      const [maxWidth, maxHeight] = this.getMaxItemSize(ctx, minWidth, minHeight);
      const [width, height] = this.maxItemSizeToTotalSize(maxWidth, maxHeight);

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
      for (const event of menuItem.getRequiredMenuEvents()) {
         let eventSet = this.events.get(event) ?? (() => {
            const set: Set<MenuItem> = new Set();
            this.events.set(event, set);
            return set;
         })();

         eventSet.add(menuItem);
      }
   }

   getMaxItemSize(ctx: CanvasRenderingContext2D, minWidth: number, minHeight: number): [number, number] {
      let maxWidth = minWidth;
      let maxHeight = minHeight;
      for (const item of this.items) {
         const [width, height] = item.getMinSize(ctx);
         if (width > maxWidth)
            maxWidth = width;
         if (height > maxHeight)
            maxHeight = height;
      }
      return [maxWidth, maxHeight];
   } 
   maxItemSizeToTotalSize(maxWidth: number, maxHeight: number) {
      const width = maxWidth + MENU_PADDING_X*2;
      const height = (maxHeight + MENU_PADDING_Y)*Math.max(this.items.length, 1) - MENU_PADDING_Y;

      return [width, height];
   }

   getSize(ctx: CanvasRenderingContext2D, minWidth: number, minHeight: number) {
      const [maxWidth, maxHeight] = this.getMaxItemSize(ctx, minWidth, minHeight);
      return this.maxItemSizeToTotalSize(maxWidth, maxHeight);
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

   menus: Map<number, [NewButton, Menu]> = new Map();
   nextMenuID: number = 0;

   openMenu: [Menu, number, number, number]|undefined = undefined;

   

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
      let [menWidth, menHeight] = [0, 0];
      if (this.openMenu) {
         [menWidth, menHeight] = this.openMenu[0].getSize(this.ctx, this.openMenu[3], TOP_BAR_SIZE);
      }

      if (
         this.openMenu
         && x >= this.openMenu[1] && x <= this.openMenu[1]+menWidth
         && y >= this.openMenu[2] && y <= this.openMenu[2]+menHeight
      ) {
         console.log("on the menu!!!");
      } else if (
         n_x >= 0 && n_y >= 0
         && n_x <= this.appCanvasWidth
         && n_y <= this.appCanvasHeight
      ) {
         this.appCanvas.handleCanvasMouseEvent(event, n_x, n_y);
      } else if (y <= TOP_BAR_SIZE) {
         topBar = true;
         this.mouseWasOnTopBar = true;
         let widthOffset = MENU_START_X;
         // for (const menu of this.menus.values()) {
         //    // menu.hovering = x >= widthOffset
         //    //    && x < widthOffset+menu.width;
         //    const width = menu[0].getMinSize(this.ctx)[0] + MENU_PADDING_X*2;
            
         //    if (
         //       x >= widthOffset
         //       && x < widthOffset+width
         //    ) {
         //       if (event == CanvasEventTypes.MOUSE_MOVE)
         //          menu[0].handleMenuEvent([MenuItemEvents.HOVERING]);
         //       else if (event == CanvasEventTypes.MOUSE_CLICK)
         //          menu[0].handleMenuEvent([MenuItemEvents.CLICKED]);
         //    } else if (event == CanvasEventTypes.MOUSE_MOVE) {
         //       menu[0].handleMenuEvent([MenuItemEvents.UNHOVERED]);
         //    }

         //    widthOffset += width;
         // }
         for (const [button, ] of this.menus.values()) {
            const [bX, bY, bWidth, bHeight] = button.getDimensions();
            const xInBounds = bX <= x && x <= bX + bWidth;
            const yInBounds = bY <= y && y <= bY + bHeight;

            const inBounds = xInBounds && yInBounds;

            switch (event) {
               case CanvasEventTypes.MOUSE_MOVE:
               {
                  if (inBounds)
                     button.handleMenuEvent([MenuItemEvents.HOVERING])
                  else
                     button.handleMenuEvent([MenuItemEvents.UNHOVERED])
               }
               break;

               case CanvasEventTypes.MOUSE_CLICK:
               {
                  if (inBounds) {
                     button.handleMenuEvent([MenuItemEvents.CLICKED])
                  }
               }
               break;
            }
               
            
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

      // let widthOffset = MENU_START_X;
      // for (const menu of this.menus.values()) {
      //    const width = menu[0].getMinSize(this.ctx)[0] + MENU_PADDING_X*2;

      //    menu[0].render(this.ctx, widthOffset, 0, width, TOP_BAR_SIZE - this.ctx.lineWidth/2.0);

      //    widthOffset += width;
      // }
      for (const [button, ] of this.menus.values()) {
         button.render(this.ctx, 0, 0);
      }

      if (this.openMenu) {
         this.openMenu[0].render(this.ctx, this.openMenu[1], this.openMenu[2], this.openMenu[3], TOP_BAR_SIZE);
      }

   }

   twrGetAppCanvasJSID(mod:IWasmModule|IWasmModuleAsync) {
      return this.appCanvas.id;
   }

   twrWindowAddMenu(mod: IWasmModuleAsync | IWasmModule, textPtr: number) {
      const text = mod.getString(textPtr);

      const id = ++this.nextMenuID;

      // const button = new Button(id, this.ctx, text, undefined, "black", "#B0B0B0", "#D0D0D0");
      // const menu = new Menu();
      // this.menus.set(id, [button, menu]);

      let maxX = MENU_START_X;
      for (const [button, ] of this.menus.values()) {
         const [x, , width, ] = button.getDimensions();
         const rX = x + width;

         maxX = Math.max(maxX, rX);
      }

      const button = new NewButton(this.ctx, {
         id: id,
         x: maxX,
         y: 0,
         height: TOP_BAR_SIZE - 0.5,
         parent: tmpManager,
         text: text,
         textColor: "black",
         buttonColor: "#B0B0B0",
         selectedButtonColor: "#D0D0D0"
      });
      const [, , width, ] = button.getDimensions();
      button.setDimensions(this.ctx, undefined, undefined, undefined, width + MENU_PADDING_X);

      const menu = new Menu();
      this.menus.set(id, [button, menu]);
      // button.addEvent((() => {
      //    let widthOffset = MENU_START_X;
      //    for (const menu2 of this.menus.values()) {
      //       if (menu2[0].id == id)
      //          break;
      //       widthOffset += menu2[0].getMinSize(this.ctx)[0] + MENU_PADDING_X*2;
      //    }
      //    this.openMenu = [menu, widthOffset, TOP_BAR_SIZE, button.getMinSize(this.ctx)[0]];
      // }).bind(this));

      button.addEvent((() => {
         const [x, y, width, height] = button.getDimensions();
         this.openMenu = [menu, x, y+height+0.5, width];
      }).bind(this));
      return id;
   }


}