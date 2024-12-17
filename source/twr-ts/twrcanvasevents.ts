import { keyEventToCodePoint } from "./twrcon.js";

export enum CanvasEventTypes {
   KEY_DOWN,
   KEY_UP,

   MOUSE_DOWN,
   MOUSE_UP,
   MOUSE_CLICK,
   MOUSE_DBLCLICK,
   MOUSE_MOVE,

   WHEEL,

   ANIMATION_FRAME
}
export const NUM_CANVAS_EVENTS = Object.values(CanvasEventTypes).length;

export const CANVAS_EVENTS = [
   "keydown",
   "keyup",
   
   "mousedown",
   "mouseup",
   "click",
   "dblclick",
   "mousemove",

   "wheel",

   "ANIMATION_FRAME"
];

export interface ICanvasEvents {
   /// Get canvas key events, return True to intercept event and stop it from being passed along
   handleCanvasKeyEvent: (event: CanvasEventTypes, key: number) => boolean;
   /// Get canvas mouse events, return True to intercept event and stop it from being passed along
   handleCanvasMouseEvent: (event: CanvasEventTypes, x: number, y: number) => boolean;
   /// Get canvas wheel events, return True to intercept event and stop it from being passed along
   handleCanvasWheelEvent: (event: CanvasEventTypes, deltaX: number, deltaY: number, deltaZ: number, deltaMode: number) => boolean;
   /// Get canvas animation frame events
   handleCanvasAnimationFrameEvent: (event: CanvasEventTypes, delta: number) => void;
}

function registerSimilarEvents(canvas: HTMLCanvasElement, start: CanvasEventTypes, end: CanvasEventTypes, handler: (eventType: CanvasEventTypes) => (event: any) => void) {
   for (let i = start; i <= end; i++) {
      canvas.addEventListener(CANVAS_EVENTS[i], handler(i));
   }
}
export function bindCanvasEvents(handler: ICanvasEvents, canvas: HTMLCanvasElement) {
   registerSimilarEvents(canvas, CanvasEventTypes.KEY_DOWN, CanvasEventTypes.KEY_UP, 
      (type) => (e: KeyboardEvent) => {
         console.log(e);
         const r=keyEventToCodePoint(e);  // twr-wasm utility function
         if (r) {
            handler.handleCanvasKeyEvent(type, r);
         }
      }
   );

   const bounding = canvas.getBoundingClientRect();
   const top = bounding.top + window.scrollY;
   const left = bounding.left + window.scrollX;
   registerSimilarEvents(canvas, CanvasEventTypes.MOUSE_DOWN, CanvasEventTypes.MOUSE_MOVE,
      (type) => (e: MouseEvent) => {
         handler.handleCanvasMouseEvent(
            type,
            e.pageX - left,
            e.pageY - top
         );
      }
   );

   canvas.addEventListener("wheel", (e: WheelEvent) => {
      handler.handleCanvasWheelEvent(CanvasEventTypes.WHEEL, e.deltaX, e.deltaY, e.deltaZ, e.deltaMode);
   });

   const animation_loop = (delta: number) => {
      handler.handleCanvasAnimationFrameEvent(CanvasEventTypes.ANIMATION_FRAME, delta);
      requestAnimationFrame(animation_loop);
   };
   requestAnimationFrame(animation_loop);
}