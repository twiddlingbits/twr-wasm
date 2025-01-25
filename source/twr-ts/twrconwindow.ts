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
   | [ MenuItemEvents.CLICKED, number, number, number]
   | [ MenuItemEvents.MOUSE_MOVE, number, number]
   | [ MenuItemEvents.CLICKED_OFF];


interface GlobalWidgetProperties {
   borderColor: string,
   selectedColor: string,
   // menuOptionFont: string,
   widgetTextFont: string,
   menuOpenOffset: number,
   subMenuOpenOffset: number,
   textColor: string,
   reservedPrefixLen: number,
   xPadding: number,
   yPadding: number,
   menuBorderWidth: number,
   menuBorderColor: string,
   emptyMenuHeight: number,
   emptyMenuWidth: number,
   checkBoxCheckedPrefix: string;
   checkBoxUncheckedPrefix: string;
   radioMenuCheckedPrefix: string;
   radioMenuUncheckedPrefix?: string;
};
interface WidgetManager {
   getCtx: () => CanvasRenderingContext2D;
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
   readonly globalProps: GlobalWidgetProperties;
   readonly parent: WidgetManager; 
   readonly id: number;
   readonly handledEvents: MenuItemEvents[];
   set visible(val: boolean);
   get visible(): boolean;
   // set width(val: number);
   // get width(): number;
   // set height(val: number);
   // get height(): number;
   
   getMinSize: () => [number, number];
   render: (ctx: CanvasRenderingContext2D, offsetX?: number, offsetY?: number) => void;
   handleMenuEvent: (ctx: CanvasRenderingContext2D, event: MenuItemEventData) => void;
   getDimensions: () => [number, number];
   setDimensions: (width?: number, height?: number) => void;
   delete: (ctx: CanvasRenderingContext2D) => Widget[];
   // setVisibility: (visibility: boolean) => void;
   // isVisible: () => boolean;

   fullUpdate: (ctx: CanvasRenderingContext2D) => void;
}

let NEXT_WIDGET_ID: number = 0;
abstract class WidgetImpl implements Widget {
   readonly globalProps: GlobalWidgetProperties;
   readonly parent: WidgetManager;
   readonly id: number;
   abstract readonly handledEvents: MenuItemEvents[];

   protected abstract _width: number;
   protected abstract _height: number;
   protected _visible: boolean = true;

   constructor(globalProps: GlobalWidgetProperties, parent: WidgetManager, cons: WidgetConstructor) {
      this.id = ++NEXT_WIDGET_ID;
      this.parent = parent;
      this.globalProps = globalProps;

   }
   abstract getMinSize(): [number, number];
   abstract render(ctx: CanvasRenderingContext2D, offsetX?: number, offsetY?: number): void;
   abstract handleMenuEvent(ctx: CanvasRenderingContext2D, event: MenuItemEventData): void;
   abstract delete(ctx: CanvasRenderingContext2D): Widget[];
   abstract fullUpdate(ctx: CanvasRenderingContext2D): void;
   protected abstract propagateUpdate(ctx?: CanvasRenderingContext2D): void;

   abstract getDimensions(): [number, number];
   abstract setDimensions(width?: number, height?: number): void;

   set visible(val: boolean) {
      if (this._visible != val) {
         this._visible = val;
         this.propagateUpdate();
      }
   }
   get visible() {return this._visible};

   set width(val: number) {
      if (this._width != val) {
         this._width = val;
         this.propagateUpdate();
      }
   }
   get width() {return this._width};

   set height(val: number) {
      if (this._height != val) {
         this._height = val;
         this.propagateUpdate();
      }
   }


}

//constructor fields in interfaces are ... weird
//They aren't implemented on classes themselves, instead,
// they are sort of auto implemented on any class that match their requirements
// So this is "automatically" implemented on any class that implements the given constructor fields
interface WidgetCreation<T extends Widget, U extends WidgetConstructor> {
   new (ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, cons: U, globalProps: GlobalWidgetProperties): T
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

   reservePrefixSpace?: boolean;
}
 
class Button extends WidgetImpl implements WidgetEvents {
   // readonly globalProps: GlobalWidgetProperties;
   // readonly parent: WidgetManager; 
   // readonly id: number;
   readonly handledEvents: MenuItemEvents[] = [
      MenuItemEvents.CLICKED,
      MenuItemEvents.HOVERING,
      MenuItemEvents.UNHOVERED
   ];

   // private width: number;
   // private height: number;

   protected _width: number;
   protected _height: number;

   // private updateProperty() {
   //    const ctx = this.parent.getCtx();
   //    this.textOffsets = this.getTextOffsets(ctx);
   //    this.parent.childUpdated(ctx, this);
   // }
   private _text: string;
   private _prefixText?: string;
   private _suffixText?: string;
   private centeredHorizontally: boolean;
   private reservePrefixSpace: boolean;

   set text(val: string) {this._text = val; this.propagateUpdate()};
   get text(): string {return this._text};
   set prefixText(val: string|undefined) {this._prefixText = val; this.propagateUpdate()};
   get prefixText(): string|undefined {return this._prefixText};
   set suffixText(val: string|undefined) {this._suffixText = val; this.propagateUpdate()};
   get suffixText(): string|undefined {return this._suffixText};



   private selected: boolean = false;
   private events: Set<((ctx: CanvasRenderingContext2D) => void)> = new Set();

   // private _visible: boolean = true;

   // private calculatedWidth: number;
   // private calculatedHeight: number;
   // private textOffsets: [number, number, number];
   private calculatedFields: {
      width: number,
      height: number,
      textOffsets: {
         mainTextX: number,
         suffixX: number,
         y: number,
      },
   } = {
      width: 0,
      height: 0,
      textOffsets: {
         mainTextX: 0,
         suffixX: 0,
         y: 0,
      }
   };

   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, cons: ButtonWidgetConstructor, globalProps: GlobalWidgetProperties) {
      super(globalProps, parent, cons);
      // this.parent = parent;
      // this.id = id;

      this._text = cons.text;
      this._prefixText = cons.prefixText;
      this._suffixText = cons.suffixText;
      this.centeredHorizontally = cons.centeredHorizontally ?? false;
      // this.globalProps = globalProps;

      this.reservePrefixSpace = cons.reservePrefixSpace ?? true;

      const [minWidth, minHeight] = this.getMinSize();
      this._width = cons.width ?? minWidth;
      this._height = cons.height ?? minHeight;
      // this.calculatedWidth = minWidth;
      // this.calculatedHeight = minHeight;
      // this.width = cons.width ?? minWidth;
      // this.height = cons.height ?? minHeight;
      
      // this.textOffsets = this.getTextOffsets(ctx);
      this.updateCalculatedFields(ctx);
   }

   protected propagateUpdate(ctx?: CanvasRenderingContext2D): void {
      const n_ctx = ctx ?? this.parent.getCtx();

      this.updateCalculatedFields(n_ctx);
      this.parent.childUpdated(n_ctx);
   }

   private updateCalculatedFields(ctx: CanvasRenderingContext2D) {
      const [minWidth, minHeight, minPrefix, minSuffix] = this.getFullMinSize(ctx);

      const calcFields = this.calculatedFields;
      calcFields.width = minWidth;
      calcFields.height = minHeight;

      const textOffsets = calcFields.textOffsets;

      function getHeight(ctx: CanvasRenderingContext2D, font: string): number {
         ctx.save();minHeight
         ctx.font = font;
         const measure = ctx.measureText("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.!?*&^%$#@)(0123456789-=_+`~[]{}\\|;:'\"");
         ctx.restore();

         return measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent;
      }

      textOffsets.mainTextX = this.centeredHorizontally 
         ? (this.width - (minWidth - minPrefix - minSuffix))/2.0 
         : minPrefix;
      
      textOffsets.y = (this.height + getHeight(ctx, this.getFont()))/2.0;
      textOffsets.suffixX = minSuffix
   }

   fullUpdate(ctx: CanvasRenderingContext2D) {
      this.updateCalculatedFields(ctx);
   }
   delete(ctx: CanvasRenderingContext2D): Widget[] {
      this.parent.handleDelete(ctx, this);
      return [this];
   }

   private getFont() {
      return this.globalProps.widgetTextFont;
   }

   // set visible(visible: boolean) {
   //    if (this._visible != visible) {
   //       this._visible = visible;
   //       this.parent.childUpdated(this.parent.getCtx(), this, false);
   //    }
   // }
   // get visible() {
   //    return this._visible;
   // }

   getDimensions(): [number, number] {
      return [
         this.width, 
         this.height
      ];
   }
   setDimensions(width?: number, height?: number) {
      if (
         (width != undefined && width != this._width)
         || (height != undefined && height != this._height)
      ) {
         this._height = height ?? this._height;
         this._width = width ?? this._width;

         console.log(`new dimensions (${this._text}): (${this._width}, ${this._height})`);
         this.propagateUpdate();
      }
   }

   private getFullMinSize(ctx: CanvasRenderingContext2D): [number, number, number, number] {
      ctx.save();
      // ctx.font = this.globalProps.widgetTextFont;
      ctx.font = this.getFont();
      const spaceMeasure = ctx.measureText(" ");
      const spaceWidth = spaceMeasure.width;

      ctx.textBaseline = "bottom";
      let minWidth = 0;
      let minHeight = 0;
      const parts = [this._prefixText, this._suffixText, this._text];
      let partWidths = [];
      for (let i = 0; i < parts.length; i++) {
         const part = parts[i];
         const minPartWidth = i == 0 && this.reservePrefixSpace
            ? this.globalProps.reservedPrefixLen
            : 0;
         
         if (part != undefined) {
            const measure = ctx.measureText(part);
            const width = Math.max(minPartWidth, measure.width) 
            minWidth += width + spaceWidth;
            minHeight = Math.max(minHeight, measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent);
            partWidths[i] = width; 
         } else {
            minWidth += minPartWidth;
            partWidths[i] = minPartWidth;
         }
      }
      ctx.restore();
      minWidth -= spaceWidth;

      const [minPrefix, minSuffix, ] = partWidths;

      console.log(`getFullMinSize: ${minWidth}, ${minHeight}, ${minPrefix}, ${minSuffix}`);

      return [minWidth, minHeight, minPrefix, minSuffix];
   }
   getMinSize(): [number, number] {
      // const [width, height,,] = this.getFullMinSize(this.parent.getCtx());
      // console.log(`button min size (${this._text}), (${width}, ${height})`)
      // return [width, height];
      console.log(`button min size (${this._text}): (${this.calculatedFields.width}, ${this.calculatedFields.height})`);
      return [
         this.calculatedFields.width,
         this.calculatedFields.height
      ]
   }
   // getTextOffsets(ctx: CanvasRenderingContext2D): [number, number, number] {
   //    const [minWidth, minHeight, minPrefix, minSuffix] = this.getFullMinSize(ctx);

   //    function getHeight(ctx: CanvasRenderingContext2D, font: string): number {
   //       ctx.save();minHeight
   //       ctx.font = font;
   //       const measure = ctx.measureText("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.!?*&^%$#@)(0123456789-=_+`~[]{}\\|;:'\"");
   //       ctx.restore();

   //       return measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent;
   //    }

   //    return [
   //       this.centeredHorizontally ? (this.width - (minWidth - minPrefix - minSuffix))/2.0 : minPrefix,
   //       (this.height + getHeight(ctx, this.getFont()))/2.0,
   //       minSuffix
   //    ];
   // }
   render(ctx: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0) {
      if (!this._visible)
         return;

      ctx.save();

      if (this._text == "Box Options") {
         console.log(`box option dims: (${this._width}, ${this._height})`);
      }

      // const width = this._width ?? this.calculatedFields.width;
      // const height = this._height ?? this.calculatedFields.height;
      const textOffsets = this.calculatedFields.textOffsets;

      const button_color = this.selected ? this.globalProps.selectedColor : this.globalProps.borderColor;
      ctx.fillStyle = button_color;
      ctx.fillRect(offsetX, offsetY, this._width, this._height);

      // ctx.font = this.globalProps.widgetTextFont;
      ctx.font = this.getFont();
      ctx.fillStyle = this.globalProps.textColor;
      if (this._prefixText != undefined) {
         ctx.fillText(
            this._prefixText,
            offsetX,
            textOffsets.y + offsetY
         );
      } 
      ctx.fillText(
         this._text,
         textOffsets.mainTextX + offsetX,
         textOffsets.y + offsetY
      );
      if (this._suffixText != undefined) {
         ctx.fillText(
            " " + this._suffixText,
            offsetX + (this._width - textOffsets.suffixX),
            textOffsets.y + offsetY
         );
      }

      ctx.restore();
   }
   handleMenuEvent(ctx: CanvasRenderingContext2D, event: MenuItemEventData) {
      if (!this._visible)
         return;

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

interface ContainedWidget {
   widget: Widget,
   x: number,
   y: number
}
interface Vec2 {
   x: number,
   y: number
}
abstract class WidgetContainer implements Widget, WidgetManager {
   readonly globalProps: GlobalWidgetProperties;
   readonly parent: WidgetManager;
   readonly id: number;

   readonly handledEvents: MenuItemEvents[] = [
      MenuItemEvents.CLICKED,
      MenuItemEvents.UNHOVERED,
      MenuItemEvents.MOUSE_MOVE,
      MenuItemEvents.CLICKED_OFF
   ];
   
   private _width?: number;
   private _height?: number;

   protected children: ContainedWidget[] = [];

   private unhoverHandlers: (() => void)[] = [];
   private clickedOffHandlers: (() => void)[] = [];

   private _calculatedDimensions: Vec2;
   protected get calculatedDimensions() {return this._calculatedDimensions};
   protected set calculatedDimensions(val: Vec2) {
      this._calculatedDimensions = val;
      if (this._width == undefined || this._height == undefined) {
         this.parent.childUpdated(this.parent.getCtx());
      }
   }

   protected get width() {return this._width};
   protected get height() {return this._height};

   //the currently hovered over/selected item 
   //resets to undefined on menu update or UNHOVERED event
   private selectedItem?: ContainedWidget;

   private _visible: boolean = true;
   private _drawOutline: boolean;
   get drawOutline() {return this._drawOutline};
   
   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: MenuWidgetConstructor, globalProps: GlobalWidgetProperties) {
      this.globalProps = globalProps;
      this.parent = parent;
      this.id = id;

      this._width = props.width;
      this._height = props.height;
      this._calculatedDimensions = {
         x: globalProps.emptyMenuHeight,
         y: globalProps.emptyMenuHeight,
      };

      this._drawOutline = props.drawOutline ?? false;
   }
   getCtx() {
      return this.parent.getCtx();
   }
   fullUpdate(ctx: CanvasRenderingContext2D) {
      for (const {widget} of this.children) {
         widget.fullUpdate(ctx);
      }
      this.updateChildSize();
      this.selectedItem = undefined;
   }

   set visible(visible: boolean) {
      const ctx = this.parent.getCtx();
      if (this._visible != visible) {
         if (!visible)
            this.handleMenuEvent(ctx, [MenuItemEvents.CLICKED_OFF]);

         this._visible = visible;
         this.parent.childUpdated(ctx, this, false);
      }
   }
   get visible() {
      return this._visible;
   }

   pauseDeleteHandle: boolean = false;
   handleDelete(ctx: CanvasRenderingContext2D, widget: Widget) {
      if (this.pauseDeleteHandle)
         return;

      for (let i = 0; i < this.children.length; i++) {
         if (this.children[i].widget == widget) {
            if (i >= 0) {
               this.children.splice(i, 1);
               this.childUpdated(ctx);
               return;
            }
         }
      }  
   }
   
   delete(ctx: CanvasRenderingContext2D) {
      this.parent.handleDelete(ctx, this);
      
      this.pauseDeleteHandle = true;
      let deleted: Widget[] = [this];
      for (const {widget} of this.children) {
         deleted = deleted.concat(widget.delete(ctx));
      }
      this.children = [];
      this.updateChildSize();
      this.pauseDeleteHandle = false;
      return deleted;

   }
   abstract openPopup(ctx: CanvasRenderingContext2D, widget: Widget, x: number, y: number, relativeChild?: Widget): void;

   closePopup(ctx: CanvasRenderingContext2D, widget: Widget) {
      this.parent.closePopup(ctx, widget);
   }

   // lastWidth: number = 0;
   // lastHeight: number = 0;
   protected supressChildUpdates: boolean = false;
   protected abstract updateChildSize(forceRun?: boolean): void;

   childUpdated(ctx: CanvasRenderingContext2D, widget?: Widget, sendToRoot: boolean = false) {
      if (sendToRoot) {
         this.parent.childUpdated(ctx, widget, true);
      } else if (!this.supressChildUpdates) {
         this.updateChildSize();
         this.selectedItem = undefined;
         this.parent.childUpdated(ctx, this, false);
      }
   }
   protected addChild<
      T extends Widget,
      U extends WidgetConstructor,
   >(ctx: CanvasRenderingContext2D, id: number, cons: WidgetCreation<T, U>, props: U, x: number, y: number): T {
      const widget: T = new cons(ctx, this, id, props, this.globalProps);

      this.children.push({
         widget: widget, 
         x: x, 
         y: y
      });
      this.updateChildSize(true);
      this.parent.childUpdated(ctx, this);

      return widget;
   }

   getMinSize(): [number, number] {
      return [
         this._calculatedDimensions.x, 
         this._calculatedDimensions.y
      ];
   }

   render(ctx: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0): void {
      if (!this._visible)
         return;

		ctx.save();

      const width = this._width ?? this._calculatedDimensions.x;
      const height = this._height ?? this._calculatedDimensions.y;

      ctx.fillStyle = this.globalProps.borderColor;
      ctx.fillRect(
         offsetX,
         offsetY,
         width,
         height,
      );

      const menuBorderWidth = this.globalProps.menuBorderWidth;
      if (menuBorderWidth > 0 && this._drawOutline) {
         ctx.strokeStyle = this.globalProps.menuBorderColor;
         ctx.lineWidth = menuBorderWidth;
         ctx.beginPath();
         ctx.rect(
            offsetX + menuBorderWidth/2.0, 
            offsetY + menuBorderWidth/2.0, 
            width - menuBorderWidth,
            height - menuBorderWidth
         );
         ctx.stroke();
         ctx.closePath();
      }

      for (const {widget, x: wX, y: wY} of this.children) {
         widget.render(ctx, offsetX + wX + menuBorderWidth, offsetY + wY + menuBorderWidth);
      }

      ctx.restore();
	}
   
   private dispatchEvent(ctx: CanvasRenderingContext2D, widget: Widget, event: MenuItemEventData) {
      if (widget.handledEvents.includes(event[0]) && widget.visible) {
         widget.handleMenuEvent(ctx, event);
      }
   }

   private mouseInWidgetBounds(widgetContainer: ContainedWidget, x: number, y: number) {
      const {widget, x: widgetX, y: widgetY} = widgetContainer;
      const [widgetWidth, widgetHeight] = widget.getDimensions();
      return widgetX <= x && x <= widgetX + widgetWidth
            && widgetY <= y && y <= widgetY + widgetHeight;
   }

   //updates the currently selected object using the given coords
   //also handles HOVERING and UNHOVERED events
   private updateSelectedObject(ctx: CanvasRenderingContext2D,x: number, y: number) {
      //check if hovering over selected item
      if (this.selectedItem) {
         if (this.mouseInWidgetBounds(this.selectedItem, x, y) && this.selectedItem.widget.visible) {
            return; //the selected item is in bounds
         } else {
            //selected item is out of bounds
            this.dispatchEvent(ctx, this.selectedItem.widget, [MenuItemEvents.UNHOVERED]);
            this.selectedItem = undefined;
         }
      }
      //otherwise, find what object (if any) are hovered over
      for (const child of this.children) {
         //found child it's hovering over
         if (this.mouseInWidgetBounds(child, x, y) && child.widget.visible) {
            this.selectedItem = child;
            this.dispatchEvent(ctx, child.widget, [MenuItemEvents.HOVERING]);
            //break early
            return;
         }
      }
   }
   handleMenuEvent(ctx: CanvasRenderingContext2D, event: MenuItemEventData): void {
      if (!this._visible)
         return;
		switch (event[0]) {
         case MenuItemEvents.MOUSE_MOVE:
         {
            const [, eX, eY] = event;
            this.updateSelectedObject(ctx, eX, eY);
            if (this.selectedItem) {
               const {widget, x: wX, y: wY} = this.selectedItem;
               const [x, y] = [eX - wX, eY - wY];
               this.dispatchEvent(ctx, widget, [MenuItemEvents.MOUSE_MOVE, x, y]);
            }
         }
         break;
         case MenuItemEvents.CLICKED:
         {
            const [, eX, eY, button] = event;
            this.updateSelectedObject(ctx, eX, eY);
            const selected = this.selectedItem;
            for (const {widget} of this.children) {
               if (selected == undefined || widget != selected.widget)
                  this.dispatchEvent(ctx, widget, [MenuItemEvents.CLICKED_OFF]);
            }
            if (selected) {
               const [x, y] = [eX - selected.x, eY - selected.y];
               this.dispatchEvent(ctx, selected.widget, [MenuItemEvents.CLICKED, x, y, button]);
            }
            
         }
         break;
         case MenuItemEvents.UNHOVERED:
         {
            if (this.selectedItem) {
               this.dispatchEvent(ctx, this.selectedItem.widget, [MenuItemEvents.UNHOVERED]);
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
            for (const {widget} of this.children)
               this.dispatchEvent(ctx, widget, [MenuItemEvents.CLICKED_OFF]);
         }
         break;
      }
	}

   getDimensions(): [number, number] {
      return [
         this._width ?? this._calculatedDimensions.x,
         this._height ?? this._calculatedDimensions.y
      ];
	}

   setDimensions(width?: number, height?: number): void {
      if (width != undefined){
         if (width == 0)
            this._width = undefined;
         else
            this._width = width;
      }
      if (height != undefined){
         if (height == 0)
            this._height = undefined;
         else
            this._height = height;
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

interface MenuWidgetConstructor extends WidgetConstructor {
   drawOutline?: boolean,
}

class Menu extends WidgetContainer {
   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: MenuWidgetConstructor, globalProps: GlobalWidgetProperties) {
      super(ctx, parent, id, props, globalProps);
   }
   getCtx() {
      return this.parent.getCtx();
   }
   openPopup(ctx: CanvasRenderingContext2D, widget: Widget, x: number, y: number, relativeChild?: Widget) {
      let [nX, nY] = [x, y];
      let nextRelative = relativeChild;
      if (relativeChild != undefined) {
         for (const {widget, y: wY} of this.children) {
            if (widget == relativeChild) {
               nY += wY;
               if (nX > 0)
                  nX += this.globalProps.menuBorderWidth * 2;
               else
                  nX -= this.globalProps.menuBorderWidth;
               nextRelative = this;
               break;
            }
         }
      }
      // console.log(`open popup (Menu): (${x}, ${y}); (${nX}, ${nY})`);
      this.parent.openPopup(ctx, widget, nX, nY, nextRelative);
   }

   lastWidth: number = 0;
   lastHeight: number = 0;
   supressChildUpdates: boolean = false;
   protected updateChildSize(forceRun: boolean = false) {
      let childWidth = 0;
      // let maxChildHeight = this.minChildHeight;
      let childHeight = 0;
      for (const {widget} of this.children) {
         if (!widget.visible)
            continue;
         const [width, ] = widget.getMinSize();
         childWidth = Math.max(childWidth, width);
         // maxChildHeight = Math.max(maxChildHeight, height+this.yPadding);
         const [, height] = widget.getDimensions();
         childHeight += height + this.globalProps.yPadding;
      }
      childWidth += this.globalProps.menuBorderWidth * 4;
      childHeight += this.globalProps.menuBorderWidth * 2;

      // console.log(childWidth, childHeight);

      childWidth = Math.max(childWidth, this.globalProps.emptyMenuWidth);
      // let childHeight = Math.max(maxChildHeight*this.children.length, this.absoluteMinHeight);
      childHeight = Math.max(childHeight, this.globalProps.emptyMenuHeight);

      const newWidth = super.width ?? childWidth;
      const newHeight = super.height ?? childHeight;
      super.calculatedDimensions = {
         x: newWidth,
         y: newHeight
      };

      // console.log(newWidth, newHeight, this.childWidth, this.childHeight);

      // console.log(`updating width: ${newWidth}; ${super.width}, ${childWidth}`);
      if (this.lastWidth != newWidth || this.lastHeight != newHeight || forceRun) {
         this.lastWidth = newWidth;
         this.lastHeight = newHeight;
         
         let curHeight = this.globalProps.menuBorderWidth;
         for (const child of this.children) {
            if (!child.widget.visible)
               continue;
            const [, height] = child.widget.getDimensions();
            this.supressChildUpdates = true;
            child.widget.setDimensions(newWidth - this.globalProps.menuBorderWidth * 4, undefined);
            child.y = curHeight;
            this.supressChildUpdates = false;
            // curHeight += maxChildHeight;
            curHeight += height + this.globalProps.yPadding;
         }

      }
   }
   addChild<
      T extends Widget,
      U extends WidgetConstructor,
   >(ctx: CanvasRenderingContext2D, id: number, cons: WidgetCreation<T, U>, props: U): T {
      return super.addChild(ctx, id, cons, props, this.globalProps.menuBorderWidth, 0);
   }
}

class MenuBar extends WidgetContainer {
   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: MenuWidgetConstructor, globalProps: GlobalWidgetProperties) {
      super(ctx, parent, id, props, globalProps);
   }

   protected updateChildSize(forceRun?: boolean) {
      let minHeight = this.globalProps.emptyMenuWidth;
      let width = 0;
      for (const {widget} of this.children) {
         if (!widget.visible)
            continue;

         const [widgetWidth, widgetHeight] = widget.getDimensions();
         const [widgetMinWidth, widgetMinHeight] = widget.getMinSize();
         
         minHeight = Math.max(minHeight, widgetHeight, widgetMinHeight);
         width += Math.max(this.globalProps.emptyMenuWidth, widgetWidth, widgetMinWidth) + this.globalProps.xPadding;
         // console.log(`${widgetWidth}, ${widgetMinWidth}, ${Math.max(this.minChildWidth, widgetWidth, widgetMinWidth)}`);
      }

      super.calculatedDimensions = {
         x: width,
         y: minHeight
      };

      const tmpHeight = super.height ?? minHeight;
      const tmpWidth = super.width ?? width;
      
      let pos = 0;
      this.supressChildUpdates = true;
      for (const child of this.children) {
         if (!child.widget.visible)
            continue;

         const [widgetWidth, widgetHeight] = child.widget.getDimensions();
         const [minWidgetWidth,] = child.widget.getMinSize();
         const nWidth = Math.max(this.globalProps.emptyMenuWidth, widgetWidth, minWidgetWidth);
         child.widget.setDimensions(
            nWidth,
            tmpHeight
         );
         console.log(`${tmpHeight}, ${super.height}, ${child.y}`);
         child.x = pos;
         pos += nWidth + this.globalProps.xPadding;
      }
      this.supressChildUpdates = false;
   }
   addChild<
      T extends Widget,
      U extends WidgetConstructor,
   >(ctx: CanvasRenderingContext2D, id: number, cons: WidgetCreation<T, U>, props: U): T {
      return super.addChild(
         ctx, id, cons, props,
         0, super.drawOutline ? this.globalProps.menuBorderWidth/2 : 0
      );
   }

   openPopup(ctx: CanvasRenderingContext2D, widget: Widget, x: number, y: number, relativeChild?: Widget) {
      let [nX, nY] = [x, y];
      let nextRelative = relativeChild;
      if (relativeChild != undefined) {
         for (const child of this.children) {
            if (child.widget == relativeChild) {
               nX += child.x;
               nextRelative = this;
               break;
            }
         }
      }
      // console.log(`open popup (MenuBar): (${x}, ${y}); (${nX}, ${nY})`);
      this.parent.openPopup(ctx, widget, nX, nY += this.globalProps.menuBorderWidth, nextRelative);
   }
}

class RootWidgetManager implements WidgetManager {
   private boundWidgets: [Widget, number, number][] = [];
   private popupWidgets: Map<Widget, [number, number]> = new Map();

   private selectedWidget?: [Widget, number, number];
   private ctx: CanvasRenderingContext2D;
   constructor(ctx: CanvasRenderingContext2D) {
      this.ctx = ctx;
   }
   getCtx() {
      return this.ctx;
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
      U extends WidgetConstructor,
   >(ctx: CanvasRenderingContext2D, id: number, cons: WidgetCreation<T, U>, props: U, globalProps: GlobalWidgetProperties, x: number, y: number): T {
      const widget: T = new cons(ctx, this, id, props, globalProps);
      
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
      // console.log(`open popup (Root): (${x}, ${y}); (${nX}, ${nY})`);
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
         if (this.widgetInBounds(this.selectedWidget[0], this.selectedWidget[1], this.selectedWidget[2], x, y) && this.selectedWidget[0].visible) {
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

         if (this.widgetInBounds(widget, widgetX, widgetY, x, y) && widget.visible) {
            this.selectedWidget = [widget, widgetX, widgetY];
            this.dispatchEvent(ctx, widget, [MenuItemEvents.HOVERING]);
            return;
         }
      }
   }

   handleCanvasMouseEvent(ctx: CanvasRenderingContext2D, event: CanvasEventTypes, x: number, y: number, button: number): boolean {
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
            this.dispatchEvent(ctx, selected[0], [MenuItemEvents.CLICKED, nX, nY, button]);
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
   menuWidth?: number;
   menuHeight?: number;
   openToRight?: boolean,
   offset?: number,
}
class MenuButton extends Button implements WidgetManager {
   readonly handledEvents: MenuItemEvents[] = [
      MenuItemEvents.CLICKED,
      MenuItemEvents.HOVERING,
      MenuItemEvents.UNHOVERED,
      MenuItemEvents.CLICKED_OFF
   ];

   readonly menu: Menu;

   private openToRight: boolean;
   private offset: number;

   private menuOpened: boolean = false;

   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: MenuButtonWidgetConstructor, globalProps: GlobalWidgetProperties) {
      super(ctx, parent, id, props, globalProps);

      this.openToRight = props.openToRight ?? false;
      this.offset = props.offset ?? 0;
      this.menu = new Menu(ctx, this, 1, {
         width: props.menuWidth,
         height: props.menuHeight,
         drawOutline: true,
      }, globalProps);

      super.addEvent((() => {
         const [width,height] = super.getDimensions();
         let x = this.openToRight ? width + this.offset : 0;
         let y = this.openToRight ? 0 : height + this.offset;
         // console.log(`spawning menu at: (${x}, ${y})`)
         this.parent.openPopup(ctx, this.menu, x, y, this);
         this.menuOpened = true;
      }).bind(this));
      this.menu.bindClickedOffEvent((() => {
         this.parent.closePopup(ctx, this.menu);
         this.menuOpened = false;
      }).bind(this));
   }
   getCtx() {
      return this.parent.getCtx();
   }
   fullUpdate(ctx: CanvasRenderingContext2D) {
      super.fullUpdate(ctx);
      this.menu.fullUpdate(ctx);
   }

   private supressHandleDelete: boolean = false;
   handleDelete(ctx: CanvasRenderingContext2D, widget: Widget) {
      if (this.supressHandleDelete)
         return;
      else if (widget == this.menu)
         throw new Error("MenuButton's internal menu shouldn't be externally accesible");
      else
         throw new Error("MenuButton shouldn't be handling any deletions?");
   }
   delete(ctx: CanvasRenderingContext2D): Widget[] {
      this.supressHandleDelete = true;
      this.parent.handleDelete(ctx, this);
      let deleted: Widget[] = this.menu.delete(ctx);
      //delete menu from list since it's not exposed externally
      deleted.splice(deleted.indexOf(this.menu), 1);
      deleted.push(this); //push self
      this.supressHandleDelete = false;
      return deleted;
   }
   handleMenuEvent(ctx: CanvasRenderingContext2D, event: MenuItemEventData) {
      if (event[0] == MenuItemEvents.CLICKED_OFF) {
         if (this.menuOpened) {
            this.menu.handleMenuEvent(ctx, [MenuItemEvents.CLICKED_OFF]);
            this.parent.closePopup(ctx, this.menu);
         }
      } else {
         // this.button.handleMenuEvent(ctx, event);
         super.handleMenuEvent(ctx, event);
      }
   }

   childUpdated(ctx: CanvasRenderingContext2D, widget?: Widget, sendToRoot?: boolean) {
      this.parent.childUpdated(ctx, widget, sendToRoot);   
   }
   addChild<
      T extends Widget,
      U extends WidgetConstructor,
   >(ctx: CanvasRenderingContext2D, id: number, cons: WidgetCreation<T, U>, props: U): T {
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
}
class Seperator implements Widget {
   readonly globalProps: GlobalWidgetProperties;
   readonly parent: WidgetManager;
   readonly id: number;
   readonly handledEvents: MenuItemEvents[] = [];

   private seperatorText: string;

   private width: number;
   private height: number;
   private minHeight: number = 0;

   private _text: string = "";
   private textXOffset: number = 0;
   private textYOffset: number = 0;

   set text(val: string) {this._text = val; this.fullUpdate(this.parent.getCtx())};
   get text(): string {return this._text};

   private _visible: boolean = true;

   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: SeperatorWidgetConstructor, globalProps: GlobalWidgetProperties) {
      this.globalProps = globalProps;
      this.parent = parent;
      this.id = id;
      
      this.seperatorText = props.seperatorText;

      this.width = props.width ?? 0;
      this.height = props.height ?? 0;
      
      this.updateText(ctx);
   }
   fullUpdate(ctx: CanvasRenderingContext2D) {
      this.updateText(ctx);
   }

   set visible(visible: boolean) {
      if (this._visible != visible) {
         this._visible = visible;
         this.parent.childUpdated(this.parent.getCtx(), this, false);
      }
   }
   get visible() {
      return this._visible;
   }

   delete(ctx: CanvasRenderingContext2D) {
      this.parent.handleDelete(ctx, this);
      return [this];
   }
   private updateText(ctx: CanvasRenderingContext2D) {
      ctx.save();
      // console.log(this.width);

      ctx.font = this.globalProps.widgetTextFont;
      const metrics = ctx.measureText(this.seperatorText);

      const repeats = Math.floor(this.width/metrics.width);
      const width = repeats*metrics.width;
      const height = metrics.actualBoundingBoxAscent;

      this._text = this.seperatorText.repeat(repeats);

      this.textXOffset = (this.width - width)/2.0;
      // console.log(width, this.width, this.textXOffset);
      this.textYOffset = (this.height + height)/2.0;
      this.minHeight = height;

      ctx.restore();
   }

   getMinSize(): [number, number] {
      return [0, this.minHeight];
   }
   render(ctx: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0) {
      if (!this._visible)
         return;

      ctx.save();

      ctx.font = this.globalProps.widgetTextFont;
      ctx.fillStyle = this.globalProps.textColor;

      // console.log(this.x, offsetX, this.textXOffset, this.x + offsetX + this.textXOffset);
      ctx.fillText(
         this._text,
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
   setDimensions(width?: number, height?: number) {
      this.width = width ?? this.width;
      this.height = height ?? this.height;
      if (width != undefined || height != undefined) {
         this.updateText(this.parent.getCtx());
      }
   }
}


interface CheckBoxWidgetConstructor extends WidgetConstructor {
   text: string;
}
class CheckBox extends Button {
   private callbacks: Set<(ctx: CanvasRenderingContext2D, selected: boolean) => void> = new Set();

   private _selected = false;

   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, cons: ButtonWidgetConstructor, globalProps: GlobalWidgetProperties) {
      super(ctx, parent, id, cons, globalProps);

      super.prefixText = globalProps.checkBoxUncheckedPrefix;
      
      super.addEvent((ctx) => {
         this._selected = !this._selected;

         super.prefixText = globalProps[this._selected ? "checkBoxCheckedPrefix" : "checkBoxUncheckedPrefix"];
         for (const callback of this.callbacks) {
            callback(ctx, this._selected);
         }
      });
   }

   addEvent(callback: (ctx: CanvasRenderingContext2D, selected: boolean) => void) {
      this.callbacks.add(callback);
   }
   removeEvent(callback: (ctx: CanvasRenderingContext2D, selected: boolean) => void) {
      return this.callbacks.delete(callback);
   }
}

class RadioItemGroup {
   private items: Map<RadioItem, {
      deselect: (ctx: CanvasRenderingContext2D)=>void, 
      setRadioGroup: (group: RadioItemGroup)=>void
   }> = new Map();

   private selected: RadioItem;
   constructor(item: RadioItem, deselect: (ctx: CanvasRenderingContext2D)=>void, setRadioGroup: (group: RadioItemGroup)=>void) {
      this.items.set(item, {
         deselect: deselect,
         setRadioGroup: setRadioGroup
      });
      this.selected = item;
   }

   optionSeleted(item: RadioItem, ctx: CanvasRenderingContext2D) {
      if (this.selected != item) {
         this.items.get(this.selected)!.deselect(ctx);
         this.selected = item;
      }
   }

   mergeGroups(oth: RadioItemGroup, ctx: CanvasRenderingContext2D) {
      if (oth == this) return;
      for (const [item, funcs] of oth.items) {
         if (this.items.has(item))
            throw new Error(`Somehow merged item twice??`);
         this.items.set(item, funcs);
         funcs.deselect(ctx);
         funcs.setRadioGroup(this);
      }
   }
}
class RadioItem extends Button {
   private callbacks: Set<(ctx: CanvasRenderingContext2D, selected: boolean) => void> = new Set();

   private _selected = false;
   private radioGroup: RadioItemGroup;

   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, cons: ButtonWidgetConstructor, globalProps: GlobalWidgetProperties) {
      super(ctx, parent, id, cons, globalProps);

      this.radioGroup = new RadioItemGroup(this, this.deselect.bind(this), this.setRadioGroup.bind(this));

      super.prefixText = globalProps.radioMenuUncheckedPrefix;
      
      super.addEvent((ctx) => {
         if (!this._selected) {
            this.makeSelected(true, ctx);
         }
      });
   }

   private deselect(ctx: CanvasRenderingContext2D) {
      this._selected = false;
      this.prefixText = this.globalProps.radioMenuUncheckedPrefix;
      for (const callback of this.callbacks) {
         callback(ctx, false);
      }
   }
   private setRadioGroup(group: RadioItemGroup) {
      this.radioGroup = group;
   }

   makeSelected(sendEvent: boolean = true, ctx?: CanvasRenderingContext2D) {
      const n_ctx = ctx ?? this.parent.getCtx();
      this.radioGroup.optionSeleted(this, this.parent.getCtx());
      this.prefixText = this.globalProps.radioMenuCheckedPrefix;
      this._selected = true;
      if (sendEvent) {
         for (const callback of this.callbacks) {
            callback(n_ctx, true);
         }
      }
   }

   mergeGroups(oth: RadioItem) {
      this.radioGroup.mergeGroups(oth.radioGroup, this.parent.getCtx());
   }

   addEvent(callback: (ctx: CanvasRenderingContext2D, selected: boolean) => void) {
      this.callbacks.add(callback);
   }
   removeEvent(callback: (ctx: CanvasRenderingContext2D, selected: boolean) => void) {
      return this.callbacks.delete(callback);
   }
}


interface RadioMenuWidgetConstructor extends MenuWidgetConstructor {
   optionHeight?: number;
}

class RadioItem2 {

}
class RadioMenu implements Widget, WidgetManager, WidgetEvents {
   readonly globalProps: GlobalWidgetProperties;
   readonly parent: WidgetManager;
   readonly id: number;
   readonly handledEvents: MenuItemEvents[];

   private menu: Menu;
   private _optionHeight: number;
   set optionHeight(val: number) {
      for (const [_, widget] of this.options) {
         widget.setDimensions(undefined, val);
      }
   }
   get optionHeight(): number {return this._optionHeight};
   
   private options: Map<string, Button> = new Map();
   private selected?: string;

   private events: Set<(ctx: CanvasRenderingContext2D, opt: string) => void> = new Set();

   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, id: number, props: RadioMenuWidgetConstructor, globalProps: GlobalWidgetProperties) {
      this.globalProps = globalProps;
      // console.log(`Creating new radiomenu: ${props.height}, ${props.width}`);
      this.menu = new Menu(ctx, this, 0, props, globalProps);
      this.parent = parent;
      this.id = id;

      this._optionHeight = props.optionHeight ?? 20;
      
      this.handledEvents = this.menu.handledEvents;
   }
   getCtx() {
      return this.parent.getCtx();
   }
   fullUpdate(ctx: CanvasRenderingContext2D) {
      if (this.selected != undefined)
         // this.options.get(this.selected)!.setButtonPrefixText(ctx, this.globalProps.radioMenuPrefix);
         this.options.get(this.selected)!.prefixText = this.globalProps.radioMenuCheckedPrefix;
      this.menu.fullUpdate(ctx);
   }
   set visible(visible: boolean) {
      this.menu.visible = visible;
   }
   get visible() {
      return this.menu.visible;
   }

   addOption(ctx: CanvasRenderingContext2D, opt: string) {
      if (this.options.has(opt))
         throw new Error(`RadioMenu: addOption already has the ${opt} option!`);

      let prefix = undefined;
      if (this.selected == undefined) {
         this.selected = opt;
         prefix = this.globalProps.radioMenuCheckedPrefix;
      }

      // console.log(`Radio menu adding button: Menu width is: ${this.menu.getDimensions()[0]}`);
      const buttonOpts: ButtonWidgetConstructor = {
         width: 20,
         height: this._optionHeight,
         text: opt,
         prefixText: prefix,
      };
      const button: Button = this.menu.addChild(ctx, 0, Button, buttonOpts);

      this.options.set(opt, button);

      button.addEvent(((ctx: CanvasRenderingContext2D) => {
         this.changeSelected(ctx, opt);
      }).bind(this));

      this.childUpdated(ctx, this);
   }

   changeSelected(ctx: CanvasRenderingContext2D, opt: string) {
      if (this.selected != opt) {
         if (this.selected != undefined) {
            let button = this.options.get(this.selected)!;

            // button.setButtonPrefixText(ctx, undefined);
            button.prefixText = undefined;
         }
         this.selected = opt;
         // this.options.get(this.selected)!.setButtonPrefixText(ctx, this.globalProps.radioMenuPrefix);
         this.options.get(this.selected)!.prefixText = this.globalProps.radioMenuCheckedPrefix;

         for (const event of this.events) {
            event(ctx, this.selected);
         }
         this.menu.childUpdated(ctx);
      }
   }

   getMinSize(): [number, number] {
      return this.menu.getMinSize();
   }
   render(ctx: CanvasRenderingContext2D, offsetX?: number, offsetY?: number) {
      this.menu.render(ctx, offsetX, offsetY);
   }
   handleMenuEvent(ctx: CanvasRenderingContext2D, event: MenuItemEventData) {
      this.menu.handleMenuEvent(ctx, event);
   }
   getDimensions(): [number, number] {
      // console.log(`Getting radio menu dimensions: ${this.menu.getDimensions()}`);
      return this.menu.getDimensions();
   }
   setDimensions(width?: number, height?: number) {
      return this.menu.setDimensions(width, height);
   }

   childUpdated(ctx: CanvasRenderingContext2D, widget?: Widget, sendToRoot?: boolean) {
      // console.log("radio menu updated!!!");
      this.parent.childUpdated(ctx, widget == this.menu ? this : widget, sendToRoot);
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

   readonly manager: RootWidgetManager;
   readonly menu: MenuBar;

   widgetSettings: GlobalWidgetProperties = {
      borderColor: "#B0B0B0",
      selectedColor: "#D0D0D0",
      // menuOptionFont: "16px Seriph",
      widgetTextFont: "12px Seriph",
      menuOpenOffset: 5,
      subMenuOpenOffset: 1,
      textColor: "black",
      reservedPrefixLen: 15,
      yPadding: 5,
      menuBorderWidth: 1.0,
      menuBorderColor: "Black",

      xPadding: 5,
      emptyMenuHeight: 20,
      emptyMenuWidth: 20,
      radioMenuCheckedPrefix: "*",
      radioMenuUncheckedPrefix: undefined,
      checkBoxCheckedPrefix: "[*]",
      checkBoxUncheckedPrefix: "[  ]"
   };
   

   imports: TLibImports = {
      twrGetAppCanvasJSID: {},
      twrWindowAddMenu: {},
      twrWindowMenuAddWidget: {},
      twrWindowMenuWidgetAddCallback: {},
      twrWindowMenuDeleteWidget: {},
      twrWindowMenuRadioMenuAddOption: {},
      twrWindowMenuWidgetSetVisibility: {},
   };

   // every library should have this line
   libSourcePath = new URL(import.meta.url).pathname;

   constructor(canvas: HTMLCanvasElement, selfRegisterEvents: boolean = true) {
      // all library constructors should start with these two lines
      super();
      this.id=twrLibraryInstanceRegistry.register(this);

      this.element = canvas;
      this.ctx = canvas.getContext("2d")!;
      this.manager = new RootWidgetManager(this.ctx);

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
      const menuBarCons: MenuWidgetConstructor = {
         // minChildWidth: 10,
         // menuColor: "#B0B0B0",
         height: TOP_BAR_SIZE - 2,
         // xPadding: MENU_PADDING_X,
      };
      console.log(`Menu Bar target size: ${menuBarCons.height}, ${TOP_BAR_SIZE - 0.5}`);
      this.menu = this.manager.addChild(this.ctx, 0, MenuBar, menuBarCons, this.widgetSettings, BORDER_SIZE + MENU_PADDING_X, 0);
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
   handleCanvasMouseEvent(event: CanvasEventTypes, x: number, y: number, button: number) {
      const n_x = x - BORDER_SIZE;
      const n_y = y - TOP_BAR_SIZE;10

      if (this.manager.handleCanvasMouseEvent(this.ctx, event, x, y, button)) {

      } else if (
         n_x >= 0 && n_y >= 0
         && n_x <= this.appCanvasWidth
         && n_y <= this.appCanvasHeight
      ) {
         this.appCanvas.handleCanvasMouseEvent(event, n_x, n_y, button);
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
         // menuColor: "#B0B0B0",
         // minimumHeight: TOP_BAR_SIZE/2.0,
         // yPadding: 2,
         // borderWidth: 1.0,
         // borderColor: "black"
      };

      const button: MenuButton = this.menu.addChild(this.ctx, id, MenuButton, {
         height: TOP_BAR_SIZE - 0.5,
         text: text,
         textColor: "black",
         buttonColor: "#B0B0B0",
         selectedButtonColor: "#D0D0D0",
         menuOptions: menuOptions,
         offset: 0.5,
         reservePrefixSpace: false,
      });

      this.widgets.set(id, [WidgetType.SubMenu, button]);


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
            // };
            let button: ButtonWidgetConstructor = {
               width: width,
               height: height,
               text: getStringOrDef(extraPtr + 0, "Lorem Ipsum"),
               // textFont: this.widgetSettings.widgetTextFont,
               // textColor: this.widgetSettings.textColor,
               // buttonColor: this.widgetSettings.borderColor,
               // selectedButtonColor: this.widgetSettings.selectedColor,
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
            // };
            let seperator: SeperatorWidgetConstructor = {
               width: width,
               height: height,
               seperatorText: getStringOrDef(extraPtr + 0, "-"),
               // seperatorFont: getStringOrDef(extraPtr + 4, this.widgetSettings.widgetTextFont),
               // seperatorColor: this.widgetSettings.textColor
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
            //    /**
            //     * Symbol used to denote that the option is selected
            //     * defaults to *
            //     */
            //    const char* selected_symbol;
            //    /// @brief default to 20
            //    long option_height;
            // };
            const cons: RadioMenuWidgetConstructor = {
               width: width,
               height: height,
               // minimumWidth: getLongOrDef(extraPtr + 0, 0),            
               // minimumHeight: getLongOrDef(extraPtr + 4, 0),
               // yPadding: this.widgetSettings.yPadding,
               // menuColor: this.widgetSettings.borderColor,
               // hoveredBackgroundColor: this.widgetSettings.selectedColor,
               // selectedSymbol: getStringOrDef(extraPtr + 8, "*"),
               // reservedPrefixLength: this.widgetSettings.reservedPrefixLen,
               optionHeight: getLongOrDef(extraPtr + 12, 20),
               // optionTextFont: this.widgetSettings.widgetTextFont,
               // optionTextColor: this.widgetSettings.textColor,
            };
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
            
            //    /// @brief defaults to 10
            //    long minimum_menu_width;
            //    /// @brief defaults to 10
            //    long minimum_menu_height;
            //    /// @brief defaults to 10
            //    long min_child_height;
            // };

            const cons: MenuButtonWidgetConstructor = {
               width: width,
               height: height,
               text: getStringOrDef(extraPtr + 0, "Lorem Ipsum"),
               // textFont: this.widgetSettings.widgetTextFont,
               // textColor: this.widgetSettings.textColor,
               // buttonColor: this.widgetSettings.borderColor,
               // selectedButtonColor: this.widgetSettings.selectedColor,

               // menuOptions: {
                  // minimumWidth: getLongOrDef(extraPtr + 4, 10),
                  // minimumHeight: getLongOrDef(extraPtr + 8, 10),
                  // menuColor: this.widgetSettings.borderColor,
                  // yPadding: this.widgetSettings.yPadding,
                  // minChildHeight: getLongOrDef(extraPtr + 12, 10),
                  // borderColor: this.widgetSettings.menuBorderColor,
                  // borderWidth: this.widgetSettings.menuBorderWidth,
               // },
               menuWidth: getLongOrDef(extraPtr + 4, undefined),
               menuHeight: getLongOrDef(extraPtr + 8, undefined),

               offset: this.widgetSettings.subMenuOpenOffset,
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
            //    /// @brief Base widget constructor
            //    struct twr_widget_constructor base;
            //    /**
            //     * Text for the check box
            //     * defaults to Lorem Ipsum
            //     */
            //    const char* text;
            //    /**
            //     * Text prefix used to indicate that the check box is clicked
            //     * defaults to *
            //     */
            //    const char* checked_symbol;
            //    /**
            //     * text prefix used to indicate that the check box is not clicked
            //     * defaults to ""
            //     */
            //    const char* unchecked_symbol;
            // };

            const props: CheckBoxWidgetConstructor = {
               text: getStringOrDef(extraPtr + 0, "Lorem Ipsum"),
               // checkedSymbol: getStringOrDef(extraPtr + 4, "*"),
               // unCheckedSymbol: getStringOrDef(extraPtr + 8, ""),
               // reservedPrefixSpace: this.widgetSettings.reservedPrefixLen,
               // textFont: this.widgetSettings.widgetTextFont,
               // textColor: this.widgetSettings.textColor,
               // buttonColor: this.widgetSettings.borderColor,
               // selectedButtonColor: this.widgetSettings.selectedColor,
            };
            const widget: CheckBox = menu.addChild(this.ctx, id, CheckBox, props);
            this.widgets.set(id, [WidgetType.CheckBox, widget]);
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


   twrWindowMenuWidgetSetVisibility(mod: IWasmModuleAsync | IWasmModule, widgetID: number, visibility: number) {
      if (!this.widgets.has(widgetID)) throw new Error(`twrWindowMenuWidgetSetVisibility: Error! was given an invalid widgetID (${widgetID})`);
      const widget = this.widgets.get(widgetID)!;

      widget[1].visible = visibility > 0 ? true : false;
   }

}