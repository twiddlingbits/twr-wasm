import { TLibImports, twrLibrary, twrLibraryInstanceRegistry } from "./twrlibrary.js";
import { IWasmModule } from "./twrmod";
import { IWasmModuleAsync } from "./twrmodasync";

enum NodeType {
   AudioBuffer,
   HTMLAudioElement,
}
type Node = [NodeType.AudioBuffer, AudioBuffer];

type BufferPlaybackNode = [NodeType.AudioBuffer, AudioBufferSourceNode, number, number, GainNode, StereoPannerNode];
type AudioPlaybackNode = [NodeType.HTMLAudioElement, HTMLAudioElement]; 
type PlaybackNode = BufferPlaybackNode | AudioPlaybackNode;

// enum AudioFileTypes {
//    RAW,
//    MP3,
//    WAV,
//    OGG,
//    Unknown
// };

export default class twrLibAudio extends twrLibrary {
   id: number;

   imports: TLibImports = {
      "twrAudioFromFloatPCM": {},
      "twrAudioFrom8bitPCM": {},
      "twrAudioFrom16bitPCM": {},
      "twrAudioFrom32bitPCM": {},

      "twrAudioGetFloatPCM": {isAsyncFunction: true},
      "twrAudioGet8bitPCM": {isAsyncFunction: true},
      "twrAudioGet16bitPCM": {isAsyncFunction: true},
      "twrAudioGet32bitPCM": {isAsyncFunction: true},

      "twrAudioPlay": {},
      "twrAudioPlayRange": {},
      "twrAudioQueryPlaybackPosition": {},
      "twrAudioLoadSync": {isAsyncFunction: true, isModuleAsyncOnly: true},
      "twrAudioLoad": {},
      "twrAudioFreeID": {},
      "twrAudioStopPlayback": {},
      "twrAudioGetMetadata": {},
      "twrAudioPlaySync": {isAsyncFunction: true, isModuleAsyncOnly: true},
      "twrAudioRangePlaySync": {isAsyncFunction: true, isModuleAsyncOnly: true},
      "twrAudioModifyPlaybackVolume": {},
      "twrAudioModifyPlaybackPan": {},
      "twrAudioModifyPlaybackRate": {},
      "twrAudioPlayFile": {},
   };
   nextID: number = 0;
   nextPlaybackID: number = 0;
   context: AudioContext = new AudioContext();
   nodes: Node[] = [];
   playbacks: PlaybackNode[] = [];
   

   // every library should have this line
   libSourcePath = new URL(import.meta.url).pathname;

   constructor() {
      // all library constructors should start with these two lines
      super();
      this.id=twrLibraryInstanceRegistry.register(this);
   }


   //loads audio from samples using createBuffer and then loading the given data in
   //data is expected to be a 2d array of channels with data length equal to singleChannelDataLen
   //so if len is 10 and channels is 1, data is of total length 10
   //if len is 10 and channels is 2, data is of total length 20, etc.
   internalSetupAudioBuffer(numChannels: number, sampleRate: number, singleChannelDataLen: number): [AudioBuffer, number] {
      const arrayBuffer = this.context.createBuffer(
         numChannels,
         singleChannelDataLen,
         sampleRate
      );

      const id = this.nextID++;
      this.nodes[id] = [NodeType.AudioBuffer, arrayBuffer];

      return [arrayBuffer, id];
   }

   twrAudioFromFloatPCM(mod: IWasmModuleAsync|IWasmModule, numChannels: number, sampleRate: number, dataPtr: number, singleChannelDataLen: number) {
      const [arrayBuffer, id] = this.internalSetupAudioBuffer(numChannels, sampleRate, singleChannelDataLen);

      for (let channel = 0; channel < numChannels; channel++) {
         const channelBuff = arrayBuffer.getChannelData(channel);
         const startPos = dataPtr/4.0 + channel*singleChannelDataLen;
         channelBuff.set(mod.wasmMem.memF!.slice(startPos, startPos + singleChannelDataLen));
      }

      return id;
   }

   twrAudioFrom8bitPCM(mod: IWasmModuleAsync|IWasmModule, numChannels: number, sampleRate: number, dataPtr: number, singleChannelDataLen: number) {
      const [arrayBuffer, id] = this.internalSetupAudioBuffer(numChannels, sampleRate, singleChannelDataLen);

      for (let channel = 0; channel < numChannels; channel++) {
         const channelBuff = arrayBuffer.getChannelData(channel);
         const startPos = dataPtr/1.0 + channel*singleChannelDataLen;

         const dataBuff = mod.wasmMem.mem8.slice(startPos, startPos + singleChannelDataLen);

         for (let i = 0; i < singleChannelDataLen; i++) {
            //convert 8-bit PCM to float
            //data is signed, so it will also need to find the negatives
            channelBuff[i] = dataBuff[i] > 127 ? (dataBuff[i] - 256)/128 : dataBuff[i]/128;
         }
      }

      return id;
   }

   twrAudioFrom16bitPCM(mod: IWasmModuleAsync|IWasmModule, numChannels: number, sampleRate: number, dataPtr: number, singleChannelDataLen: number) {
      const [arrayBuffer, id] = this.internalSetupAudioBuffer(numChannels, sampleRate, singleChannelDataLen);

      for (let channel = 0; channel < numChannels; channel++) {
         const channelBuff = arrayBuffer.getChannelData(channel);
         const startPos = dataPtr/1.0 + channel*singleChannelDataLen*2.0; //using collections of two from mem8 to represent 16 bits

         const dataBuff = mod.wasmMem.mem8.slice(startPos, startPos + singleChannelDataLen*2.0);

         for (let i = 0; i < singleChannelDataLen*2; i += 2) {
            const val = dataBuff[i]+dataBuff[i+1]*256;
            //convert 16-bit PCM to float
            channelBuff[i] = val > 32767 ? (val - 65536)/32768 : val/32768;
         }
      }

      return id;
   }

   twrAudioFrom32bitPCM(mod: IWasmModuleAsync|IWasmModule, numChannels: number, sampleRate: number, dataPtr: number, singleChannelDataLen: number) {
      const [arrayBuffer, id] = this.internalSetupAudioBuffer(numChannels, sampleRate, singleChannelDataLen);

      for (let channel = 0; channel < numChannels; channel++) {
         const channelBuff = arrayBuffer.getChannelData(channel);
         const startPos = dataPtr/4.0 + channel*singleChannelDataLen;

         const dataBuff = mod.wasmMem.mem32.slice(startPos, startPos + singleChannelDataLen);

         for (let i = 0; i < singleChannelDataLen; i++) {
            //convert 32-bit PCM to float
            channelBuff[i] = dataBuff[i] > 2147483647 ? (dataBuff[i] - 4294967296)/2147483648 : dataBuff[i]/2147483648;
         }
      }

      return id;
   }
   internalGetAnyPCMPart1(mod: IWasmModuleAsync|IWasmModule, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number): [AudioBuffer, number] {
      if (!(nodeID in this.nodes)) throw new Error(`twrAudioGetSamples couldn't find node of ID ${nodeID}`);
      
      const node = this.nodes[nodeID];
      if (node[0] != NodeType.AudioBuffer) throw new Error(`twrAudioGetSamples expected a node of type AudioBuffer, got ${NodeType[node[0]]}!`);

      const audioBuffer = node[1] as AudioBuffer;

      const totalLen = audioBuffer.length * audioBuffer.numberOfChannels;

      mod.wasmMem.setLong(singleChannelDataLenPtr, audioBuffer.length);
      mod.wasmMem.setLong(channelPtr, audioBuffer.numberOfChannels);

      return [audioBuffer, totalLen];
   }

   internalSyncGetAnyPCM(mod: IWasmModule, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number, dataSize: number, part2: (a: IWasmModuleAsync|IWasmModule, b: AudioBuffer, c: number) => void) {
      const [node, totalLen] = this.internalGetSamplesPart1(mod, nodeID, singleChannelDataLenPtr, channelPtr);
      const bufferPtr = mod.malloc!(totalLen * dataSize); //len(floatArray) * dataSize bytes/item
      part2(mod, node, bufferPtr);

      return bufferPtr
   }

   async internalAsyncGetAnyPCM(mod: IWasmModuleAsync, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number, dataSize: number, part2: (a: IWasmModuleAsync|IWasmModule, b: AudioBuffer, c: number) => void) {
      const [node, totalLen] = this.internalGetSamplesPart1(mod, nodeID, singleChannelDataLenPtr, channelPtr);
      const bufferPtr = await mod.malloc!(totalLen * dataSize); //len(floatArray) * dataSize bytes/item
      part2(mod, node, bufferPtr);

      return bufferPtr
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
   internalGetFloatPCMPart2(mod: IWasmModuleAsync|IWasmModule, buffer: AudioBuffer, bufferPtr: number) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
         let data = buffer.getChannelData(channel);
         const startPos = bufferPtr/4 + channel*buffer.length;
         mod.wasmMem.memF.set(data.slice(0, buffer.length), startPos);
      }
   }

   //Separated into a sync and async module, gets the total amount of data stored
   //mallocs a buffer of appropriate size (split by sync and async since async needs await)
   //then copies the audio buffer to the malloced memory and returns the pointer to the memory
   twrAudioGetFloatPCM(mod: IWasmModule, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number) {
      return this.internalSyncGetAnyPCM(mod, nodeID, singleChannelDataLenPtr, channelPtr, 4, this.internalGetFloatPCMPart2);
   }

   async twrAudioGetFloatPCM_async(mod: IWasmModuleAsync, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number) {
      return await this.internalAsyncGetAnyPCM(mod, nodeID, singleChannelDataLenPtr, channelPtr, 4, this.internalGetFloatPCMPart2);
   }

   internalGet8bitPCMPart2(mod: IWasmModuleAsync|IWasmModule, buffer: AudioBuffer, bufferPtr: number) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
         let data = buffer.getChannelData(channel);
         const startPos = bufferPtr + channel*buffer.length;
         const retBuffer = mod.wasmMem.mem8.slice(startPos, buffer.length);

         for (let i = 0; i < buffer.length; i++) {
            //nergative values will automatically be converted to unsigned when assigning to retBuffer
            retBuffer[i] = Math.round(data[i] * 128); 
         }
      }
   }

   twrAudioGet8bitPCM(mod: IWasmModule, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number) {
      return this.internalSyncGetAnyPCM(mod, nodeID, singleChannelDataLenPtr, channelPtr, 1, this.internalGet8bitPCMPart2);
   }

   async twrAudioGet8bitPCM_async(mod: IWasmModuleAsync, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number) {
      return await this.internalAsyncGetAnyPCM(mod, nodeID, singleChannelDataLenPtr, channelPtr, 1, this.internalGet8bitPCMPart2);
   }

   internalGet16bitPCMPart2(mod: IWasmModuleAsync|IWasmModule, buffer: AudioBuffer, bufferPtr: number) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
         let data = buffer.getChannelData(channel);
         const startPos = bufferPtr + channel*buffer.length*2.0; //2 bytes per short
         const retBuffer = mod.wasmMem.mem8.slice(startPos, buffer.length * 2.0);

         for (let i = 0; i < buffer.length; i++) {

            const val = data[i] < 0 ? 65536 + data[i] * 32768 : data[i] * 32768;

            retBuffer[i] = val%256; //byte 1
            retBuffer[i+1] = Math.round(val/256); //byte 2 
         }
      }
   }

   twrAudioGet16bitPCM(mod: IWasmModule, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number) {
      return this.internalSyncGetAnyPCM(mod, nodeID, singleChannelDataLenPtr, channelPtr, 2, this.internalGet16bitPCMPart2);
   }

   async twrAudioGet16bitPCM_async(mod: IWasmModuleAsync, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number) {
      return await this.internalAsyncGetAnyPCM(mod, nodeID, singleChannelDataLenPtr, channelPtr, 2, this.internalGet16bitPCMPart2);
   }

   internalGet32bitPCMPart2(mod: IWasmModuleAsync|IWasmModule, buffer: AudioBuffer, bufferPtr: number) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
         let data = buffer.getChannelData(channel);
         const startPos = bufferPtr/4.0 + channel*buffer.length;
         const retBuffer = mod.wasmMem.mem32.slice(startPos, buffer.length);

         for (let i = 0; i < buffer.length; i++) {
            //nergative values will automatically be converted to unsigned when assigning to retBuffer
            retBuffer[i] = Math.round(data[i] * 2147483648); 
         }
      }
   }

   twrAudioGet32bitPCM(mod: IWasmModule, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number) {
      return this.internalSyncGetAnyPCM(mod, nodeID, singleChannelDataLenPtr, channelPtr, 4, this.internalGet32bitPCMPart2);
   }

   async twrAudioGet21bitPCM_async(mod: IWasmModuleAsync, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number) {
      return await this.internalAsyncGetAnyPCM(mod, nodeID, singleChannelDataLenPtr, channelPtr, 4, this.internalGet32bitPCMPart2);
   }


   //starts playing an audio node,
   //all nodes are cloned by default so they can be played multiple times
   //therefor, a new playback_id is returned for querying status
   twrAudioPlay(mod: IWasmModuleAsync|IWasmModule, nodeID: number, volume: number = 1, pan: number = 0, finishCallback: number | null = null) {
      return this.twrAudioPlayRange(mod, nodeID, 0, null, false, null, volume, pan, finishCallback);
   }

   internalAudioPlayRange(mod: IWasmModuleAsync|IWasmModule, nodeID: number, startSample: number, endSample: number | null, loop: boolean, sampleRate: number | null, volume: number, pan: number): [Promise<number>, number] {
      if (!(nodeID in this.nodes)) throw new Error(`twrLibAudio twrAudioPlayNode was given a non-existant nodeID (${nodeID})!`);

      if (sampleRate == 0) { //assume a 0 sample_rate is just normal speed or null
         sampleRate = null;
      }

      const node = this.nodes[nodeID];

      let id = this.nextPlaybackID++;
      let promise: Promise<number>;

      switch (node[0]) {
         case NodeType.AudioBuffer:
         {
            if (endSample == null) {
               endSample = node[1].length;
            }
            
            const buffer = node[1] as AudioBuffer;
            const sourceBuffer = this.context.createBufferSource();
            sourceBuffer.buffer = buffer;

            promise = new Promise((resolve, reject) => {
               sourceBuffer.onended = () => {
                  delete this.playbacks[id];
                  resolve(id);
               }
            });
            

            const startTime = startSample/node[1].sampleRate;
            const endTime = (endSample - startSample)/node[1].sampleRate;
            
            sourceBuffer.loop = loop;
            sourceBuffer.loopStart = startTime;
            sourceBuffer.loopEnd = endSample/node[1].sampleRate;

            sourceBuffer.playbackRate.value = sampleRate ? sampleRate/node[1].sampleRate : 1.0;

            sourceBuffer.start(0, startTime, loop ? undefined : endTime);

            const gainNode = this.context.createGain();
            gainNode.gain.value = volume;
            sourceBuffer.connect(gainNode);

            const panNode = this.context.createStereoPanner();
            panNode.pan.value = pan;
            gainNode.connect(panNode);
            panNode.connect(this.context.destination);

            this.playbacks[id] = [NodeType.AudioBuffer, sourceBuffer, (new Date()).getTime(), node[1].sampleRate, gainNode, panNode];
         }
         break;

         default:
            throw new Error(`twrAudioPlayNode unknown type! ${node[0]}`);
      }

      return [promise, id];
   }

   twrAudioPlayRange(mod: IWasmModuleAsync|IWasmModule, nodeID: number, startSample: number, endSample: number | null = null, loop: boolean = false, sampleRate: number | null = null, volume: number = 1, pan: number = 0, finishCallback: number | null = null) {
      if (finishCallback == -1000) { //no callback, used in twr_audio_play_range_full
         finishCallback = null;
      }
      let [promise, id] = this.internalAudioPlayRange(mod, nodeID, startSample, endSample, loop, sampleRate, volume, pan);
      if (finishCallback != null) {
         promise.then((playback_id) => {
            mod.postEvent(finishCallback, playback_id);
         });
      }
      
      return id;
   }

   async twrAudioPlaySync_async(mod: IWasmModuleAsync, nodeID: number, volume: number = 1, pan: number = 0) {
      return this.twrAudioPlayRangeSync_async(mod, nodeID, 0, null, false, null, volume, pan,);
   }
   async twrAudioPlayRangeSync_async(mod: IWasmModuleAsync, nodeID: number, startSample: number, endSample: number | null = null, loop: boolean = false, sampleRate: number | null = null, volume: number = 1, pan: number = 0) {
      let [promise, id] = this.internalAudioPlayRange(mod, nodeID, startSample, endSample, loop, sampleRate, volume, pan);
      
      await promise;
      
      return id;
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

         case NodeType.HTMLAudioElement:
         {
            return playback[1].currentTime;
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
   async twrAudioLoadSync_async(mod: IWasmModuleAsync, urlPtr: number) {
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
      if (!(playbackID in this.playbacks)) {
         console.log(`Warning: twrAudioStopPlayback was given an ID that didn't exist (${playbackID})!`);
         return;
      }

      const node = this.playbacks[playbackID];

      // console.log("hi!!");
      
      switch (node[0]) {
         case NodeType.AudioBuffer:
         {
            node[1].stop();
         }
         break;

         case NodeType.HTMLAudioElement:
         {
            node[1].loop = false;
            node[1].currentTime = Number.MAX_SAFE_INTEGER;
            //delete index just in case audio hasn't loaded yet
            delete this.playbacks[playbackID];
         }
         break;


         default:
            throw new Error(`twrAudioStopPlayback unknown type! ${node[0]}`);
      }
      // delete this.playbacks[playbackID];
   }

   twrAudioModifyPlaybackVolume(mod: IWasmModule|IWasmModuleAsync, playbackID: number, volume: number) {
      if (!(playbackID in this.playbacks)) {
         console.log(`Warning: twrAudioModifyPlaybackVolume was given an ID that didn't exist (${playbackID})!`);
         return;
      }

      const node = this.playbacks[playbackID];
      if (volume > 1 || volume < 0) {
         console.log(`Warning! twrAudioModifyPlaybackVolume was given a volume (${volume}) that wasn't between 0 and 1!`)
         volume = Math.max(Math.min(volume, 1), 0);
      }

      switch (node[0]) {
         case NodeType.AudioBuffer: 
         {
            const gainNode = node[4];
            gainNode.gain.value = volume;
         }
         break;

         case NodeType.HTMLAudioElement:
         {
            const audio = node[1];
            audio.volume = volume;
         }
         break;
      }
   }

   twrAudioModifyPlaybackPan(mod: IWasmModule|IWasmModuleAsync, playbackID: number, pan: number) {
      if (!(playbackID in this.playbacks)) {
         console.log(`Warning: twrAudioModifyPlaybackPan was given an ID that didn't exist (${playbackID})!`);
         return;
      }

      const node = this.playbacks[playbackID];

      switch (node[0]) {
         case NodeType.AudioBuffer: 
         {
            const panNode = node[5];
            panNode.pan.value = pan;
         }
         break;
         case NodeType.HTMLAudioElement:
         {
            throw new Error("Can't modify the pan of a playback started by twrAudioPlayFile!");
         }
         break;
      }
   }

   twrAudioModifyPlaybackRate(mod: IWasmModule|IWasmModuleAsync, playbackID: number, sampleRate: number) {
      if (!(playbackID in this.playbacks)) {
         console.log(`Warning: twrAudioModifyPlaybackRate was given an ID that didn't exist (${playbackID})!`);
         return;
      }

      const node = this.playbacks[playbackID];

      switch (node[0]) {
         case NodeType.AudioBuffer: 
         {
            const playback = node[1];
            const baseSampleRate = node[3];
            playback.playbackRate.value = sampleRate/baseSampleRate;
         }
         break;
         case NodeType.HTMLAudioElement:
         {
            const audio = node[1];
            audio.playbackRate = sampleRate;
         }
         break;
      }
   }

   twrAudioPlayFile(mod: IWasmModule|IWasmModuleAsync, fileURLPtr: number, volume: number = 1.0, playbackRate: number = 1.0, loop: boolean = false) {
      const playbackID = this.nextPlaybackID++;
      
      const fileURL = mod.wasmMem.getString(fileURLPtr);
      const audio = new Audio(fileURL);

      audio.volume = volume;
      audio.loop = loop;
      audio.playbackRate = playbackRate;

      audio.onended = () => {
         delete this.playbacks[playbackID];
      };

      audio.play();
      
      this.playbacks[playbackID] = [NodeType.HTMLAudioElement, audio];

      return playbackID;
   }
}