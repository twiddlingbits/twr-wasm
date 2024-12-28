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

interface WidgetManager {
   childUpdated: (ctx: CanvasRenderingContext2D, widget?: Widget, sendToRoot?: boolean) => void;
   //really, really long type. Basically accepts any class constructor that created a Widget
   // and accepts a CanvasRenderingContext2D, an id, a parent WidgetManager, and a set of properties of any type
   // the idea is that you give the manager a widget and it constructs it internally.
   // addChild: <T extends Widget, U, O extends new (ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: U) => T>(ctx: CanvasRenderingContext2D, id: number, cons: O, props: U) => T;

   openPopup: (ctx: CanvasRenderingContext2D, widget: Widget, x: number, y: number, relativeChild?: Widget) => void;
   closePopup: (ctx: CanvasRenderingContext2D, widget: Widget) => void;
   handleDelete: (ctx: CanvasRenderingContext2D, widget: Widget) => void;
}
interface Widget {
   readonly parent: WidgetManager; 
   readonly id: number;
   readonly handledEvents: MenuItemEvents[];
   getMinSize: (ctx: CanvasRenderingContext2D) => [number, number];
   render: (ctx: CanvasRenderingContext2D, offsetX?: number, offsetY?: number) => void;
   handleMenuEvent: (ctx: CanvasRenderingContext2D, event: MenuItemEventData) => void;
   getDimensions: () => [number, number];
   setDimensions: (ctx: CanvasRenderingContext2D, width?: number, height?: number) => void;
   delete: (ctx: CanvasRenderingContext2D) => Widget[];
}

interface WidgetConstructor {
   width?: number;
   height?: number;
}
interface ButtonWidgetConstructor extends WidgetConstructor {
   text: string;
   prefixText?: string;
   suffixText?: string;
   centeredHorizontally?: boolean;
   reservedPrefixSpace?: number;
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

   private width: number;
   private height: number;

   private textOffsets: [number, number, number];

   private text: string;
   private prefixText?: string;
   private suffixText?: string;
   private centeredHorizontally: boolean;
   private reservedPrefixSpace: number;
   private textFont: string;
   private textColor: string;
   private buttonColor: string;
   private selectedButtonColor: string;

   private selected: boolean = false;
   private events: Set<((ctx: CanvasRenderingContext2D) => void)> = new Set();

   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, cons: ButtonWidgetConstructor) {
      this.parent = parent;
      this.id = id;

      this.text = cons.text;
      this.prefixText = cons.prefixText;
      this.suffixText = cons.suffixText;
      this.centeredHorizontally = cons.centeredHorizontally ?? false;
      this.reservedPrefixSpace = cons.reservedPrefixSpace ?? 0;
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

   getDimensions(): [number, number] {
      return [this.width, this.height];
   }
   setDimensions(ctx: CanvasRenderingContext2D, width?: number, height?: number) {
      this.height = height ?? this.height;
      this.width = width ?? this.width;

      if (height != undefined || width != undefined)
         this.textOffsets = this.getTextOffsets(ctx);
      
      if (height != undefined || width != undefined)
         this.parent.childUpdated(ctx);
   }
   setButtonText(ctx: CanvasRenderingContext2D, newText: string) {
      this.text = newText;
      this.textOffsets = this.getTextOffsets(ctx);
      this.parent.childUpdated(ctx, this);
   }
   setButtonPrefixText(ctx: CanvasRenderingContext2D, newText?: string) {
      this.prefixText = newText;
      this.textOffsets = this.getTextOffsets(ctx);
      this.parent.childUpdated(ctx, this);
   }

   private getFullMinSize(ctx: CanvasRenderingContext2D): [number, number, number, number] {
      ctx.save();
      ctx.font = this.textFont;

      const spaceMeasure = ctx.measureText(" ");
      const spaceWidth = spaceMeasure.width;
      let minPrefix = this.reservedPrefixSpace;
      if (this.prefixText != undefined) {
         const prefixMeasure = ctx.measureText(this.prefixText);
         minPrefix = Math.min(minPrefix, prefixMeasure.width + spaceWidth);
      }
      let minSuffix = 0;
      if (this.suffixText != undefined) {
         const suffixMeasure = ctx.measureText(this.suffixText);
         minSuffix = suffixMeasure.width + spaceWidth;
      }

      const measure = ctx.measureText(this.text);
      const minWidth = measure.width + minPrefix + minSuffix;
      const minHeight = measure.actualBoundingBoxAscent;

      ctx.restore();

      return [minWidth, minHeight, minPrefix, minSuffix];
   }
   getMinSize(ctx: CanvasRenderingContext2D): [number, number] {
      const [width, height,,] = this.getFullMinSize(ctx);
      return [width, height];
   }
   getTextOffsets(ctx: CanvasRenderingContext2D): [number, number, number] {
      const [minWidth, minHeight, minPrefix, minSuffix] = this.getFullMinSize(ctx);

      return [
         this.centeredHorizontally ? (this.width - (minWidth - minPrefix - minSuffix))/2.0 : minPrefix,
         (this.height + minHeight)/2.0,
         minSuffix
      ];
   }
   render(ctx: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0) {
      ctx.save();

      const button_color = this.selected ? this.selectedButtonColor : this.buttonColor ;
      ctx.fillStyle = button_color;
      ctx.fillRect(offsetX, offsetY, this.width, this.height);

      ctx.font = this.textFont;
      ctx.fillStyle = this.textColor;
      if (this.prefixText != undefined) {
         ctx.fillText(
            this.prefixText,
            offsetX,
            this.textOffsets[1] + offsetY
         );
      } 
      ctx.fillText(
         this.text,
         this.textOffsets[0] + offsetX,
         this.textOffsets[1] + offsetY
      );
      if (this.suffixText != undefined) {
         ctx.fillText(
            " " + this.suffixText,
            offsetX + (this.width - this.textOffsets[2]),
            this.textOffsets[1] + offsetY
         );
      }

      ctx.restore();
   }
   handleMenuEvent(ctx: CanvasRenderingContext2D, event: MenuItemEventData) {
      switch (event[0]) {
         case MenuItemEvents.CLICKED:
         {
            for (const callback of this.events.keys()) {
               callback(ctx);
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

   addEvent(callback: (ctx: CanvasRenderingContext2D) => void) {
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
   borderColor?: string;
   borderWidth?: number;
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
   
   private width?: number;
   private height?: number;
   private yPadding: number;

   private childWidth: number;
   private childHeight: number;

   private menuColor: string;

   private children: [Widget, number][] = [];

   private unhoverHandlers: (() => void)[] = [];
   private clickedOffHandlers: (() => void)[] = [];


   //the currently hovered over/selected item 
   //resets to undefined on menu update or UNHOVERED event
   private selectedItem?: [Widget, number];

   private borderColor: string;
   private borderWidth: number;
   
   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: MenuWidgetConstructor) {
      this.parent = parent;
      this.id = id;

      this.absoluteMinWidth = props.minimumWidth ?? 5;
      this.absoluteMinHeight = props.minimumHeight ?? 5;
      this.childWidth = this.absoluteMinWidth;
      this.childHeight = this.absoluteMinHeight;
      this.minChildHeight = props.minChildHeight ?? 5;

      this.width = props.width;
      this.height = props.height;
      this.yPadding = props.yPadding ?? 10;

      this.borderColor = props.borderColor ?? "black";
      this.borderWidth = props.borderWidth ?? 0.0;

      this.menuColor = props.menuColor ?? "gray";
   }
   pauseDeleteHandle: boolean = false;
   handleDelete(ctx: CanvasRenderingContext2D, widget: Widget) {
      if (this.pauseDeleteHandle)
         return;

      // let i = this.children.indexOf(widget);
      for (let i = 0; i < this.children.length; i++) {
         if (this.children[i][0] == widget) {
            if (i >= 0) {
               this.children.splice(i, 1);
               this.childUpdated(ctx);
            }
         }
      }  
   }
   delete(ctx: CanvasRenderingContext2D) {
      this.parent.handleDelete(ctx, this);
      
      this.pauseDeleteHandle = true;
      let deleted: Widget[] = [];
      for (const widget of this.children) {
         deleted = deleted.concat(widget[0].delete(ctx));
      }
      //push self to list
      deleted.push(this);
      this.children = [];
      this.updateChildSize(ctx);
      this.pauseDeleteHandle = false;
      return deleted;

   }
   openPopup(ctx: CanvasRenderingContext2D, widget: Widget, x: number, y: number, relativeChild?: Widget) {
      let [nX, nY] = [x, y];
      let nextRelative = relativeChild;
      if (relativeChild != undefined) {
         for (const child of this.children) {
            if (child[0] == relativeChild) {
               nY += child[1];
               if (nX > 0)
                  nX += this.borderWidth * 2;
               else
                  nX -= this.borderWidth;
               nextRelative = this;
               break;
            }
         }
      }
      console.log(`open popup (Menu): (${x}, ${y}); (${nX}, ${nY})`);
      this.parent.openPopup(ctx, widget, nX, nY, nextRelative);
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
      for (const [widget,] of this.children) {
         const [width, ] = widget.getMinSize(ctx);
         childWidth = Math.max(childWidth, width);
         // maxChildHeight = Math.max(maxChildHeight, height+this.yPadding);
         const [, height] = widget.getDimensions();
         childHeight += height + this.yPadding;
      }
      childWidth += this.borderWidth * 2;
      childHeight += this.borderWidth * 2;

      // console.log(childWidth, childHeight);

      childWidth = Math.max(childWidth, this.absoluteMinWidth);
      // let childHeight = Math.max(maxChildHeight*this.children.length, this.absoluteMinHeight);
      childHeight = Math.max(childHeight, this.absoluteMinHeight);

      const newWidth = this.width ?? childWidth;
      const newHeight = this.height ?? childHeight;
      this.childHeight = childHeight;
      this.childWidth = childWidth;

      // console.log(newWidth, newHeight, this.childWidth, this.childHeight);

      console.log(`updating width: ${newWidth}`);
      if (this.lastWidth != newWidth || this.lastHeight != newHeight || forceRun) {
         this.lastWidth = newWidth;
         this.lastHeight = newHeight;
         
         let curHeight = this.borderWidth;
         for (const widget of this.children) {
            const [, height] = widget[0].getDimensions();
            this.supressChildUpdates = true;
            widget[0].setDimensions(ctx, newWidth - this.borderWidth * 2, undefined);
            widget[1] = curHeight;
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
         this.parent.childUpdated(ctx, this, false);
      }
   }
   addChild<
      T extends Widget, 
      U, 
      O extends new (ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: U) => T
   >(ctx: CanvasRenderingContext2D, id: number, cons: O, props: U): T {
      const widget: T = new cons(ctx, this, id, props);

      this.children.push([widget, 0]);
      this.updateChildSize(ctx, true);
      this.parent.childUpdated(ctx, this);

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

      const width = this.width ?? this.childWidth;
      const height = this.height ?? this.childHeight;

      ctx.fillStyle = this.menuColor;
      ctx.fillRect(
         offsetX,
         offsetY,
         width,
         height,
      );

      if (this.borderWidth > 0) {
         ctx.strokeStyle = this.borderColor;
         ctx.lineWidth = this.borderWidth;
         ctx.beginPath();
         ctx.rect(
            offsetX + this.borderWidth/2.0, 
            offsetY + this.borderWidth/2.0, 
            width - this.borderWidth,
            height - this.borderWidth
         );
         ctx.stroke();
         ctx.closePath();
      }

      for (const widget of this.children) {
         widget[0].render(ctx, offsetX + this.borderWidth, offsetY + widget[1] + this.borderWidth);
      }

      ctx.restore();
	}
   
   private dispatchEvent(ctx: CanvasRenderingContext2D, widget: Widget, event: MenuItemEventData) {
      if (widget.handledEvents.includes(event[0])) {
         widget.handleMenuEvent(ctx, event);
      }
   }

   private mouseInWidgetBounds(widget: Widget, widgetY: number, x: number, y: number) {
      const [widgetWidth, widgetHeight] = widget.getDimensions();
      return this.borderWidth <= x && x <= this.borderWidth + widgetWidth
            && widgetY <= y && y <= widgetY + widgetHeight;
   }

   //updates the currently selected object using the given coords
   //also handles HOVERING and UNHOVERED events
   private updateSelectedObject(ctx: CanvasRenderingContext2D,x: number, y: number) {
      //check if hovering over selected item
      if (this.selectedItem) {
         if (this.mouseInWidgetBounds(this.selectedItem[0], this.selectedItem[1], x, y)) {
            return; //the selected item is in bounds
         } else {
            //selected item is out of bounds
            this.dispatchEvent(ctx, this.selectedItem[0], [MenuItemEvents.UNHOVERED]);
            this.selectedItem = undefined;
         }
      }
      //otherwise, find what object (if any) are hovered over
      for (const child of this.children) {
         //found child it's hovering over
         if (this.mouseInWidgetBounds(child[0], child[1], x, y)) {
            this.selectedItem = child;
            this.dispatchEvent(ctx, child[0], [MenuItemEvents.HOVERING]);
            //break early
            return;
         }
      }
   }
   handleMenuEvent(ctx: CanvasRenderingContext2D, event: MenuItemEventData): void {
		switch (event[0]) {
         case MenuItemEvents.MOUSE_MOVE:
         {
            const [, eX, eY] = event;
            this.updateSelectedObject(ctx, eX, eY);
            if (this.selectedItem) {
               const [x, y] = [eX - this.borderWidth, eY - this.selectedItem[1]];
               this.dispatchEvent(ctx, this.selectedItem[0], [MenuItemEvents.MOUSE_MOVE, x, y]);
            }
         }
         break;
         case MenuItemEvents.CLICKED:
         {
            const [, eX, eY] = event;
            this.updateSelectedObject(ctx, eX, eY);
            const selected = this.selectedItem;
            if (selected) {
               const [x, y] = [eX - this.borderWidth, eY - selected[1]];
               this.dispatchEvent(ctx, selected[0], [MenuItemEvents.CLICKED, x, y]);
            }
            for (const [widget,] of this.children) {
               if (selected == undefined || widget != selected[0])
                  this.dispatchEvent(ctx, widget, [MenuItemEvents.CLICKED_OFF]);
            }
         }
         break;
         case MenuItemEvents.UNHOVERED:
         {
            if (this.selectedItem) {
               this.dispatchEvent(ctx, this.selectedItem[0], [MenuItemEvents.UNHOVERED]);
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
            for (const widget of this.children)
               this.dispatchEvent(ctx, widget[0], [MenuItemEvents.CLICKED_OFF]);
         }
         break;
      }
	}

   getDimensions(): [number, number] {
      return [
         this.width ?? this.childWidth,
         this.height ?? this.childHeight
      ];
	}

   setDimensions(ctx: CanvasRenderingContext2D, width?: number, height?: number): void {
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
   reservedPrefixLength?: number;
   optionTextFont?: string;
   optionTextColor?: string;
   hoveredBackgroundColor?: string;
}

class RadioMenu implements Widget, WidgetManager, WidgetEvents {
   readonly parent: WidgetManager;
   readonly id: number;
   readonly handledEvents: MenuItemEvents[];

   private menu: Menu;
   private optionHeight: number;
   private selectedSymbol: string;
   private reservedPrefixLength: number;
   private optionTextFont: string;
   private optionTextColor: string;
   private backgroundColor: string;
   private hoveredBackgroundColor: string;
   
   private options: Map<string, Button> = new Map();
   private selected?: string;

   private events: Set<(ctx: CanvasRenderingContext2D, opt: string) => void> = new Set();

   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: RadioMenuWidgetConstructor) {
      this.backgroundColor = props.menuColor ?? "gray";
      props.menuColor = this.backgroundColor;

      this.menu = new Menu(ctx, this, 0, props);
      this.parent = parent;
      this.id = id;

      this.optionHeight = props.optionHeight ?? 20;

      this.selectedSymbol = props.selectedSymbol ?? "*";
      const selectSymbolMeasure = ctx.measureText(this.selectedSymbol);
      const selectSymbolWidth = selectSymbolMeasure.width;
      const spaceMeasure = ctx.measureText(" ");
      const spaceWidth = spaceMeasure.width;
      this.reservedPrefixLength = props.reservedPrefixLength ?? (selectSymbolWidth + spaceWidth*2);
      
      this.optionTextFont = props.optionTextFont ?? "16px Seriph";
      this.optionTextColor = props.optionTextColor ?? "black";
      this.hoveredBackgroundColor = props.hoveredBackgroundColor ?? "lightgray";
      this.handledEvents = this.menu.handledEvents;
   }

   addOption(ctx: CanvasRenderingContext2D, opt: string) {
      if (this.options.has(opt))
         throw new Error(`RadioMenu: addOption already has the ${opt} option!`);

      let prefix = undefined;
      if (this.selected == undefined) {
         this.selected = opt;
         prefix = this.selectedSymbol;
      }

      const buttonOpts: ButtonWidgetConstructor = {
         width: -1,
         height: this.optionHeight,
         text: opt,
         prefixText: prefix,
         reservedPrefixSpace: this.reservedPrefixLength,
         textColor: this.optionTextColor,
         textFont: this.optionTextFont,
         buttonColor: this.backgroundColor,
         selectedButtonColor: this.hoveredBackgroundColor,
      };
      const button: Button = this.menu.addChild(ctx, 0, Button, buttonOpts);

      this.options.set(opt, button);

      button.addEvent(((ctx: CanvasRenderingContext2D) => {
         this.changeSelected(ctx, opt);
      }).bind(this));
   }

   changeSelected(ctx: CanvasRenderingContext2D, opt: string) {
      if (this.selected != opt) {
         if (this.selected != undefined) {
            let button = this.options.get(this.selected)!;

            button.setButtonPrefixText(ctx, undefined);
         }
         this.selected = opt;
         this.options.get(this.selected)!.setButtonPrefixText(ctx, this.selectedSymbol);
         
         for (const event of this.events) {
            event(ctx, this.selected);
         }
      }
   }

   getMinSize(ctx: CanvasRenderingContext2D): [number, number] {
      return this.menu.getMinSize(ctx);
   }
   render(ctx: CanvasRenderingContext2D, offsetX?: number, offsetY?: number) {
      this.menu.render(ctx, offsetX, offsetY);
   }
   handleMenuEvent(ctx: CanvasRenderingContext2D, event: MenuItemEventData) {
      this.menu.handleMenuEvent(ctx, event);
   }
   getDimensions(): [number, number] {
      return this.menu.getDimensions();
   }
   setDimensions(ctx: CanvasRenderingContext2D, width?: number, height?: number) {
      return this.menu.setDimensions(ctx, width, height);
   }

   childUpdated(ctx: CanvasRenderingContext2D, widget?: Widget, sendToRoot?: boolean) {
      this.parent.childUpdated(ctx, widget, sendToRoot);
   }

   openPopup(ctx: CanvasRenderingContext2D, widget: Widget, x: number, y: number, relativeChild?: Widget) {
      this.parent.openPopup(ctx, widget, x, y, relativeChild);
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

   addEvent(callback: (ctx: CanvasRenderingContext2D, opt: string) => void) {
      this.events.add(callback);
   }
   removeEvent(callback: (ctx: CanvasRenderingContext2D, opt: string) => void) {
      this.events.delete(callback);
   }

}

interface MenuBarWidgetConstructor extends WidgetConstructor {
   minimumWidth?: number;
   minimumHeight?: number;
   menuColor?: string;
   xPadding?: number;
   minChildWidth?: number;
}

class MenuBar implements Widget, WidgetManager {
   readonly parent: WidgetManager;
   readonly id: number;
   readonly handledEvents: MenuItemEvents[] = [
      MenuItemEvents.CLICKED,
      MenuItemEvents.CLICKED_OFF,
      MenuItemEvents.UNHOVERED,
      MenuItemEvents.MOUSE_MOVE
   ];

   private width?: number;
   private height?: number;
   private minimumWidth: number;
   private minimumHeight: number;
   private menuColor: string;
   private xPadding: number;
   private minChildWidth: number;

   private calcHeight;
   private calcWidth;

   private children: [Widget, number][] = [];

   private supressChildUpdates = false;

   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: MenuBarWidgetConstructor) {
      this.parent = parent;
      this.id = id;

      this.width = props.width;
      this.height = props.height;

      this.minimumWidth = props.minimumWidth ?? 10;
      this.minimumHeight = props.minimumHeight ?? 10;
      this.calcWidth = this.minimumWidth;
      this.calcHeight = this.minimumHeight;
      this.menuColor = props.menuColor ?? "#B0B0B0";
      this.xPadding = props.xPadding ?? 5;
      this.minChildWidth = props.minChildWidth ?? 10;
   }
   getMinSize(ctx: CanvasRenderingContext2D): [number, number] {
      return [this.calcWidth, this.calcHeight];
   }
   render(ctx: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0) {
      for (let i = this.children.length-1; i >= 0; i--) {
         const [widget, widgetX] = this.children[i];
         widget.render(
            ctx,
            widgetX + offsetX,
            offsetY
         );
      }
   };

   private selected?: [Widget, number];
   private dispatchEvent(ctx: CanvasRenderingContext2D, widget: Widget, event: MenuItemEventData) {
      if (widget.handledEvents.includes(event[0])) {
         widget.handleMenuEvent(ctx, event);
      }
   }
   private mouseInWidgetBounds(widget: Widget, widgetX: number, x: number, y: number) {
      const [widgetWidth, widgetHeight] = widget.getDimensions();
      return widgetX <= x && x <= widgetX + widgetWidth
            && 0 <= y && y <= widgetHeight;
   }
   private updateSelected(ctx: CanvasRenderingContext2D, x: number, y: number) {
      if (this.selected) {
         if (this.mouseInWidgetBounds(this.selected[0], this.selected[1], x, y)) {
            return;
         } else {
            this.dispatchEvent(ctx, this.selected[0], [MenuItemEvents.UNHOVERED]);
            this.selected = undefined;
         }
      }

      for (const widget of this.children) {
         if (this.mouseInWidgetBounds(widget[0], widget[1], x, y)) {
            this.selected = widget;
            this.dispatchEvent(ctx, widget[0], [MenuItemEvents.HOVERING]);
            return;
         }
      }
   }
   handleMenuEvent(ctx: CanvasRenderingContext2D, event: MenuItemEventData) {
      switch (event[0]) {
         case MenuItemEvents.MOUSE_MOVE:
         {
            const [,eX, eY] = event;
            this.updateSelected(ctx, eX, eY);
            if (this.selected) {
               const [x, y] = [eX - this.selected[1], eY];
               this.dispatchEvent(ctx, this.selected[0], [MenuItemEvents.MOUSE_MOVE, x, y]);
            }
         }
         break;
         case MenuItemEvents.CLICKED:
         {
            const [,eX, eY] = event;
            this.updateSelected(ctx, eX, eY);
            if (this.selected) {
               const [x, y] = [eX - this.selected[1], eY];
               this.dispatchEvent(ctx, this.selected[0], [MenuItemEvents.CLICKED, x, y]);
            }
         }
         break;
         case MenuItemEvents.UNHOVERED:
         {
            if (this.selected)
               this.dispatchEvent(ctx, this.selected[0], [MenuItemEvents.UNHOVERED]);
            this.selected = undefined;
         }
         break;

         case MenuItemEvents.CLICKED_OFF:
         {
            if (this.selected) {
               this.dispatchEvent(ctx, this.selected[0], [MenuItemEvents.UNHOVERED]);
            }
            this.selected = undefined;

            for (const widget of this.children) {
               this.dispatchEvent(ctx, widget[0], [MenuItemEvents.CLICKED_OFF]);
            }

         }
         break;

         default:
         {
            throw new Error(`MenuBar HandleMenuEvent: Error! Was given an unhandled event (${MenuItemEvents[event[0]]})!`);
         }
         break;
      }
   }
   getDimensions(): [number, number] {
      return [
         this.width ?? this.calcWidth,
         this.height ?? this.calcHeight
      ];
   }
   setDimensions(ctx: CanvasRenderingContext2D, width?: number, height?: number) {
      this.width = width ?? this.width;
      this.height = height ?? this.height;
      this.parent.childUpdated(ctx, this);
   }
   delete(ctx: CanvasRenderingContext2D): Widget[] {
      this.supressChildUpdates = true;
      let deleted: Widget[] = [this];
      for (const widget of this.children) {
         deleted.push(...widget[0].delete(ctx));
      }
      this.children = [];
      this.supressChildUpdates = false;
      return deleted;
   }
   private updateChildren(ctx: CanvasRenderingContext2D) {
      this.selected = undefined;

      let minHeight = this.minimumHeight;
      let width = 0;
      for (const [widget,] of this.children) {
         const [widgetWidth, widgetHeight] = widget.getDimensions();
         const [widgetMinWidth, widgetMinHeight] = widget.getMinSize(ctx);
         
         minHeight = Math.max(minHeight, widgetHeight, widgetMinHeight);
         width += Math.max(this.minChildWidth, widgetWidth, widgetMinWidth) + this.xPadding;
         // console.log(`${widgetWidth}, ${widgetMinWidth}, ${Math.max(this.minChildWidth, widgetWidth, widgetMinWidth)}`);
      }

      this.calcHeight = minHeight;
      this.calcWidth = width;

      const tmpHeight = this.height ?? this.calcHeight;
      const tmpWidth = this.width ?? this.calcWidth;
      
      let pos = 0;
      this.supressChildUpdates = true;
      for (const widget of this.children) {
         const [widgetWidth, widgetHeight] = widget[0].getDimensions();
         const [minWidgetWidth,] = widget[0].getMinSize(ctx);
         const nWidth = Math.max(this.minChildWidth, widgetWidth, minWidgetWidth);
         widget[0].setDimensions(
            ctx,
            nWidth,
            tmpHeight
         );
         widget[1] = pos;
         pos += nWidth + this.xPadding;
      }
      this.supressChildUpdates = false;
   }

   childUpdated(ctx: CanvasRenderingContext2D, widget?: Widget, sendToRoot?: boolean) {
      if (sendToRoot) {
         this.parent.childUpdated(ctx, widget, true);
      } else if(!this.supressChildUpdates) {
         this.updateChildren(ctx);
      }
   }
   addChild<
      T extends Widget, 
      U, 
      O extends new (ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: U) => T
   >(ctx: CanvasRenderingContext2D, id: number, cons: O, props: U): T {
      const widget: T = new cons(ctx, this, id, props);
      
      this.children.push([widget, 0]);
      this.childUpdated(ctx, widget);

      return widget;
   }

   openPopup(ctx: CanvasRenderingContext2D, widget: Widget, x: number, y: number, relativeChild?: Widget) {
      let [nX, nY] = [x, y];
      let nextRelative = relativeChild;
      if (relativeChild != undefined) {
         for (const child of this.children) {
            if (child[0] == relativeChild) {
               nX += child[1];
               nextRelative = this;
               break;
            }
         }
      }
      console.log(`open popup (MenuBar): (${x}, ${y}); (${nX}, ${nY})`);
      this.parent.openPopup(ctx, widget, nX, nY, nextRelative);
   }
   closePopup(ctx: CanvasRenderingContext2D, widget: Widget) {
      this.parent.closePopup(ctx, widget);
   }
   handleDelete(ctx: CanvasRenderingContext2D, widget: Widget) {
      if (!this.supressChildUpdates) {
         for (let i = 0; i < this.children.length; i++) {
            if (this.children[i][0] == widget) {
               this.children.splice(i, 1);
               this.updateChildren(ctx);
               break;
            }
         }
         throw new Error(`MenuBar handleDelete was given an unregistered widget to delete!`);   
      }
   }
}

class RootWidgetManager implements WidgetManager {
   private boundWidgets: [Widget, number, number][] = [];
   private popupWidgets: Map<Widget, [number, number]> = new Map();

   private selectedWidget?: [Widget, number, number];

   constructor() {

   }
   handleDelete(ctx: CanvasRenderingContext2D, widget: Widget) {
      for (let i = 0; i < this.boundWidgets.length; i++) {
         if (this.boundWidgets[i][0] == widget) {
            this.boundWidgets.splice(i, 1);
            this.childUpdated(ctx);
            return;
         }
      }
   }

   addChild<
      T extends Widget, 
      U, 
      O extends new (ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: U) => T
   >(ctx: CanvasRenderingContext2D, id: number, cons: O, props: U, x: number, y: number): T {
      const widget: T = new cons(ctx, this, id, props);
      
      this.boundWidgets.push([widget, x, y]);

      return widget;
   }
   childUpdated(ctx: CanvasRenderingContext2D, widget?: Widget) {
      this.selectedWidget = undefined;
   }

   openPopup(ctx: CanvasRenderingContext2D, widget: Widget, x: number, y: number, relativeChild?: Widget) {
      let [nX, nY] = [x, y];
      if (relativeChild != undefined) {
         let fromPopups = this.popupWidgets.get(relativeChild);
         if (fromPopups) {
            nX += fromPopups[0];
            nY += fromPopups[1];
         } else {
            for (const child of this.boundWidgets) {
               nX += child[1];
               nY += child[2];
            }
         }
      }
      console.log(`open popup (Root): (${x}, ${y}); (${nX}, ${nY})`);
      this.popupWidgets.set(widget, [nX, nY]);
      this.childUpdated(ctx, widget);
   }
   closePopup(ctx: CanvasRenderingContext2D, widget: Widget) {
      this.popupWidgets.delete(widget);
      this.childUpdated(ctx);
   }

   handleCanvasKeyEvent(ctx: CanvasRenderingContext2D, event: CanvasEventTypes, key: number): boolean {
      return false;
   }

   private widgetInBounds(widget: Widget, widgetX: number, widgetY: number, x: number, y: number): boolean {
      const [wW, wH] = widget.getDimensions();
      return widgetX <= x && x <= widgetX + wW
         && widgetY <= y && y <= widgetY + wH;
   }
   private dispatchEvent(ctx: CanvasRenderingContext2D, widget: Widget, event: MenuItemEventData) {
      if (widget.handledEvents.includes(event[0])) {
         widget.handleMenuEvent(ctx, event);
      }
   }
   private updateSelected(ctx: CanvasRenderingContext2D, x: number, y: number) {
      if (this.selectedWidget) {
         if (this.widgetInBounds(this.selectedWidget[0], this.selectedWidget[1], this.selectedWidget[2], x, y)) {
            return;
         } else {
            this.dispatchEvent(ctx, this.selectedWidget[0], [MenuItemEvents.UNHOVERED]);
            this.selectedWidget = undefined;
         }
      }

      //most recently added is on top in order of popups -> bound

      const widgetList = Array.from(this.popupWidgets.entries());
      for (let i = widgetList.length-1; i >= 0; i--) {
         const [widget, [widgetX, widgetY]] = widgetList[i];
         if (this.widgetInBounds(widget, widgetX, widgetY, x, y)) {
            this.selectedWidget = [widget, widgetX, widgetY];
            this.dispatchEvent(ctx, widget, [MenuItemEvents.HOVERING]);
            return;
         }
      }

      for (let i = this.boundWidgets.length-1; i >= 0; i--) {
         const [widget, widgetX, widgetY] = this.boundWidgets[i];
         if (this.widgetInBounds(widget, widgetX, widgetY, x, y)) {
            this.selectedWidget = [widget, widgetX, widgetY];
            this.dispatchEvent(ctx, widget, [MenuItemEvents.HOVERING]);
            return;
         }
      }
   }

   handleCanvasMouseEvent(ctx: CanvasRenderingContext2D, event: CanvasEventTypes, x: number, y: number): boolean {
      this.updateSelected(ctx, x, y);
      if (!this.selectedWidget) {
         if (event == CanvasEventTypes.MOUSE_CLICK) {
            for (const [popup, ] of this.popupWidgets) {
               this.dispatchEvent(ctx, popup, [MenuItemEvents.CLICKED_OFF]);
            }
         }
         return false;
      }

      switch (event) {
         case CanvasEventTypes.MOUSE_MOVE:
         {
            const [nX, nY] = [x - this.selectedWidget[1], y - this.selectedWidget[2]];
            this.dispatchEvent(ctx, this.selectedWidget[0], [MenuItemEvents.MOUSE_MOVE, nX, nY]);
         }
         break;

         case CanvasEventTypes.MOUSE_CLICK:
         {
            const selected = this.selectedWidget;
            if (!this.popupWidgets.has(selected[0])) {
               for (const popup of this.popupWidgets) {
                  if (selected[0] != popup[0])
                     this.dispatchEvent(ctx, popup[0], [MenuItemEvents.CLICKED_OFF]);
               }
            }
            const [nX, nY] = [x - selected[1], y - selected[2]];
            this.dispatchEvent(ctx, selected[0], [MenuItemEvents.CLICKED, nX, nY]);
         }
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
      for (const [widget, [x, y]] of this.popupWidgets)
         widget.render(ctx, x, y);
      for (const [widget, x, y] of this.boundWidgets)
         widget.render(ctx, x, y);
   }
}

interface MenuButtonWidgetConstructor extends ButtonWidgetConstructor {
   menuOptions: MenuWidgetConstructor,
   openToRight?: boolean,
   offset?: number,
}
class MenuButton implements Widget, WidgetManager {
   readonly parent: WidgetManager;
   readonly id: number;
   readonly handledEvents: MenuItemEvents[] = [
      MenuItemEvents.CLICKED,
      MenuItemEvents.HOVERING,
      MenuItemEvents.UNHOVERED,
      MenuItemEvents.CLICKED_OFF
   ];

   readonly button: Button;
   readonly menu: Menu;

   private openToRight: boolean;
   private offset: number;

   private menuOpened: boolean = false;
   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: MenuButtonWidgetConstructor) {
      this.parent = parent;
      this.id = id;

      this.openToRight = props.openToRight ?? false;
      this.offset = props.offset ?? 0;

      this.button = new Button(ctx, this, 0, props);

      const menuOptions = structuredClone(props.menuOptions);
      const [width, ] = this.button.getDimensions();

      menuOptions.minimumWidth = menuOptions.minimumWidth ?? width; 
      this.menu = new Menu(ctx, this, 1, menuOptions);

      this.button.addEvent((() => {
         const [width,height] = this.button.getDimensions();
         let x = this.openToRight ? width + this.offset : 0;
         let y = this.openToRight ? 0 : height + this.offset;
         console.log(`spawning menu at: (${x}, ${y})`)
         this.parent.openPopup(ctx, this.menu, x, y, this);
         this.menuOpened = true;
      }).bind(this));
      this.menu.bindClickedOffEvent((() => {
         this.parent.closePopup(ctx, this.menu);
         this.menuOpened = false;
      }).bind(this));

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
   handleMenuEvent(ctx: CanvasRenderingContext2D, event: MenuItemEventData) {
      if (event[0] == MenuItemEvents.CLICKED_OFF) {
         if (this.menuOpened) {
            this.menu.handleMenuEvent(ctx, [MenuItemEvents.CLICKED_OFF]);
            this.parent.closePopup(ctx, this.menu);
         }
      } else {
         this.button.handleMenuEvent(ctx, event);
      }
   }
   getDimensions(): [number, number] {
      return this.button.getDimensions();
   }
   setDimensions(ctx: CanvasRenderingContext2D, width?: number, height?: number) {
      this.button.setDimensions(ctx, width, height);
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
   openPopup(ctx: CanvasRenderingContext2D, widget: Widget, x: number, y: number, relativeChild?: Widget) {
      this.parent.openPopup(ctx, widget, x, y, relativeChild);
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
         offsetX + this.textXOffset,
         offsetY + this.textYOffset
      );

      ctx.restore();
   }
   handleMenuEvent(ctx: CanvasRenderingContext2D, event: MenuItemEventData) {
      throw new Error(`Seperator widget doesn't accept events!!`);
   }
   getDimensions(): [number, number] {
      return [this.width, this.height];
   }
   setDimensions(ctx: CanvasRenderingContext2D, width?: number, height?: number) {
      this.width = width ?? this.width;
      this.height = height ?? this.height;
      if (width != undefined || height != undefined) {
         this.updateText(ctx);
      }
   }
}
interface CheckBoxWidgetConstructor extends WidgetConstructor {
   text: string;
   checkedSymbol?: string;
   unCheckedSymbol?: string;
   reservedPrefixSpace?: number;
   textFont?: string;
   textColor?: string;
   buttonColor?: string;
   selectedButtonColor?: string;
}
class CheckBox implements Widget, WidgetManager, WidgetEvents {
   readonly parent: WidgetManager;
   readonly id: number;
   readonly handledEvents: MenuItemEvents[];

   private button: Button;
   private changeEventHandlers: Set<(ctx: CanvasRenderingContext2D, selected: boolean) => void> = new Set();
   private selected = false;
   private checkedSymbol: string;
   private uncheckedSymbol?: string;

   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: CheckBoxWidgetConstructor) {
      this.parent = parent;
      this.id = id;

      this.checkedSymbol = props.checkedSymbol ?? "*";
      const checkedSymbolWidth = ctx.measureText(this.checkedSymbol).width;
      this.uncheckedSymbol = props.unCheckedSymbol;
      const uncheckedSymbolWidth = ctx.measureText(props.unCheckedSymbol ?? "").width;
      const spaceWidth = ctx.measureText(" ").width;
      const reservedPrefixSpace = props.reservedPrefixSpace ?? (Math.max(checkedSymbolWidth, uncheckedSymbolWidth) + spaceWidth * 2.0);

      const buttonCons: ButtonWidgetConstructor = {
         text: props.text,
         reservedPrefixSpace: reservedPrefixSpace,
         prefixText: this.uncheckedSymbol,
         textFont: props.textFont,
         textColor: props.textColor,
         buttonColor: props.buttonColor,
         selectedButtonColor: props.selectedButtonColor,
         width: props.width,
         height: props.height
      };
      this.button = new Button(ctx, this, 0, buttonCons);
      this.handledEvents = this.button.handledEvents;

      this.button.addEvent((ctx) => {
         this.selected = !this.selected;
         if (this.selected) {
            this.button.setButtonPrefixText(ctx, this.checkedSymbol);
         } else {
            this.button.setButtonPrefixText(ctx, this.uncheckedSymbol);
         }
         for (const callback of this.changeEventHandlers) {
            callback(ctx, this.selected);
         }
      })
   }
   addEvent(callback: (ctx: CanvasRenderingContext2D, selected: boolean) => void) {
      this.changeEventHandlers.add(callback);
   }
   removeEvent(callback: (ctx: CanvasRenderingContext2D, selected: boolean) => void) {
      this.changeEventHandlers.delete(callback);
   }

   getMinSize(ctx: CanvasRenderingContext2D): [number, number] {
      return this.button.getMinSize(ctx);
   }
   render(ctx: CanvasRenderingContext2D, offsetX?: number, offsetY?: number) {
      this.button.render(ctx, offsetX, offsetY);
   }
   handleMenuEvent(ctx: CanvasRenderingContext2D, event: MenuItemEventData) {
      this.button.handleMenuEvent(ctx, event);
   }
   getDimensions(): [number, number] {
      return this.button.getDimensions();
   }
   setDimensions(ctx: CanvasRenderingContext2D, width?: number, height?: number) {
      this.button.setDimensions(ctx, width, height);
   }
   delete(ctx: CanvasRenderingContext2D): Widget[] {
      this.button.delete(ctx);
      return [this];
   }
   childUpdated(ctx: CanvasRenderingContext2D, widget?: Widget, sendToRoot?: boolean) {
      this.parent.childUpdated(ctx, this, sendToRoot);
   }
   openPopup(ctx: CanvasRenderingContext2D, widget: Widget, x: number, y: number, relativeChild?: Widget) {
      throw new Error(`CheckBox should never have openPopup be called on it!`);
   }
   closePopup(ctx: CanvasRenderingContext2D, widget: Widget) {
      throw new Error(`CheckBox should never have closePopup be called on it!`);
   }
   handleDelete(ctx: CanvasRenderingContext2D, widget: Widget) {
      //do nothing
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
   Seperator,
   RadioMenu,
   SubMenu,
   CheckBox,
}

export class twrConsoleWindow extends twrLibrary implements ICanvasEvents, IConsoleWindow {
   id: number;
   props: IConsoleBaseProps;

   element: HTMLCanvasElement;
   ctx: CanvasRenderingContext2D;
   
   appCanvasWidth: number;
   appCanvasHeight: number;
   readonly appCanvas: twrConsoleCanvas;

   widgets: Map<
      number, 
      [WidgetType.Button, Button]
      | [WidgetType.Seperator, Seperator]
      | [WidgetType.RadioMenu, RadioMenu]
      | [WidgetType.SubMenu, MenuButton]
      | [WidgetType.CheckBox, CheckBox]
   > = new Map();
   
   nextWidgetID: number = 0;

   readonly manager: RootWidgetManager = new RootWidgetManager();
   readonly menu: MenuBar;
   

   imports: TLibImports = {
      twrGetAppCanvasJSID: {},
      twrWindowAddMenu: {},
      twrWindowMenuAddWidget: {},
      twrWindowMenuWidgetAddCallback: {},
      twrWindowMenuDeleteWidget: {},
      twrWindowMenuRadioMenuAddOption: {},
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

      // const buttonOpts: ButtonWidgetConstructor = {
      //    x: 100,
      //    y: 100,
      //    text: "TEST!!!",
      //    textFont: "64px Serif",
      //    width: 300,
      //    height: 300,
      //    buttonColor: "#B0B0B0B0"
      // };
      // this.manager.addChild(this.ctx, -10, Button, buttonOpts);
      const menuBarCons: MenuBarWidgetConstructor = {
         minChildWidth: 10,
         menuColor: "#B0B0B0",
         height: TOP_BAR_SIZE - 0.5,
         xPadding: MENU_PADDING_X,
      };
      this.menu = this.manager.addChild(this.ctx, 0, MenuBar, menuBarCons, BORDER_SIZE + MENU_PADDING_X, 0);
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

      const id = ++this.nextWidgetID;

      const menuOptions: MenuWidgetConstructor = {
         menuColor: "#B0B0B0",
         minimumHeight: TOP_BAR_SIZE/2.0,
         yPadding: 2,
         borderWidth: 1.0,
         borderColor: "black"
      };

      const button: MenuButton = this.menu.addChild(this.ctx, id, MenuButton, {
         height: TOP_BAR_SIZE - 0.5,
         text: text,
         textColor: "black",
         buttonColor: "#B0B0B0",
         selectedButtonColor: "#D0D0D0",
         menuOptions: menuOptions,
         offset: 0.5,
      });

      this.widgets.set(id, [WidgetType.SubMenu, button]);

      // const subMenuOpts: MenuButtonWidgetConstructor = {
      //    menuOptions: menuOptions,
      //    height: TOP_BAR_SIZE - 0.5,
      //    text: "hello there",
      //    textColor: "black",
      //    buttonColor: "#B0B0B0",
      //    selectedButtonColor: "#D0D0D0",
      //    openToRight: true,
      //    suffixText: "▶",
      // };
      // const subMenu: MenuButton = button.addChild(this.ctx, 0, MenuButton, subMenuOpts);
      // subMenu.addChild(this.ctx, 0, Button, {
      //    height: TOP_BAR_SIZE - 0.5,
      //    text: text,
      //    textColor: "black",
      //    buttonColor: "#B0B0B0",
      //    selectedButtonColor: "#D0D0D0",
      // });
      // const subSubMenu: MenuButton = subMenu.addChild(this.ctx, 0, MenuButton, subMenuOpts);

      // const checkBoxOpts: CheckBoxWidgetConstructor = {
      //    text: "testBox!",
      //    textColor: "black",
      //    buttonColor: "#B0B0B0",
      //    selectedButtonColor: "#D0D0D0",
      //    checkedSymbol: "☑",
      //    unCheckedSymbol: "☐",
      // };
      // const checkBox: CheckBox = subSubMenu.addChild(this.ctx, 0, CheckBox, checkBoxOpts);
      // checkBox.addEvent((ctx: CanvasRenderingContext2D, selected: boolean) => {
      //    console.log(`clicked: ${selected}!`);
      // });

      return id;
   }

   twrWindowMenuAddWidget(mod: IWasmModuleAsync | IWasmModule, menuID: number, consPtr: number): number {
      if (!this.widgets.has(menuID)) throw new Error(`twrWindowMenuAddWidget was given an invalid menu ID (${menuID})!`);
      const widgetBase = this.widgets.get(menuID)!;
      if (widgetBase[0] != WidgetType.SubMenu)
         throw new Error(`twrWindowMenuAddWidget was given a non-menu (${WidgetType[widgetBase[0]]}) widget as a menu!`);

      const menu = widgetBase[1];

      // struct twr_widget_constructor {
      //    enum WindowWidget type;
      //    long x;
      //    long y;
      //    long width;
      //    long height;
      // };
      function getLongOrDef<T>(ptr: number, def: T): number|T {
         const ptrx32=Math.floor(ptr/4);
         if (ptrx32*4!=ptr) throw new Error("getLongOrDef passed non long aligned address")
         if (ptrx32<0 || ptrx32 >= mod.wasmMem.mem32.length) throw new Error("invalid index passed to getLongOrDef: "+ptr+", this.mem32.length: "+mod.wasmMem.mem32.length);
         const val: number = mod.wasmMem.mem32[ptrx32];

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

      const width = getLongOrDef(consPtr + 4, undefined);
      const height = getLongOrDef(consPtr + 8, undefined);

      const extraPtr = consPtr + 12;

      const id = ++this.nextWidgetID;
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
               width: width,
               height: height,
               text: getStringOrDef(extraPtr + 0, "Lorem Ipsum"),
               textFont: getStringOrDef(extraPtr + 4, "16px Seriph"),
               textColor: getStringOrDef(extraPtr + 8, "black"),
               buttonColor: getStringOrDef(extraPtr + 12, "#B0B0B0"),
               selectedButtonColor: getStringOrDef(extraPtr + 16, "#D0D0D0")
            };
            const widget: Button = menu.addChild(this.ctx, id, Button, button);
            this.widgets.set(id, [WidgetType.Button, widget]);
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
               width: width,
               height: height,
               seperatorText: getStringOrDef(extraPtr + 0, "-"),
               seperatorFont: getStringOrDef(extraPtr + 4, "16px Seriph"),
               seperatorColor: getStringOrDef(extraPtr + 8, "black")
            };
            const widget: Seperator = menu.addChild(this.ctx, id, Seperator, seperator);
            this.widgets.set(id, [WidgetType.Seperator, widget]);
         }
         break;

         case WidgetType.RadioMenu:
         {
            // struct twr_widget_radio_menu_constructor {
            //    /// @brief Base widget constructor
            //    struct twr_widget_constructor base;
            //    ///@brief defaults to 0
            //    long minimum_width;
            //    /// @brief defaults to 0
            //    long minimum_height;
            //    /// @brief defaults to 0
            //    long y_padding;
            //    /// @brief defaults to gray
            //    const char* menu_color;
            //    /**
            //     * Color options change to when hovered over
            //     * defaults to light gray
            //     */
            //    const char* hovered_background_color;
            //    /**
            //     * Symbol used to denote that the option is selected
            //     * defaults to *
            //     */
            //    const char* selected_symbol;
            //    /**
            //     * Amount of space before option text reserved for the select symbol
            //     * defaults to width of (selected_symbol + "  ")
            //     */
            //    long reserved_prefix_length;
            //    /// @brief default to 20
            //    long option_height;
            //    /// @brief defaults to 16px Seriph
            //    const char* option_text_font;
            //    /// @brief defaults to black
            //    const char* option_text_color;
            // };
            const cons: RadioMenuWidgetConstructor = {
               width: width,
               height: height,
               minimumWidth: getLongOrDef(extraPtr + 0, 0),            
               minimumHeight: getLongOrDef(extraPtr + 4, 0),
               yPadding: getLongOrDef(extraPtr + 8, 0),
               menuColor: getStringOrDef(extraPtr + 12, "gray"),
               hoveredBackgroundColor: getStringOrDef(extraPtr + 16, "lightgray"),
               selectedSymbol: getStringOrDef(extraPtr + 20, "*"),
               reservedPrefixLength: getLongOrDef(extraPtr + 24, undefined),
               optionHeight: getLongOrDef(extraPtr + 28, 20),
               optionTextFont: getStringOrDef(extraPtr + 32, "16px Seriph"),
               optionTextColor: getStringOrDef(extraPtr + 36, "black"),
            };
            console.log(cons);
            const radio: RadioMenu = menu.addChild(this.ctx, id, RadioMenu, cons);
            this.widgets.set(id, [WidgetType.RadioMenu, radio]);
         }
         break;

         case WidgetType.SubMenu:
         {
            // struct twr_widget_sub_menu_constructor {
            //    /// @brief Base widget constructor
            //    struct twr_widget_constructor base;
            //    /**
            //     * Text for the button that opens this menu
            //     * defaults to Lorem Ipsum
            //     */
            //    const char* button_text;
            //    /// @brief defaults to 16px Seriph
            //    const char* button_text_font;
            //    /// @brief defaults to "black"
            //    const char* button_text_color;
            //    /// @brief defaults to #B0B0B0
            //    const char* button_color;
            //    /// @brief defaults to #D0D0D0
            //    const char* selected_button_color;
            
            //    /// @brief defaults to 10
            //    long minimum_menu_width;
            //    /// @brief defaults to 10
            //    long minimum_menu_height;
            //    /// @brief defaults to #B0B0B0
            //    const char* menu_color;
            //    /// @brief defaults to 5
            //    long menu_y_padding;
            //    /// @brief defaults to 10
            //    long min_child_height;
            //    /// @brief defaults to black
            //    const char* menu_border_color;
            //    /// @brief defaults to 0
            //    long menu_border_width;
            //    ///@brief defaults to 0
            //    long menu_open_offset;
            // };

            const cons: MenuButtonWidgetConstructor = {
               width: width,
               height: height,
               text: getStringOrDef(extraPtr + 0, "Lorem Ipsum"),
               textFont: getStringOrDef(extraPtr + 4, "16px Seriph"),
               textColor: getStringOrDef(extraPtr + 8, "black"),
               buttonColor: getStringOrDef(extraPtr + 12, "#B0B0B0"),
               selectedButtonColor: getStringOrDef(extraPtr + 16, "#D0D0D0"),

               menuOptions: {
                  minimumWidth: getLongOrDef(extraPtr + 20, 10),
                  minimumHeight: getLongOrDef(extraPtr + 24, 10),
                  menuColor: getStringOrDef(extraPtr + 28, "#B0B0B0"),
                  yPadding: getLongOrDef(extraPtr + 32, 5),
                  minChildHeight: getLongOrDef(extraPtr + 36, 10),
                  borderColor: getStringOrDef(extraPtr + 40, "black"),
                  borderWidth: getLongOrDef(extraPtr + 44, 1.0),
               },

               offset: getLongOrDef(extraPtr + 48, 0),
               openToRight: true,
               suffixText: "▶",
            };
            const subMenu: MenuButton = menu.addChild(this.ctx, id, MenuButton, cons);
            this.widgets.set(id, [WidgetType.SubMenu, subMenu]);
         }
         break;

         case WidgetType.CheckBox:
         {
            // struct twr_widget_check_box_constructor {
            //    struct twr_widget_constructor base;
            //    const char* text;
            //    const char* checked_symbol;
            //    const char* unchecked_symbol;
            //    long reserved_prefix_space;
            //    const char* text_font;
            //    const char* text_color;
            //    const char* button_color;
            //    const char* selected_button_color;
            // };

            const props: CheckBoxWidgetConstructor = {
               
               const char* text;
               const char* checked_symbol;
               const char* unchecked_symbol;
               long reserved_prefix_space;
               const char* text_font;
               const char* text_color;
               const char* button_color;
               const char* selected_button_color;
            };
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

   twrWindowMenuWidgetAddCallback(mod: IWasmModuleAsync | IWasmModule, widgetID: number, eventID: number, extraPtr: number) {
      if (!this.widgets.has(widgetID)) throw new Error(`twrWindowMenuButtonAddCallback: Error! was given an invalid widgetID (${widgetID})`);
      const widget = this.widgets.get(widgetID)!;

      switch (widget[0]) {
         case WidgetType.Button:
         {
            const button: Button = widget[1];

            button.addEvent(() => {
               mod.postEvent(eventID, extraPtr)
            });
         }
         break;

         case WidgetType.RadioMenu:
         {
            const radio: RadioMenu = widget[1];
            radio.addEvent(async (ctx: CanvasRenderingContext2D, opt: string) => {
               mod.postEvent(eventID, extraPtr, await mod.putString(opt));
            });
         }
         break;

         case WidgetType.CheckBox:
         {
            const checkBox: CheckBox = widget[1];
            checkBox.addEvent((ctx: CanvasRenderingContext2D, selected: boolean) => {
               mod.postEvent(eventID, extraPtr, selected ? 1 : 0);
            });
         }
         break;

         default:
         {
            throw new Error(`twrWindowMenuWidgetAddCallback: Error! was given an invalid widget type! Expected button, checkBox, or radioMenu, got ${WidgetType[widget[0]]}`);
         }
         break;
      }      
   }

   twrWindowMenuDeleteWidget(mod: IWasmModuleAsync | IWasmModule, widgetID: number) {
      if (!this.widgets.has(widgetID)) throw new Error(`twrWindowMenuDeleteWidget: Error! was given an invalid widgetID (${widgetID})`);
      const widget = this.widgets.get(widgetID)!;

      const deleted = widget[1].delete(this.ctx);
      for (const del of deleted) {
         this.widgets.delete(del.id);
      }
   }

   twrWindowMenuRadioMenuAddOption(mod: IWasmModuleAsync | IWasmModule, widgetID: number, optionPtr: number) {
      if (!this.widgets.has(widgetID)) throw new Error(`twrWindowMenuRadioMenuAddOption: Error! was given an invalid widgetID (${widgetID})`);
      const widget = this.widgets.get(widgetID)!;

      if (widget[0] != WidgetType.RadioMenu) throw new Error(`twrWindowMenuRadioMenuAddOption: Error! was given an invalid widget type! Expected RadioMenu, got ${WidgetType[widget[0]]}`);
      
      const radio: RadioMenu = widget[1];

      radio.addOption(this.ctx, mod.getString(optionPtr));
   }


}