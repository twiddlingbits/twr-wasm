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
type MenuItemHoverEvent = {
   type: MenuItemEvents.HOVERING
};
type MenuItemUnhoverEvent = {
   type: MenuItemEvents.UNHOVERED
};
type MenuItemClickedEvent = {
   type: MenuItemEvents.CLICKED,
   x: number,
   y: number,
   button: number
};
type MenuItemMouseMoveEvent = {
   type: MenuItemEvents.MOUSE_MOVE,
   x: number,
   y: number
};
type MenuItemClickedOffEvent = {
   type: MenuItemEvents.CLICKED_OFF
};
type MenuItemEventData = MenuItemHoverEvent
   | MenuItemUnhoverEvent
   | MenuItemClickedEvent
   | MenuItemMouseMoveEvent
   | MenuItemClickedOffEvent;

// Globals used in widgets for a given window to specify things like:
//    font, colors, spacing, etc.
// can be updated from the program and values should propogate
interface GlobalWidgetProperties {
   borderColor: string,
   selectedColor: string,
   disabledColor: string,
   disabledTextColor: string,
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
enum PropBaseType {
   String = 1,
   Boolean = 2,
   Number = 4,
   Undefined = 8,
   Combination = 512
};
type PropPrimitiveType = PropBaseType.String
   | PropBaseType.Boolean
   | PropBaseType.Number
   | PropBaseType.Undefined;

type PropType = [PropBaseType.String]
   | [PropBaseType.Boolean]
   | [PropBaseType.Number]
   | [PropBaseType.Combination, ...PropPrimitiveType[]];

type GetPropVal = [PropBaseType.String, string]
   | [PropBaseType.Boolean, boolean]
   | [PropBaseType.Number, number]
   | [PropBaseType.Undefined];
type AllocGetPropVal = [PropBaseType.String, string, number]
   | [PropBaseType.Boolean, boolean]
   | [PropBaseType.Number, number]
   | [PropBaseType.Undefined];
enum PropPerms {
   ReadOnly = 1,   //0b01
   SetOnly = 2,    //0b10
   ReadAndSet = 3, //0b11 -- Just addition of above two flags
}
interface WidgetManager {
   getCtx: () => CanvasRenderingContext2D;
   childUpdated: (ctx: CanvasRenderingContext2D, widget?: Widget, sendToRoot?: boolean) => void;

   openPopup: (ctx: CanvasRenderingContext2D, widget: Widget, x: number, y: number, relativeChild?: Widget) => void;
   closePopup: (ctx: CanvasRenderingContext2D, widget: Widget) => void;
   handleDelete: (ctx: CanvasRenderingContext2D, widget: Widget) => void;

   resendLastMove: () => void;
}
interface Widget {
   readonly globalProps: GlobalWidgetProperties;
   readonly parent: WidgetManager; 
   readonly id: number;
   readonly handledEvents: MenuItemEvents[];
   // readonly publicProperties: { [propName: string]: [PropPerms, PropType] };
   get publicProperties(): { [propName: string]: [PropPerms, PropType] };
   set isVisible(val: boolean);
   get isVisible(): boolean;

   set width(val: number|undefined);
   get width(): number|undefined;
   set height(val: number|undefined);
   get height(): number|undefined;
   get usedWidth(): number;
   get usedHeight(): number;
   get minWidth(): number;
   get minHeight(): number;

   set isDisabled(val: boolean);
   get isDisabled(): boolean;

   render: (ctx: CanvasRenderingContext2D, offsetX?: number, offsetY?: number) => void;
   handleMenuEvent: (ctx: CanvasRenderingContext2D, event: MenuItemEventData) => void;
   delete: (ctx: CanvasRenderingContext2D) => Widget[];

   fullUpdate: (ctx: CanvasRenderingContext2D) => void;
}
///"deep" clones a json object
///doesn't clone classes, etc. Just clones sub-JSON objects
function cloneJSONObject<T>(to_copy: T): T {
   if (typeof to_copy == "object") {
      const obj: {[val: string]: any} = {};
      for (const [key, value] of Object.entries(to_copy as {[val: string]: any})) {
         obj[key] = cloneJSONObject(value);
      }
      return obj as T;
   } else {
      return to_copy;
   }
}

type PublicPropertiesType = { [propName: string]: [PropPerms, PropType]; };
let NEXT_WIDGET_ID: number = 0;
abstract class WidgetImpl implements Widget {
   readonly globalProps: GlobalWidgetProperties;
   readonly parent: WidgetManager;
   readonly id: number;
   abstract readonly handledEvents: MenuItemEvents[];
   get publicProperties(): PublicPropertiesType {
      return {
         "width": [PropPerms.ReadAndSet, [PropBaseType.Combination, PropBaseType.Number, PropBaseType.Undefined]],
         "height": [PropPerms.ReadAndSet, [PropBaseType.Combination, PropBaseType.Number, PropBaseType.Undefined]],
         "isVisible": [PropPerms.ReadAndSet, [PropBaseType.Boolean]],
         "isDisabled": [PropPerms.ReadAndSet, [PropBaseType.Boolean]],
         "minWidth": [PropPerms.ReadOnly, [PropBaseType.Number]],
         "usedWidth": [PropPerms.ReadOnly, [PropBaseType.Number]],
         "minHeight": [PropPerms.ReadOnly, [PropBaseType.Number]],
         "usedHeight": [PropPerms.ReadOnly, [PropBaseType.Number]]
      }
   }

   protected abstract _width?: number;
   protected abstract _height?: number;
   protected _isVisible: boolean = true;
   protected _isDisabled: boolean = false;

   constructor(globalProps: GlobalWidgetProperties, parent: WidgetManager, cons: WidgetConstructor) {
      this.id = ++NEXT_WIDGET_ID;
      this.parent = parent;
      this.globalProps = globalProps;

   }
   abstract render(ctx: CanvasRenderingContext2D, offsetX?: number, offsetY?: number): void;
   abstract handleMenuEvent(ctx: CanvasRenderingContext2D, event: MenuItemEventData): void;
   abstract delete(ctx: CanvasRenderingContext2D): Widget[];
   abstract fullUpdate(ctx: CanvasRenderingContext2D): void;
   protected abstract propagateUpdate(ctx?: CanvasRenderingContext2D): void;

   set isVisible(val: boolean) {
      if (this._isVisible != val) {
         this._isVisible = val;
         this.propagateUpdate();
      }
   }
   get isVisible() {return this._isVisible};

   protected abstract disableStateChange(): void;
   set isDisabled(val: boolean) {
      if (this._isDisabled != val) {
         this._isDisabled = val;
         this.disableStateChange();
      }
   }
   get isDisabled() {return this._isDisabled};

   set width(val: number|undefined) {
      if (this._width != val) {
         this._width = val;
         this.propagateUpdate();
      }
   }
   get width() {return this._width};
   abstract get minWidth(): number;
   get usedWidth(): number {
      return this._width ?? this.minWidth;
   }

   set height(val: number|undefined) {
      if (this._height != val) {
         this._height = val;
         this.propagateUpdate();
      }
   }
   get height() {return this._height};
   abstract get minHeight(): number;
   get usedHeight(): number {
      return this._height ?? this.minHeight;
   }
}

//constructor fields in interfaces are ... weird
//They aren't implemented on classes themselves, instead,
// they are sort of auto implemented on any class that match their requirements
// So this is "automatically" implemented on any class that implements the given constructor fields
interface WidgetCreation<T extends Widget, U extends WidgetConstructor> {
   new (ctx: CanvasRenderingContext2D, parent: WidgetManager, cons: U, globalProps: GlobalWidgetProperties): T
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

abstract class ButtonBase extends WidgetImpl {
   readonly handledEvents: MenuItemEvents[] = [
      MenuItemEvents.CLICKED,
      MenuItemEvents.HOVERING,
      MenuItemEvents.UNHOVERED
   ];

   protected _width?: number;
   protected _height?: number;

   private _text: string;
   private _prefixText?: string;
   private _suffixText?: string;
   private centeredHorizontally: boolean;
   private reservePrefixSpace: boolean;

   set text(val: string) {this._text = val; this.propagateUpdate(undefined, true)};
   get text(): string {return this._text};
   protected set prefixText(val: string|undefined) {this._prefixText = val; this.propagateUpdate(undefined, true)};
   protected get prefixText(): string|undefined {return this._prefixText};
   protected set suffixText(val: string|undefined) {this._suffixText = val; this.propagateUpdate(undefined, true)};
   protected get suffixText(): string|undefined {return this._suffixText};

   get publicProperties(): PublicPropertiesType {
      return {
         ...super.publicProperties,
         "text": [PropPerms.ReadAndSet, [PropBaseType.String]]
      }
   };



   private mousedOver: boolean = false;

   private calculatedFields = {
      width: 0,
      height: 0,
      textOffsets: {
         mainTextX: 0,
         suffixX: 0,
         y: 0,
      }
   };

   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, cons: ButtonWidgetConstructor, globalProps: GlobalWidgetProperties) {
      super(globalProps, parent, cons);

      this._text = cons.text;
      this._prefixText = cons.prefixText;
      this._suffixText = cons.suffixText;
      this.centeredHorizontally = cons.centeredHorizontally ?? false;

      this.reservePrefixSpace = cons.reservePrefixSpace ?? true;

      this._width = cons.width;
      this._height = cons.height;

      this.updateCalculatedFields(ctx);
   }

   protected propagateUpdate(ctx?: CanvasRenderingContext2D, text_based: boolean = false): void {
      const n_ctx = ctx ?? this.parent.getCtx();

      const prev = {
         x: this.calculatedFields.width,
         y: this.calculatedFields.height
      };
      this.updateCalculatedFields(n_ctx);
      if (!text_based || prev.x != this.calculatedFields.width || prev.y != this.calculatedFields.height)
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
         ? (this.usedWidth - (minWidth - minPrefix - minSuffix))/2.0 
         : minPrefix;
      
      textOffsets.y = (this.usedHeight + getHeight(ctx, this.getFont()))/2.0;
      textOffsets.suffixX = minSuffix;
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

   private getFullMinSize(ctx: CanvasRenderingContext2D): [number, number, number, number] {
      ctx.save();
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
            minWidth += minPartWidth + ((i != parts.length-1) ? spaceWidth : 0 );
            partWidths[i] = minPartWidth;
         }
      }
      ctx.restore();
      minWidth -= spaceWidth;

      const [minPrefix, minSuffix, ] = partWidths;


      return [minWidth, minHeight, minPrefix, minSuffix];
   }

   get minWidth() {
      return this.calculatedFields.width;
   }

   get minHeight() {
      return this.calculatedFields.height;
   }

   render(ctx: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0) {
      if (!this._isVisible)
         return;

      ctx.save();

      const textOffsets = this.calculatedFields.textOffsets;

      const button_color = this._isDisabled 
         ? this.globalProps.disabledColor
         : (this.mousedOver 
            ? this.globalProps.selectedColor 
            : this.globalProps.borderColor);
      
      ctx.fillStyle = button_color;
      ctx.fillRect(offsetX, offsetY, this.usedWidth, this.usedHeight);

      ctx.font = this.getFont();
      ctx.fillStyle = this._isDisabled 
         ? this.globalProps.disabledTextColor
         : this.globalProps.textColor;
         
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
            offsetX + (this.usedWidth - textOffsets.suffixX),
            textOffsets.y + offsetY
         );
      }

      ctx.restore();
   }
   handleMenuEvent(ctx: CanvasRenderingContext2D, event: MenuItemEventData) {
      if (!this._isVisible || this._isDisabled)
         return;

      switch (event.type) {
         case MenuItemEvents.CLICKED:
         {
            this.buttonPressed(ctx);
         }
         break;

         case MenuItemEvents.HOVERING:
         {
            this.mousedOver = true;
         }
         break;

         case MenuItemEvents.UNHOVERED:
         {
            this.mousedOver = false;
         }
         break;

         default:
            throw new Error(`Button handleMenuEvent was given an unrecognized event ${MenuItemEvents[event.type] ?? event.type}!`);
      }
   }
   protected disableStateChange(): void {
      this.mousedOver = false;
   }

   abstract buttonPressed(ctx: CanvasRenderingContext2D): void;
}

class Button extends ButtonBase implements WidgetEvents {
   private events: Set<((ctx: CanvasRenderingContext2D) => void)> = new Set();

   get suffixText(): string|undefined {return super.suffixText};
   set suffixText(val: string|undefined) {super.suffixText = val};
   get prefixText(): string|undefined {return super.prefixText};
   set prefixText(val: string|undefined) {super.prefixText = val};

   get publicProperties(): PublicPropertiesType {
      return {
         ...super.publicProperties,
         "suffixText": [PropPerms.ReadAndSet, [PropBaseType.Combination, PropBaseType.String, PropBaseType.Undefined]],
         "prefixText": [PropPerms.ReadAndSet, [PropBaseType.Combination, PropBaseType.String, PropBaseType.Undefined]],
      }
   } 

   buttonPressed(ctx: CanvasRenderingContext2D): void {
      for (const callback of this.events.keys()) {
         callback(ctx);
      }
   }

   addEvent(callback: (ctx: CanvasRenderingContext2D) => void) {
      this.events.add(callback);
   }
   removeEvent(callback: (ctx: CanvasRenderingContext2D) => void) {
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
abstract class WidgetContainer extends WidgetImpl implements WidgetManager {

   readonly handledEvents: MenuItemEvents[] = [
      MenuItemEvents.CLICKED,
      MenuItemEvents.UNHOVERED,
      MenuItemEvents.MOUSE_MOVE,
      MenuItemEvents.CLICKED_OFF
   ];
   
   protected _width?: number;
   protected _height?: number;

   protected children: ContainedWidget[] = [];

   private unhoverHandlers: (() => void)[] = [];
   private clickedOffHandlers: (() => void)[] = [];

   protected _calculatedDimensions: Vec2;
   protected get calculatedDimensions() {return this._calculatedDimensions};
   protected set calculatedDimensions(val: Vec2) {
      this._calculatedDimensions = val;
      if (this._width == undefined || this._height == undefined) {
         this.parent.childUpdated(this.parent.getCtx());
      }
   }

   private selectedItem?: ContainedWidget;

   private _drawOutline: boolean;
   get drawOutline() {return this._drawOutline};
   
   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, props: MenuWidgetConstructor, globalProps: GlobalWidgetProperties) {
      super(globalProps, parent, {});

      this._width = props.width;
      this._height = props.height;
      this._calculatedDimensions = {
         x: globalProps.emptyMenuHeight,
         y: globalProps.emptyMenuHeight,
      };

      this._drawOutline = props.drawOutline ?? false;
   }
   resendLastMove() {
      this.parent.resendLastMove();
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
      this.parent.resendLastMove();
   }

   protected propagateUpdate(ctx?: CanvasRenderingContext2D, click_off: boolean = false): void {
      const n_ctx = ctx ?? this.parent.getCtx();
      if (!this._isVisible) return;
      if (click_off)
         this.handleMenuEvent(n_ctx, {type: MenuItemEvents.CLICKED_OFF});
      else 
         this.handleMenuEvent(n_ctx, {type: MenuItemEvents.UNHOVERED});

      const prev_dims = {
         x: this.usedWidth,
         y: this.usedHeight,
      };
      this.updateChildSize();
      if (prev_dims.x != this.usedWidth || prev_dims.y != this.usedHeight) {
         this.parent.childUpdated(this.parent.getCtx());
      }

      this.parent.resendLastMove();
      
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

   protected supressChildUpdates: boolean = false;
   protected abstract updateChildSize(forceRun?: boolean): void;

   childUpdated(ctx: CanvasRenderingContext2D, widget?: Widget, sendToRoot: boolean = false) {
      if (sendToRoot) {
         this.parent.childUpdated(ctx, widget, true);
      } else if (!this.supressChildUpdates) {
         this.propagateUpdate(ctx);
      }
   }
   protected addChild<
      T extends Widget,
      U extends WidgetConstructor,
   >(ctx: CanvasRenderingContext2D, cons: WidgetCreation<T, U>, props: U, x: number, y: number): T {
      const widget: T = new cons(ctx, this, props, this.globalProps);

      this.children.push({
         widget: widget, 
         x: x, 
         y: y
      });
      this.updateChildSize(true);
      this.parent.childUpdated(ctx, this);

      return widget;
   }

   get minWidth() {
      return this._calculatedDimensions.x;
   }
   get minHeight() {
      return this._calculatedDimensions.y;
   }
   render(ctx: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0): void {
      if (!this._isVisible)
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
      if (widget.handledEvents.includes(event.type) && widget.isVisible) {
         widget.handleMenuEvent(ctx, event);
      }
   }

   private mouseInWidgetBounds(widgetContainer: ContainedWidget, x: number, y: number) {
      const {widget, x: widgetX, y: widgetY} = widgetContainer;
      return widgetX <= x && x <= widgetX + widget.usedWidth
            && widgetY <= y && y <= widgetY + widget.usedHeight;
   }

   //updates the currently selected object using the given coords
   //also handles HOVERING and UNHOVERED events
   private updateSelectedObject(ctx: CanvasRenderingContext2D,x: number, y: number) {
      //check if hovering over selected item
      if (this.selectedItem) {
         if (this.mouseInWidgetBounds(this.selectedItem, x, y) && this.selectedItem.widget.isVisible) {
            return; //the selected item is in bounds
         } else {
            //selected item is out of bounds
            this.dispatchEvent(ctx, this.selectedItem.widget, {type:MenuItemEvents.UNHOVERED});
            this.selectedItem = undefined;
         }
      }
      //otherwise, find what object (if any) are hovered over
      for (const child of this.children) {
         //found child it's hovering over
         if (this.mouseInWidgetBounds(child, x, y) && child.widget.isVisible) {
            this.selectedItem = child;
            this.dispatchEvent(ctx, child.widget, {type:MenuItemEvents.HOVERING});
            //break early
            return;
         }
      }
   }
   handleMenuEvent(ctx: CanvasRenderingContext2D, event: MenuItemEventData): void {
      if (!this._isVisible)
         return;
		switch (event.type) {
         case MenuItemEvents.MOUSE_MOVE:
         {
            const {x: eX, y: eY} = event;
            this.updateSelectedObject(ctx, eX, eY);
            if (this.selectedItem) {
               const {widget, x: wX, y: wY} = this.selectedItem;
               const [x, y] = [eX - wX, eY - wY];
               this.dispatchEvent(ctx, widget, {type: MenuItemEvents.MOUSE_MOVE, x: x, y: y});
            }
         }
         break;
         case MenuItemEvents.CLICKED:
         {
            const {x: eX, y: eY, button} = event;
            this.updateSelectedObject(ctx, eX, eY);
            const selected = this.selectedItem;
            for (const {widget} of this.children) {
               if (selected == undefined || widget != selected.widget)
                  this.dispatchEvent(ctx, widget, {type: MenuItemEvents.CLICKED_OFF});
            }
            if (selected) {
               const [x, y] = [eX - selected.x, eY - selected.y];
               this.dispatchEvent(ctx, selected.widget, {type: MenuItemEvents.CLICKED, x: x, y: y, button: button});
            }
            
         }
         break;
         case MenuItemEvents.UNHOVERED:
         {
            if (this.selectedItem) {
               this.dispatchEvent(ctx, this.selectedItem.widget, {type: MenuItemEvents.UNHOVERED});
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
               this.dispatchEvent(ctx, widget, {type: MenuItemEvents.CLICKED_OFF});
         }
         break;
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

   protected disableStateChange(): void {
      //TODO@ figure out what to do here?
      //should menus be capable of being disabled?
      // in fact, since RadioMenu was converted to linked Radio Items
      // is there any point in menus being considered Widgets at all?
      // you can link them to widgets just fine with things like MenuButtons
   }

}

interface MenuWidgetConstructor extends WidgetConstructor {
   drawOutline?: boolean,
}

class Menu extends WidgetContainer {
   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, props: MenuWidgetConstructor, globalProps: GlobalWidgetProperties) {
      super(ctx, parent, props, globalProps);
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
      this.parent.openPopup(ctx, widget, nX, nY, nextRelative);
   }

   lastWidth: number = 0;
   lastHeight: number = 0;
   supressChildUpdates: boolean = false;
   protected updateChildSize(forceRun: boolean = false) {
      let childWidth = 0;
      let childHeight = 0;
      for (const {widget} of this.children) {
         if (!widget.isVisible)
            continue;
         const width = widget.minWidth;
         childWidth = Math.max(childWidth, width);
         childHeight += widget.usedHeight + this.globalProps.yPadding;
      }
      childWidth += this.globalProps.menuBorderWidth * 4;
      childHeight += this.globalProps.menuBorderWidth * 2;


      childWidth = Math.max(childWidth, this.globalProps.emptyMenuWidth);
      childHeight = Math.max(childHeight, this.globalProps.emptyMenuHeight);

      const newWidth = super.width ?? childWidth;
      const newHeight = super.height ?? childHeight;
      this._calculatedDimensions = {
         x: newWidth,
         y: newHeight
      };
      
      if (this.lastWidth != newWidth || this.lastHeight != newHeight || forceRun) {
         this.lastWidth = newWidth;
         this.lastHeight = newHeight;
         
         let curHeight = this.globalProps.menuBorderWidth;
         this.supressChildUpdates = true;
         for (const child of this.children) {
            if (!child.widget.isVisible)
               continue;
            child.widget.width = newWidth - this.globalProps.menuBorderWidth * 4;
            child.y = curHeight;
            curHeight += child.widget.usedHeight + this.globalProps.yPadding;
         }
         this.supressChildUpdates = false;

      }
   }
   addChild<
      T extends Widget,
      U extends WidgetConstructor,
   >(ctx: CanvasRenderingContext2D, cons: WidgetCreation<T, U>, props: U): T {
      return super.addChild(ctx, cons, props, this.globalProps.menuBorderWidth, 0);
   }
}

class MenuBar extends WidgetContainer {
   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, props: MenuWidgetConstructor, globalProps: GlobalWidgetProperties) {
      super(ctx, parent, props, globalProps);
   }

   protected updateChildSize(forceRun?: boolean) {
      let minHeight = this.globalProps.emptyMenuWidth;
      let width = 0;
      for (const {widget} of this.children) {
         if (!widget.isVisible)
            continue;

         const [widgetWidth, widgetHeight] = [widget.usedWidth, widget.usedHeight];
         const [widgetMinWidth, widgetMinHeight] = [widget.minWidth, widget.minHeight];
         
         minHeight = Math.max(minHeight, widgetHeight, widgetMinHeight);
         width += Math.max(this.globalProps.emptyMenuWidth, widgetWidth, widgetMinWidth) + this.globalProps.xPadding;
      }

      this._calculatedDimensions = {
         x: width,
         y: minHeight
      };

      const tmpHeight = super.height ?? minHeight;
      const tmpWidth = super.width ?? width;
      
      let pos = 0;
      this.supressChildUpdates = true;
      for (const child of this.children) {
         if (!child.widget.isVisible)
            continue;

         const widgetWidth = child.widget.usedWidth;
         const minWidgetWidth = child.widget.minWidth;
         const nWidth = Math.max(this.globalProps.emptyMenuWidth, widgetWidth, minWidgetWidth);
         child.widget.width = nWidth;
         child.widget.height = tmpHeight;

         child.x = pos;
         pos += nWidth + this.globalProps.xPadding;
      }
      this.supressChildUpdates = false;
   }
   addChild<
      T extends Widget,
      U extends WidgetConstructor,
   >(ctx: CanvasRenderingContext2D, cons: WidgetCreation<T, U>, props: U): T {
      return super.addChild(
         ctx, cons, props,
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
   >(ctx: CanvasRenderingContext2D, cons: WidgetCreation<T, U>, props: U, globalProps: GlobalWidgetProperties, x: number, y: number): T {
      const widget: T = new cons(ctx, this, props, globalProps);
      
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
      const [wW, wH] = [widget.usedWidth, widget.usedHeight];
      return widgetX <= x && x <= widgetX + wW
         && widgetY <= y && y <= widgetY + wH;
   }
   private dispatchEvent(ctx: CanvasRenderingContext2D, widget: Widget, event: MenuItemEventData) {
      if (widget.handledEvents.includes(event.type)) {
         widget.handleMenuEvent(ctx, event);
      }
   }
   private updateSelected(ctx: CanvasRenderingContext2D, x: number, y: number) {
      if (this.selectedWidget) {
         if (this.widgetInBounds(this.selectedWidget[0], this.selectedWidget[1], this.selectedWidget[2], x, y) && this.selectedWidget[0].isVisible) {
            return;
         } else {
            this.dispatchEvent(ctx, this.selectedWidget[0], {type: MenuItemEvents.UNHOVERED});
            this.selectedWidget = undefined;
         }
      }

      //most recently added is on top in order of popups -> bound

      const widgetList = Array.from(this.popupWidgets.entries());
      for (let i = widgetList.length-1; i >= 0; i--) {
         const [widget, [widgetX, widgetY]] = widgetList[i];
         if (this.widgetInBounds(widget, widgetX, widgetY, x, y)) {
            this.selectedWidget = [widget, widgetX, widgetY];
            this.dispatchEvent(ctx, widget, {type: MenuItemEvents.HOVERING});
            return;
         }
      }

      for (let i = this.boundWidgets.length-1; i >= 0; i--) {
         const [widget, widgetX, widgetY] = this.boundWidgets[i];

         if (this.widgetInBounds(widget, widgetX, widgetY, x, y) && widget.isVisible) {
            this.selectedWidget = [widget, widgetX, widgetY];
            this.dispatchEvent(ctx, widget, {type: MenuItemEvents.HOVERING});
            return;
         }
      }
   }
   
   private lastMouseMove: [number, number]|undefined = undefined;
   resendLastMove() {
      if (this.lastMouseMove != undefined) {
         const [x, y] = this.lastMouseMove;
         this.handleCanvasMouseEvent(this.ctx, CanvasEventTypes.MOUSE_MOVE, x, y, 0);
      }
   }
   handleCanvasMouseEvent(ctx: CanvasRenderingContext2D, event: CanvasEventTypes, x: number, y: number, button: number): boolean {
      this.lastMouseMove = [x, y];
      this.updateSelected(ctx, x, y);
      if (!this.selectedWidget) {
         if (event == CanvasEventTypes.MOUSE_CLICK) {
            for (const [popup, ] of this.popupWidgets) {
               this.dispatchEvent(ctx, popup, {type: MenuItemEvents.CLICKED_OFF});
            }
         }
         return false;
      }

      switch (event) {
         case CanvasEventTypes.MOUSE_MOVE:
         {
            const [nX, nY] = [x - this.selectedWidget[1], y - this.selectedWidget[2]];
            this.dispatchEvent(ctx, this.selectedWidget[0], {type: MenuItemEvents.MOUSE_MOVE, x: nX, y: nY});
         }
         break;

         case CanvasEventTypes.MOUSE_CLICK:
         {
            const selected = this.selectedWidget;
            if (!this.popupWidgets.has(selected[0])) {
               for (const popup of this.popupWidgets) {
                  if (selected[0] != popup[0])
                     this.dispatchEvent(ctx, popup[0], {type: MenuItemEvents.CLICKED_OFF});
               }
            }
            const [nX, nY] = [x - selected[1], y - selected[2]];
            this.dispatchEvent(ctx, selected[0], {type: MenuItemEvents.CLICKED, x: nX, y: nY, button: button});
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
class MenuButton extends ButtonBase implements WidgetManager {
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

   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, props: MenuButtonWidgetConstructor, globalProps: GlobalWidgetProperties) {
      super(ctx, parent, props, globalProps);

      this.openToRight = props.openToRight ?? false;
      this.offset = props.offset ?? 0;
      this.menu = new Menu(ctx, this, {
         width: props.menuWidth,
         height: props.menuHeight,
         drawOutline: true,
      }, globalProps);

      this.menu.bindClickedOffEvent((() => {
         this.parent.closePopup(ctx, this.menu);
         this.menuOpened = false;
      }).bind(this));
   }
   resendLastMove() {
      this.parent.resendLastMove();
   }
   buttonPressed(ctx: CanvasRenderingContext2D): void {
      const [width, height] = [super.usedWidth, super.usedHeight];
      let x = this.openToRight ? width + this.offset : 0;
      let y = this.openToRight ? 0 : height + this.offset;
      this.parent.openPopup(ctx, this.menu, x, y, this);
      this.menuOpened = true;
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
   private closeSubMenu(ctx: CanvasRenderingContext2D) {
      if (this.menuOpened) {
         this.menu.handleMenuEvent(ctx, {type: MenuItemEvents.CLICKED_OFF});
         this.parent.closePopup(ctx, this.menu);
      }
   }
   handleMenuEvent(ctx: CanvasRenderingContext2D, event: MenuItemEventData) {
      if (event.type == MenuItemEvents.CLICKED_OFF) {
         this.closeSubMenu(ctx);
      } else {
         super.handleMenuEvent(ctx, event);
      }
   }

   childUpdated(ctx: CanvasRenderingContext2D, widget?: Widget, sendToRoot?: boolean) {
      this.parent.childUpdated(ctx, widget, sendToRoot);   
   }
   addChild<
      T extends Widget,
      U extends WidgetConstructor,
   >(ctx: CanvasRenderingContext2D, cons: WidgetCreation<T, U>, props: U): T {
      return this.menu.addChild(ctx, cons, props);
   }
   openPopup(ctx: CanvasRenderingContext2D, widget: Widget, x: number, y: number, relativeChild?: Widget) {
      this.parent.openPopup(ctx, widget, x, y, relativeChild);
   }
   closePopup(ctx: CanvasRenderingContext2D, widget: Widget) {
      this.parent.closePopup(ctx, widget);
   }
   protected disableStateChange(): void {
      this.closeSubMenu(this.parent.getCtx());
   }
}

interface SeperatorWidgetConstructor extends WidgetConstructor {
   seperatorText: string,
}
class Seperator extends WidgetImpl {
   readonly handledEvents: MenuItemEvents[] = [];

   private seperatorText: string;

   protected _width?: number;
   protected _height?: number;

   private _minHeight: number = 0;

   private _text: string = "";
   private textXOffset: number = 0;
   private textYOffset: number = 0;

   set text(val: string) {this._text = val; this.fullUpdate(this.parent.getCtx())};
   get text(): string {return this._text};

   get publicProperties(): PublicPropertiesType {
      return {
         ...super.publicProperties,
         "text": [PropPerms.ReadAndSet, [PropBaseType.String]]
      }
   }

   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, props: SeperatorWidgetConstructor, globalProps: GlobalWidgetProperties) {
      super(globalProps, parent, {});
      
      this.seperatorText = props.seperatorText;

      this._width = props.width;
      this._height = props.height;

      this.updateText(ctx);
   }
   fullUpdate(ctx: CanvasRenderingContext2D) {
      this.updateText(ctx);
   }

   delete(ctx: CanvasRenderingContext2D) {
      this.parent.handleDelete(ctx, this);
      return [this];
   }
   private updateText(ctx: CanvasRenderingContext2D) {
      ctx.save();

      ctx.font = this.globalProps.widgetTextFont;
      const metrics = ctx.measureText(this.seperatorText);

      const repeats = Math.floor(this.usedWidth/metrics.width);
      const width = repeats*metrics.width;
      const height = metrics.actualBoundingBoxAscent;
      this._minHeight = height;

      this._text = this.seperatorText.repeat(repeats);

      this.textXOffset = (this.usedWidth - width)/2.0;
      this.textYOffset = (this.usedHeight + height)/2.0;
      

      ctx.restore();
   }


   get minWidth() {
      return 0;
   }

   get minHeight() {
      if (this._width == 0) {
         return 0;
      } else {
         return this._minHeight;
      }
   }

   render(ctx: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0) {
      if (!this._isVisible)
         return;

      ctx.save();

      ctx.font = this.globalProps.widgetTextFont;
      ctx.fillStyle = this.globalProps.textColor;

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
   protected propagateUpdate(ctx?: CanvasRenderingContext2D): void {
      this.updateText(ctx ?? this.parent.getCtx());
   }
   protected disableStateChange(): void {
      //Do nothing, seperator can't really be disabled...
   }
}


interface CheckBoxWidgetConstructor extends WidgetConstructor {
   text: string;
}
class CheckBox extends ButtonBase implements WidgetEvents {
   private callbacks: Set<(ctx: CanvasRenderingContext2D, selected: boolean) => void> = new Set();

   private _selected = false;

   setSelected(val: boolean, supressEventPassdown: boolean = false, ctx?: CanvasRenderingContext2D) {
      if (val == this._selected) return;
      this._selected = val;
      //prefixText uses builtin getter/setter to auto update properties
      super.prefixText = this.globalProps[this._selected ? "checkBoxCheckedPrefix" : "checkBoxUncheckedPrefix"];
      
      if (!supressEventPassdown) {
         const n_ctx = ctx ?? this.parent.getCtx();
         for (const callback of this.callbacks) {
            callback(n_ctx, this._selected);
         }
      }
         
   }
   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, cons: ButtonWidgetConstructor, globalProps: GlobalWidgetProperties) {
      super(ctx, parent, cons, globalProps);

      super.prefixText = globalProps.checkBoxUncheckedPrefix;
   }

   buttonPressed(ctx: CanvasRenderingContext2D): void {
      this.setSelected(!this._selected, false, ctx);
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
class RadioItem extends ButtonBase implements WidgetEvents {
   private callbacks: Set<(ctx: CanvasRenderingContext2D, selected: boolean) => void> = new Set();

   private _selected = true;
   private radioGroup: RadioItemGroup;

   constructor(ctx: CanvasRenderingContext2D, parent: WidgetManager, cons: ButtonWidgetConstructor, globalProps: GlobalWidgetProperties) {
      super(ctx, parent, cons, globalProps);

      this.radioGroup = new RadioItemGroup(this, this.deselect.bind(this), this.setRadioGroup.bind(this));

      super.prefixText = globalProps.radioMenuCheckedPrefix;
   }

   buttonPressed(ctx: CanvasRenderingContext2D): void {
      if (!this._selected) {
         this.makeSelected(true, ctx);
      }
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
   RadioItem,
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
      | [WidgetType.RadioItem, RadioItem]
      | [WidgetType.SubMenu, MenuButton]
      | [WidgetType.CheckBox, CheckBox]
   > = new Map();
   
   readonly manager: RootWidgetManager;
   readonly menu: MenuBar;

   widgetSettings: GlobalWidgetProperties = {
      borderColor: "#B0B0B0",
      selectedColor: "#D0D0D0",
      disabledColor: "#808080",
      disabledTextColor: "#D0D0D0",
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
      twrWindowMenuWidgetSetVisibility: {},
      twrWindowMenuRadioItemMerge: {},
      twrWindowMenuWidgetSetProp: {},
      twrWindowMenuWidgetGetProp: {isAsyncFunction: true},
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

      this.appCanvasHeight = Math.floor(canvas.height - BORDER_SIZE - TOP_BAR_SIZE);
      this.appCanvasWidth = Math.floor(canvas.width - BORDER_SIZE*2.0);


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

      const menuBarCons: MenuWidgetConstructor = {
         height: TOP_BAR_SIZE - 2,
      };
      this.menu = this.manager.addChild(this.ctx, MenuBar, menuBarCons, this.widgetSettings, BORDER_SIZE + MENU_PADDING_X, 0);
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


      const menuOptions: MenuWidgetConstructor = {
      };

      const button: MenuButton = this.menu.addChild(this.ctx, MenuButton, {
         height: TOP_BAR_SIZE - 0.5,
         text: text,
         textColor: "black",
         buttonColor: "#B0B0B0",
         selectedButtonColor: "#D0D0D0",
         menuOptions: menuOptions,
         offset: 0.5,
         reservePrefixSpace: false,
      });

      this.widgets.set(button.id, [WidgetType.SubMenu, button]);


      return button.id;
   }

   twrWindowMenuAddWidget(mod: IWasmModuleAsync | IWasmModule, menuID: number, consPtr: number): number {
      if (!this.widgets.has(menuID)) throw new Error(`twrWindowMenuAddWidget was given an invalid menu ID (${menuID})!`);
      const widgetBase = this.widgets.get(menuID)!;
      if (widgetBase[0] != WidgetType.SubMenu)
         throw new Error(`twrWindowMenuAddWidget was given a non-menu (${WidgetType[widgetBase[0]]}) widget as a menu!`);

      const menu = widgetBase[1];

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
            };
            const widget: Button = menu.addChild(this.ctx, Button, button);
            this.widgets.set(widget.id, [WidgetType.Button, widget]);
            return widget.id;
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
            };
            const widget: Seperator = menu.addChild(this.ctx, Seperator, seperator);
            this.widgets.set(widget.id, [WidgetType.Seperator, widget]);
            return widget.id;
         }
         break;

         case WidgetType.RadioItem:
         {
            // struct twr_widget_button_constructor {
            //    /// @brief Base widget constructor
            //    struct twr_widget_constructor base;
            //    /// @brief defaults to "Lorem Ipsum"
            //    const char* text;
            // };

            const cons: ButtonWidgetConstructor = {
               width: width,
               height: height,
               text: getStringOrDef(extraPtr + 0, "Lorem Ipsum"),
            };
            const radioItem: RadioItem = menu.addChild(this.ctx, RadioItem, cons);
            this.widgets.set(radioItem.id, [WidgetType.RadioItem, radioItem]);
            return radioItem.id;
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
               menuWidth: getLongOrDef(extraPtr + 4, undefined),
               menuHeight: getLongOrDef(extraPtr + 8, undefined),

               offset: this.widgetSettings.subMenuOpenOffset,
               openToRight: true,
               suffixText: "▶",
            };
            const subMenu: MenuButton = menu.addChild(this.ctx, MenuButton, cons);
            this.widgets.set(subMenu.id, [WidgetType.SubMenu, subMenu]);
            return subMenu.id;
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
            };
            const widget: CheckBox = menu.addChild(this.ctx, CheckBox, props);
            this.widgets.set(widget.id, [WidgetType.CheckBox, widget]);
            return widget.id;
         }
         break;

         default:
         {
            throw new Error(`twrWindowMenuAddWidget: Error! Was given an unknown type (${type})!`);
         }
         break;
      }

      // return id;
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

         case WidgetType.RadioItem:
         {
            const radioItem: RadioItem = widget[1];
            radioItem.addEvent((ctx: CanvasRenderingContext2D, selected: boolean) => {
               mod.postEvent(eventID, extraPtr, selected ? 1 : 0);
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

   twrWindowMenuRadioItemMerge(mod: IWasmModuleAsync | IWasmModule, widgetID1: number, widgetID2: number) {
      const widget1 = this.widgets.get(widgetID1);
      const widget2 = this.widgets.get(widgetID2);
      if (widget1 == undefined) throw new Error(`twrWindowMenuRadioItemMerge: Error! was given an invalid widgetID1 (${widgetID1})`);
      if (widget2 == undefined) throw new Error(`twrWindowMenuRadioItemMerge: Error! was given an invalid widgetID2 (${widgetID2})`);

      if (widget1[0] != WidgetType.RadioItem) throw new Error(`twrWindowMenuRadioItemMerge: Error! was given an invalid widget1 type! Got ${WidgetType[widget1[0]]}, expected RadioItem!`);
      if (widget2[0] != WidgetType.RadioItem) throw new Error(`twrWindowMenuRadioItemMerge: Error! was given an invalid widget2 type! Got ${WidgetType[widget2[0]]}, expected RadioItem!`);

      widget1[1].mergeGroups(widget2[1]);
   }


   twrWindowMenuWidgetSetVisibility(mod: IWasmModuleAsync | IWasmModule, widgetID: number, visibility: number) {
      if (!this.widgets.has(widgetID)) throw new Error(`twrWindowMenuWidgetSetVisibility: Error! was given an invalid widgetID (${widgetID})`);
      const widget = this.widgets.get(widgetID)!;

      widget[1].isVisible = visibility > 0 ? true : false;
   }

   private checkValiditity(propField: [PropPerms, PropType], propName: string, typ: PropBaseType, widget: [WidgetType, Widget]) {
      if (propField[1][0] == typ)
         return;
      else if (propField[1][0] == PropBaseType.Combination && propField[1].includes(typ)) {
         return;
      } else {
         throw new Error(`twrWindowMenuWidgetSetProp: Property "${propName}" does not accept type ${PropBaseType[typ] ?? typ} in widget ${widget[1].id} of type ${WidgetType[widget[0]] ?? widget[0]}`);
      }
   }

   twrWindowMenuWidgetSetProp(mod: IWasmModuleAsync | IWasmModule, widgetID: number, propNamePtr: number, dataPtr: number) {
      /* struct JSPropVal {
         enum JSPropValType type;
         const void* val;
      }*/
      const widget = this.widgets.get(widgetID);
      if (widget == undefined) throw new Error(`twrWindowMenuWidgetSetProp: Error! was given an invalid widgetID (${widgetID})`);
      
      const propName = mod.getString(propNamePtr);
      const propField = widget[1].publicProperties[propName];
      if (propField == undefined) throw new Error(`twrWindowMenuWidgetSetProp: Couldn't find prop name "${propName}" in widget ${widgetID} of type ${WidgetType[widget[0]] ?? widget[0]}`);
      if (propField[0] == PropPerms.ReadOnly) throw new Error(`twrWindowMenuWidgetSetProp: Property "${propName}" is read only in widget ${widgetID} of type ${WidgetType[widget[0]] ?? widget[0]}`);
      
      const typ = mod.getLong(dataPtr + 8) as PropBaseType;
      const valPtr = dataPtr;
      
      console.log(`Attempting to modify ${propName} in widget ${widgetID}`);
      switch (typ) {
         case PropBaseType.String: 
         {
            this.checkValiditity(propField, propName, typ, widget);

            let str;
            const strPtr = mod.getLong(valPtr);
            if (strPtr == 0) {
               console.log("twrwindowMenuWidgetSetProp: Warning! Given a null ptr for string, default to empty string.");
               str = "";
            } else {
               str = mod.getString(strPtr);
            }

            (widget[1] as any)[propName] = str;
         }
         break;
         case PropBaseType.Boolean:
         {
            this.checkValiditity(propField, propName, typ, widget);

            let val = mod.getLong(valPtr) != 0;
            (widget[1] as any)[propName] = val;
         }
         break;
         case PropBaseType.Number:
         {
            this.checkValiditity(propField, propName, typ, widget);

            (widget[1] as any)[propName] = mod.getDouble(valPtr);
         }
         break;
         case PropBaseType.Undefined:
         {
            this.checkValiditity(propField, propName, typ, widget);
            (widget[1] as any)[propName] = undefined;
         }
         break;
         default: 
         {
            throw new Error(`twrWindowMenuWidgetSetProp: Was given an invalid prop type. Expected a String (${PropBaseType.String}), Number (${PropBaseType.Number}), Boolean (${PropBaseType.Boolean}) or Undefined (${PropBaseType.Undefined})`);
         }
         break;
      }
   }

   private twrWindowMenuWidgetGetPropPart1(mod: IWasmModuleAsync | IWasmModule, widgetID: number, propNamePtr: number): GetPropVal {
      /* struct JSPropVal {
         enum JSPropValType type;
         const void* val;
      }*/
      const widget = this.widgets.get(widgetID);
      if (widget == undefined) throw new Error(`twrWindowMenuWidgetGetProp: Error! was given an invalid widgetID (${widgetID})`);
      
      const propName = mod.getString(propNamePtr);
      const propField = widget[1].publicProperties[propName];
      if (propField == undefined) throw new Error(`twrWindowMenuWidgetGetProp: Couldn't find prop name "${propName}" in widget ${widgetID} of type ${WidgetType[widget[0]] ?? widget[0]}`);
      if (propField[0] == PropPerms.SetOnly) throw new Error(`twrWindowMenuWidgetGetProp: Property "${propName}" is set only in widget ${widgetID} of type ${WidgetType[widget[0]] ?? widget[0]}`);

      const val = (widget[1] as any)[propName];
      switch (typeof val) {
         case "string":
            return [PropBaseType.String, val];
         case "number":
            return [PropBaseType.Number, val];
         case "boolean":
            return [PropBaseType.Boolean, val];
         case "undefined":
            return [PropBaseType.Undefined];
         default:
            throw new Error(`twrWindowMenuWidgetGetProp: Internal Error! Got unexpected type from property "${propName}" in Widget ${widgetID} of type ${WidgetType[widget[0]] ?? widget[0]}`);
      }
   }

   private twrWindowMenuWidgetGetPropPart2(mod: IWasmModuleAsync | IWasmModule, retPtr: number, data: AllocGetPropVal) {
      const valPtr = retPtr + 0;
      const typePtr = retPtr + 8;
      switch (data[0]) {
         case PropBaseType.String:
         {
            mod.setLong(valPtr, data[2]);
         }
         break;
         case PropBaseType.Number:
         {
            mod.setDouble(valPtr, data[1]);
         }
         break;
         case PropBaseType.Undefined:
         break;
         case PropBaseType.Boolean:
         {
            mod.setLong(valPtr, data[1] ? 1 : 0);
         }
         break;
         default:
            throw new Error(`internal error, shouldn't be possible`);
      }
      mod.setLong(typePtr, data[0]);
   }

   twrWindowMenuWidgetGetProp(mod: IWasmModule, widgetID: number, propNamePtr: number) {
      const val = this.twrWindowMenuWidgetGetPropPart1(mod, widgetID, propNamePtr);
      
      let alloc: AllocGetPropVal;
      if (val[0] == PropBaseType.String)
         alloc = [val[0], val[1], mod.putString(val[1])]
      else
         alloc = val;

      //in struct, max unioned type is a double (8 bytes)
      //and the type enum is a long (4 bytes)
      const retPtr = mod.malloc(8 + 4);

      this.twrWindowMenuWidgetGetPropPart2(mod, retPtr, alloc);

      return retPtr;
   }
   async twrWindowMenuWidgetGetProp_async(mod: IWasmModuleAsync, widgetID: number, propNamePtr: number) {
      const val = this.twrWindowMenuWidgetGetPropPart1(mod, widgetID, propNamePtr);
   
      let alloc: AllocGetPropVal;
      if (val[0] == PropBaseType.String)
         alloc = [val[0], val[1], await mod.putString(val[1])]
      else
         alloc = val;

      //in struct, max unioned type is a double (8 bytes)
      //and the type enum is a long (4 bytes)
      const retPtr = await mod.malloc(8 + 4);

      this.twrWindowMenuWidgetGetPropPart2(mod, retPtr, alloc);

      return retPtr;
   }

   twrWindowMenuWidgetGetPropTypes(mod: IWasmModuleAsync | IWasmModule, widgetID: number, propNamePtr: number) {
      const widget = this.widgets.get(widgetID);
      if (widget == undefined) throw new Error(`twrWindowMenuWidgetGetPropTypes: Error! was given an invalid widgetID (${widgetID})`);
      
      const propName = mod.getString(propNamePtr);
      const propField = widget[1].publicProperties[propName];
      if (propField == undefined) throw new Error(`twrWindowMenuWidgetGetPropTypes: Couldn't find prop name "${propName}" in widget ${widgetID} of type ${WidgetType[widget[0]] ?? widget[0]}`);
      
      function getPropTypes(propType: PropType): number {
         switch (propType[0]) {
            case PropBaseType.Combination:
            {
               let out = 0;
               for (let i = 1; i < propType.length; i++) {
                  const typ = propType[i];
                  if (typ == PropBaseType.Undefined) {
                     out &= PropBaseType.Undefined;
                  } else {
                     out &= getPropTypes([typ]);
                  }
               }
               return out;
            }

            case PropBaseType.Boolean:
            case PropBaseType.Number:
            case PropBaseType.String:
            {
               return propType[0] as number;
            }
            
            default:
               throw new Error(`twrWindowMenuWidgetGetPropTypes: Error! was given unexpected prop type: ${PropBaseType[propType[0]] ?? propType[0]}!`);
         }
      }

      return getPropTypes(propField[1]);
   }

   twrWindowMenuWidgetGetPropType(mod: IWasmModuleAsync | IWasmModule, widgetID: number, propNamePtr: number) {
      const widget = this.widgets.get(widgetID);
      if (widget == undefined) throw new Error(`twrWindowMenuWidgetGetPropType: Error! was given an invalid widgetID (${widgetID})`);
      
      const propName = mod.getString(propNamePtr);
      const propField = widget[1].publicProperties[propName];
      if (propField == undefined) throw new Error(`twrWindowMenuWidgetGetPropType: Couldn't find prop name "${propName}" in widget ${widgetID} of type ${WidgetType[widget[0]] ?? widget[0]}`);
      if (propField[0] == PropPerms.SetOnly) throw new Error(`twrWindowMenuWidgetGetPropType: Property "${propName}" is set only in widget ${widgetID} of type ${WidgetType[widget[0]] ?? widget[0]}`);
      
      function assertFine(typ: PropBaseType) {
         if (!(
            propField[1][0] == typ
            || (
               propField[1][0] == PropBaseType.Combination
               && propField[1].includes(typ)
            )
         )) {
            throw new Error(`twrWindowMenuWidgetGetPropType: Internal error! Widget property was of type ${PropBaseType[typ] ?? typ} but was expecting: ${propField[1]}`);
         }
      }
      switch (typeof (widget as any)[propName]) {
         case "boolean":
            assertFine(PropBaseType.Boolean);
            return PropBaseType.Boolean;
         case "string":
            assertFine(PropBaseType.String);
            return PropBaseType.String;
         case "undefined":
            assertFine(PropBaseType.Undefined);
            return PropBaseType.Undefined;
         case "number":
            assertFine(PropBaseType.Number);
            return PropBaseType.Number;
         default:
            throw new Error(`twrWindowMenuWidgetGetPropType: Internal error! property was of type: ${typeof (widget as any)[propName]}`)
      }
   }

   twrWindowMenuWidgetGetPropAccess(mod: IWasmModuleAsync | IWasmModule, widgetID: number, propNamePtr: number) {
      const widget = this.widgets.get(widgetID);
      if (widget == undefined) throw new Error(`twrWindowMenuWidgetGetPropAccess: Error! was given an invalid widgetID (${widgetID})`);
      
      const propName = mod.wasmMem.getString(propNamePtr);
      const propField = widget[1].publicProperties[propName];
      if (propField == undefined) throw new Error(`twrWindowMenuWidgetGetPropAccess: Couldn't find prop name "${propName}" in widget ${widgetID} of type ${WidgetType[widget[0]] ?? widget[0]}`);
      
      return propField[0] as number;
   }

   twrWindowMenuWidgetListProps(mod: IWasmModule, widgetID: number, lengthPtr: number) {
      const widget = this.widgets.get(widgetID);
      if (widget == undefined) throw new Error(`twrWindowMenuWidgetListProps: Error! was given an invalid widgetID (${widgetID})`);

      const props = [];
      let totalSize = 0;
      for (const name in widget[1].publicProperties) {
         const ru8=mod.wasmMem.stringToU8(name);
         // const strIndex:number=this.malloc(ru8.length+1);
         // this.mem8u.set(ru8, strIndex);
         // this.mem8u[strIndex+ru8.length]=0;
   
         totalSize += ru8.length + 1;
         props.push(ru8);
      }
      totalSize += props.length * 4;
      mod.wasmMem.setLong(lengthPtr, props.length);

      const alloc = mod.malloc(totalSize);
      let offset = props.length*4;
      for (let i = 0; i < props.length; i++) {
         mod.wasmMem.setDouble(i * 4, offset);
         mod.wasmMem.mem8u.set(props[i], offset);
         mod.wasmMem.mem8u[offset+props[i].length] = 0; //null ptr at end
         offset += props[i].length + 1;
      }

      return alloc

   }



}

