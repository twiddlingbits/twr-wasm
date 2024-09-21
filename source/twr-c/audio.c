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

long twr_audio_play_range_full(long node_id, long start_sample, long end_sample, struct PlayRangeFields* fields) {
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

long twr_audio_play_range_sync_full(long node_id, long start_sample, long end_sample, struct PlayRangeSyncFields* fields) {
   __attribute__((import_name("twrAudioPlayRangeSync"))) long twr_audio_play_range_sync_sample_rate(long node_id, long start_sample, long end_sample, int loop, long sample_rate, double volume, double pan);

   return twr_audio_play_range_sync_sample_rate(node_id, start_sample, end_sample, fields->loop, fields->sample_rate, fields->volume, fields->pan);
}

float* twr_convert_8_bit_pcm(char* pcm, long pcm_len) {
   const float MAX_8 = 127.0;
   const float MIN_8 = -128.0;

   float* ret = (float*)malloc(sizeof(float) * pcm_len);

   for (long i = 0; i < pcm_len; i++) {
      ret[i] = pcm[i] > 0 ? pcm[i]/MAX_8 : pcm[i]/MIN_8;
   }

   return ret;
}

float* twr_convert_16_bit_pcm(short* pcm, long pcm_len) {
   const float MAX_16 = 32767.0;
   const float MIN_16 = -32768.0;
   
   float* ret = (float*)malloc(sizeof(float) * pcm_len);

   for (long i = 0; i < pcm_len; i++) {
      ret[i] = pcm[i] > 0 ? pcm[i]/MAX_16 : pcm[i]/MIN_16;
   }

   return ret;
}

float* twr_convert_32_bit_pcm(long* pcm, long pcm_len) {
   const float MAX_32 = 2147483647.0;
   const float MIN_32 = -2147483648.0;
   
   float* ret = (float*)malloc(sizeof(float) * pcm_len);

   for (long i = 0; i < pcm_len; i++) {
      ret[i] = pcm[i] > 0 ? pcm[i]/MAX_32 : pcm[i]/MIN_32;
   }

   return ret;
}