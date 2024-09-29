import { TLibImports, twrLibrary } from "./twrlibrary.js";
import { IWasmModule } from "./twrmod";
import { IWasmModuleAsync } from "./twrmodasync";
declare enum NodeType {
    AudioBuffer = 0,
    HTMLAudioElement = 1
}
type Node = [NodeType.AudioBuffer, AudioBuffer];
type BufferPlaybackNode = [NodeType.AudioBuffer, AudioBufferSourceNode, number, number, GainNode, StereoPannerNode];
type AudioPlaybackNode = [NodeType.HTMLAudioElement, HTMLAudioElement];
type PlaybackNode = BufferPlaybackNode | AudioPlaybackNode;
export default class twrLibAudio extends twrLibrary {
    id: number;
    imports: TLibImports;
    nextID: number;
    nextPlaybackID: number;
    context: AudioContext;
    nodes: Node[];
    playbacks: PlaybackNode[];
    libSourcePath: string;
    constructor();
    internalSetupAudioBuffer(numChannels: number, sampleRate: number, singleChannelDataLen: number): [AudioBuffer, number];
    twrAudioFromFloatPCM(mod: IWasmModuleAsync | IWasmModule, numChannels: number, sampleRate: number, dataPtr: number, singleChannelDataLen: number): number;
    twrAudioFrom8bitPCM(mod: IWasmModuleAsync | IWasmModule, numChannels: number, sampleRate: number, dataPtr: number, singleChannelDataLen: number): number;
    twrAudioFrom16bitPCM(mod: IWasmModuleAsync | IWasmModule, numChannels: number, sampleRate: number, dataPtr: number, singleChannelDataLen: number): number;
    twrAudioFrom32bitPCM(mod: IWasmModuleAsync | IWasmModule, numChannels: number, sampleRate: number, dataPtr: number, singleChannelDataLen: number): number;
    internalGetAnyPCMPart1(mod: IWasmModuleAsync | IWasmModule, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number): [AudioBuffer, number];
    internalSyncGetAnyPCM(mod: IWasmModule, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number, dataSize: number, part2: (a: IWasmModuleAsync | IWasmModule, b: AudioBuffer, c: number) => void): number;
    internalAsyncGetAnyPCM(mod: IWasmModuleAsync, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number, dataSize: number, part2: (a: IWasmModuleAsync | IWasmModule, b: AudioBuffer, c: number) => void): Promise<number>;
    internalGetSamplesPart1(mod: IWasmModuleAsync | IWasmModule, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number): [AudioBuffer, number];
    internalGetFloatPCMPart2(mod: IWasmModuleAsync | IWasmModule, buffer: AudioBuffer, bufferPtr: number): void;
    twrAudioGetFloatPCM(mod: IWasmModule, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number): number;
    twrAudioGetFloatPCM_async(mod: IWasmModuleAsync, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number): Promise<number>;
    internalGet8bitPCMPart2(mod: IWasmModuleAsync | IWasmModule, buffer: AudioBuffer, bufferPtr: number): void;
    twrAudioGet8bitPCM(mod: IWasmModule, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number): number;
    twrAudioGet8bitPCM_async(mod: IWasmModuleAsync, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number): Promise<number>;
    internalGet16bitPCMPart2(mod: IWasmModuleAsync | IWasmModule, buffer: AudioBuffer, bufferPtr: number): void;
    twrAudioGet16bitPCM(mod: IWasmModule, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number): number;
    twrAudioGet16bitPCM_async(mod: IWasmModuleAsync, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number): Promise<number>;
    internalGet32bitPCMPart2(mod: IWasmModuleAsync | IWasmModule, buffer: AudioBuffer, bufferPtr: number): void;
    twrAudioGet32bitPCM(mod: IWasmModule, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number): number;
    twrAudioGet21bitPCM_async(mod: IWasmModuleAsync, nodeID: number, singleChannelDataLenPtr: number, channelPtr: number): Promise<number>;
    twrAudioPlay(mod: IWasmModuleAsync | IWasmModule, nodeID: number, volume?: number, pan?: number, finishCallback?: number | null): number;
    internalAudioPlayRange(mod: IWasmModuleAsync | IWasmModule, nodeID: number, startSample: number, endSample: number | null, loop: boolean, sampleRate: number | null, volume: number, pan: number): [Promise<number>, number];
    twrAudioPlayRange(mod: IWasmModuleAsync | IWasmModule, nodeID: number, startSample: number, endSample?: number | null, loop?: boolean, sampleRate?: number | null, volume?: number, pan?: number, finishCallback?: number | null): number;
    twrAudioPlaySync_async(mod: IWasmModuleAsync, nodeID: number, volume?: number, pan?: number): Promise<number>;
    twrAudioPlayRangeSync_async(mod: IWasmModuleAsync, nodeID: number, startSample: number, endSample?: number | null, loop?: boolean, sampleRate?: number | null, volume?: number, pan?: number): Promise<number>;
    twrAudioQueryPlaybackPosition(mod: IWasmModuleAsync | IWasmModule, playbackID: number): number;
    internalLoadAudio(mod: IWasmModuleAsync | IWasmModule, urlPtr: number, id: number): Promise<void>;
    twrAudioLoadSync_async(mod: IWasmModuleAsync, urlPtr: number): Promise<number>;
    twrAudioLoad(mod: IWasmModuleAsync | IWasmModule, eventID: number, urlPtr: number): number;
    twrAudioFreeID(mod: IWasmModule | IWasmModuleAsync, nodeID: number): void;
    twrAudioGetMetadata(mod: IWasmModuleAsync | IWasmModule, nodeID: number, metadataPtr: number): void;
    twrAudioStopPlayback(mod: IWasmModule | IWasmModuleAsync, playbackID: number): void;
    twrAudioModifyPlaybackVolume(mod: IWasmModule | IWasmModuleAsync, playbackID: number, volume: number): void;
    twrAudioModifyPlaybackPan(mod: IWasmModule | IWasmModuleAsync, playbackID: number, pan: number): void;
    twrAudioModifyPlaybackRate(mod: IWasmModule | IWasmModuleAsync, playbackID: number, sampleRate: number): void;
    twrAudioPlayFile(mod: IWasmModule | IWasmModuleAsync, fileURLPtr: number, volume?: number, playbackRate?: number, loop?: boolean): number;
}
export {};
//# sourceMappingURL=twrlibaudio.d.ts.map