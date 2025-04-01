---
title: Audio API for WebAssembly
description: twr-wasm provides an audio C API that allows Wasm code to call a subset of the JS Audio API.
---

# Audio API for WebAssembly

This section describes twr-wasm's C Audio API, which allows audio API functions to be called using C/C++ from WebAssembly.

## Examples
| Name | View Live Link | Source Link |
| - | - | -
| Pong (C++) | [View Pong](/examples/dist/pong/index.html) | [Source for Pong](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/pong) |
| tests-audio | [View tests-audio](/examples/dist/tests-audio/index.html) | [Source for tests-audio](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/tests-audio) |

## Code Example
~~~c title="Play Audio"
#include "twr-audio.h"
#include <math.h>
#include <stdlib.h>

#define M_PI 3.14159265358979323846

void play() {
   twr_audio_play_file("example.mp3"); //plays audio from specified URL

   const long SAMPLE_RATE = 48000; //48,000 samples per second
   const double DURATION = 10.0; //play for 10 seconds
   const double freq = 493.883; //Middle B (B4)

   long length = (long)ceil(SAMPLE_RATE*DURATION);
   //PCM audio data in the form of -1.0 to 1.0
   float* wave = (float*)malloc(sizeof(float) * length);

   //generate square wave at specified frequency and duration
   for (long i = 0; i < length; i++) {
      wave[i] = cos(2*M_PI*freq*(i/(float)sample_rate)) > 0 ? 1 : -1;
   }

   //creates a mon-audio channel buffer at our given SAMPLE_RATE
   // and square-wave data we generated
   long node_id = twr_audio_from_float_pcm(1, SAMPLE_RATE, wave, length);

   //plays the square wave
   // Can be played multiple times, and is only freed on twr_audio_free
   twr_audio_play(node_id);
}
~~~

## Overview
The Audio API is part a twr-wasm library that can be accessed via `#include "twr-audio.h"`. It has two main methods to play audio: from raw PCM data and from a URL. 

Raw PCM data can be initialized via `twr_audio_from_<type>_pcm` or `twr_audio_load`. There are multiple types for `twr_audio_from_<type>_pcm`. These types include Float, 8bit, 16bit, and 32bit. Float takes in values between -1.0 and 1.0. Meanwhile, the 8bit, 16bit, and 32bit versions take them in as signed numbers between their minimum and maximum values. `twr_audio_load`, on the other hand, reads the PCM data from an audio file that is specified by a URL. This method does not stream the audio, so it might take some time to read the file (depending how long the file is). Each function returns an integer `node_id` that identifies the loaded PCM data.  Once the PCM data is initialized, it can be played via functions like `twr_audio_play`, `twr_audio_play_range`, `twr_audio_play_sync`, and `twr_audio_play_range_sync`.  The play functions can be called multiple times for each audio ID.

You can also play audio directly from a URL. Unlike `twr_audio_load`, the url is initialized directly into an `HTMLAudioElement` which streams the audio and starts playback immediately.

In addition to playing audio, there are functions that allow you to query and modify an ongoing playback. These include stopping the playback, getting how long it's been playing, and modifying the pan; volume; or playback rate of the audio.

## Notes
When playing audio, a `playback_id` is returned to query or modify the playback. However, once playback completes, the `playback_id` becomes invalid. Most functions that take in a `playback_id` will simply return a warning and return without error if the `playback_id` is invalid. An exception is `twr_audio_query_playback_position` which will return -1 when given an invalid `playback_id`.

Functions that end in `_sync` are for use with `twrWamModuleAsync`, and are synchronous.  Meaning they don't return until the operation, such as playback, is complete.

Note that on some platforms, sounds that are too short might not play correctly.  This is true in JavaScript as well.

## Functions
These are the current Audio APIs available in C/C++:

~~~c
long twr_audio_from_float_pcm(long num_channels, long sample_rate, float* data, long singleChannelDataLen);
long twr_audio_from_8bit_pcm(long number_channels, long sample_rate, char* data, long singleChannelDataLen);
long twr_audio_from_16bit_pcm(long number_channels, long sample_rate, short* data, long singleChannelDataLen);
long twr_audio_from_32bit_pcm(long number_channels, long sample_rate, int* data, long singleChannelDataLen);

float* twr_audio_get_float_pcm(long node_id, long* singleChannelDataLenPtr, long* numChannelsPtr);
char* twr_audio_get_8bit_pcm(long node_id, long* singleChannelDataLenPtr, long* numChannelsPtr);
short* twr_audio_get_16bit_pcm(long node_id, long* singleChannelDataLenPtr, long* numChannelsPtr);
int* twr_audio_get_32bit_pcm(long node_id, long* singleChannelDataLenPtr, long* numChannelsPtr);

long twr_audio_play(long node_id);
long twr_audio_play_volume(long node_id, double volume, double pan);
long twr_audio_play_callback(long node_id, double volume, double pan, int finish_callback);

struct PlayRangeFields {
   double pan, volume;
   int loop, finish_callback;
   long sample_rate;
};
struct PlayRangeFields twr_audio_default_play_range();
long twr_audio_play_range(long node_id, long start_sample, long end_sample);
long twr_audio_play_range_ex(long node_id, long start_sample, long end_sample, struct PlayRangeFields* fields);

long twr_audio_play_sync(long node_id);
long twr_audio_play_sync_ex(long node_id, double volume, double pan);


struct PlayRangeSyncFields {
   double pan, volume;
   int loop;
   long sample_rate;
};

struct PlayRangeSyncFields twr_audio_default_play_range_sync();
long twr_audio_play_range_sync(long node_id, long start_sample, long end_sample);
long twr_audio_play_range_sync_ex(long node_id, long start_sample, long end_sample, struct PlayRangeSyncFields* fields);

long twr_audio_load_sync(char* url);
long twr_audio_load(int event_id, char* url);
long twr_audio_query_playback_position(long playback_id);
void twr_audio_free_id(long node_id);

void twr_audio_stop_playback(long playback_id);

void twr_audio_modify_playback_volume(long playback_id, double volume);
void twr_audio_modify_playback_pan(long playback_id, double pan);
void twr_audio_modify_playback_rate(long playback_id, double sample_rate);

long twr_audio_play_file(char* file_url);
long twr_audio_play_file_ex(char* file_url, double volume, double playback_rate, int loop);

struct AudioMetadata {
   long length;
   long sample_rate;
   long channels;
};

void twr_audio_get_metadata(long node_id, struct AudioMetadata* metadata);
~~~

