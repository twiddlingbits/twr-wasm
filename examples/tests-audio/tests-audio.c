#include <twr-audio.h>
#include <stdlib.h>
#include <stdio.h>
#include <stdarg.h>
#include <math.h>

__attribute__((import_name("clearIODiv"))) 
void clearIODiv();

__attribute__((import_name("twr_register_callback")))
int twr_register_callback(const char* func_name);

__attribute__((import_name("twr_timer_single_shot")))
void twr_timer_single_shot(long milli_seconds, long event_id);

#define CHANNELS 2
#define SAMPLE_RATE 48000
#define SECONDS 3

enum Tests {
   AudioFromSampleAndGetAudioSample,
   TooSmallGetAudioSampleBuffer,
   AppendAudioSamplesAndGetAudioSample,
   GetMetadata,
   PlayAudioFromSample,
   PanAudioSample,
   PlayLoadedAudio,
   SynchronousLoadAudio,
   QueryPlaybackSampleAudio,
   StopAudioPlaybackSample,
};
const long START_TEST = AudioFromSampleAndGetAudioSample;
const long END_TEST = StopAudioPlaybackSample;

const char* TEST_NAMES[30] = {
   "AudioFromSampleAndGetAudioSample",
   "TooSmallGetAudioSampleBuffer",
   "AppendAudioSamplesAndGetAudioSample",
   "GetMetadata",
   "PlayAudioFromSample",
   "PanAudioSample",
   "PlayLoadedAudio",
   "SynchronousLoadAudio",
   "QueryPlaybackSampleAudio",
   "StopAudioPlaybackSample",
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
   AudioLoaded
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

   long node_id = twrLoadAudio(AUDIO_EVENT_ID, url);

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

#define ERR_MSG_LEN 30
char err_msg[ERR_MSG_LEN];

void internal_test_case(int test, void* extra, bool full, enum CallType typ) {
   //set TEST_IS_RUNNING to false. A callback like wait_for_audio_load, test_next, or test_next_part
   // will set it back to true if needed. Otherwise, the test will have finished
   TEST_IS_RUNNING = false;

   switch (test) {
      case AudioFromSampleAndGetAudioSample:
      {
         const long total_len = CHANNELS * SAMPLE_RATE * SECONDS;
         float* noise = generate_random_noise(total_len);

         long node_id = twrAudioFromSamples(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE*SECONDS);

         const long test_noise_len = total_len + 5;
         float* test_noise = (float*)malloc(sizeof(float) * test_noise_len);
         long test_channels = -1;
         long test_len = twrGetAudioSamples(node_id, &test_channels, test_noise, test_noise_len);
         
         
         if (test_channels != CHANNELS) {
            snprintf(err_msg, ERR_MSG_LEN-1, "expected %d channels, got %ld", CHANNELS, test_channels);
            test_fail(TEST_NAMES[test], err_msg);
         } else if (test_len != total_len) {
            snprintf(err_msg, ERR_MSG_LEN-1, "expected a length of %ld, got %ld", total_len, test_len);
            test_fail(TEST_NAMES[test], err_msg);
         } else {
            bool valid = true;
            for (int i = 0; i < total_len; i++) {
               if (noise[i] != test_noise[i]) {
                  valid = false;
                  test_fail(TEST_NAMES[test], "audio generated for twrAudioFromSamples didn't match data returned from twrGetAudioSamples");
                  break;
               }
            }
            if (valid) {
               test_success(TEST_NAMES[test]);
            }
         }

         twrFreeAudioID(node_id);

         free(noise);
         free(test_noise);
         test_next(test, full, 0);
      }
      break;

      case TooSmallGetAudioSampleBuffer:
      {
         const long total_len = CHANNELS * SAMPLE_RATE * SECONDS;
         float* noise = generate_random_noise(total_len);

         long node_id = twrAudioFromSamples(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE*SECONDS);

         const long test_noise_len = total_len - 10;
         float* test_noise = (float*)malloc(sizeof(float) * test_noise_len);
         long test_channels = -1;
         long test_len = twrGetAudioSamples(node_id, &test_channels, test_noise, test_noise_len);
         
         long expected_test_len = (test_noise_len/test_channels)*test_channels;
         
         if (test_channels != CHANNELS) {
            snprintf(err_msg, ERR_MSG_LEN-1, "expected %d channels, got %ld", CHANNELS, test_channels);
            test_fail(TEST_NAMES[test], err_msg);
         } else if (test_len != expected_test_len) {
            snprintf(err_msg, ERR_MSG_LEN-1, "expected a length of %ld, got %ld", expected_test_len, test_len);
            test_fail(TEST_NAMES[test], err_msg);
         } else {
            bool valid = true;
            for (int channel = 0; channel < CHANNELS; channel++) {
               long noise_offset = channel * SAMPLE_RATE*SECONDS;
               long test_noise_offset = channel * test_len/test_channels;
               for (int i = 0; i < test_len/test_channels; i++) {
                  if (noise[noise_offset + i] != test_noise[test_noise_offset + i]) {
                     valid = false;
                     test_fail(TEST_NAMES[test], "audio generated for twrAudioFromSamples didn't match data returned from twrGetAudioSamples");
                     break;
                  }
               }
               if (!valid)
                  break;  
            }
            if (valid) {
               test_success(TEST_NAMES[test]);
            }
         }

         twrFreeAudioID(node_id);
         free(noise);
         free(test_noise);
         test_next(test, full, 0);
      }
      break;

      case AppendAudioSamplesAndGetAudioSample:
      {
         long duration = SECONDS/2;
         float* noise_1 = generate_random_noise(CHANNELS * duration * SAMPLE_RATE);
         float* noise_2 = generate_random_noise(CHANNELS * duration * SAMPLE_RATE);

         long node_id = twrAudioFromSamples(CHANNELS, SAMPLE_RATE, noise_1, duration * SAMPLE_RATE);
         twrAppendAudioSamples(node_id, CHANNELS, noise_2, duration * SAMPLE_RATE);

         long actual_size = CHANNELS * duration * SAMPLE_RATE * 2.0;
         long combined_size = actual_size + 10;

         float* combined = (float*)malloc(sizeof(float) * combined_size);
         long channels;
         long total_len = twrGetAudioSamples(node_id, &channels, combined, combined_size);

         twrFreeAudioID(node_id);

         if (channels != CHANNELS) {
            test_fail(TEST_NAMES[test], "channels no longer match!");
         } else if (total_len != actual_size) {
            char err_msg[100];
            snprintf(err_msg, 99, "Expected a length of %ld, got %ld!\n", actual_size, total_len);
            test_fail(TEST_NAMES[test], err_msg);
         } else {
            bool valid = true;
            for (long channel = 0; channel < CHANNELS; channel++) {
               long channel_offset = CHANNELS * duration * SAMPLE_RATE * channel;
               long noise_offset = duration * SAMPLE_RATE * channel;
               for (long seg = 0; seg < 2; seg++) {
                  long offset = duration * SAMPLE_RATE * seg + channel_offset;
                  for (long i = 0; i < duration * SAMPLE_RATE; i++) {
                     bool bef = valid;
                     if (seg == 0 && noise_1[noise_offset + i] != combined[offset + i]) {
                        valid = false;
                     } else if (seg == 1 && noise_2[noise_offset + i] != combined[offset + i]) {
                        valid = false;
                     }
                     if (bef && !valid) {
                        printf("failed! %ld, %ld, %ld, %ld, %ld, %f, %f\n", channel, channel_offset, seg, offset, i, seg ? noise_2[noise_offset + i] : noise_1[noise_offset + i], combined[offset + i]);
                     }
                  }
                  
               }
            }

            if (valid) {
               test_success(TEST_NAMES[test]);
            } else {
               test_fail(TEST_NAMES[test], "combined audio from twrAppendAudioSamples didn't match given data");
            }

            free(noise_1);
            free(noise_2);
            free(combined);

            
            test_next(test, full, 0);
         }
      }
      break;

      case GetMetadata:
      {
         float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
         long node_id = twrAudioFromSamples(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE * SECONDS);
         free(noise);

         struct AudioMetadata meta;
         twrGetAudioMetadata(node_id, &meta);

         if (meta.channels != CHANNELS || meta.length != SAMPLE_RATE * SECONDS || meta.sample_rate != SAMPLE_RATE) {
            test_fail(TEST_NAMES[test], "metadata didn't match given values");
         } else {
            float* extra = generate_random_noise(CHANNELS * SAMPLE_RATE * 1);
            twrAppendAudioSamples(node_id, CHANNELS, extra, SAMPLE_RATE * 1);
            
            twrGetAudioMetadata(node_id, &meta);

            if (meta.channels == CHANNELS && meta.length == SAMPLE_RATE * (SECONDS + 1) && meta.sample_rate == SAMPLE_RATE) {
               test_success(TEST_NAMES[test]);
            } else {
               char err_msg[100];
               snprintf(
                  err_msg, 
                  99, 
                  "appended metadata expected: %ld == %d, %ld == %d, %ld == %d", 
                  meta.channels, CHANNELS,
                  meta.sample_rate, SAMPLE_RATE,
                  meta.length, SAMPLE_RATE * (SECONDS + 1)
               );
               test_fail(TEST_NAMES[test], err_msg);
            }
            free(extra);
         }
         twrFreeAudioID(node_id);

         test_next(test, full, 0);
      }
      break;

      case PlayAudioFromSample:
      {
         float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
         long node_id = twrAudioFromSamples(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE*SECONDS);

         twrPlayAudioNodeVolume(node_id, 50);
         printf("Running test %s\n", TEST_NAMES[test]);

         twrFreeAudioID(node_id);
         free(noise);
         test_next(test, full, SECONDS*1000 + 500);
      }
      break;

      case PanAudioSample:
      {
         float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
         long node_id = twrAudioFromSamples(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE*SECONDS);

         twrPlayAudioNodePan(node_id, 50, -50);
         printf("Running test %s\n", TEST_NAMES[test]);

         twrFreeAudioID(node_id);
         free(noise);
         test_next(test, full, SECONDS*1000 + 500);
      }
      break;

      case PlayLoadedAudio:
      {
         #ifdef ASYNC
         long node_id = twrLoadAudioAsync("ping.mp3");
         twrPlayAudioNode(node_id);
         printf("Running test %s\n", TEST_NAMES[test]);
         twrFreeAudioID(node_id);
         test_next(test, full, 3000);  
         #else
         printf("%s can only be ran as async!\n", TEST_NAMES[test]);
         test_next(test, full, 0);
         #endif
      }
      break;

      case SynchronousLoadAudio:
      {
         if (typ != AudioLoaded) {
            wait_for_audio_load(test, full, "ping.mp3");
         } else {
            long node_id = (long)extra;
            twrPlayAudioNode(node_id);

            printf("Running test %s\n", TEST_NAMES[test]);

            twrFreeAudioID(node_id);
            test_next(test, full, 3000);
         }
         
      }
      break;

      case QueryPlaybackSampleAudio:
      {
         long* state = (long*)extra;
         if (extra == NULL) {
            state = malloc(sizeof(long) * 3);
            float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
            long node_id = twrAudioFromSamples(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE*SECONDS);

            long playback_id = twrPlayAudioNodeVolume(node_id, 50);
            twrFreeAudioID(node_id);
            free(noise);
            state[0] = playback_id;
            state[1] = twr_epoch_timems();
            state[2] = true;
         }

         long elapsed = twr_epoch_timems() - state[1];

         if (elapsed <= SECONDS*1000) {
            // printf("playback position: %ld, elapsed: %ld\n", twrQueryAudioPlaybackPosition(state[0]), elapsed);
            long pos = twrQueryAudioPlaybackPosition(state[0]);
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
         if (!prev_playback_id) {
            float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
            long node_id = twrAudioFromSamples(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE*SECONDS);
            free(noise);
            long playback_id = twrPlayAudioNode(node_id);
            twrFreeAudioID(node_id);

            twrStopAudioPlayback(playback_id);
            
            //playback is fully deleted based on an event, so it might take time to propogate
            test_next_part(test, (void*)playback_id, full, 200);
         } else {
            if (twrQueryAudioPlaybackPosition(prev_playback_id) < 0) {
               test_success(TEST_NAMES[test]);
            } else {
               test_fail(TEST_NAMES[test], "audio hasn't ended!");
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
   return END_TEST - START_TEST;
}

__attribute__((export_name("getTestName")))
const char* get_test_name(int id) {
   return TEST_NAMES[id+START_TEST];
}