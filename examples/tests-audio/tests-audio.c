#include <twr-audio.h>
#include <stdlib.h>
#include <stdio.h>
#include <stdarg.h>
#include <math.h>

__attribute__((import_name("setTimeout"))) 
void setTimeout(long event_id, long time, void* args);

__attribute__((import_name("twr_register_callback")))
int twr_register_callback(const char* func_name);


#define CHANNELS 2
#define SAMPLE_RATE 48000
#define SECONDS 3

enum Tests {
   AudioFromSampleAndGetAudioSample,
   TooSmallGetAudioSampleBuffer,
   AppendAudioSamplesAndGetAudioSample,
   PlayAudioFromSample,
   PlayLoadedAudio,
   QueryPlaybackSampleAudio,
   QueryPlaybackLoadedAudio,
   StopAudioPlaybackSample,
   StopAudioPlaybackLoaded,
};
const long START_TEST = AudioFromSampleAndGetAudioSample;
const long END_TEST = StopAudioPlaybackLoaded;

const char* TEST_NAMES[30] = {
   "AudioFromSampleAndGetAudioSample",
   "TooSmallGetAudioSampleBuffer",
   "AppendAudioSamplesAndGetAudioSample",
   "PlayAudioFromSample",
   "PlayLoadedAudio",
   "QueryPlaybackSampleAudio",
   "QueryPlaybackLoadedAudio",
   "StopAudioPlaybackSample",
   "StopAudioPlaybackLoaded",
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

void internal_test_case(int test, void* extra, bool full);

//current test_run so it can be interrupted by restarting the tests or running an individual one
int TEST_RUN = 0;
int TEST_NEXT_EVENT = -1;
struct TestData {
   int test_run, current_test;
};
void test_next(int current_test, bool full, long timeout) {
   int next_test = current_test+1;
   if (full && next_test <= END_TEST) {
      if (TEST_NEXT_EVENT == -1) {
         TEST_NEXT_EVENT = twr_register_callback("testNextTimer");
      }
      if (timeout <= 0) {
         internal_test_case(next_test, 0, true);
      } else {
         struct TestData* test = malloc(sizeof(struct TestData));
         test->test_run = TEST_RUN;
         test->current_test = next_test;
         setTimeout(TEST_NEXT_EVENT, timeout, (void*)test);
      }
   }
}
__attribute__((export_name("testNextTimer")))
void test_next_timer(int event_id, struct TestData* args) {
   if (args->test_run == TEST_RUN) {
      internal_test_case(args->current_test, NULL, true); 
   }
   free(args);
}

struct TestDataPart {
   int test_run, current_test;
   bool full;
   void* extra;
};
int TEST_NEXT_PART_EVENT = -1;
void test_next_part(int current_test, void* extra, bool full, long timeout) {
   if (TEST_NEXT_PART_EVENT == -1) {
      TEST_NEXT_PART_EVENT = twr_register_callback("testNextPartTimer");
   }

   if (timeout <= 0) {
      internal_test_case(current_test, extra, full);
   } else {
      struct TestDataPart* test = malloc(sizeof(struct TestDataPart));
      test->test_run = TEST_RUN;
      test->current_test = current_test;
      test->extra = extra;
      test->full = full;
      setTimeout(TEST_NEXT_PART_EVENT, timeout, (void*)test);
   }
}
__attribute__((export_name("testNextPartTimer")))
void test_next_part_timer(int event_id, struct TestDataPart* args) {
   if (args->test_run == TEST_RUN) {
      internal_test_case(args->current_test, args->extra, args->full);
   }
   free(args);
}

#define ERR_MSG_LEN 30
char err_msg[ERR_MSG_LEN];

void internal_test_case(int test, void* extra, bool full) {
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

      case PlayAudioFromSample:
      {
         float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
         long node_id = twrAudioFromSamples(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE*SECONDS);

         twrPlayAudioNode(node_id);
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

      case QueryPlaybackSampleAudio:
      {
         long* state = (long*)extra;
         if (extra == NULL) {
            state = malloc(sizeof(long) * 3);
            float* noise = generate_random_noise(CHANNELS * SAMPLE_RATE * SECONDS);
            long node_id = twrAudioFromSamples(CHANNELS, SAMPLE_RATE, noise, SAMPLE_RATE*SECONDS);

            long playback_id = twrPlayAudioNode(node_id);
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

      case QueryPlaybackLoadedAudio:
      {
         #ifdef ASYNC
         long* state = (long*)extra;
         if (extra == NULL) {
            state = malloc(sizeof(long) * 4);
            
            long node_id = twrLoadAudioAsync("ping.mp3");
            long playback_id = twrPlayAudioNode(node_id);
            twrFreeAudioID(node_id);

            state[0] = playback_id;
            state[1] = twr_epoch_timems();
            state[2] = true;
            state[3] = 0;
         }

         long now = twr_epoch_timems();
         long elapsed = now - state[1];
         long pos = twrQueryAudioPlaybackPosition(state[0]);
         
         if (elapsed <= 3000 && pos >= 0) {
            // printf("playback position: %ld, elapsed: %ld\n", pos, elapsed);
            if (pos < state[3]) {
               state[2] = false;
            }
            state[3] = pos;
            test_next_part(test, (void*)state, full, 200);
         } else {
            // printf("state: %ld\n", state[2]);
            if (state[2] && pos == -1) {
               test_success(TEST_NAMES[test]);
            } else {
               test_fail(TEST_NAMES[test], "audio played at an unexpected rate!");
            }
            free(state);
            test_next(test, full, 0);
         } 
         #else
         printf("%s can only be ran as async!\n", TEST_NAMES[test]);
         test_next(test, full, 0);
         #endif
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

      case StopAudioPlaybackLoaded:
      {
         #ifdef ASYNC
         long prev_playback_id = (long)extra;
         if (!prev_playback_id) {
            long node_id = twrLoadAudioAsync("ping.mp3");
            long playback_id = twrPlayAudioNode(node_id);
            twrFreeAudioID(node_id);
            twrStopAudioPlayback(playback_id);

            test_next_part(test, (void*)playback_id, full, 200);
         } else {
            if (twrQueryAudioPlaybackPosition(prev_playback_id) < 0) {
            test_success(TEST_NAMES[test]);
            } else {
               test_fail(TEST_NAMES[test], "audio hasn't ended!");
            }
            test_next(test, full, 0);
         }
         #else
         printf("%s can only be ran as async!\n", TEST_NAMES[test]);
         test_next(test, full, 0);
         #endif
      }
      break;

      

      default:
         assert(false);
   }

}

__attribute__((export_name("testCase")))
void test_case(int test) {
   TEST_RUN++;
   internal_test_case(test + START_TEST, 0, false); 
}

__attribute__((export_name("testAll")))
void test_all() {
   TEST_RUN++;
   internal_test_case(START_TEST, 0, true);
}
