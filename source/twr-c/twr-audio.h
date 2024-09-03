
#ifdef __cplusplus
extern "C" {
#endif

__attribute__((import_name("twrAudioFromSamples"))) long twrAudioFromSamples(long num_channels, long sample_rate, float* data, long singleChannelDataLen);
__attribute__((import_name("twrPlayAudioNode"))) long twrPlayAudioNode(long node_id);
__attribute__((import_name("twrPlayAudioNode"))) long twrPlayAudioNodeVolume(long node_id, long volume);
__attribute__((import_name("twrPlayAudioNode"))) long twrPlayAudioNodePan(long node_id, long volume, long pan);

__attribute__((import_name("twrPlayAudioNodeRange"))) long twrPlayAudioNodeRange(long node_id, long start_sample, long end_sample);
__attribute__((import_name("twrPlayAudioNodeRange"))) long twrPlayAudioNodeRangeLoop(long node_id, long start_sample, long end_sample, int loop);
__attribute__((import_name("twrPlayAudioNodeRange"))) long twrPlayAudioNodeRangeSampleRate(long node_id, long start_sample, long end_sample, int loop, long sample_rate, long volume, long pan);

// __attribute__((import_name("twrChainAudioNodes"))) long twrChainAudioNodes(long node_1, long node_2);
__attribute__((import_name("twrAppendAudioSamples"))) void twrAppendAudioSamples(long node_id, long num_channels, float* data, long data_len);
__attribute__((import_name("twrLoadAudioAsync"))) long twrLoadAudioAsync(char* url);
__attribute__((import_name("twrLoadAudio"))) long twrLoadAudio(int event_id, char* url);
__attribute__((import_name("twrQueryAudioPlaybackPosition"))) long twrQueryAudioPlaybackPosition(long playback_id);
__attribute__((import_name("twrGetAudioSamples"))) long twrGetAudioSamples(long node_id, long* channels, float* buffer_ptr, long total_buffer_len);
__attribute__((import_name("twrFreeAudioID"))) void twrFreeAudioID(long node_id);

__attribute__((import_name("twrStopAudioPlayback"))) void twrStopAudioPlayback(long playback_id);

struct AudioMetadata {
   long length;
   long sample_rate;
   long channels;
};

__attribute__((import_name("twrGetAudioMetadata"))) void twrGetAudioMetadata(long node_id, struct AudioMetadata* metadata);

#ifdef __cplusplus
}
#endif