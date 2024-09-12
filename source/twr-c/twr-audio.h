
#ifdef __cplusplus
extern "C" {
#endif

__attribute__((import_name("twrAudioFromSamples"))) long twrAudioFromSamples(long num_channels, long sample_rate, float* data, long singleChannelDataLen);
__attribute__((import_name("twrAudioPlay"))) long twrAudioPlay(long node_id);
__attribute__((import_name("twrAudioPlay"))) long twrAudioPlayVolume(long node_id, double volume);
__attribute__((import_name("twrAudioPlay"))) long twrAudioPlayPan(long node_id, double volume, double pan);
__attribute__((import_name("twrAudioPlayCallback"))) long twrAudioPlayCallback(long node_id, double volume, double pan, int finish_callback);

__attribute__((import_name("twrAudioPlayRange"))) long twrAudioPlayRange(long node_id, long start_sample, long end_sample);
__attribute__((import_name("twrAudioPlayRange"))) long twrAudioPlayRangeLoop(long node_id, long start_sample, long end_sample, int loop);
__attribute__((import_name("twrAudioPlayRange"))) long twrAudioPlayRangeSampleRate(long node_id, long start_sample, long end_sample, int loop, long sample_rate, double volume, double pan);
__attribute__((import_name("twrAudioPlayRange"))) long twrAudioPlayRangeCallback(long node_id, long start_sample, long end_sample, int loop, long sample_rate, double volume, double pan, int finish_callback);


__attribute__((import_name("twrAudioPlaySync"))) long twrAudioPlaySync(long node_id);
__attribute__((import_name("twrAudioPlaySync"))) long twrAudioPlaySyncVolume(long node_id, double volume);
__attribute__((import_name("twrAudioPlaySync"))) long twrAudioPlaySyncPan(long node_id, double volume, double pan);

__attribute__((import_name("twrAudioPlayRangeSync"))) long twrAudioPlayRangeSync(long node_id, long start_sample, long end_sample);
__attribute__((import_name("twrAudioPlayRangeSync"))) long twrAudioPlayRangeSyncLoop(long node_id, long start_sample, long end_sample, int loop);
__attribute__((import_name("twrAudioPlayRangeSync"))) long twrAudioPlayRangeSyncSampleRate(long node_id, long start_sample, long end_sample, int loop, long sample_rate, double volume, double pan);


// __attribute__((import_name("twrAudioChainNodes"))) long twrAudioChainNodes(long node_1, long node_2);
__attribute__((import_name("twrAudioAppendSamples"))) void twrAudioAppendSamples(long node_id, long num_channels, float* data, long data_len);
__attribute__((import_name("twrAudioLoadSync"))) long twrAudioLoadSync(char* url);
__attribute__((import_name("twrAudioLoad"))) long twrAudioLoad(int event_id, char* url);
__attribute__((import_name("twrAudioQueryPlaybackPosition"))) long twrAudioQueryPlaybackPosition(long playback_id);
// __attribute__((import_name("twrAudioGetSamples"))) long twrAudioGetSamples(long node_id, long* channels, float* buffer_ptr, long total_buffer_len);
__attribute__((import_name("twrAudioGetSamples"))) float* twrAudioGetSamples(long node_id, long* singleChannelDataLenPtr, long* channelPtr);
__attribute__((import_name("twrAudioFreeID"))) void twrAudioFreeID(long node_id);

__attribute__((import_name("twrAudioStopPlayback"))) void twrAudioStopPlayback(long playback_id);

__attribute__((import_name("twrAudioModifyPlaybackVolume"))) void twrAudioModifyPlaybackVolume(long node_id, double volume);
__attribute__((import_name("twrAudioModifyPlaybackPan"))) void twrAudioModifyPlaybackPan(long node_id, double pan);
__attribute__((import_name("twrAudioModifyPlaybackRate"))) void twrAudioModifyPlaybackRate(long node_id, long sample_rate);

struct AudioMetadata {
   long length;
   long sample_rate;
   long channels;
};

__attribute__((import_name("twrAudioGetMetadata"))) void twrAudioGetMetadata(long node_id, struct AudioMetadata* metadata);

#ifdef __cplusplus
}
#endif