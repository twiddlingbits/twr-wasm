import { twrLibrary } from "./twrlibrary";
import { IWasmModule } from "./twrmod";
import { IWasmModuleAsync } from "./twrmodasync";

export class twrAudio extends twrLibrary {
   imports: string[];

   audioObjects: (
      
   )[] = [];
   constructor() {
      super();
      this.imports = [
         "twrLibAudioFromSamples"
      ];
   }

   AudioFromSamples(num_channels: number, length: number, sample_rate: number, mod: IWasmModuleAsync|IWasmModule) {
      
   }
}