import { keyEventToCodePoint } from "./twrcon.js";

export enum CanvasEventTypes {
   KEY_DOWN,
   KEY_UP,

   MOUSE_DOWN,
   MOUSE_UP,
   MOUSE_CLICK,
   MOUSE_DBLCLICK,
   MOUSE_MOVE,

   WHEEL
}
export const NUM_CANVAS_EVENTS = CanvasEventTypes.WHEEL - CanvasEventTypes.KEY_DOWN + 1;

export const CANVAS_EVENTS = [
   "keydown",
   "keyup",
   
   "mousedown",
   "mouseup",
   "click",
   "dblclick",
   "mousemove",

   "wheel"
];

export interface ICanvasEvents {
   handleCanvasKeyEvent: (event: CanvasEventTypes, key: number) => void;
   handleCanvasMouseEvent: (event: CanvasEventTypes, x: number, y: number) => void;
   handleCanvasWheelEvent: (event: CanvasEventTypes, deltaX: number, deltaY: number, deltaZ: number, deltaMode: number) => void;
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
            e.pageX - left - window.scrollX,
            e.pageY - top - window.scrollY
         );
      }
   );

   canvas.addEventListener("wheel", (e: WheelEvent) => {
      handler.handleCanvasWheelEvent(CanvasEventTypes.WHEEL, e.deltaX, e.deltaY, e.deltaZ, e.deltaMode);
   });
}