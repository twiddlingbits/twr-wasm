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
   | [ MenuItemEvents.CLICKED, number, number ]
   | [ MenuItemEvents.MOUSE_MOVE, number, number ];

interface MenuItem {
   id: number;
   getMinSize: (ctx: CanvasRenderingContext2D) => [number, number];
   render: (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => void;
   getRequiredMenuEvents: () => MenuItemEvents[];
   handleMenuEvent: (event: MenuItemEventData) => void;
}

interface WidgetManager {
   childUpdated: (ctx: CanvasRenderingContext2D, widget?: Widget, sendToRoot?: boolean) => void;
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

//implementation of Map that will automatically
// set a default value for a get on an unknown item
class DefaultMap<K, V> extends Map<K, V> {
   private readonly def: V;
   constructor(def: V) {
      super();
      this.def = def;
   }
   
   get(key: K): V {
      const val = super.get(key);
      if (val != undefined)
         return val;
      const newVal = structuredClone(this.def);
      super.set(key, newVal);
      return newVal;
   }
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
         this.parent.childUpdated(ctx);
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
   yPadding?: number;
}

class NewMenu implements Widget, WidgetManager {
   readonly parent: WidgetManager;
   readonly id: number;

   readonly handledEvents: MenuItemEvents[] = [
      MenuItemEvents.CLICKED,
      MenuItemEvents.UNHOVERED,
      MenuItemEvents.MOUSE_MOVE
   ];

   private absoluteMinWidth: number;
   private absoluteMinHeight: number;
   
   private x: number;
   private y: number;
   private width?: number;
   private height?: number;
   private yPadding: number;

   private childWidth: number;
   private childHeight: number;

   private menuColor: string;

   private children: Widget[] = [];

   private unhoverHandlers: (() => void)[] = [];


   //the currently hovered over/selected item 
   //resets to undefined on menu update or UNHOVERED event
   private selectedItem?: Widget;
   
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
      this.yPadding = props.yPadding ?? 10;

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
         childHeight += height + this.yPadding;
      }

      // console.log(childWidth, childHeight);

      childWidth = Math.max(childWidth, this.absoluteMinWidth);
      childHeight = Math.max(childHeight, this.absoluteMinHeight);

      const newWidth = this.width ?? childWidth;
      const newHeight = this.height ?? childHeight;
      this.childHeight = childHeight;
      this.childWidth = childWidth;

      console.log(newWidth, newHeight, this.childWidth, this.childHeight);

      if (this.lastWidth != newWidth || this.lastHeight != newHeight || forceRun) {
         this.lastWidth = newWidth;
         this.lastHeight = newHeight;
         
         let curHeight = 0;
         for (const widget of this.children) {
            const [, height] = widget.getMinSize(ctx);

            this.supressChildUpdates = true;
            widget.setDimensions(ctx, 0, curHeight, newWidth, height);
            this.supressChildUpdates = false;
            curHeight += height + this.yPadding;
         }

      }
   }

   childUpdated(ctx: CanvasRenderingContext2D, widget?: Widget, sendToRoot: boolean = false) {
      if (sendToRoot) {
         this.parent.childUpdated(ctx, widget, true);
      } else if (!this.supressChildUpdates) {
         this.updateChildSize(ctx);
         this.selectedItem = undefined;
         this.parent.childUpdated(ctx, undefined, false);
      }
   }
   addChild<
      T extends Widget, 
      U, 
      O extends new (ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: U) => T
   >(ctx: CanvasRenderingContext2D, id: number, cons: O, props: U): T {
      const widget: T = new cons(ctx, this, id, props);

      this.children.push(widget);
      this.updateChildSize(ctx, true);

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
   
   private dispatchEvent(widget: Widget, event: MenuItemEventData) {
      if (event[0] in widget.handledEvents) {
         widget.handleMenuEvent(event);
      }
   }

   private mouseInWidgetBounds(widget: Widget, x: number, y: number) {
      const [wX, wY, wW, wH] = widget.getDimensions();
      return wX <= x && x <= wX + wW
            && wY <= y && y <= wY + wH;
   }

   //updates the currently selected object using the given coords
   //also handles HOVERING and UNHOVERED events
   private updateSelectedObject(x: number, y: number) {
      //check if hovering over selected item
      if (this.selectedItem) {
         if (this.mouseInWidgetBounds(this.selectedItem, x, y)) {
            return; //the selected item is in bounds
         } else {
            //selected item is out of bounds
            this.dispatchEvent(this.selectedItem, [MenuItemEvents.UNHOVERED]);
         }
      }
      //otherwise, find what object (if any) are hovered over
      for (const child of this.children) {
         //found child it's hovering over
         if (this.mouseInWidgetBounds(child, x, y)) {
            this.selectedItem = child;
            this.dispatchEvent(child, [MenuItemEvents.HOVERING]);
            //break early
            return;
         }
      }
   }
   handleMenuEvent(event: MenuItemEventData): void {
      console.log(event, this.selectedItem);
		switch (event[0]) {
         case MenuItemEvents.MOUSE_MOVE:
         {
            const [, eX, eY] = event;
            const [x, y] = [eX - this.x, eY - this.y];
            this.updateSelectedObject(x, y);
            if (this.selectedItem)
               this.dispatchEvent(this.selectedItem, [MenuItemEvents.MOUSE_MOVE, x, y]);
         }
         break;
         case MenuItemEvents.CLICKED:
         {
            const [, eX, eY] = event;
            const [x, y] = [eX - this.x, eY - this.y];
            this.updateSelectedObject(x, y);
            if (this.selectedItem)
               this.dispatchEvent(this.selectedItem, [MenuItemEvents.CLICKED, x, y]);
         }
         break;
         case MenuItemEvents.UNHOVERED:
         {
            if (this.selectedItem) {
               this.dispatchEvent(this.selectedItem, [MenuItemEvents.UNHOVERED]);
               this.selectedItem = undefined;
            }
            for (const handler of this.unhoverHandlers) {
               handler();
            }
         }
         break;

      }
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
      this.x = x ?? this.x;
      this.y = y ?? this.y;
      if (width != undefined){
         if (width == 0)
            this.width = undefined;
         else
            this.width = width;
      }
      if (height != undefined){
         if (height == 0)
            this.height = undefined;
         else
            this.height = height;
      }
	}


   bindUnhoverEvent(callback: () => void) {
      this.unhoverHandlers.push(callback);
   }
   unbindUnhoverEvent(callback: () => void) {
      const index = this.unhoverHandlers.indexOf(callback);
      if (index >= 0)
         this.unhoverHandlers.splice(index);
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
   childUpdated(ctx: CanvasRenderingContext2D) {

   }
}
const tmpManager = new TmpManager();

class RootWidgetManager implements WidgetManager {
   private boundWidgets: Widget[] = [];
   private popupWidgets: Set<Widget> = new Set();

   private selectedWidget?: Widget;

   constructor() {

   }

   addChild<
      T extends Widget, 
      U, 
      O extends new (ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: U) => T
   >(ctx: CanvasRenderingContext2D, id: number, cons: O, props: U): T {
      const widget: T = new cons(ctx, this, id, props);
      
      this.boundWidgets.push(widget);

      return widget;
   }
   childUpdated(ctx: CanvasRenderingContext2D, widget?: Widget) {
      this.selectedWidget = undefined;
   }

   openPopup(ctx: CanvasRenderingContext2D, widget: Widget) {
      this.popupWidgets.add(widget);
      this.childUpdated(ctx, widget);
   }
   closePopup(ctx: CanvasRenderingContext2D, widget: Widget) {
      this.popupWidgets.delete(widget);
      this.childUpdated(ctx);
   }

   handleCanvasKeyEvent(ctx: CanvasRenderingContext2D, event: CanvasEventTypes, key: number): boolean {
      return false;
   }

   private widgetInBounds(widget: Widget, x: number, y: number): boolean {
      const [wX, wY, wW, wH] = widget.getDimensions();
      return wX <= x && x <= wX + wW
         && wY <= y && y <= wY + wH;
   }
   private dispatchEvent(widget: Widget, event: MenuItemEventData) {
      if (event[0] in widget.handledEvents) {
         widget.handleMenuEvent(event);
      }
   }
   private updateSelected(x: number, y: number) {
      if (this.selectedWidget) {
         if (this.widgetInBounds(this.selectedWidget, x, y)) {
            return;
         } else {
            this.dispatchEvent(this.selectedWidget, [MenuItemEvents.UNHOVERED]);
            this.selectedWidget = undefined;
         }
      }

      for (const widget of this.boundWidgets) {
         if (this.widgetInBounds(widget, x, y)) {
            this.selectedWidget = widget;
            this.dispatchEvent(widget, [MenuItemEvents.HOVERING]);
            return;
         }
      }
   }

   handleCanvasMouseEvent(ctx: CanvasRenderingContext2D, event: CanvasEventTypes, x: number, y: number): boolean {
      this.updateSelected(x, y);
      if (!this.selectedWidget) return false;

      switch (event) {
         case CanvasEventTypes.MOUSE_MOVE:
            this.dispatchEvent(this.selectedWidget, [MenuItemEvents.MOUSE_MOVE, x, y]);
         break;

         case CanvasEventTypes.MOUSE_CLICK:
            this.dispatchEvent(this.selectedWidget, [MenuItemEvents.CLICKED, x, y]);
         break;
      }

      return true;
   }
   
   handleCanvasWheelEvent(ctx: CanvasRenderingContext2D, event: CanvasEventTypes, deltaX: number, deltaY: number, deltaZ: number, deltaMode: number) {
      return false;
   }

   handleCanvasAnimationFrameEvent(ctx: CanvasRenderingContext2D, event: CanvasEventTypes, delta: number) {
      for (const widget of this.boundWidgets)
         widget.render(ctx)
   }
}
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

   readonly manager: RootWidgetManager = new RootWidgetManager();

   

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

      const buttonOpts: ButtonWidgetConstructor = {
         x: 100,
         y: 100,
         text: "TEST!!!",
         textFont: "64px Serif",
         width: 300,
         height: 300,
         buttonColor: "#B0B0B0B0"
      };
      this.manager.addChild(this.ctx, -10, NewButton, buttonOpts);
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
   mouseWasOnMenu: boolean = false;
   handleCanvasMouseEvent(event: CanvasEventTypes, x: number, y: number) {
      const n_x = x - BORDER_SIZE;
      const n_y = y - TOP_BAR_SIZE;
      let topBar = false;
      let [menX, menY, menWidth, menHeight] = this.openMenu?.getDimensions() ?? [0, 0, 0, 0];
      let mouseOnMenu = false;

      if (this.manager.handleCanvasMouseEvent(this.ctx, event, x, y)) {

      } else if (
         this.openMenu
         && x >= menX && x <= menX+menWidth
         && y >= menY && y <= menY+menHeight
      ) {
         // console.log(event);
         if (event == CanvasEventTypes.MOUSE_MOVE) {
            this.openMenu.handleMenuEvent([MenuItemEvents.MOUSE_MOVE, x, y]);
         } else if (event == CanvasEventTypes.MOUSE_CLICK) {
            this.openMenu.handleMenuEvent([MenuItemEvents.CLICKED, x, y]);
         }
         this.mouseWasOnMenu = true;
         mouseOnMenu = true;
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
                     button.handleMenuEvent([MenuItemEvents.CLICKED, n_x, n_y])
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
      if (!mouseOnMenu && this.mouseWasOnMenu) {
         this.mouseWasOnMenu = false;
         this.openMenu?.handleMenuEvent([MenuItemEvents.UNHOVERED]);
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

      this.manager.handleCanvasAnimationFrameEvent(this.ctx, event, delta);
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

      const buttonOptions: ButtonWidgetConstructor = {
         x: 0,
         y: 0,
         text: "Hello!!!",
         textColor: "black",
         buttonColor: "#B0B0B0",
         selectedButtonColor: "#D0D0D0"
      };
      const secondButton: NewButton = menu.addChild(this.ctx, ++this.nextMenuItem, NewButton, buttonOptions);
      secondButton.addEvent(() => {
         console.log("pressed!!!");
      });

      button.addEvent((() => {
         this.openMenu = menu;
      }).bind(this));
      return id;
   }


}