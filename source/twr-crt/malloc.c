#include <stddef.h>
#include "twr-crt.h"

/*
 * inefficent, yet very simple, malloc and free
 * allocates out of the static array heap
 * 
 **/

/* Change HEAP_SIZE_IN_WORDS to increase or decreae heap size */
/* a WORD is of size twr_size_t (typically int32_t) */
#define HEAP_SIZE_IN_WORDS 25000

/* heap has format: <VALID_MALLOC_MARKER><size in words><allocated memory>, repeat */
#define VALID_MALLOC_MARKER ((twr_size_t)-1)
static twr_size_t heap[HEAP_SIZE_IN_WORDS];

/* heap map is set to 1 for allocated words and 0 for free words */
static unsigned char heap_map[HEAP_SIZE_IN_WORDS];


/************************************************/

static int find_next_free_chunk(int *start, int *len) {
	int i=*start;
	while(i < HEAP_SIZE_IN_WORDS) {
		if (heap_map[i]==0) { //free word?
			*start=i++;
			while (i < HEAP_SIZE_IN_WORDS && heap_map[i]==0)
				i++;
			*len = i-(*start);
			return 1;
		}
		else {
			i++;
		}
	}
	return 0;  // failed to find free memory
}

static void take_some_memory(int start, int size_in_words) {
	heap[start]=VALID_MALLOC_MARKER;
	heap[start+1]=size_in_words;
	for (int i=0; i < (size_in_words+2); i++)
		heap_map[start+i]=1;
}

/************************************************/

void *twr_malloc(twr_size_t size) {
	int size_in_words = (size+sizeof(twr_size_t)-1)/sizeof(twr_size_t);
	int start=0;
	int len;

	if (size==0) return NULL;

	while (find_next_free_chunk(&start, &len)) {
		if (len >= (size_in_words+2)) {
			take_some_memory(start, size_in_words);
			return (void *)&(heap[start+2]);  /* first memory word is VALID_MALLOC_MARKER, 2nd is used for size of allocaton */
		}
		start=start+len;
	}

	return 0;
}

/************************************************/

static int validate_header(char* msg, void* mem) {
		int addr = (twr_size_t*)mem-heap;

		if (NULL==mem) {
			twr_printf("%s - fail - mem==NULL\n", msg);
			return 0;
		}
		else if (addr<2) {
			twr_printf("%s - fail - addr < 2\n", msg);
			return 0;
		}
		else if (heap[addr-1]<1 || heap[addr-1] > (HEAP_SIZE_IN_WORDS-2) ) {
			twr_printf("%s - fail - invalid allocation size \n", msg);
			return 0;
		}
		else if (heap[addr-2]!=VALID_MALLOC_MARKER) {
			twr_printf("%s - fail - missing VALID_MALLOC_MARKER \n", msg);
			return 0;
		}	
		else
			return 1;
}

/************************************************/

void twr_free(void *mem) {
	twr_size_t addr=(twr_size_t *)mem-heap;
	twr_size_t size_in_words=heap[addr-1];

	validate_header("in free", mem);

	for (int i=-2; i < (int)size_in_words; i++) {
		if (heap_map[addr+i]==0) {
			twr_printf("error in twr_free(%d) - internal error - memory incorrectly marked as free\n", addr);
			return;
		}
		heap_map[addr+i]=0;
		heap[addr+i]=0xDEADBEEF;
	}
}

/************************************************/

int twr_avail() {
	int avail=0;
	for (int i=0; i < HEAP_SIZE_IN_WORDS; i++) 
		if (heap_map[i]==0) 
			avail++;

	return avail*sizeof(twr_size_t);
}

/************************************************/

static int validate_malloc(char* msg, void* mem, twr_size_t size) {
		const twr_size_t addr = (twr_size_t*)mem-heap;
		const twr_size_t size_in_words = (size+sizeof(twr_size_t)-1)/sizeof(twr_size_t);

		if (!validate_header(msg, mem))
			return 0;
		else if (heap[addr-1]!=size_in_words) {
			twr_printf("%s fail - invalid size saved\n", msg);
			return 0;
		}

		return 1;
}

/************************************************/

int twr_malloc_unit_test() {
	
	const int max_allocs=HEAP_SIZE_IN_WORDS/3;
	void* allocation[max_allocs];

	if (twr_avail()!=HEAP_SIZE_IN_WORDS*sizeof(twr_size_t)) {
		twr_printf("twr_malloc unit test failed on twr_avail\n");
		return 0;
	}

	if (twr_malloc(0)!=0) {
		twr_printf("twr_malloc unit test failed on zero size twr_malloc\n");
		return 0;
	}

	void* mem;
	const twr_size_t max_alloc=(HEAP_SIZE_IN_WORDS-2)*sizeof(twr_size_t);
	if ((mem=twr_malloc(max_alloc))==0) {
		twr_printf("twr_malloc unit test failed on max size twr_malloc\n");
		return 0;
	}	

	if (0==validate_malloc("max twr_malloc", mem, max_alloc))
		return 0;

	if (twr_avail()!=0) {
		twr_printf("twr_malloc unit test failed on twr_avail max alloc\n");
		return 0;
	}

	if (twr_malloc(1)!=NULL) {
		twr_printf("twr_malloc unit test failed by twr_mallocing after max size twr_malloc\n");
		return 0;
	}	

	twr_free(mem);

	if (twr_avail()!=HEAP_SIZE_IN_WORDS*sizeof(twr_size_t)) {
		twr_printf("twr_malloc unit test failed on twr_avail post max alloc\n");
		return 0;
	}

	for (int i=0; i<max_allocs; i++) {
		mem=twr_malloc((i&3)+1);   /* allocate 1,2,3,4 byte.  ASSUMES size-t >= 32 bits */
		if (mem==0) {
			twr_printf("twr_malloc unit test failed on pass one twr_malloc\n");
			return 0;			
		}
		if (validate_malloc("pass one", mem, (i&3)+1)==0)
			return 0;
		allocation[i]=mem;
	}

	for (int i=0; i<max_allocs; i++) {
		twr_free(allocation[i]);
	}

	for (int i=0; i<max_allocs; i++) {
		mem=twr_malloc((i&3)+1);   /* allocate 1,2,3,4 bytes */
		if (mem==0) {
			twr_printf("twr_malloc unit test failed on pass two twr_malloc\n");
			return 0;			
		}
		if (validate_malloc("pass two", mem, (i&3)+1)==0)
			return 0;
		allocation[i]=mem;
	}

	for (int i=0; i<max_allocs; i=i+3) {
		twr_free(allocation[i]);
		twr_free(allocation[i+1]);
		allocation[i]=0;
		allocation[i+1]=0;
	}

	for (int i=0; i<max_allocs; i=i+3) {
		mem=twr_malloc(2*sizeof(twr_size_t));   /* allocate 1,2,3,4 bytes */
		allocation[i]=mem;
		if (validate_malloc("pass three", mem, 2*sizeof(twr_size_t))==0)
			return 0;
	}
	
	for (int i=0; i<max_allocs; i++) {
		if (allocation[i])
			twr_free(allocation[i]);
	}

	if (twr_avail()!=HEAP_SIZE_IN_WORDS*sizeof(twr_size_t)) {
		twr_printf("twr_malloc unit test failed on twr_avail post max alloc\n");
		return 0;
	}	

	const char* s1="this is a string of some length";
	const char* s2="this is another string of some length that is longer";
	const char* s3="ab";

	char *d1=twr_strdup(s1);
	char *d2=twr_strdup(s2);
	char *d3=twr_strdup(s3);

	if (twr_strcmp(s1, d1)!=0 || twr_strcmp(s2, d2)!=0 || twr_strcmp(s3, d3)!=0) {
		twr_printf("twr_malloc unit test failed on strings\n");
		return 0;	
	}

	twr_free(d2);
	twr_free(d1);
	twr_free(d3);

	if (twr_avail()!=HEAP_SIZE_IN_WORDS*sizeof(twr_size_t)) {
		twr_printf("twr_malloc unit test failed on string post free\n");
		return 0;
	}	

	return 1;

}




