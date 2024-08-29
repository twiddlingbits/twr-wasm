
#ifdef __cplusplus
extern "C" {
#endif

__attribute__((import_name("twrAudioFromSamples"))) long twrAudioFromSamples(long num_channels, long sample_rate, float* data, long singleChannelDataLen);
__attribute__((import_name("twrPlayAudioNode"))) long twrPlayAudioNode(long node_id);
// __attribute__((import_name("twrChainAudioNodes"))) long twrChainAudioNodes(long node_1, long node_2);
__attribute__((import_name("twrAppendAudioSamples"))) void twrAppendAudioSamples(long node_id, long num_channels, float* data, long data_len);
__attribute__((import_name("twrLoadAudioAsync"))) long twrLoadAudioAsync(char* url);
__attribute__((import_name("twrQueryAudioPlaybackPosition"))) long twrQueryAudioPlaybackPosition(long playback_id);
__attribute__((import_name("twrGetAudioSamples"))) long twrGetAudioSamples(long node_id, long* channels, float* buffer_ptr, long total_buffer_len);
__attribute__((import_name("twrFreeAudioID"))) void twrFreeAudioID(long node_id);

#ifdef __cplusplus
}
#endif