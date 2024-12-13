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
   //really, really long type. Basically accepts any class constructor that created a Widget
   // and accepts a CanvasRenderingContext2D, an id, a parent WidgetManager, and a set of properties of any type
   // the idea is that you give the manager a widget and it constructs it internally.
   addChild: <T extends Widget, U, O extends new (ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: U) => T>(ctx: CanvasRenderingContext2D, id: number, cons: O, props: U) => T;
}
interface Widget {
   readonly parent: WidgetManager; 
   readonly id: number;
   readonly handledEvents: MenuItemEvents[];
   getMinSize: (ctx: CanvasRenderingContext2D) => [number, number];
   render: (ctx: CanvasRenderingContext2D, offsetX?: number, offsetY?: number) => void;
   handleMenuEvent: (event: MenuItemEventData) => void;
   getDimensions: () => [number, number, number, number];
   setDimensions: (ctx: CanvasRenderingContext2D, x?: number, y?: number, width?: number, height?: number) => void;
}

interface WidgetConstructor {
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
   readonly handledEvents: MenuItemEvents[] = [
      MenuItemEvents.CLICKED,
      MenuItemEvents.HOVERING,
      MenuItemEvents.UNHOVERED
   ];

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

   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, cons: ButtonWidgetConstructor) {
      this.parent = parent;
      this.id = id;
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
   setDimensions(ctx: CanvasRenderingContext2D, x?: number, y?: number, width?: number, height?: number) {
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

interface MenuWidgetConstructor extends WidgetConstructor {
   minimumWidth?: number;
   minimumHeight?: number;
   menuColor?: string;
}

class NewMenu implements Widget, WidgetEvents, WidgetManager {
   readonly parent: WidgetManager;
   readonly id: number;

   readonly handledEvents: MenuItemEvents[] = Object.values(MenuItemEvents)
      .filter(item => typeof item == "number");

   private absoluteMinWidth: number;
   private absoluteMinHeight: number;
   
   private x: number;
   private y: number;
   private width?: number;
   private height?: number;

   private childWidth: number;
   private childHeight: number;

   private menuColor: string;

   private children: Widget[] = [];
   private childEvents: Map<MenuItemEvents, Widget[]> = new Map();
   
   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: MenuWidgetConstructor) {
      this.parent = parent;
      this.id = id;
      
      this.x = props.x;
      this.y = props.y;

      this.absoluteMinWidth = props.minimumWidth ?? 5;
      this.absoluteMinHeight = props.minimumHeight ?? 5;
      this.childWidth = this.absoluteMinWidth;
      this.childHeight = this.absoluteMinHeight;

      this.width = props.width;
      this.height = props.height;

      this.menuColor = props.menuColor ?? "gray";
   }

   lastWidth: number = 0;
   lastHeight: number = 0;
   supressChildUpdates: boolean = false;
   updateChildSize(ctx: CanvasRenderingContext2D, forceRun: boolean = false) {
      let childWidth = 0;
      let childHeight = 0;
      for (const widget of this.children) {
         const [width, height] = widget.getMinSize(ctx);
         childWidth = Math.max(childWidth, width);
         childHeight += height;
      }

      const newWidth = this.width ?? Math.min(childWidth, this.absoluteMinWidth);
      const newHeight = this.height ?? Math.min(childHeight, this.absoluteMinHeight);
      this.childHeight = childHeight;
      this.childWidth = childWidth;

      if (this.lastWidth != newWidth || this.lastHeight != newHeight || forceRun) {
         this.lastWidth = newWidth;
         this.lastHeight = newHeight;
         
         let curHeight = 0;
         for (const widget of this.children) {
            const [, height] = widget.getMinSize(ctx);

            this.supressChildUpdates = true;
            widget.setDimensions(ctx, 0, curHeight, newWidth, height);
            this.supressChildUpdates = false;
         }

      }
   }

   childUpdated(widget: Widget, ctx: CanvasRenderingContext2D) {
      if (!this.supressChildUpdates)
         this.updateChildSize(ctx);
   }
   addChild<
      T extends Widget, 
      U, 
      O extends new (ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: U) => T
   >(ctx: CanvasRenderingContext2D, id: number, cons: O, props: U): T {
      const widget: T = new cons(ctx, this, id, props);

      this.children.push(widget);
      this.updateChildSize(ctx, true);
      for (const event of widget.handledEvents) {
         const handlers = this.childEvents.get(event) ?? (() => {
            const tmp: Widget[] = [];
            this.childEvents.set(event, tmp);
            return tmp;
         })();

         handlers.push(widget);
      }

      return widget;
   }

   getMinSize(ctx: CanvasRenderingContext2D): [number, number] {
      return [
         this.childWidth, 
         this.childHeight
      ];
   }

   render(ctx: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0): void {
		ctx.save();

      ctx.fillStyle = this.menuColor;
      ctx.fillRect(
         this.x + offsetX,
         this.y + offsetY,
         this.width ?? this.childWidth,
         this.height ?? this.childHeight,
      );

      for (const widget of this.children) {
         widget.render(ctx, this.x + offsetX, this.y + offsetY);
      }

      ctx.restore();
	}
   
   handleMenuEvent(event: MenuItemEventData): void {
		
	}

   getDimensions(): [number, number, number, number] {
      return [
         this.x,
         this.y,
         this.width ?? this.childWidth,
         this.height ?? this.childHeight
      ];
	}

   setDimensions(ctx: CanvasRenderingContext2D, x?: number, y?: number, width?: number, height?: number): void {
      
	}

   addEvent(callback: () => void) {
      
   }

   removeEvent(callback: () => void) {

   }

}

class TmpManager implements WidgetManager {
   addChild<
      T extends Widget, 
      U, 
      O extends new (ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: U) => T
   >(ctx: CanvasRenderingContext2D, id: number, cons: O, props: U): T {
      return new cons(ctx, this as WidgetManager, id, props);
   }
   childUpdated(widget: Widget, ctx: CanvasRenderingContext2D) {

   }
}
const tmpManager = new TmpManager();

interface WidgetEvents {
   addEvent: (callback: () => void) => void;
   removeEvent: (callback: () => void) => void;
}

const MENU_PADDING_X = 5;
const MENU_PADDING_Y = 4;
const TOP_BAR_SIZE: number = 30;
const BORDER_SIZE: number = 5;
const MENU_START_X = BORDER_SIZE;

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

   menus: Map<number, [NewButton, NewMenu]> = new Map();
   nextMenuID: number = 0;

   openMenu: NewMenu|undefined = undefined;

   

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
      let [menX, menY, menWidth, menHeight] = this.openMenu?.getDimensions() ?? [0, 0, 0, 0];

      if (
         this.openMenu
         && x >= menX && x <= menX+menWidth
         && y >= menY && y <= menY+menHeight
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

      for (const [button, ] of this.menus.values()) {
         button.render(this.ctx, 0, 0);
      }

      this.openMenu?.render(this.ctx);

   }

   twrGetAppCanvasJSID(mod:IWasmModule|IWasmModuleAsync) {
      return this.appCanvas.id;
   }

   twrWindowAddMenu(mod: IWasmModuleAsync | IWasmModule, textPtr: number) {
      const text = mod.getString(textPtr);

      const id = ++this.nextMenuID;

      let maxX = MENU_START_X;
      for (const [button, ] of this.menus.values()) {
         const [x, , width, ] = button.getDimensions();
         const rX = x + width;

         maxX = Math.max(maxX, rX);
      }

      const button: NewButton = tmpManager.addChild(this.ctx, id, NewButton, {
         x: maxX,
         y: 0,
         height: TOP_BAR_SIZE - 0.5,
         text: text,
         textColor: "black",
         buttonColor: "#B0B0B0",
         selectedButtonColor: "#D0D0D0"
      });

      const [, , width, ] = button.getDimensions();
      button.setDimensions(this.ctx, undefined, undefined, width + MENU_PADDING_X, undefined);

      const menuID = ++this.nextMenuID;
      const menuOptions: MenuWidgetConstructor = {
         x: maxX,
         y: TOP_BAR_SIZE,
         menuColor: "#B0B0B0",
         minimumWidth: width + MENU_PADDING_X,
         minimumHeight: TOP_BAR_SIZE/2.0,
      };
      const menu: NewMenu = tmpManager.addChild(this.ctx, menuID, NewMenu, menuOptions);
      this.menus.set(id, [button, menu]);

      button.addEvent((() => {
         this.openMenu = menu;
      }).bind(this));
      return id;
   }


}