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
   CLICKED_OFF,
}
type MenuItemEventData = [ MenuItemEvents.HOVERING ]
   | [ MenuItemEvents.UNHOVERED ]
   | [ MenuItemEvents.CLICKED, number, number ]
   | [ MenuItemEvents.MOUSE_MOVE, number, number ]
   | [ MenuItemEvents.CLICKED_OFF];

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
   // addChild: <T extends Widget, U, O extends new (ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: U) => T>(ctx: CanvasRenderingContext2D, id: number, cons: O, props: U) => T;

   openPopup: (ctx: CanvasRenderingContext2D, widget: Widget) => void;
   closePopup: (ctx: CanvasRenderingContext2D, widget: Widget) => void;
   handleDelete: (ctx: CanvasRenderingContext2D, widget: Widget) => void;
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
   delete: (ctx: CanvasRenderingContext2D) => Widget[];
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

class Button implements Widget, WidgetEvents {
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
   delete(ctx: CanvasRenderingContext2D) {
      this.parent.handleDelete(ctx, this);
      return [this];
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
   setButtonText(ctx: CanvasRenderingContext2D, newText: string) {
      this.text = newText;
      this.textOffsets = this.getTextOffsets(ctx);
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
   minChildHeight?: number;
}

class Menu implements Widget, WidgetManager {
   readonly parent: WidgetManager;
   readonly id: number;

   readonly handledEvents: MenuItemEvents[] = [
      MenuItemEvents.CLICKED,
      MenuItemEvents.UNHOVERED,
      MenuItemEvents.MOUSE_MOVE,
      MenuItemEvents.CLICKED_OFF
   ];

   private absoluteMinWidth: number;
   private absoluteMinHeight: number;
   private minChildHeight: number;
   
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
   private clickedOffHandlers: (() => void)[] = [];


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
      this.minChildHeight = props.minChildHeight ?? 5;

      this.width = props.width;
      this.height = props.height;
      this.yPadding = props.yPadding ?? 10;

      this.menuColor = props.menuColor ?? "gray";
   }
   pauseDeleteHandle: boolean = false;
   handleDelete(ctx: CanvasRenderingContext2D, widget: Widget) {
      if (this.pauseDeleteHandle)
         return;

      let i = this.children.indexOf(widget);
      if (i >= 0) {
         this.children.splice(i, 1);
         this.childUpdated(ctx);
      }
   }
   delete(ctx: CanvasRenderingContext2D) {
      this.parent.handleDelete(ctx, this);
      
      this.pauseDeleteHandle = true;
      let deleted: Widget[] = [];
      for (const widget of this.children) {
         deleted = deleted.concat(widget.delete(ctx));
      }
      //push self to list
      deleted.push(this);
      this.children = [];
      this.updateChildSize(ctx);
      this.pauseDeleteHandle = false;
      return deleted;

   }
   openPopup(ctx: CanvasRenderingContext2D, widget: Widget) {
      this.parent.openPopup(ctx, widget);
   }
   closePopup(ctx: CanvasRenderingContext2D, widget: Widget) {
      this.parent.closePopup(ctx, widget);
   }

   lastWidth: number = 0;
   lastHeight: number = 0;
   supressChildUpdates: boolean = false;
   updateChildSize(ctx: CanvasRenderingContext2D, forceRun: boolean = false) {
      let childWidth = 0;
      // let maxChildHeight = this.minChildHeight;
      let childHeight = 0;
      for (const widget of this.children) {
         const [width, ] = widget.getMinSize(ctx);
         childWidth = Math.max(childWidth, width);
         // maxChildHeight = Math.max(maxChildHeight, height+this.yPadding);
         const [, , , height] = widget.getDimensions();
         childHeight += height + this.yPadding;
      }

      // console.log(childWidth, childHeight);

      childWidth = Math.max(childWidth, this.absoluteMinWidth);
      // let childHeight = Math.max(maxChildHeight*this.children.length, this.absoluteMinHeight);
      childHeight = Math.max(childHeight, this.absoluteMinHeight);

      const newWidth = this.width ?? childWidth;
      const newHeight = this.height ?? childHeight;
      this.childHeight = childHeight;
      this.childWidth = childWidth;

      // console.log(newWidth, newHeight, this.childWidth, this.childHeight);

      if (this.lastWidth != newWidth || this.lastHeight != newHeight || forceRun) {
         this.lastWidth = newWidth;
         this.lastHeight = newHeight;
         
         let curHeight = 0;
         for (const widget of this.children) {
            const [, , , height] = widget.getDimensions();
            this.supressChildUpdates = true;
            widget.setDimensions(ctx, 0, curHeight, newWidth, undefined);
            this.supressChildUpdates = false;
            // curHeight += maxChildHeight;
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
      if (widget.handledEvents.includes(event[0])) {
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
            this.selectedItem = undefined;
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
         case MenuItemEvents.CLICKED_OFF:
         {
            for (const handler of this.clickedOffHandlers) {
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
         this.unhoverHandlers.splice(index, 1);
   }

   bindClickedOffEvent(callback: () => void) {
      this.clickedOffHandlers.push(callback);
   }
   unbindClickedOffEvent(callback: () => void) {
      const index = this.clickedOffHandlers.indexOf(callback);
      if (index >= 0) {
         this.clickedOffHandlers.splice(index, 1);
      }
   }

}

interface RadioMenuWidgetConstructor extends MenuWidgetConstructor {
   optionHeight?: number;
   selectedSymbol?: string;
   optionTextFont?: string;
   optionTextColor?: string;
   hoveredBackgroundColor?: string;
}

class RadioMenu implements Widget, WidgetManager {
   readonly parent: WidgetManager;
   readonly id: number;
   readonly handledEvents: MenuItemEvents[];

   private menu: Menu;
   private optionHeight: number;
   private selectedSymbol: string;
   private optionTextFont: string;
   private optionTextColor: string;
   private backgroundColor: string;
   private hoveredBackgroundColor: string;
   
   private options: Map<string, Button> = new Map();
   private selected?: string;

   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: RadioMenuWidgetConstructor) {
      this.backgroundColor = props.menuColor ?? "gray";
      props.menuColor = this.backgroundColor;

      this.menu = new Menu(ctx, this, 0, props);
      this.parent = parent;
      this.id = id;

      this.optionHeight = props.optionHeight ?? 20;
      this.selectedSymbol = props.selectedSymbol ?? "*";
      this.optionTextFont = props.optionTextFont ?? "16px Seriph";
      this.optionTextColor = props.optionTextColor ?? "black";
      this.hoveredBackgroundColor = props.hoveredBackgroundColor ?? "lightgray";
      this.handledEvents = this.menu.handledEvents;
   }

   addOption(ctx: CanvasRenderingContext2D, opt: string) {
      if (this.options.has(opt))
         throw new Error(`RadioMenu: addOption already has the ${opt} option!`);

      let prefix = " ".repeat(this.selectedSymbol.length + 1);
      if (this.selected == undefined) {
         this.selected = opt;
         prefix = this.selectedSymbol + " ";
      }

      const buttonOpts: ButtonWidgetConstructor = {
         x: 0,
         y: 0,
         width: -1,
         height: this.optionHeight,
         text: " ".repeat(this.selectedSymbol.length + 1) + opt,
         textColor: this.optionTextColor,
         textFont: this.optionTextFont,
         buttonColor: this.backgroundColor,
         selectedButtonColor: this.hoveredBackgroundColor,
      };
      const button: Button = this.menu.addChild(ctx, 0, Button, buttonOpts);

      this.options.set(opt, button);

      
   }

   getMinSize(ctx: CanvasRenderingContext2D): [number, number] {
      return this.menu.getMinSize(ctx);
   }
   render(ctx: CanvasRenderingContext2D, offsetX?: number, offsetY?: number) {
      this.menu.render(ctx, offsetX, offsetY);
   }
   handleMenuEvent(event: MenuItemEventData) {
      this.menu.handleMenuEvent(event);
   }
   getDimensions(): [number, number, number, number] {
      return this.menu.getDimensions();
   }
   setDimensions(ctx: CanvasRenderingContext2D, x?: number, y?: number, width?: number, height?: number) {
      return this.menu.setDimensions(ctx, x, y, width, height);
   }

   childUpdated(ctx: CanvasRenderingContext2D, widget?: Widget, sendToRoot?: boolean) {
      this.parent.childUpdated(ctx, widget, sendToRoot);
   }

   openPopup(ctx: CanvasRenderingContext2D, widget: Widget) {
      this.parent.openPopup(ctx, widget);
   }
   closePopup(ctx: CanvasRenderingContext2D, widget: Widget) {
      this.parent.closePopup(ctx, widget);
   }

   private supressDeleteHandle: boolean = false;
   delete(ctx: CanvasRenderingContext2D) {
      this.supressDeleteHandle = true;
      this.parent.handleDelete(ctx, this);
      this.menu.delete(ctx);
      this.supressDeleteHandle = false;
      return [this];
   }
   handleDelete(ctx: CanvasRenderingContext2D, widget: Widget) {
      if (this.supressDeleteHandle) return;
      throw new Error("RadialMenu shouldn't be handling an delete events!!!");
   }

}

class RootWidgetManager implements WidgetManager {
   private boundWidgets: Widget[] = [];
   private popupWidgets: Set<Widget> = new Set();

   private selectedWidget?: Widget;

   constructor() {

   }
   handleDelete(ctx: CanvasRenderingContext2D, widget: Widget) {
      const i = this.boundWidgets.indexOf(widget);
      if (i < 0)
         return;
      this.boundWidgets.splice(i, 1);
      this.childUpdated(ctx);
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
      if (widget.handledEvents.includes(event[0])) {
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

      //most recently added is on top in order of popups -> bound

      const widgetList = Array.from(this.popupWidgets.keys());
      for (let i = widgetList.length-1; i >= 0; i--) {
         const widget = widgetList[i];
         if (this.widgetInBounds(widget, x, y)) {
            this.selectedWidget = widget;
            this.dispatchEvent(widget, [MenuItemEvents.HOVERING]);
            return;
         }
      }

      for (let i = this.boundWidgets.length-1; i >= 0; i--) {
         const widget = this.boundWidgets[i];
         if (this.widgetInBounds(widget, x, y)) {
            this.selectedWidget = widget;
            this.dispatchEvent(widget, [MenuItemEvents.HOVERING]);
            return;
         }
      }
   }

   handleCanvasMouseEvent(ctx: CanvasRenderingContext2D, event: CanvasEventTypes, x: number, y: number): boolean {
      this.updateSelected(x, y);
      if (!this.selectedWidget) {
         if (event == CanvasEventTypes.MOUSE_CLICK) {
            for (const popup of this.popupWidgets) {
               this.dispatchEvent(popup, [MenuItemEvents.CLICKED_OFF]);
            }
         }
         return false;
      }

      switch (event) {
         case CanvasEventTypes.MOUSE_MOVE:
            this.dispatchEvent(this.selectedWidget, [MenuItemEvents.MOUSE_MOVE, x, y]);
         break;

         case CanvasEventTypes.MOUSE_CLICK:
            const selected = this.selectedWidget;
            for (const popup of this.popupWidgets) {
               if (selected != popup)
                  this.dispatchEvent(popup, [MenuItemEvents.CLICKED_OFF]);
            }
            this.dispatchEvent(selected, [MenuItemEvents.CLICKED, x, y]);
            
         break;
      }

      return true;
   }
   
   handleCanvasWheelEvent(ctx: CanvasRenderingContext2D, event: CanvasEventTypes, deltaX: number, deltaY: number, deltaZ: number, deltaMode: number) {
      return false;
   }

   handleCanvasAnimationFrameEvent(ctx: CanvasRenderingContext2D, event: CanvasEventTypes, delta: number) {
      //render in reverse order of the way events are handled
      //that way top most items are drawn last so they appear on top
      for (const widget of this.popupWidgets)
         widget.render(ctx);
      for (const widget of this.boundWidgets)
         widget.render(ctx);
   }
}

interface MenuButtonwidgetConstructor extends ButtonWidgetConstructor {
   menuOptions: MenuWidgetConstructor
}
class MenuButton implements Widget, WidgetManager {
   readonly parent: WidgetManager;
   readonly id: number;
   readonly handledEvents: MenuItemEvents[];

   readonly button: Button;
   readonly menu: Menu;
   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: MenuButtonwidgetConstructor) {
      this.parent = parent;
      this.id = id;

      this.button = new Button(ctx, this, 0, props);

      const menuOptions = structuredClone(props.menuOptions);
      const [, , width, _] = this.button.getDimensions();

      menuOptions.minimumWidth = menuOptions.minimumWidth ?? width; 
      this.menu = new Menu(ctx, this, 1, menuOptions);

      this.button.addEvent((() => {
         this.parent.openPopup(ctx, this.menu);
      }).bind(this));
      this.menu.bindClickedOffEvent((() => {
         this.parent.closePopup(ctx, this.menu);
      }).bind(this));

      this.handledEvents = this.button.handledEvents;
   }
   private supressHandleDelete: boolean = false;
   handleDelete(ctx: CanvasRenderingContext2D, widget: Widget) {
      if (this.supressHandleDelete)
         return;
      if (widget == this.button)
         throw new Error("MenuButton's internal button shouldn't be externally accesible");
      else if (widget == this.menu)
         throw new Error("MenuButton's internal menu shouldn't be externally accesible");
      else
         throw new Error("MenuButton shouldn't be handling any deletions?");
   }
   delete(ctx: CanvasRenderingContext2D) {
      this.supressHandleDelete = true;
      this.parent.handleDelete(ctx, this);
      let deleted: Widget[] = this.menu.delete(ctx);
      this.button.delete(ctx);
      //delete menu from list since it's not exposed externally
      deleted.splice(deleted.indexOf(this.menu), 1);
      deleted.push(this); //push self
      this.supressHandleDelete = false;
      return deleted;
   }

   getMinSize(ctx: CanvasRenderingContext2D): [number, number] {
      return this.button.getMinSize(ctx);
   }
   render(ctx: CanvasRenderingContext2D, offsetX?: number, offsetY?: number) {
      this.button.render(ctx, offsetX, offsetY);
   }
   handleMenuEvent(event: MenuItemEventData) {
      this.button.handleMenuEvent(event);
   }
   getDimensions(): [number, number, number, number] {
      return this.button.getDimensions();
   }
   setDimensions(ctx: CanvasRenderingContext2D, x?: number, y?: number, width?: number, height?: number) {
      this.button.setDimensions(ctx, x, y, width, height);
   }

   childUpdated(ctx: CanvasRenderingContext2D, widget?: Widget, sendToRoot?: boolean) {
      this.parent.childUpdated(ctx, widget, sendToRoot);   
   }
   addChild<
      T extends Widget, 
      U, 
      O extends new (ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: U) => T
   >(ctx: CanvasRenderingContext2D, id: number, cons: O, props: U): T {
      return this.menu.addChild(ctx, id, cons, props);
   }
   openPopup(ctx: CanvasRenderingContext2D, widget: Widget) {
      this.parent.openPopup(ctx, widget);
   }
   closePopup(ctx: CanvasRenderingContext2D, widget: Widget) {
      this.parent.closePopup(ctx, widget);
   }
}

interface SeperatorWidgetConstructor extends WidgetConstructor {
   seperatorText: string,
   seperatorFont?: string,
   seperatorColor?: string
}
class Seperator implements Widget {
   readonly parent: WidgetManager;
   readonly id: number;
   readonly handledEvents: MenuItemEvents[] = [];

   private seperatorText: string;
   private seperatorFont: string;
   private seperatorColor: string;

   private x: number;
   private y: number;
   private width: number;
   private height: number;
   private minHeight: number = 0;

   private text: string = "";
   private textXOffset: number = 0;
   private textYOffset: number = 0;
   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: SeperatorWidgetConstructor) {
      this.parent = parent;
      this.id = id;
      
      this.seperatorText = props.seperatorText;
      this.seperatorColor = props.seperatorColor ?? "black";
      this.seperatorFont = props.seperatorFont ?? "16px Seriph";

      this.x = props.x;
      this.y = props.y;
      this.width = props.width ?? 0;
      this.height = props.height ?? 0;
      
      this.updateText(ctx);
   }
   delete(ctx: CanvasRenderingContext2D) {
      this.parent.handleDelete(ctx, this);
      return [this];
   }
   private updateText(ctx: CanvasRenderingContext2D) {
      ctx.save();
      // console.log(this.width);

      ctx.font = this.seperatorFont;
      const metrics = ctx.measureText(this.seperatorText);

      const repeats = Math.floor(this.width/metrics.width);
      const width = repeats*metrics.width;
      const height = metrics.actualBoundingBoxAscent;

      this.text = this.seperatorText.repeat(repeats);

      this.textXOffset = (this.width - width)/2.0;
      // console.log(width, this.width, this.textXOffset);
      this.textYOffset = (this.height + height)/2.0;
      this.minHeight = height;

      ctx.restore();
   }

   getMinSize(ctx: CanvasRenderingContext2D): [number, number] {
      return [0, this.minHeight];
   }
   render(ctx: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0) {
      ctx.save();

      ctx.font = this.seperatorFont;
      ctx.fillStyle = this.seperatorColor;

      // console.log(this.x, offsetX, this.textXOffset, this.x + offsetX + this.textXOffset);
      ctx.fillText(
         this.text,
         this.x + offsetX + this.textXOffset,
         this.y + offsetY + this.textYOffset
      );

      ctx.restore();
   }
   handleMenuEvent(event: MenuItemEventData) {
      throw new Error(`Seperator widget doesn't accept events!!`);
   }
   getDimensions(): [number, number, number, number] {
      return [this.x, this.y, this.width, this.height];
   }
   setDimensions(ctx: CanvasRenderingContext2D, x?: number, y?: number, width?: number, height?: number) {
      this.x = x ?? this.x;
      this.y = y ?? this.y;
      this.width = width ?? this.width;
      this.height = height ?? this.height;
      if (width != undefined || height != undefined) {
         this.updateText(ctx);
      }
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

enum WidgetType {
   Button,
   Seperator
}

export class twrConsoleWindow extends twrLibrary implements ICanvasEvents, IConsoleWindow {
   id: number;
   props: IConsoleBaseProps;

   element: HTMLCanvasElement;
   ctx: CanvasRenderingContext2D;
   
   appCanvasWidth: number;
   appCanvasHeight: number;
   readonly appCanvas: twrConsoleCanvas;

   menuItems: Map<
      number, 
      [WidgetType.Button, Button]
      | [WidgetType.Seperator, Seperator]
   > = new Map();
   
   nextMenuItem: number = 0;

   menus: Map<number, MenuButton> = new Map();
   nextMenuID: number = 0;

   readonly manager: RootWidgetManager = new RootWidgetManager();

   

   imports: TLibImports = {
      twrGetAppCanvasJSID: {},
      twrWindowAddMenu: {},
      twrWindowMenuAddWidget: {},
      twrWindowMenuButtonAddCallback: {},
      twrWindowMenuDeleteWidget: {},
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
      this.manager.addChild(this.ctx, -10, Button, buttonOpts);
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
      const n_y = y - TOP_BAR_SIZE;10

      if (this.manager.handleCanvasMouseEvent(this.ctx, event, x, y)) {

      } else if (
         n_x >= 0 && n_y >= 0
         && n_x <= this.appCanvasWidth
         && n_y <= this.appCanvasHeight
      ) {
         this.appCanvas.handleCanvasMouseEvent(event, n_x, n_y);
      }10

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


      this.manager.handleCanvasAnimationFrameEvent(this.ctx, event, delta);
   }

   twrGetAppCanvasJSID(mod:IWasmModule|IWasmModuleAsync) {
      return this.appCanvas.id;
   }

   twrWindowAddMenu(mod: IWasmModuleAsync | IWasmModule, textPtr: number) {
      const text = mod.getString(textPtr);

      const id = ++this.nextMenuID;

      let maxX = MENU_START_X;
      for (const button of this.menus.values()) {
         const [x, , width, ] = button.getDimensions();
         const rX = x + width;

         maxX = Math.max(maxX, rX);
      }


      const menuOptions: MenuWidgetConstructor = {
         x: maxX,
         y: TOP_BAR_SIZE,
         menuColor: "#B0B0B0",
         minimumHeight: TOP_BAR_SIZE/2.0,
         yPadding: 2,
      };

      const button: MenuButton = this.manager.addChild(this.ctx, id, MenuButton, {
         x: maxX,
         y: 0,
         height: TOP_BAR_SIZE - 0.5,
         text: text,
         textColor: "black",
         buttonColor: "#B0B0B0",
         selectedButtonColor: "#D0D0D0",
         menuOptions: menuOptions
      });

      const [, , width, ] = button.getDimensions();
      button.setDimensions(this.ctx, undefined, undefined, width + MENU_PADDING_X, undefined);

      // const seperatorOptions: SeperatorWidgetConstructor = {
      //    x: 0,
      //    y: 0,
      //    height: 10,
      //    seperatorText: "-",
      //    seperatorColor: "black",
      //    seperatorFont: "20px Seriph"
      // }

      this.menus.set(id, button);

      // const buttonOptions: ButtonWidgetConstructor = {
      //    x: 0,
      //    y: 0,
      //    height: 20,
      //    text: "Hello!!!",
      //    textColor: "black",
      //    buttonColor: "#B0B0B0",
      //    selectedButtonColor: "#D0D0D0"
      // };
      // const secondButton: Button = button.addChild(this.ctx, ++this.nextMenuItem, Button, buttonOptions);
      // secondButton.addEvent(() => {
      //    console.log("pressed!!!");
      // });
      // button.addChild(this.ctx, ++this.nextMenuItem, Seperator, seperatorOptions);

      // const thirdButton: Button = button.addChild(this.ctx, ++this.nextMenuItem, Button, buttonOptions);

      // button.addEvent((() => {
      //    // this.openMenu = menu;
      // }).bind(this));
      return id;
   }

   twrWindowMenuAddWidget(mod: IWasmModuleAsync | IWasmModule, menuID: number, consPtr: number): number {
      if (!this.menus.has(menuID)) throw new Error(`twrWindowMenuAddWidget was given an invalid menu ID (${menuID})!`);
      const menu = this.menus.get(menuID)!;

      // struct twr_widget_constructor {
      //    enum WindowWidget type;
      //    long x;
      //    long y;
      //    long width;
      //    long height;
      // };
      function getLongOrDef<T>(ptr: number, def: T): number|T {
         const val = mod.getLong(ptr);
         if (val < 0) {
            return def;
         } else {
            return val;
         }
      }
      function getStringOrDef(ptr: number, def: string): string {
         const strPtr = mod.getLong(ptr);
         if (strPtr == 0) {
            return def;
         } else {
            return mod.getString(strPtr);
         }
      }

      const type = mod.getLong(consPtr + 0) as WidgetType;

      const x = getLongOrDef(consPtr + 4, 0);
      const y = getLongOrDef(consPtr + 8, 0);
      const width = getLongOrDef(consPtr + 12, undefined);
      const height = getLongOrDef(consPtr + 16, undefined);

      const extraPtr = consPtr + 20;

      const id = ++this.nextMenuItem;
      switch (type) {
         case WidgetType.Button:
         {
            // struct twr_widget_button_constructor {
            //    /// @brief Base widget constructor
            //    struct twr_widget_constructor base;
            //    /// @brief defaults to "Lorem Ipsum"
            //    const char* text;
            //    /// @brief defaults to 16px Seriph
            //    const char* text_font;
            //    /// @brief defaults to Black
            //    const char* text_color;
            //    /// @brief defaults to #B0B0B0
            //    const char* button_color;
            //    /// @brief defaults to #D0D0D0
            //    const char* selected_button_color;
            // };
            let button: ButtonWidgetConstructor = {
               x: x,
               y: y,
               width: width,
               height: height,
               text: getStringOrDef(extraPtr + 0, "Lorem Ipsum"),
               textFont: getStringOrDef(extraPtr + 4, "16px Seriph"),
               textColor: getStringOrDef(extraPtr + 8, "black"),
               buttonColor: getStringOrDef(extraPtr + 12, "#B0B0B0"),
               selectedButtonColor: getStringOrDef(extraPtr + 16, "#D0D0D0")
            };
            const widget: Button = menu.addChild(this.ctx, id, Button, button);
            this.menuItems.set(id, [WidgetType.Button, widget]);
         }
         break;

         case WidgetType.Seperator:
         {
            // struct twr_widget_seperator_constructor {
            //    /// @brief Base widget constructor
            //    struct twr_widget_constructor base;
            //    /// @brief defaults to "-"
            //    const char* seperator_text;
            //    /// @brief defaults to 16px Seriph
            //    const char* seperator_font;
            //    /// @brief defaults to black
            //    const char* seperator_color;
            // };
            let seperator: SeperatorWidgetConstructor = {
               x: x,
               y: y,
               width: width,
               height: height,
               seperatorText: getStringOrDef(extraPtr + 0, "-"),
               seperatorFont: getStringOrDef(extraPtr + 4, "16px Seriph"),
               seperatorColor: getStringOrDef(extraPtr + 8, "black")
            };
            const widget: Seperator = menu.addChild(this.ctx, id, Seperator, seperator);
            this.menuItems.set(id, [WidgetType.Seperator, widget]);
         }
         break;

         default:
         {
            throw new Error(`twrWindowMenuAddWidget: Error! Was given an unknown type (${type})!`);
         }
         break;
      }

      return id;
   }

   twrWindowMenuButtonAddCallback(mod: IWasmModuleAsync | IWasmModule, widgetID: number, eventID: number, extraPtr: number) {
      if (!this.menuItems.has(widgetID)) throw new Error(`twrWindowMenuButtonAddCallback: Error! was given an invalid widgetID (${widgetID})`);
      const widget = this.menuItems.get(widgetID)!;

      if (widget[0] != WidgetType.Button) throw new Error(`twrWindowMenuButtonAddCallback: Error! was given an invalid widget type! Expected Button, got ${WidgetType[widget[0]]}`);
      
      const button: Button = widget[1];

      button.addEvent(() => {
         mod.postEvent(eventID, extraPtr)
      });
   }

   twrWindowMenuDeleteWidget(mod: IWasmModuleAsync | IWasmModule, widgetID: number) {
      if (!this.menuItems.has(widgetID)) throw new Error(`twrWindowMenuDeleteWidget: Error! was given an invalid widgetID (${widgetID})`);
      const widget = this.menuItems.get(widgetID)!;

      const deleted = widget[1].delete(this.ctx);
      for (const del of deleted) {
         this.menuItems.delete(del.id);
      }
   }


}