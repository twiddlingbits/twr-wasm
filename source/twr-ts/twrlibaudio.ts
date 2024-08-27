import { TLibImports, twrLibrary } from "./twrlibrary.js";
import { IWasmModule } from "./twrmod";
import { IWasmModuleAsync } from "./twrmodasync";

enum NodeType {
   AudioBuffer,
   HTMLAudioElement,
}
type Node = [NodeType.AudioBuffer, AudioBuffer]
   | [NodeType.HTMLAudioElement, HTMLAudioElement];


type PlaybackNode = [NodeType.AudioBuffer, AudioBufferSourceNode, number]
   | [NodeType.HTMLAudioElement, HTMLAudioElement];

export default class twrLibAudio extends twrLibrary {
   imports: TLibImports = {
      "twrAudioFromSamples": {},
      "twrPlayAudioNode": {},
      "twrAppendAudioSamples": {},
      "twrQueryAudioPlaybackPosition": {},
      "twrLoadAudioAsync": {isAsyncFunction: true, isModuleAsyncOnly: true},
   };
   nextID: number = 0;
   nextPlaybackID: number = 0;
   context: AudioContext = new AudioContext();
   nodes: Node[] = [];
   playbacks: PlaybackNode[] = [];
   



   //loads audio from samples using createBuffer and then loading the given data in
   //data is expected to be a 2d array of channels with data length equal to singleChannelDataLen
   //so if len is 10 and channels is 1, data is of total length 10
   //if len is 10 and channels is 2, data is of total length 20, etc.
   twrAudioFromSamples(mod: IWasmModuleAsync|IWasmModule, numChannels: number, sampleRate: number, dataPtr: number, singleChannelDataLen: number) {
      const arrayBuffer = this.context.createBuffer(
         numChannels,
         singleChannelDataLen,
         sampleRate
      );

      for (let channel = 0; channel < numChannels; channel++) {
         const channelBuff = arrayBuffer.getChannelData(channel);
         const startPos = dataPtr/4.0 + channel*singleChannelDataLen;
         channelBuff.set(mod.wasmMem.memF!.slice(startPos, startPos + singleChannelDataLen));
      }

      

      const id = this.nextID++;
      this.nodes[id] = [NodeType.AudioBuffer, arrayBuffer];

      return id;
   }

   //starts playing an audio node,
   //all nodes are cloned by default so they can be played multiple times
   //therefor, a new playback_id is returned for querying status
   twrPlayAudioNode(mod: IWasmModuleAsync|IWasmModule, nodeID: number) {
      if (!(nodeID in this.nodes)) throw new Error(`twrLibAudio twrPlayAudioNode was given a non-existant nodeID (${nodeID})!`);

      const node = this.nodes[nodeID];

      switch (node[0]) {
         case NodeType.AudioBuffer:
         {
            let id = this.nextPlaybackID++;
            const buffer = node[1] as AudioBuffer;
            const source = this.context.createBufferSource();
            source.buffer = buffer;

            source.connect(this.context.destination);

            source.onended = () => {
               console.log("twrPlayAudioNode finished playback!");
               delete this.playbacks[id];
            }
            source.start();

            

            this.playbacks[id] = [NodeType.AudioBuffer, source, (new Date()).getTime()];
            return id;
         }
         break;

         case NodeType.HTMLAudioElement:
         {
            let id = this.nextPlaybackID++;
            const audio = (node[1].cloneNode(true)) as HTMLAudioElement;
            audio.play();
            audio.onended = () => {
               console.log(`twrPlayAudioNode finished playback! ${audio.currentTime}`);
               delete this.playbacks[id];
            }
            this.playbacks[id] = [NodeType.HTMLAudioElement, audio];
            return id;
         }
         break;

         default:
            throw new Error(`twrPlayAudioNode unknown type! ${node[0]}`);
      }
   }

   twrAppendAudioSamples(mod: IWasmModuleAsync|IWasmModule, nodeID: number, numChannels: number, buffer: number, singleChannelDataLen: number) {
      if (!(nodeID in this.nodes)) throw new Error(`twrLibAudio twrAppendAudioSamples was given a non-existant nodeID (${nodeID})!`);

      const node = this.nodes[nodeID];

      if (node[0] != NodeType.AudioBuffer) throw new Error(`twrLibAudio twrAppendAudioSamples node (${nodeID}) was of type ${NodeType[node[0]]}, expected AudioBuffer!`);

      const prev_buffer = node[1] as AudioBuffer;
      const new_len = prev_buffer.length + singleChannelDataLen;
      
      if (numChannels != prev_buffer.numberOfChannels) throw new Error(`twrLibAudio twrAppendAudioSamples can't append samples with a different number of channels! ${prev_buffer.numberOfChannels} != ${numChannels}`);

      const arrayBuffer = this.context.createBuffer(
         prev_buffer.numberOfChannels,
         new_len,
         prev_buffer.sampleRate
      );

      for (let channel = 0; channel < prev_buffer.numberOfChannels; channel++) {
         const channelBuff = arrayBuffer.getChannelData(channel);
         channelBuff.set(prev_buffer.getChannelData(channel));
         const startPos = buffer/4.0 + channel*singleChannelDataLen;
         channelBuff.set(mod.wasmMem.memF!.slice(startPos, startPos + singleChannelDataLen), prev_buffer.length);

         console.log(channelBuff);
      }

      this.nodes[nodeID][1] = arrayBuffer;
   }

   //queries current playback positions
   //if the given ID doesn't exist, assume it was removed because it ended and return -1
   twrQueryAudioPlaybackPosition(mod: IWasmModuleAsync|IWasmModule, playbackID: number) {
      if (!(playbackID in this.playbacks)) return -1;

      const playback = this.playbacks[playbackID];

      switch (playback[0]) {
         case NodeType.AudioBuffer:
         {
            return ((new Date()).getTime() - playback[2]);
         }
         break;

         case NodeType.HTMLAudioElement:
         {
            const time = Math.round(playback[1].currentTime*1000)
            console.log(`twrQueryAduioPlaybackPosition: ${time}`);
            return time;
            // return 1.5;
            //return Math.round(playback[1].currentTime/1000);
         }
         break;

         default:
            throw new Error(`twrQueryAudioPlaybackPosition unknown type! ${playback[0]}`);
      }
   }

   async twrLoadAudioAsync_async(mod: IWasmModuleAsync|IWasmModule, urlPtr: number) {
      const url = mod.wasmMem.getString(urlPtr);
      return new Promise<number>((resolve, reject) => {
         let audio = new Audio(url);
         let id = this.nextID++;
         this.nodes[id] = [NodeType.HTMLAudioElement, audio];

         audio.addEventListener("canplaythrough", () => {
            resolve(id);
         });
      });
   }
   
}