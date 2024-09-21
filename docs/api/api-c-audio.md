---
title: Audio API for WebAssembly
description: twr-wasm provides an audio C API that allows Wasm code to call a subset of the JS Audio API.
---

# Audio API for WebAssembly

This section describes twr-wasm's C Audio API, which allows audio API functions to be called from WebAssembly.

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
   long node_id = twr_audio_from_samples(1, SAMPLE_RATE, wave, length);

   //plays the square wave
   // Can be played multiple times, and is only freed on twr_audio_free
   twr_audio_play(node_id);
}
~~~

## Overview
The Audio API is part a twr-wasm library that can be accessed via `#include "twr-audio.h"`. It has two main ways to play audio: from raw PCM data and from a URL. 

Raw PCM data can be setup via twr_audio_from_samples or twr_audio_load. twr_audio_from_samples takes in the PCM data as an array of floats between -1.0 and 1.0. twr_audio_load, on the other hand, takes in the URL of an audio file, downloads it, and converts it to PCM data. This method does not stream the audio, so it might take longer on startup. Once the PCM data is setup, it can be played via functions like twr_audio_play, twr_audio_play_range, twr_audio_play_sync, and twr_audio_play_range_sync.

You can also play audio directly from a URL. Unlike twr_audio_load, the url is loaded directly into an HTMLAudioElement which streams the audio and plays it imediately.

In addition to playing audio, there are functions that allow you to query and modify an ongoing playback. These include stopping the playback, getting how long it's been playing, and modifying the pan; volume; or playback rate of the audio.

## Notes
When playing audio, a playback_id is returned to query or modify the playback. However, the playback is automatically deleted when it ends making the playback_id invalid as it does so. Most functions that take in a playback_id will simply return a warning and return without error. The only slight exception is twr_audio_query_playback_position which will return -1 when given a dead or invalid playback_id.

## Functions
These are the current Audio APIs available in C:

~~~c
long twr_audio_from_samples(long num_channels, long sample_rate, float* data, long singleChannelDataLen);

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
long twr_audio_play_range_full(long node_id, long start_sample, long end_sample, struct PlayRangeFields* fields);

long twr_audio_play_sync(long node_id);
long twr_audio_play_sync_full(long node_id, double volume, double pan);


struct PlayRangeSyncFields {
   double pan, volume;
   int loop;
   long sample_rate;
};
struct PlayRangeSyncFields twr_audio_default_play_range_sync();
long twr_audio_play_range_sync(long node_id, long start_sample, long end_sample);
long twr_audio_play_range_sync_full(long node_id, long start_sample, long end_sample, struct PlayRangeSyncFields* fields);

long twr_audio_load_sync(char* url);
long twr_audio_load(int event_id, char* url);
long twr_audio_query_playback_position(long playback_id);
float* twr_audio_get_samples(long node_id, long* singleChannelDataLenPtr, long* channelPtr);
void twr_audio_free_id(long node_id);

void twr_audio_stop_playback(long playback_id);

void twr_audio_modify_playback_volume(long node_id, double volume);
void twr_audio_modify_playback_pan(long node_id, double pan);
void twr_audio_modify_playback_rate(long node_id, double sample_rate);

long twr_audio_play_file(char* file_url);
long twr_audio_play_file_full(char* file_url, double volume, double playback_rate, int loop);
struct AudioMetadata {
   long length;
   long sample_rate;
   long channels;
};

void twr_audio_get_metadata(long node_id, struct AudioMetadata* metadata);


float* twr_convert_8_bit_pcm(char* pcm, long pcm_len);
float* twr_convert_16_bit_pcm(short* pcm, long pcm_len);
float* twr_convert_32_bit_pcm(long* pcm, long pcm_len);
~~~

