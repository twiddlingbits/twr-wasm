#include "extra.h"
#include <math.h>
#include <stdlib.h>

#define M_PI 3.14159265358979323846

float* generate_square_wave(double frequency, double duration, long sample_rate) {
   long length = (long)ceil(duration * sample_rate);
   float* wave = (float*)malloc(sizeof(float) * length);
   for (long i = 0; i < length; i++) {
      wave[i] = cos(2*M_PI*frequency*(i/(float)sample_rate)) > 0 ? 1 : -1;
   }
   return wave;
}

long load_square_wave(double frequency, double duration, long sample_rate) {
   float* wave = generate_square_wave(frequency, duration, sample_rate);
   long node_id = twr_audio_from_float_pcm(1, sample_rate, wave, (long)ceil(duration * sample_rate));
   free(wave);
   return node_id;
}