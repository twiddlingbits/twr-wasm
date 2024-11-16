
import { keyEventToCodePoint } from "./twrcon.js";
import { TLibImports, twrLibrary, twrLibraryInstanceRegistry } from "./twrlibrary.js";
import { IWasmModule } from "./twrmod";
import { IWasmModuleAsync } from "./twrmodasync";



//nominal type - Allows FullID to be considered a unique type compared to number
//can easily remove { readonly '': unique symbol } to make it a simple type alias
// type FullID = number & { readonly '': unique symbol };

type FullID = number;

enum EventTypes {
   KEY_DOWN,
   KEY_UP,

   MOUSE_DOWN,
   MOUSE_UP,
   MOUSE_CLICK,
   MOUSE_DBLCLICK,
   MOUSE_MOVE,

   WHEEL
}
const NUM_EVENTS = EventTypes.WHEEL - EventTypes.KEY_DOWN + 1;

const EVENTS = [
   "keydown",
   "keyup",
   
   "mousedown",
   "mouseup",
   "click",
   "dblclick",
   "mousemove",

   "wheel"
]


function calculateID(mod:IWasmModule|IWasmModuleAsync, id: number): FullID {
   if (mod.id >= (2**20)) throw new Error("twrlibaudio was given a module ID greater than 20 bits long!");
   if (id >= (2**32)) throw new Error("twrlibaudio was given an object ID greater than 32 bits!");
   //should be equivalent to (mod.id << 32) | id
   //can't use shift operations without being limited to 32-bit signed integers or using bignumber
   return ((mod.id & (2**20 - 1)) * 2**32 + id) as FullID;
}

export default class twrLibAudio extends twrLibrary {
   id: number;

   readonly canvas: HTMLCanvasElement;

   imports: TLibImports = {
      
   };
   
   tabs: { [id: FullID]: [IWasmModule|IWasmModuleAsync, ...any] } = {};
   registeredEvents: Map<number, Array<Map<number, number>>> = new Map();
   selectedTab: number = -1;

   // every library should have this line
   libSourcePath = new URL(import.meta.url).pathname;

   constructor(canvas: HTMLCanvasElement) {
      // all library constructors should start with these two lines
      super();
      this.id=twrLibraryInstanceRegistry.register(this);

      this.canvas = canvas;

      
      const register_similar_events = (rangeStart: number, rangeEnd: number, handler: (e: any) => number[] | void) => {
         for (let i = rangeStart; i <= rangeEnd; i++) {
            canvas.addEventListener(EVENTS[i], (e) => {
               const res = handler(e);
               if (res != undefined)
                  this.internalSendEvent(i, ...res);
            });
         };
      }

      register_similar_events(EventTypes.KEY_DOWN, EventTypes.KEY_UP, (e: KeyboardEvent) => {
         const r=keyEventToCodePoint(e);  // twr-wasm utility function
         if (r) {
            // postEvent can only post numbers -- no translation of arguments is performed prior to making the C event callback
            // See ex_append_two_strings below for an example using strings.
            return [r];
         }
      });

      register_similar_events(EventTypes.MOUSE_DOWN, EventTypes.MOUSE_MOVE, (e: MouseEvent) => {
         return [e.pageX + window.scrollX, e.pageY + window.scrollY];
      });

      register_similar_events(EventTypes.WHEEL, EventTypes.WHEEL, (e: WheelEvent) => {
         return [e.deltaX, e.deltaY, e.deltaZ, e.deltaMode];
      });

   }

   internalSendEvent(event_type: EventTypes, ...args: number[]) {
      const event_types = this.registeredEvents.get(this.selectedTab);
      if (event_types == undefined) return;

      const event_handlers = event_types[event_type];

      for (const [i, _] of event_handlers) {
         this.tabs[this.selectedTab][0].postEvent(
            i,
            ...args
         );
      } 
   }

   twrRegisterEvent(mod: IWasmModule|IWasmModuleAsync, tabID: number, eventType: EventTypes, eventID: number) {
      if (0 < eventType || eventType >= NUM_EVENTS) throw new Error(`twrRegisterEvent was given an out of bounds event type (${eventType})!`);

      const fullTabID = calculateID(mod, tabID);
      
      const tabEvents = this.registeredEvents.get(tabID);
      if (tabEvents == undefined) throw new Error(`twrRegisterEvent was given an unregistered tab (${tabID})!`);

      const eventHandlers = tabEvents[eventType];
      
      const prevValTmp = eventHandlers.get(eventID);
      const prevVal = prevValTmp == undefined ? 0 : prevValTmp;
      if (prevValTmp != undefined) console.log("warning! twrRegisterEvent was given an already registered eventID!");

      eventHandlers.set(eventID, prevVal+1);
   }

   twrUnregisterEvent(mod: IWasmModule|IWasmModuleAsync, tabID: number, eventType: EventTypes, eventID: number) {
      if (0 < eventType || eventType >= NUM_EVENTS) throw new Error(`twrUnregisterEvent was given an out of bounds event type (${eventType})!`);

      const fullTabID = calculateID(mod, tabID);
      
      const tabEvents = this.registeredEvents.get(tabID);
      if (tabEvents == undefined) throw new Error(`twrUnregisterEvent was given an unregistered tab (${tabID})!`);

      const eventHandlers = tabEvents[eventType];

      const prevVal = eventHandlers.get(eventID);

      if (prevVal == undefined) {
         throw new Error(`twrUnregisterEvent was given an eventID that isn't registered (${eventID})!`);
      } else if (prevVal == 0) {
         throw new Error(`twrUnregisterEvent was given an eventID that isn't registered (${eventID}) and it wasn't properly removed!`);
      } else if (prevVal == 1) {
         eventHandlers.delete(prevVal);
      } else {
         console.log(`warning: twrUnregisterEvent didn't unregister eventID ${eventID} since it still has ${prevVal-1} registration(s) left!`);
         eventHandlers.set(eventID, prevVal-1);
      }
   }


}