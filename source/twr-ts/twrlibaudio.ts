import { TLibImports, twrLibrary } from "./twrlibrary.js";
import { IWasmModule } from "./twrmod";
import { IWasmModuleAsync } from "./twrmodasync";

enum NodeType {
   AudioBuffer,
   HTMLAudioElement,
}
type Node = [NodeType.AudioBuffer, AudioBuffer];


type PlaybackNode = [NodeType.AudioBuffer, AudioBufferSourceNode, number];

// enum AudioFileTypes {
//    RAW,
//    MP3,
//    WAV,
//    OGG,
//    Unknown
// };

export default class twrLibAudio extends twrLibrary {
   imports: TLibImports = {
      "twrAudioFromSamples": {},
      "twrAudioPlay": {},
      "twrAudioPlayRange": {},
      "twrAudioAppendSamples": {},
      "twrAudioQueryPlaybackPosition": {},
      "twrAudioLoadSync": {isAsyncFunction: true, isModuleAsyncOnly: true},
      "twrAudioLoad": {},
      "twrAudioGetSamples": {isAsyncFunction: true},
      "twrAudioFreeID": {},
      "twrAudioStopPlayback": {},
      "twrAudioGetMetadata": {},
      "twrAudioPlaySync": {isAsyncFunction: true, isModuleAsyncOnly: true},
      "twrAudioRangePlaySync": {isAsyncFunction: true, isModuleAsyncOnly: true},
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
   twrAudioPlay(mod: IWasmModuleAsync|IWasmModule, nodeID: number, volume: number = 100, pan: number = 0, finishCallback: number | null = null) {
      return this.twrAudioPlayRange(mod, nodeID, 0, null, false, null, volume, pan, finishCallback);
   }

   internalAudioPlayRange(mod: IWasmModuleAsync|IWasmModule, nodeID: number, startSample: number, endSample: number | null, loop: boolean, sampleRate: number | null, volume: number, pan: number): [Promise<number>, number] {
      if (!(nodeID in this.nodes)) throw new Error(`twrLibAudio twrAudioPlayNode was given a non-existant nodeID (${nodeID})!`);

      const node = this.nodes[nodeID];

      let source: AudioNode;
      let id = this.nextPlaybackID++;
      let promise: Promise<number> = new Promise((resolve, reject) => {
         switch (node[0]) {
            case NodeType.AudioBuffer:
            {
               if (endSample == null) {
                  endSample = node[1].length;
               }
               
               const buffer = node[1] as AudioBuffer;
               const sourceBuffer = this.context.createBufferSource();
               sourceBuffer.buffer = buffer;

               sourceBuffer.onended = () => {
                  delete this.playbacks[id];
                  resolve(id);
               }

               const startTime = startSample/node[1].sampleRate;
               const endTime = (endSample - startSample)/node[1].sampleRate;
               
               sourceBuffer.loop = loop;
               sourceBuffer.loopStart = startTime;
               sourceBuffer.loopEnd = endSample/node[1].sampleRate;

               sourceBuffer.playbackRate.value = sampleRate ? sampleRate/node[1].sampleRate : 1.0;

               sourceBuffer.start(0, startTime, loop ? undefined : endTime);

               this.playbacks[id] = [NodeType.AudioBuffer, sourceBuffer, (new Date()).getTime()];

               const gainNode = this.context.createGain();
               gainNode.gain.value = volume/100;

               sourceBuffer.connect(gainNode);

               source = gainNode;
            }
            break;

            default:
               throw new Error(`twrAudioPlayNode unknown type! ${node[0]}`);
         }

         if (pan != 0) {
            const panNode = this.context.createStereoPanner();

            panNode.pan.value = pan/100.0;

            source.connect(panNode);
            panNode.connect(this.context.destination);
         } else {
            source.connect(this.context.destination);
         }

      });
      return [promise, id];
   }

   twrAudioPlayRange(mod: IWasmModuleAsync|IWasmModule, nodeID: number, startSample: number, endSample: number | null = null, loop: boolean = false, sampleRate: number | null = null, volume: number = 100, pan: number = 0, finishCallback: number | null = null) {
      let [promise, id] = this.internalAudioPlayRange(mod, nodeID, startSample, endSample, loop, sampleRate, volume, pan);
      if (finishCallback != null) {
         promise.then((playback_id) => {
            mod.postEvent(finishCallback, playback_id);
         });
      }
      
      return id;
   }

   async twrAudioPlaySync_async(mod: IWasmModuleAsync, nodeID: number, volume: number = 100, pan: number = 0) {
      return this.twrAudioPlayRangeSync_async(mod, nodeID, 0, null, false, null, volume, pan,);
   }
   async twrAudioPlayRangeSync_async(mod: IWasmModuleAsync, nodeID: number, startSample: number, endSample: number | null = null, loop: boolean = false, sampleRate: number | null = null, volume: number = 100, pan: number = 0) {
      let [promise, id] = this.internalAudioPlayRange(mod, nodeID, startSample, endSample, loop, sampleRate, volume, pan);
      
      await promise;
      
      return id;
   }

   twrAudioAppendSamples(mod: IWasmModuleAsync|IWasmModule, nodeID: number, numChannels: number, buffer: number, singleChannelDataLen: number) {
      if (!(nodeID in this.nodes)) throw new Error(`twrLibAudio twrAudioAppendSamples was given a non-existant nodeID (${nodeID})!`);

      const node = this.nodes[nodeID];

      if (node[0] != NodeType.AudioBuffer) throw new Error(`twrLibAudio twrAudioAppendSamples node (${nodeID}) was of type ${NodeType[node[0]]}, expected AudioBuffer!`);

      const prev_buffer = node[1] as AudioBuffer;
      const new_len = prev_buffer.length + singleChannelDataLen;
      
      if (numChannels != prev_buffer.numberOfChannels) throw new Error(`twrLibAudio twrAudioAppendSamples can't append samples with a different number of channels! ${prev_buffer.numberOfChannels} != ${numChannels}`);

      const arrayBuffer = this.context.createBuffer(
         prev_buffer.numberOfChannels,
         new_len,
         prev_buffer.sampleRate
      );

      for (let channel = 0; channel < prev_buffer.numberOfChannels; channel++) {
         const channelBuff = arrayBuffer.getChannelData(channel);
         channelBuff.set(prev_buffer.getChannelData(channel));
         const startPos = buffer/4.0 + channel*singleChannelDataLen;
         channelBuff.set(mod.wasmMem.memF.slice(startPos, startPos + singleChannelDataLen), prev_buffer.length);
      }

      this.nodes[nodeID][1] = arrayBuffer;
   }

   //queries current playback positions
   //if the given ID doesn't exist, assume it was removed because it ended and return -1
   twrAudioQueryPlaybackPosition(mod: IWasmModuleAsync|IWasmModule, playbackID: number) {
      if (!(playbackID in this.playbacks)) return -1;

      const playback = this.playbacks[playbackID];

      switch (playback[0]) {
         case NodeType.AudioBuffer:
         {
            return ((new Date()).getTime() - playback[2]);
         }
         break;

         default:
            throw new Error(`twrAudioQueryPlaybackPosition unknown type! ${playback[0]}`);
      }
   }

   async internalLoadAudio(mod: IWasmModuleAsync|IWasmModule, urlPtr: number, id: number) {
      const url = mod.wasmMem.getString(urlPtr);
      const res = await fetch(url);

      const buffer = await this.context.decodeAudioData(await res.arrayBuffer());
      this.nodes[id] = [NodeType.AudioBuffer, buffer];

   }
   async twrAudioLoadSync_async(mod: IWasmModuleAsync|IWasmModule, urlPtr: number) {
      const id = this.nextID++;
      await this.internalLoadAudio(mod, urlPtr, id);
      return id;
   }

   twrAudioLoad(mod: IWasmModuleAsync|IWasmModule, eventID: number, urlPtr: number) {
      const id = this.nextID++;

      this.internalLoadAudio(mod, urlPtr, id).then(() => {
         mod.postEvent(eventID, id);
      });


      return id;
   }

   internalGetSamplesPart1(mod: IWasmModuleAsync|IWasmModule, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number): [AudioBuffer, number] {
      if (!(nodeID in this.nodes)) throw new Error(`twrAudioGetSamples couldn't find node of ID ${nodeID}`);
      
      const node = this.nodes[nodeID];
      if (node[0] != NodeType.AudioBuffer) throw new Error(`twrAudioGetSamples expected a node of type AudioBuffer, got ${NodeType[node[0]]}!`);

      const audioBuffer = node[1] as AudioBuffer;

      const totalLen = audioBuffer.length * audioBuffer.numberOfChannels;

      mod.wasmMem.setLong(singleChannelDataLenPtr, audioBuffer.length);
      mod.wasmMem.setLong(channelPtr, audioBuffer.numberOfChannels);

      return [audioBuffer, totalLen];
   }
   internalGetSamplesPart2(mod: IWasmModuleAsync|IWasmModule, buffer: AudioBuffer, bufferPtr: number) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
         let data = buffer.getChannelData(channel);
         const startPos = bufferPtr/4 + channel*buffer.length;
         mod.wasmMem.memF.set(data.slice(0, buffer.length), startPos);
      }
   }

   //Seperated into a sync and async module, gets the total amount of data stored
   //mallocs a buffer of appropriate size (split by sync and async since async needs await)
   //then copies the audio buffer to the malloced memory and returns the pointer to the memory
   twrAudioGetSamples(mod: IWasmModule, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number) {
      const [node, totalLen] = this.internalGetSamplesPart1(mod, nodeID, singleChannelDataLenPtr, channelPtr);
      const bufferPtr = mod.malloc!(totalLen * 4); //len(floatArray) * 4 bytes/float
      this.internalGetSamplesPart2(mod, node, bufferPtr);

      return bufferPtr
   }

   async twrAudioGetSamples_async(mod: IWasmModuleAsync, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number) {
      const [node, totalLen] = this.internalGetSamplesPart1(mod, nodeID, singleChannelDataLenPtr, channelPtr);
      const bufferPtr = await mod.malloc!(totalLen * 4); //len(floatArray) * 4 bytes/float
      this.internalGetSamplesPart2(mod, node, bufferPtr);

      return bufferPtr
   }

   twrAudioFreeID(mod: IWasmModule|IWasmModuleAsync, nodeID: number) {
      if (!(nodeID in this.nodes)) throw new Error(`twrAudioFreeID couldn't find node of ID ${nodeID}`);

      delete this.nodes[nodeID];
   }

   
   // need to clarify some implementation details
   twrAudioGetMetadata(mod: IWasmModuleAsync|IWasmModule, nodeID: number, metadataPtr: number) {
      if (!(nodeID in this.nodes)) throw new Error(`twrAudioGetMetadata couldn't find node of ID ${nodeID}`);

      /*
      struct AudioMetadata {
         long length;
         long sample_rate;
         long channels;
      };*/

      const node = this.nodes[nodeID];

      switch (node[0]) {
         case NodeType.AudioBuffer:
         {
            mod.wasmMem.setLong(metadataPtr+0, node[1].length);
            mod.wasmMem.setLong(metadataPtr+4, node[1].sampleRate);
            mod.wasmMem.setLong(metadataPtr+8, node[1].numberOfChannels);
         }
         break;


         default:
            throw new Error(`twrAudioGetMetadata unknown type! ${node[0]}`);
      }
      
   }

   twrAudioStopPlayback(mod: IWasmModule|IWasmModuleAsync, playbackID: number) {
      if (!(playbackID in this.playbacks)) console.log(`Warning: twrAudioStopPlayback was given an ID that didn't exist (${playbackID})!`);

      const node = this.playbacks[playbackID];

      // console.log("hi!!");
      
      switch (node[0]) {
         case NodeType.AudioBuffer:
         {
            node[1].stop();
         }
         break;


         default:
            throw new Error(`twrAudioStopPlayback unknown type! ${node[0]}`);
      }
      // delete this.playbacks[playbackID];
   }
   
}