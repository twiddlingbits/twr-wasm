import { TLibImports, twrLibrary } from "./twrlibrary";
import { IWasmModule } from "./twrmod";
import { IWasmModuleAsync } from "./twrmodasync";

export class twrAudio extends twrLibrary {
   imports: TLibImports;
   
   // audioObjects: (
      
   // )[] = [];
   constructor() {
      super();
      this.imports = {
         "twrAudioFromSamples": {}
      };
   }

   twrAudioFromSamples(mod: IWasmModuleAsync|IWasmModule, num_channels: number, length: number, sample_rate: number) {
      console.log("twrAudioFromSamples " + num_channels + ", " + length + ", " + sample_rate);
   }
}