#include <twr-audio.h>
#include "twr-crt.h"  // twr_register_callback
#include <stdlib.h>
#include <stdio.h>
#include <stdarg.h>
#include <math.h>


__attribute__((import_name("clearIODiv"))) 
void clearIODiv();

#define CHANNELS 2
#define SAMPLE_RATE 48000
#define SECONDS 3

enum Tests {
   FromFloatPCMAndGetFloatPCM,
   From8bitPCMAndGet8bitPCM,
   From16bitPCMAndGet16bitPCM,
   From32bitPCMAndGet32bitPCM,
   GetMetadata,
   PlayAudioFromSample,
   PanAudioSample,
   PlayLoadedAudio,
   AudioFinishCallback,
   PlayAudioSync,
   SynchronousLoadAudio,
   PlayAudioFile,
   ModifyPlaybackVolume,
   ModifyFilePlaybackVolume,
   ModifyPlaybackPan,
   ModifyPlaybackRate,
   ModifyFilePlaybackRate,
   QueryPlaybackSampleAudio,
   StopAudioPlaybackSample,
   StopAudioPlaybackFile,
   StopAudioPlaybackFileLoop,
   PlayAudioNodeRange,
   PlayAudioNodeRangeLoop,
   PlayAudioNodeRangeSampleRate,
};
const long START_TEST = FromFloatPCMAndGetFloatPCM;
const long END_TEST = PlayAudioNodeRangeSampleRate;

const char* TEST_NAMES[30] = {
   "FromFloatPCMAndGetFloatPCM",
   "From8bitPCMAndGet8bitPCM",
   "From16bitPCMAndGet16bitPCM",
   "From32bitPCMAndGet32bitPCM",
   "GetMetadata",
   "PlayAudioFromSample",
   "PanAudioSample",
   "PlayLoadedAudio",
   "AudioFinishCallback",
   "PlayAudioSync",
   "SynchronousLoadAudio",
   "PlayAudioFile",
   "ModifyPlaybackVolume",
   "ModifyFilePlaybackVolume",
   "ModifyPlaybackPan",
   "ModifyPlaybackRate",
   "ModifyFilePlaybackRate",
   "QueryPlaybackSampleAudio",
   "StopAudioPlaybackSample",
   "StopAudioPlaybackFile",
   "StopAudioPlaybackFileLoop",
   "PlayAudioNodeRange",
   "PlayAudioNodeRangeLoop",
   "PlayAudioNodeRangeSampleRate",
};

float* generate_random_noise(long total_length) {
   float* noise = (float*)malloc(sizeof(float) * total_length);
   for (int i = 0; i < total_length; i++) {
      noise[i] = ((float)(rand() - RAND_MAX/2))/(((float)RAND_MAX)/2.0);
   }

   return noise;
}

void test_fail(const char* test_name, const char* err_msg) {
   printf("%s test failed! %s\n", test_name, err_msg);
}
void test_success(const char* test_name) {
   printf("%s test was successful!\n", test_name);
}

enum CallType {
   JSCall,
   NextTest,
   NextTestPart,
   AudioLoaded,
   PlaybackFinished
};

void internal_test_case(int test, void* extra, bool full, enum CallType typ);


//used for if user tries to run a test while one is already going
//the requested test is queued up and the running one is canceled ASAP
bool TEST_IS_RUNNING = false;
bool TEST_IN_QUEUE = false;
struct WaitingTest {
   int test_id;
   bool full;
};
struct WaitingTest WAITING_TEST;

void run_queued_test() {
   TEST_IN_QUEUE = false;
   clearIODiv();
   internal_test_case(WAITING_TEST.test_id, NULL, WAITING_TEST.full, JSCall);
}
//current test_run so it can be interrupted by restarting the tests or running an individual one
int TEST_NEXT_EVENT = -1;
int TEST_NEXT_CURRENT_TEST = -1;
int TEST_NEXT_THERE_IS_NEXT = false;
void test_next(int current_test, bool full, long timeout) {
   //test_next is used to interrupt currently running test
   //and run the requested one
   //this way, assuming no bugs, all other events are cleared and ready for the next test
   if (TEST_IN_QUEUE) {
      run_queued_test();
      return;
   }
   int next_test = current_test+1;
   // if (full && next_test <= END_TEST) {
   if (TEST_NEXT_EVENT == -1) {
      TEST_NEXT_EVENT = twr_register_callback("testNextTimer");
   }

   //if the event has a timeout, run it even if there is no text
   //just in case a new test is called while it's still running
   if (timeout <= 0 && full && next_test <= END_TEST) {
      internal_test_case(next_test, 0, true, NextTest);
   } else {
      TEST_IS_RUNNING = true;
      TEST_NEXT_CURRENT_TEST = next_test;
      TEST_NEXT_THERE_IS_NEXT = full && next_test <= END_TEST;
      twr_timer_single_shot(timeout, TEST_NEXT_EVENT);
   }
   // }
}
__attribute__((export_name("testNextTimer")))
void test_next_timer(int event_id) {
   if (TEST_IN_QUEUE) {
      run_queued_test();
   } else if (TEST_NEXT_THERE_IS_NEXT) {
      internal_test_case(TEST_NEXT_CURRENT_TEST, NULL, true, NextTest); 
   } else {
      TEST_IS_RUNNING = false;
   }
}

struct TestDataPart {
   int current_test;
   bool full;
   void* extra;
};
struct TestDataPart TEST_DATA_PART;
int TEST_NEXT_PART_EVENT = -1;
void test_next_part(int current_test, void* extra, bool full, long timeout) {
   TEST_IS_RUNNING = true;
   if (TEST_NEXT_PART_EVENT == -1) {
      TEST_NEXT_PART_EVENT = twr_register_callback("testNextPartTimer");
   }

   if (timeout <= 0) {
      internal_test_case(current_test, extra, full, NextTestPart);
   } else {      
      TEST_DATA_PART.current_test = current_test;
      TEST_DATA_PART.extra = extra;
      TEST_DATA_PART.full = full;
      twr_timer_single_shot(timeout, TEST_NEXT_PART_EVENT);
   }
}
__attribute__((export_name("testNextPartTimer")))
void test_next_part_timer(int event_id) {
   internal_test_case(TEST_DATA_PART.current_test, TEST_DATA_PART.extra, TEST_DATA_PART.full, NextTestPart);
}


int AUDIO_EVENT_ID = -1;
int AUDIO_LOAD_ID = -1;
int AUDIO_LOAD_CURRENT_TEST = -1;
bool AUDIO_LOAD_FULL = false;
void wait_for_audio_load(int current_test, bool full, char* url) {
   assert(AUDIO_LOAD_ID == -1);

   TEST_IS_RUNNING = true;

   if (AUDIO_EVENT_ID == -1) {
      AUDIO_EVENT_ID = twr_register_callback("audioLoadEvent");
   }

   long node_id = twr_audio_load(AUDIO_EVENT_ID, url);

   AUDIO_LOAD_ID = node_id;
   AUDIO_LOAD_CURRENT_TEST = current_test;
   AUDIO_LOAD_FULL = full;
}

__attribute__((export_name("audioLoadEvent")))
void audio_load_event(int event_id, int audio_id) {
   if (audio_id != AUDIO_LOAD_ID) return;

   int current_test = AUDIO_LOAD_CURRENT_TEST;
   int full = AUDIO_LOAD_FULL;

   AUDIO_LOAD_ID = -1;
   AUDIO_LOAD_CURRENT_TEST = -1;
   AUDIO_LOAD_FULL = -1;

   internal_test_case(current_test, (void*)(audio_id), full, AudioLoaded);
}

int PLAYBACK_WAIT_EVENT_ID = -1;
int PLAYBACK_WAIT_ID = -1;
int PLAYBACK_WAIT_CURRENT_TEST = -1;
bool PLAYBACK_WAIT_LOAD_FULL = false;
void wait_for_playback_finish(int current_test, bool full, long node_id, long start_sample, long end_sample, int loop, long sample_rate, double volume, double pan) {
   assert(PLAYBACK_WAIT_ID == -1);

   TEST_IS_RUNNING = true;

   if (PLAYBACK_WAIT_EVENT_ID == -1) {
      PLAYBACK_WAIT_EVENT_ID = twr_register_callback("waitForPlaybackFinishEvent");
   }

   struct PlayRangeFields fields = {
      .loop = loop,
      .sample_rate = sample_rate,
      .volume = volume,
      .pan = pan,
      .finish_callback = PLAYBACK_WAIT_EVENT_ID
   };
   long playback_id = twr_audio_play_range_ex(node_id, start_sample, end_sample, &fields);

   PLAYBACK_WAIT_ID = playback_id;
   PLAYBACK_WAIT_CURRENT_TEST = current_test;
   PLAYBACK_WAIT_LOAD_FULL = full;
}

__attribute__((export_name("waitForPlaybackFinishEvent")))
void wait_for_playback_finish_event(int event_id, int playback_id) {
   if (playback_id != PLAYBACK_WAIT_ID) return;

   int current_test = PLAYBACK_WAIT_CURRENT_TEST;
   int full = PLAYBACK_WAIT_LOAD_FULL;

   PLAYBACK_WAIT_ID = -1;
   PLAYBACK_WAIT_CURRENT_TEST = -1;
   PLAYBACK_WAIT_LOAD_FULL = false;

   internal_test_case(current_test, (void*)playback_id, full, PlaybackFinished);
}

#define ERR_MSG_LEN 30
char err_msg[ERR_MSG_LEN];

void test_from_pcm_and_get_pcm(
   long test, 
   long channels, 
   long duration,
   long sample_rate, 
   void* data, 
   long (*generate_audio)(long, long, void*, long),
   void* (*get_audio)(long, long*, long*),
   bool (*validate)(void* data1, void* data2, long len)
) {
   long node_id = generate_audio(channels, sample_rate, data, sample_rate*duration);

   long total_len = duration*sample_rate*channels;

   long num_channels = -1;

   long single_channel_len = -1;

   void* test_noise = twr_audio_get_float_pcm(node_id, &single_channel_len, &num_channels);
   
   
   if (num_channels != CHANNELS) {
      snprintf(err_msg, ERR_MSG_LEN-1, "expected %d channels, got %ld", CHANNELS, num_channels);
      test_fail(TEST_NAMES[test], err_msg);
   } else if (single_channel_len*num_channels != total_len) {
      snprintf(err_msg, ERR_MSG_LEN-1, "expected a length of %ld, got %ld", total_len, single_channel_len*num_channels);
      test_fail(TEST_NAMES[test], err_msg);
   } else if (validate(data, test_noise, total_len)) {
      test_success(TEST_NAMES[test]);
   } else {
      test_fail(TEST_NAMES[test], "Given audio didn't match what was retrieved!");
   }

   twr_audio_free_id(node_id);

   free(test_noise);
}

bool validate_float(void* data1, void* data2, long len) {
   for (long i = 0; i < len; i++) {
      if (((float*)data1)[i] != ((float*)data2)[i]) {
         return false;
      }
   }
   return true;
}
bool validate_char(void* data1, void* data2, long len) {
   for (long i = 0; i < len; i++) {
      if (((char*)data1)[i] != ((char*)data2)[i]) {
         return false;
      }
   }
   return true;
}
bool validate_short(void* data1, void* data2, long len) {
   for (long i = 0; i < len; i++) {
      if (((short*)data1)[i] != ((short*)data2)[i]) {
         return false;
      }
   }
   return true;
}
bool validate_int(void* data1, void* data2, long len) {
   for (long i = 0; i < len; i++) {
      if (((int*)data1)[i] != ((int*)data2)[i]) {
         return false;
      }
   }
   return true;
}
void internal_test_case(int test, void* extra, bool full, enum CallType typ) {
   //set TEST_IS_RUNNING to false. A callback like wait_for_audio_load, test_next, or test_next_part
   // will set it back to true if needed. Otherwise, the test will have finished
   TEST_IS_RUNNING = false;

   switch (test) {
      case FromFloatPCMAndGetFloatPCM:
      {
         float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
         test_from_pcm_and_get_pcm(test, CHANNELS, SECONDS, SAMPLE_RATE, (void*)noise, 
            (long (*)(long, long, void*, long))twr_audio_from_float_pcm, 
            (void* (*)(long, long*, long*))twr_audio_get_float_pcm, 
            validate_float
         );
         free(noise);
         test_next(test, full, 0);
      }
      break;
      case From8bitPCMAndGet8bitPCM:
      {
         long total_len = CHANNELS * SAMPLE_RATE * SECONDS;
         float* noise = generate_random_noise(total_len);
         char* noise_char = (char*)malloc(sizeof(char) * total_len);
         for (long i = 0; i < total_len; i++) {
            noise_char[i] = (char)floor(noise[i]/128 + 0.5); //0.5 is added to make it round
         }
         free(noise);

         test_from_pcm_and_get_pcm(test, CHANNELS, SECONDS, SAMPLE_RATE, (void*)noise_char, 
            (long (*)(long, long, void*, long))twr_audio_from_8bit_pcm, 
            (void* (*)(long, long*, long*))twr_audio_get_8bit_pcm, 
            validate_char
         );
         free(noise_char);
         test_next(test, full, 0);
      }
      break;
      case From16bitPCMAndGet16bitPCM:
      {
         long total_len = CHANNELS * SAMPLE_RATE * SECONDS;
         float* noise = generate_random_noise(total_len);
         short* noise_char = (short*)malloc(sizeof(short) * total_len);
         for (long i = 0; i < total_len; i++) {
            noise_char[i] = (short)floor(noise[i]/32768 + 0.5); //0.5 is added to make it round
         }
         free(noise);

         test_from_pcm_and_get_pcm(test, CHANNELS, SECONDS, SAMPLE_RATE, (void*)noise_char, 
            (long (*)(long, long, void*, long))twr_audio_from_16bit_pcm, 
            (void* (*)(long, long*, long*))twr_audio_get_16bit_pcm, 
            validate_short
         );
         free(noise_char);
         test_next(test, full, 0);
      }
      break;
      case From32bitPCMAndGet32bitPCM:
      {
         long total_len = CHANNELS * SAMPLE_RATE * SECONDS;
         float* noise = generate_random_noise(total_len);
         int* noise_char = (int*)malloc(sizeof(int) * total_len);
         for (long i = 0; i < total_len; i++) {
            noise_char[i] = (int)floor(noise[i]/2147483648 + 0.5); //0.5 is added to make it round
         }
         free(noise);

         test_from_pcm_and_get_pcm(test, CHANNELS, SECONDS, SAMPLE_RATE, (void*)noise_char, 
            (long (*)(long, long, void*, long))twr_audio_from_32bit_pcm, 
            (void* (*)(long, long*, long*))twr_audio_get_32bit_pcm, 
            validate_int
         );
         free(noise_char);
         test_next(test, full, 0);
      }
      break;

      case GetMetadata:
      {
         float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
         long node_id = twr_audio_from_float_pcm(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE * SECONDS);
         free(noise);

         struct AudioMetadata meta;
         twr_audio_get_metadata(node_id, &meta);

         if (meta.channels != CHANNELS || meta.length != SAMPLE_RATE * SECONDS || meta.sample_rate != SAMPLE_RATE) {
            test_fail(TEST_NAMES[test], "metadata didn't match given values");
         } else {
            
            twr_audio_get_metadata(node_id, &meta);

            if (meta.channels == CHANNELS && meta.length == SAMPLE_RATE * SECONDS && meta.sample_rate == SAMPLE_RATE) {
               test_success(TEST_NAMES[test]);
            } else {
               char err_msg[100];
               snprintf(
                  err_msg, 
                  99, 
                  "appended metadata expected: %ld == %d, %ld == %d, %ld == %d", 
                  meta.channels, CHANNELS,
                  meta.sample_rate, SAMPLE_RATE,
                  meta.length, SAMPLE_RATE * SECONDS
               );
               test_fail(TEST_NAMES[test], err_msg);
            }
            free(extra);
         }
         twr_audio_free_id(node_id);

         test_next(test, full, 0);
      }
      break;

      case PlayAudioFromSample:
      {
         float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
         long node_id = twr_audio_from_float_pcm(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE*SECONDS);

         twr_audio_play_volume(node_id, 0.5, 0.0);
         printf("Running test %s\n", TEST_NAMES[test]);

         twr_audio_free_id(node_id);
         free(noise);
         test_next(test, full, SECONDS*1000 + 500);
      }
      break;

      case PanAudioSample:
      {
         float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
         long node_id = twr_audio_from_float_pcm(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE*SECONDS);

         twr_audio_play_volume(node_id, 0.5, -0.5);
         printf("Running test %s\n", TEST_NAMES[test]);

         twr_audio_free_id(node_id);
         free(noise);
         test_next(test, full, SECONDS*1000 + 500);
      }
      break;

      case PlayLoadedAudio:
      {
         #ifdef ASYNC
         long node_id = twr_audio_load_sync("ping.mp3");
         twr_audio_play(node_id);
         printf("Running test %s\n", TEST_NAMES[test]);
         twr_audio_free_id(node_id);
         test_next(test, full, 3000);  
         #else
         printf("%s can only be ran as async!\n", TEST_NAMES[test]);
         test_next(test, full, 0);
         #endif
      }
      break;

      case AudioFinishCallback:
      {
         if (typ != PlaybackFinished) {
            float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
            long node_id = twr_audio_from_float_pcm(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE*SECONDS);

            printf("Running test %s\n", TEST_NAMES[test]);
            wait_for_playback_finish(test, full, node_id, 0, SAMPLE_RATE*SECONDS, false, SAMPLE_RATE, 50, 0);

            twr_audio_free_id(node_id);
            free(noise);
            
         } else {
            long playback_id = (long)extra;
            if (twr_audio_query_playback_position(playback_id) == -1) {
               test_success(TEST_NAMES[test]);
            } else {
               test_fail(TEST_NAMES[test], "audio playback node hasn't been cleared yet!");
            }
            test_next(test, full, 0);
         }
      }
      break;

      case PlayAudioSync:
      {
         #ifdef ASYNC
         float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
         long node_id = twr_audio_from_float_pcm(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE*SECONDS);

         printf("Running test %s\n", TEST_NAMES[test]);

         long playback_id = twr_audio_play_sync(node_id);

         twr_audio_free_id(node_id);
         free(noise);
         
         if (twr_audio_query_playback_position(playback_id) == -1) {
            test_success(TEST_NAMES[test]);
         } else {
            test_fail(TEST_NAMES[test], "audio playback node hasn't been cleared yet!");
         }
         #else
         printf("%s can only be ran as async!\n", TEST_NAMES[test]);
         #endif
         test_next(test, full, 0);
      }
      break;

      case SynchronousLoadAudio:
      {
         if (typ != AudioLoaded) {
            wait_for_audio_load(test, full, "ping.mp3");
         } else {
            long node_id = (long)extra;
            twr_audio_play(node_id);

            printf("Running test %s\n", TEST_NAMES[test]);

            twr_audio_free_id(node_id);
            test_next(test, full, 3000);
         }
         
      }
      break;

      case PlayAudioFile:
      {
         twr_audio_play_file("ping.mp3");
         printf("Running test %s\n", TEST_NAMES[test]);
         test_next(test, full, 3000);
      }
      break;

      case ModifyPlaybackVolume:
      {
         if (extra == NULL) {
            float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
            long node_id = twr_audio_from_float_pcm(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE*SECONDS);

            printf("Running test %s\n", TEST_NAMES[test]);

            long playback_id = twr_audio_play(node_id);

            twr_audio_free_id(node_id);
            free(noise);

            void* args = malloc(sizeof(double) + sizeof(long));
            *(double*)(args) = 1.0;
            *(long*)(args + sizeof(double)) = playback_id;

            test_next_part(test, (void*)args, full, (SECONDS * 1000)/10);
         } else {
            double* vol_ptr = (double*)extra;
            long playback_id = *(long*)(extra + sizeof(double));
            *vol_ptr -= 0.1;
            double volume = *vol_ptr;

            if (twr_audio_query_playback_position(playback_id) == -1) {
               free(extra);
               test_next(test, full, 0);
            } else {
               twr_audio_modify_playback_volume(playback_id, volume);
               test_next_part(test, extra, full, (SECONDS * 1000)/10);
            }
         }
      }
      break;

      case ModifyFilePlaybackVolume:
      {
         if (extra == NULL) {

            printf("Running test %s\n", TEST_NAMES[test]);

            long playback_id = twr_audio_play_file("croud.mp3");

            void* args = malloc(sizeof(double) + sizeof(long));
            *(double*)(args) = 1.0;
            *(long*)(args + sizeof(double)) = playback_id;

            test_next_part(test, (void*)args, full, (4 * 1000)/10);
         } else {
            double* vol_ptr = (double*)extra;
            long playback_id = *(long*)(extra + sizeof(double));
            *vol_ptr -= 0.1;
            double volume = *vol_ptr;

            if (twr_audio_query_playback_position(playback_id) == -1) {
               free(extra);
               test_next(test, full, 0);
            } else {
               twr_audio_modify_playback_volume(playback_id, volume);
               test_next_part(test, extra, full, (4 * 1000)/10);
            }
         }
      }
      break;

      case ModifyPlaybackPan:
      {
         if (extra == NULL) {
            float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
            long node_id = twr_audio_from_float_pcm(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE*SECONDS);

            printf("Running test %s\n", TEST_NAMES[test]);

            long playback_id = twr_audio_play_volume(node_id, 0.5, -1.0);

            twr_audio_free_id(node_id);
            free(noise);

            void* args = malloc(sizeof(double) + sizeof(long));
            *(double*)(args) = -1.0;
            *(long*)(args + sizeof(double)) = playback_id;

            test_next_part(test, (void*)args, full, (SECONDS * 1000)/26);
         } else {
            double* pan_ptr = (double*)extra;
            long playback_id = *(long*)(extra + sizeof(double));
            *pan_ptr += 1.0/20.0*2.0;
            double pan = *pan_ptr;
            pan = pan > 1.0 ? 1.0 : pan;
            // pan = pan > 1.0 ? 1.0 : pan;

            if (twr_audio_query_playback_position(playback_id) == -1) {
               free(extra);
               test_next(test, full, 0);
            } else {
               twr_audio_modify_playback_pan(playback_id, pan);
               test_next_part(test, extra, full, (SECONDS * 1000)/26);
            }
         }
      }
      break;

      case ModifyPlaybackRate:
      {

         if (typ != AudioLoaded && typ != NextTestPart) {
            wait_for_audio_load(test, full, "ping.mp3");
         } else if (typ == AudioLoaded) {
            printf("Running test %s\n", TEST_NAMES[test]);

            long node_id = (long)extra;

            struct AudioMetadata meta;
            twr_audio_get_metadata(node_id, &meta);

            long START_SAMPLE_RATE = meta.sample_rate;

            struct PlayRangeFields fields = twr_audio_default_play_range();
            fields.sample_rate = START_SAMPLE_RATE;
            fields.volume = 0.5;

            long playback_id = twr_audio_play_range_ex(node_id, 0, meta.length, &fields);

            twr_audio_free_id(node_id);

            long* args = malloc(sizeof(long) * 2);
            args[0] = playback_id;

            args[1] = meta.sample_rate;

            test_next_part(test, (void*)args, full, (SECONDS * 1000)/20);

         } else {
            long* args = (long*)extra;
            long playback_id = args[0];
            args[1] = (long)((args[1])/1.15);
            long rate = args[1];

            if (twr_audio_query_playback_position(playback_id) == -1) {
               free(args);
               test_next(test, full, 0);
            } else {
               twr_audio_modify_playback_rate(playback_id, rate);
               test_next_part(test, (void*)args, full, (SECONDS * 1000)/20);
            }
         }
      }
      break;

      case ModifyFilePlaybackRate:
      {
         if (extra == NULL) {
            printf("Running test %s\n", TEST_NAMES[test]);

            long playback_id = twr_audio_play_file("croud.mp3");

            void* args = malloc(sizeof(double) + sizeof(long));

            *(double*)args = 1.0;
            *(long*)(args + sizeof(double)) = playback_id;

            test_next_part(test, (void*)args, full, (4 * 1000)/5);

         } else {
            double* rate_ptr = (double*)extra;
            long playback_id = *(long*)(extra + sizeof(double));

            *rate_ptr *= 2.0;
            long rate = *rate_ptr;

            if (twr_audio_query_playback_position(playback_id) == -1) {
               free(extra);
               test_next(test, full, 0);
            } else {
               twr_audio_modify_playback_rate(playback_id, rate);
               test_next_part(test, extra, full, (SECONDS * 1000)/5);
            }
         }
      }
      break;

      case QueryPlaybackSampleAudio:
      {
         long* state = (long*)extra;
         if (typ != NextTestPart) {
            state = malloc(sizeof(long) * 3);
            float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
            long node_id = twr_audio_from_float_pcm(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE*SECONDS);

            long playback_id = twr_audio_play_volume(node_id, 0.5, 0.0);
            twr_audio_free_id(node_id);
            free(noise);
            state[0] = playback_id;
            state[1] = twr_epoch_timems();
            state[2] = true;
         }

         long elapsed = twr_epoch_timems() - state[1];

         if (elapsed <= SECONDS*1000) {
            // printf("playback position: %ld, elapsed: %ld\n", twr_audio_query_playback_position(state[0]), elapsed);
            long pos = twr_audio_query_playback_position(state[0]);
            if (abs(elapsed - pos) > 20) {
               state[2] = false;
            }
            test_next_part(test, (void*)state, full, 200);
         } else {
            if (state[2]) {
               test_success(TEST_NAMES[test]);
            } else {
               test_fail(TEST_NAMES[test], "audio played at an unexpected rate!");
            }
            free(state);
            test_next(test, full, 0);
         } 
      }
      break;

      case StopAudioPlaybackSample:
      {
         long prev_playback_id = (long)extra;
         if (typ != NextTestPart) {
            float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
            long node_id = twr_audio_from_float_pcm(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE*SECONDS);
            free(noise);
            long playback_id = twr_audio_play(node_id);
            twr_audio_free_id(node_id);

            twr_audio_stop_playback(playback_id);
            
            //playback is fully deleted based on an event, so it might take time to propogate
            test_next_part(test, (void*)playback_id, full, 200);
         } else {
            if (twr_audio_query_playback_position(prev_playback_id) < 0) {
               test_success(TEST_NAMES[test]);
            } else {
               test_fail(TEST_NAMES[test], "audio hasn't ended!");
            }
            test_next(test, full, 0);
         }
      }
      break;

      case StopAudioPlaybackFile:
      {
         long* ret_args = (long*)extra;
         long prev_playback_id = ret_args[0];
         if (typ != NextTestPart) {
            long playback_id = twr_audio_play_file("croud.mp3");

            long* args = malloc(sizeof(long) * 2);
            args[0] = -20;
            args[1] = playback_id;
            
            //audio takes a bit to load, give it some time before stopping
            test_next_part(test, (void*)args, full, 200);
         } else if (prev_playback_id == -20) {
            long playback_id = ret_args[1];
            free(extra);

            twr_audio_stop_playback(playback_id);

            //give it some time to propogate the stop
            test_next_part(test, (void*)playback_id, full, 200); 
         } else {
            if (twr_audio_query_playback_position(prev_playback_id) < 0) {
               test_success(TEST_NAMES[test]);
            } else {
               test_fail(TEST_NAMES[test], "audio hasn't ended!");
            }
            test_next(test, full, 0);
         }
      }
      break;

      case StopAudioPlaybackFileLoop:
      {
         long* ret_args = (long*)extra;
         long prev_playback_id = ret_args[0];
         if (typ != NextTestPart) {
            long playback_id = twr_audio_play_file_ex("croud.mp3", 1.0, 0.0, true);

            long* args = malloc(sizeof(long) * 2);
            args[0] = -20;
            args[1] = playback_id;
            
            //audio takes a bit to load, give it some time before stopping
            test_next_part(test, (void*)args, full, 200);
         } else if (prev_playback_id == -20) {
            long playback_id = ret_args[1];
            free(extra);

            twr_audio_stop_playback(playback_id);

            //give it some time to propogate the stop
            test_next_part(test, (void*)playback_id, full, 200); 
         } else {
            if (twr_audio_query_playback_position(prev_playback_id) < 0) {
               test_success(TEST_NAMES[test]);
            } else {
               test_fail(TEST_NAMES[test], "audio hasn't ended!");
            }
            test_next(test, full, 0);
         }
      }
      break;

      case PlayAudioNodeRange:
      {
         long prev_id = (long)extra;
         long target_runtime = 1;
         if (typ != NextTestPart) {
            float* noise = generate_random_noise(SAMPLE_RATE * SECONDS * CHANNELS);
            long node_id = twr_audio_from_float_pcm(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE * SECONDS);
            free(noise);

            long playback_id = twr_audio_play_range(node_id, 0, SAMPLE_RATE * target_runtime);

            twr_audio_free_id(node_id);

            test_next_part(test, (void*)playback_id, full, (long)(((double)target_runtime) * 1000.0 * 1.25));
         } else {
            long runtime = twr_audio_query_playback_position(prev_id);
            //timeout is longer than the audio sample range given
            //the audio should be done (returning -1) by the time it gets here
            if (runtime == -1) {
               test_success(TEST_NAMES[test]);
               test_next(test, full, 0);
            } else {
               test_fail(TEST_NAMES[test], "Audio played for too long!");
               //have a different timeout to ensure this one finished before next possible test
               test_next(test, full, (SECONDS - target_runtime) * 1000);
            }
         }
      }
      break;

      case PlayAudioNodeRangeLoop:
      {
         long prev_id = (long)extra;
         double target_runtime = 0.15;
         if (typ != NextTestPart) {
            float* noise = generate_random_noise(SAMPLE_RATE * SECONDS * CHANNELS);
            long node_id = twr_audio_from_float_pcm(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE * SECONDS);
            free(noise);

            struct PlayRangeFields fields = twr_audio_default_play_range();
            fields.loop = true;

            long playback_id = twr_audio_play_range_ex(node_id, 0, SAMPLE_RATE * target_runtime, &fields);

            twr_audio_free_id(node_id);

            test_next_part(test, (void*)playback_id, full, (long)(target_runtime * 1000.0 * 10.0));
         } else {
            long runtime = twr_audio_query_playback_position(prev_id);
            //timeout is longer than the audio sample range given
            //since the audio loops, it should not be done by the time it get's here
            if (runtime != -1) {
               test_success(TEST_NAMES[test]);
               twr_audio_stop_playback(prev_id);
            } else {
               test_fail(TEST_NAMES[test], "audio failed to loop!");
            }
            test_next(test, full, 0);
         }
      }
      break;

      case PlayAudioNodeRangeSampleRate:
      {
         long prev_id = (long)extra;
         double target_runtime = 1.0;
         long n_sample_rate = SAMPLE_RATE * 2;
         if (typ != NextTestPart) {
            float* noise = generate_random_noise(SAMPLE_RATE * SECONDS * CHANNELS);
            long node_id = twr_audio_from_float_pcm(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE * SECONDS);
            free(noise);

            struct PlayRangeFields fields = twr_audio_default_play_range();
            fields.sample_rate = n_sample_rate;

            long playback_id = twr_audio_play_range_ex(node_id, 0, SAMPLE_RATE * target_runtime, &fields);

            twr_audio_free_id(node_id);

            long timeout = (long)(target_runtime * 1000.0 * ((n_sample_rate + SAMPLE_RATE)/2.0)/n_sample_rate);
            test_next_part(test, (void*)playback_id, full, timeout);

         } else {
            long runtime = twr_audio_query_playback_position(prev_id);
            //timeout is longer than the audio sample range given
            //since the audio loops, it should not be done by the time it get's here
            if (runtime == -1) {
               test_success(TEST_NAMES[test]);
            } else {
               test_fail(TEST_NAMES[test], "audio lasted longer than expected");
               twr_audio_stop_playback(prev_id);
            }
            test_next(test, full, 0);
         }
      }
      break;

      

      default:
         assert(false);
   }

   // printf("test running: %d\n", TEST_IS_RUNNING);
}

void enter_test_case(int test, bool full) {
   if (!TEST_IS_RUNNING) {
      clearIODiv();
      internal_test_case(test + START_TEST, 0, full, JSCall);
   } else {
      TEST_IN_QUEUE = true;
      WAITING_TEST.test_id = test;
      WAITING_TEST.full = full;
   }
}

__attribute__((export_name("testCase")))
void test_case(int test) {
   // internal_test_case(test + START_TEST, 0, false, JSCall);
   enter_test_case(test, false); 
}

__attribute__((export_name("testAll")))
void test_all() {
   // internal_test_case(START_TEST, 0, true, JSCall);
   enter_test_case(0, true);
}

__attribute__((export_name("getNumTests")))
int get_num_tests() {
   return END_TEST - START_TEST + 1;
}

__attribute__((export_name("getTestName")))
const char* get_test_name(int id) {
   return TEST_NAMES[id+START_TEST];
}