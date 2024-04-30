#include <string.h>
#include <stdint.h>
#include <stdlib.h>

/** murmur code from wikipedia */

static inline uint32_t murmur_32_scramble(uint32_t k) {
    k *= 0xcc9e2d51;
    k = (k << 15) | (k >> 17);
    k *= 0x1b873593;
    return k;
}

uint32_t murmur3_32(const uint8_t* key, size_t len, uint32_t seed)
{
	uint32_t h = seed;
    uint32_t k;
    /* Read in groups of 4. */
    for (size_t i = len >> 2; i; i--) {
        // Here is a source of differing results across endiannesses.
        // A swap here has no effects on hash properties though.
        memcpy(&k, key, sizeof(uint32_t));
        key += sizeof(uint32_t);
        h ^= murmur_32_scramble(k);
        h = (h << 13) | (h >> 19);
        h = h * 5 + 0xe6546b64;
    }
    /* Read the rest. */
    k = 0;
    for (size_t i = len & 3; i; i--) {
        k <<= 8;
        k |= key[i - 1];
    }
    // A swap is *not* necessary here because the preceding loop already
    // places the low bytes in the low places according to whatever endianness
    // we use. Swaps only apply when the memory is copied in a chunk.
    h ^= murmur_32_scramble(k);
    /* Finalize. */
	h ^= len;
	h ^= h >> 16;
	h *= 0x85ebca6b;
	h ^= h >> 13;
	h *= 0xc2b2ae35;
	h ^= h >> 16;
	return h;
}

/**********************************/

static int mg_seed;

void srand(int seed) {
    mg_seed=seed;
}

int rand() {
	static uint32_t last;

	uint32_t result=murmur3_32((uint8_t *)(&last), sizeof(last), mg_seed++);
	last=result;

	return result>>16;
}

int rand_unit_test() {
	int r,s;

    srand(1000);

	s=rand();
	for (int i=0; i<10; i++) {
		r=rand();
		if (r<0 || r>RAND_MAX) return 0;
		if (r==s) return 0;
		s=r;
	}

	return 1;
}