#include "twr-audio.h"
#include "twr-jsimports.h"

long alib_load_audio_from_samples_with_con(int jsid, long num_channels, long length, long sample_rate) {
   twrAudioFromSamples(jsid, num_channels, length, sample_rate);
}
long alib_load_audio_from_samples(long num_channels, long length, long sample_rate) {
   alib_load_audio_from_samples_with_con(1, num_channels, length, sample_rate);
}