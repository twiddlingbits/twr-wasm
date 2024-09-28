#include "twr-audio.h"
#include "twr-jsimports.h"
#include <stdlib.h>



struct PlayRangeFields twr_audio_default_play_range() {
   struct PlayRangeFields fields = {
      .finish_callback = -1000,
      .loop = false,
      .pan = 0.0,
      .volume = 1.0,
      .sample_rate = 0,
   };

   return fields;
}

long twr_audio_play_range_ex(long node_id, long start_sample, long end_sample, struct PlayRangeFields* fields) {
   __attribute__((import_name("twrAudioPlayRange"))) long twr_audio_play_range_callback(long node_id, long start_sample, long end_sample, int loop, long sample_rate, double volume, double pan, int finish_callback);
   
   return twr_audio_play_range_callback(node_id, start_sample, end_sample, fields->loop, fields->sample_rate, fields->volume, fields->pan, fields->finish_callback);
}

struct PlayRangeSyncFields twr_audio_default_play_range_sync() {
   struct PlayRangeSyncFields fields = {
      .loop = false,
      .pan = 0.0,
      .volume = 1.0,
      .sample_rate = 0
   };

   return fields;
}

long twr_audio_play_range_sync_ex(long node_id, long start_sample, long end_sample, struct PlayRangeSyncFields* fields) {
   __attribute__((import_name("twrAudioPlayRangeSync"))) long twr_audio_play_range_sync_sample_rate(long node_id, long start_sample, long end_sample, int loop, long sample_rate, double volume, double pan);

   return twr_audio_play_range_sync_sample_rate(node_id, start_sample, end_sample, fields->loop, fields->sample_rate, fields->volume, fields->pan);
}
