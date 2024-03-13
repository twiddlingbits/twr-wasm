#include <stddef.h>
#include <assert.h>
#include "twr-crt.h"

/* This implementation aligns on 8 byte boundaries.  GNU is 8 (for 32bit arch) or 16 (for 64 bit arch).  */

/* heap has format: <VALID_MALLOC_MARKER><size in words><allocated memory>, repeat */
#define VALID_MALLOC_MARKER (0x1234ABCD)

/* heap map bit is set to 1 for allocated entries of size ALLOC_SIZE and 0 for free entries */
#define MAP_ENTRY_BITS 8
static twr_size_t heap_map_size_in_bytes;
static unsigned char *heap_map;
//#define heap_map_size_in_bytes 1250
//static unsigned char heap_map[heap_map_size_in_bytes];

// number of bytes in each allocation chunk, as well as the alignment of the allocation
// to modify allocation/align size, it is not sufficient to just change ALLOC_SIZE since type uint64_t is used throughout
#define ALLOC_SIZE 8   
#define ALLOC_SIZE_MASK (ALLOC_SIZE-1)

static twr_size_t heap_size_in_alloc_units;
static uint64_t *heap;

twr_size_t heap_size_in_bytes;
twr_size_t mem_size_in_bytes;

//#define heap_size_in_alloc_units 10000
//static uint64_t heap[heap_size_in_alloc_units];

/************************************************/
/************************************************/

//Data by default starts at address 1024
//The stack starts one page (64k) above the end of data and grows down
//The stack grows downwards and the heap grows upwards. 
//The stack starts at __data_end, the heap starts at __heap_base. 
//Because the stack is placed first, it is limited to a maximum size set at compile time, which is __heap_base - __data_end.

// add init call to unit tests
void twr_init_malloc(uint64_t* mem, twr_size_t mem_sizeb) {
	//twr_dbg_printf("twr_init_malloc %x %d %d\n",mem, mem_sizeb, sizeof(mem));
	if (sizeof(mem)==4) {
		uint32_t mem_idx=(uint32_t)((void*)mem);
		assert((mem_idx & ALLOC_SIZE_MASK) ==0) ;
	}
	else if (sizeof(mem)==8) {
		uint64_t mem_idx=(uint64_t)((void*)mem);
		assert((mem_idx & ALLOC_SIZE_MASK) ==0) ;
	}
	else {
		assert(0);
	}

	assert(heap_map_size_in_bytes==0); // check that init only called once

	mem_size_in_bytes=mem_sizeb;

	heap_size_in_bytes=mem_size_in_bytes/(ALLOC_SIZE*8+1); // eg. we need 1 bit per ALLOC_SIZE for map, or 1 byte per ALLOC_SIZE*8
	heap_size_in_bytes=heap_size_in_bytes*ALLOC_SIZE*8;
	heap_size_in_bytes=heap_size_in_bytes & (~ALLOC_SIZE_MASK);  // round down to ALLOC_SIZE units
	assert(heap_size_in_bytes>0);

	heap=mem;
	heap_size_in_alloc_units=heap_size_in_bytes/ALLOC_SIZE;

	heap_map=(unsigned char*)mem+heap_size_in_bytes;
	heap_map_size_in_bytes=heap_size_in_bytes/(ALLOC_SIZE*8);

	assert(heap_size_in_alloc_units>0);
	assert(heap_map_size_in_bytes>0);

	assert(heap_size_in_alloc_units*ALLOC_SIZE+heap_map_size_in_bytes <= mem_size_in_bytes);
	assert(heap_map+heap_map_size_in_bytes<=(unsigned char*)mem+mem_size_in_bytes);
}

void twr_malloc_debug_stats() {
	twr_dbg_printf("init_malloc stats:\n");
	twr_dbg_printf("   heap start addr: %x\n", heap);
	twr_dbg_printf("   heap size bytes: %d\n", heap_size_in_bytes);
	twr_dbg_printf("   heap allocation map offset mem+offset: %x %d\n", heap_map-(unsigned char*)heap, heap_map-(unsigned char*)heap);
	twr_dbg_printf("   heap allocation map size bytes: %d\n", heap_map_size_in_bytes);
	twr_dbg_printf("   heap_size_in_alloc_units: %d\n", heap_size_in_alloc_units);
	twr_dbg_printf("   unused padding: %d\n", mem_size_in_bytes-heap_size_in_bytes-heap_map_size_in_bytes);
	twr_dbg_printf("   avail() returns: %d\n", twr_avail());
}

/************************************************//************************************************/

static bool is_alloc_unit_free(unsigned long i) {
	unsigned long idx=i/MAP_ENTRY_BITS;
	unsigned char bit=(i-idx*MAP_ENTRY_BITS);
	return (heap_map[idx]&(1<<bit))==0;
}

static void set_free_state(unsigned long i, bool do_alloc) {
	unsigned long idx=i/MAP_ENTRY_BITS;
	unsigned char bit=i-idx*MAP_ENTRY_BITS;
	assert (bit<8);
	if (do_alloc)
		heap_map[idx]|=((unsigned char)1 << bit);
	else
		heap_map[idx]&=(~(1<<bit));
}

static int find_next_free_chunk(unsigned long *start, unsigned long *len) {
	unsigned long i=*start;
	while(i < heap_size_in_alloc_units) {
		if (is_alloc_unit_free(i)) { //free word?
			*start=i++;
			while (i < heap_size_in_alloc_units && is_alloc_unit_free(i))
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

static void take_some_memory(unsigned long start, twr_size_t size_in_alloc_units) {
	heap[start]=VALID_MALLOC_MARKER;
	heap[start+1]=size_in_alloc_units;
	for (unsigned long i=0; i < (size_in_alloc_units+2); i++)
		set_free_state(start+i, 1);
}

/************************************************/


__attribute__((export_name("twr_malloc")))
void *twr_malloc(twr_size_t size) {
	twr_size_t size_in_alloc_units = (size+ALLOC_SIZE-1)/ALLOC_SIZE;
	twr_size_t start=0;
	twr_size_t len;
	
	//twr_dbg_printf("twr_malloc entry size %d\n",size);
	//twr_dbg_printf("twr_malloc avail is %d\n",twr_avail());

	if (size==0) {
		twr_dbg_printf("malloc returned NULL because size passed was 0\n");
		return NULL;
	}

	while (find_next_free_chunk(&start, &len)) {
		if (len >= (size_in_alloc_units+2)) {
			take_some_memory(start, size_in_alloc_units);
			//twr_dbg_printf("malloc returns %x\n",(void *)&(heap[start+2]));
			const void* mem = (void*)(&(heap[start+2]));
			assert( ( (mem-(void*)0) & 7)==0);  // assert 8 byte aligned
			return (void *)mem;  /* first memory alloc unit is VALID_MALLOC_MARKER, 2nd is used for size of allocation */
		}
		start=start+len;
	}

	twr_dbg_printf("malloc failed to alloc mem of size %d, note avail mem is %d\n",size,twr_avail());

	return 0;
}

/************************************************/

static int validate_header(char* msg, void* mem) {
		int addr = (uint64_t *)mem-heap;

		if (NULL==mem) {
			twr_dbg_printf("%s - validate_header fail: mem==NULL\n", msg);
			return 0;
		}
		else if (addr<2) {
			twr_dbg_printf("%s - validate_header fail: mem-heap==%d < 2\n", msg, addr);
			return 0;
		}
		else if (heap[addr-1]<1 || heap[addr-1] > (heap_size_in_alloc_units-2) ) {
			twr_dbg_printf("%s - validate_header fail: invalid malloc size of %x\n", msg, heap[addr-1]);
			return 0;
		}
		else if (heap[addr-2]!=VALID_MALLOC_MARKER) {
			twr_dbg_printf("%s - validate_header fail:  missing VALID_MALLOC_MARKER \n", msg);
			return 0;
		}	
		else
			return 1;
}

/************************************************/

__attribute__((export_name("twr_free")))
void twr_free(void *mem) {

	if (mem==NULL) {
		twr_dbg_printf("error in twr_free - passed NULL pointer\n");
		assert(mem!=NULL);
		return;
	}

	//twr_dbg_printf("free(%x)\n",mem);


	uint64_t addr=(uint64_t*)mem-heap;
	twr_size_t size_in_alloc_units=heap[addr-1];

	if (!validate_header("in free", mem)) {
		twr_dbg_printf("error in twr_free(%x)\n", mem);
		return;
	}

	for (int i=-2; i < (int)size_in_alloc_units; i++) {
		if (is_alloc_unit_free(addr+i)) {
			twr_dbg_printf("error in twr_free(%d) - internal error - memory incorrectly marked as free\n", addr);
			return;
		}
		set_free_state(addr+i, 0);
		heap[addr+i]=0xDEADBEEF;
	}
}

/************************************************/

twr_size_t twr_avail() {
	//twr_dbg_printf("in AVAIL heap_size_in_alloc_units set to %d\n",heap_size_in_alloc_units);

	twr_size_t avail=0;
	for (twr_size_t i=0; i < heap_size_in_alloc_units; i++) {
		//twr_dbg_printf("%d, ",i);
		if (is_alloc_unit_free(i))
			avail++;
	}

	return avail*ALLOC_SIZE;
}

/************************************************/

static int validate_malloc(char* msg, void* mem, twr_size_t size) {
		const twr_size_t addr = (uint64_t*)mem-heap;
		const twr_size_t size_in_alloc_units = (size+ALLOC_SIZE-1)/ALLOC_SIZE;

		if (!validate_header(msg, mem))
			return 0;
		else if (heap[addr-1]!=size_in_alloc_units) {
			twr_dbg_printf("%s fail - invalid size saved\n", msg);
			return 0;
		}

		return 1;
}

/********************************************************/
/********************************************************/
/********************************************************/

struct bin {
    twr_size_t size;
    struct bin *next;
    void* first_free_entry;
};

struct bin_entry {
    struct bin_entry *next;  
    unsigned long size;       
    // cache_malloc mem goes here
};

struct bin * bin_find(twr_size_t size);
void* bin_get_mem(struct bin *);

struct bin * first_bin;

struct bin * bin_find(twr_size_t size) {

    struct bin *last, *b;

    for (b=first_bin; b; b=b->next) {
        if (b->size==size) return b;
        last=b;
    }

    b=twr_malloc(sizeof(struct bin));
    b->size=size;
    b->first_free_entry=NULL;
    b->next=NULL;

    if (first_bin) {
        last->next=b;
    }
    else {
        first_bin=b;
    }
    return b;
}

void* bin_get_mem(struct bin *b) {
    struct bin_entry *be;

    if (b->first_free_entry==NULL) {
		assert((sizeof(struct bin_entry)&7)==0); // make sure 8 byte aligned
        be = twr_malloc(sizeof(struct bin_entry)+b->size);
        be->size=b->size;
    }
    else {
        be = b->first_free_entry;
        b->first_free_entry=be->next;
    }

    return &(be[1]);
}

void bin_return_mem(struct bin *b, struct bin_entry *be) {
    be->next=b->first_free_entry;
    b->first_free_entry=be;
}

/********************************************************/
/********************************************************/

void *twr_cache_malloc(twr_size_t size) {
    void* mem=NULL;
    struct bin * b=bin_find(size);
    mem=bin_get_mem(b);
	assert( ( (mem-(void*)0) & 7)==0);  // assert 8 byte aligned
    return mem;
}

void twr_cache_free(void* mem) {
    const char* cmem = (char*)mem;
    struct bin_entry *be=(struct bin_entry*)(cmem-sizeof(struct bin_entry));

    struct bin * b=bin_find(be->size);
    bin_return_mem(b, be);
}

/********************************************************/
/********************************************************/
/************************************************/

//static uint64_t myheap[39000];
//twr_init_malloc 1CC20 930784  ... a run that crashed
//static int64_t align_to_8;
//static unsigned char myheap[930784];

static uint64_t myheap[1000];  

static void set_mem(void* mem, twr_size_t size, unsigned char val) {
	for (twr_size_t i=0; i < size; i++)
		((char*)mem)[i]=val;
}

int twr_malloc_unit_test() {

	if (heap_size_in_alloc_units==0) {  // check if init needs calling
		//align_to_8=1; // eliminate compiler warning
		twr_init_malloc((uint64_t*)myheap, sizeof(myheap));
	}

	const size_t max_allocs=heap_size_in_alloc_units/3;  /* marker,size,data -- smallest allocations take three units */
	if (max_allocs*4 > 64*1024) twr_dbg_printf("warning: in twr_malloc_unit_test() stack alloc exceeds default wasm stack size\n");
	void* allocation[max_allocs];

	assert(max_allocs>=1);  // tests will fail if not the case

	if (twr_avail()!=heap_size_in_alloc_units*ALLOC_SIZE) {
		twr_dbg_printf("twr_malloc unit test failed on twr_avail=%d\n",twr_avail());
		return 0;
	}

	if (twr_malloc(0)!=NULL) {
		twr_dbg_printf("twr_malloc unit test failed on zero size twr_malloc\n");
		return 0;
	}

	void* mem;
	const twr_size_t max_alloc=(heap_size_in_alloc_units-2)*ALLOC_SIZE;
	if ((mem=twr_malloc(max_alloc))==0) {
		twr_dbg_printf("twr_malloc unit test failed on max size twr_malloc\n");
		return 0;
	}	

	set_mem(mem, max_alloc, 0xAA);

	if (0==validate_malloc("max twr_malloc", mem, max_alloc))
		return 0;

	if (twr_avail()!=0) {
		twr_dbg_printf("twr_malloc unit test failed on twr_avail max alloc\n");
		return 0;
	}

	if (twr_malloc(1)!=NULL) {
		twr_dbg_printf("twr_malloc unit test failed by twr_mallocing after max size twr_malloc\n");
		return 0;
	}	

	twr_free(mem);

	if (twr_avail()!=heap_size_in_alloc_units*ALLOC_SIZE) {
		twr_dbg_printf("twr_malloc unit test failed on twr_avail post max alloc\n");
		return 0;
	}

	for (twr_size_t i=0; i<max_allocs; i++) {
		mem=twr_malloc((i&7)+1);   /* allocate 1,2,3,4,5,6,7,8 bytes.  all should fit in one allocation unit*/
		if (mem==0) {
			twr_dbg_printf("twr_malloc unit test failed on pass one twr_malloc\n");
			return 0;			
		}

		set_mem(mem, (i&7)+1, 0x55);

		if (validate_malloc("pass one", mem, (i&7)+1)==0)
			return 0;
		allocation[i]=mem;
	}

	for (twr_size_t i=0; i<max_allocs; i++) {
		twr_free(allocation[i]);
	}

	for (twr_size_t i=0; i<max_allocs; i++) {
		mem=twr_malloc((i&7)+1);   /* allocate 1,2,3,4,5,6,7,8 bytes */
		if (mem==0) {
			twr_dbg_printf("twr_malloc unit test failed on pass two twr_malloc\n");
			return 0;			
		}

		set_mem(mem, (i&7)+1, 0);

		if (validate_malloc("pass two", mem, (i&7)+1)==0)
			return 0;
		allocation[i]=mem;
	}

	for (twr_size_t i=0; i<(max_allocs-1); i=i+3) {
		twr_free(allocation[i]);
		twr_free(allocation[i+1]);
		allocation[i]=0;
		allocation[i+1]=0;
	}

	for (twr_size_t i=0; i<(max_allocs-1); i=i+3) {
		mem=twr_malloc(2*ALLOC_SIZE);   /* 2 alloc units bytes */
		assert(allocation[i]==0);
		allocation[i]=mem;
		set_mem(mem, 2*ALLOC_SIZE, 0);
		if (validate_malloc("pass three", mem, 2*ALLOC_SIZE)==0)
			return 0;
	}
	
	for (twr_size_t i=0; i<max_allocs; i++) {
		if (allocation[i])
			twr_free(allocation[i]);
	}

	if (twr_avail()!=heap_size_in_alloc_units*ALLOC_SIZE) {
		twr_dbg_printf("twr_malloc unit test failed on twr_avail post max alloc\n");
		return 0;
	}	

	const char* s1="this is a string of some length";
	const char* s2="this is another string of some length that is longer";
	const char* s3="ab";

	char *d1=twr_strdup(s1);
	char *d2=twr_strdup(s2);
	char *d3=twr_strdup(s3);

	if (twr_strcmp(s1, d1)!=0 || twr_strcmp(s2, d2)!=0 || twr_strcmp(s3, d3)!=0) {
		twr_dbg_printf("twr_malloc unit test failed on strings\n");
		return 0;	
	}

	twr_free(d2);
	twr_free(d1);
	twr_free(d3);

	const twr_size_t av=twr_avail();
	if (av!=heap_size_in_alloc_units*ALLOC_SIZE) {
		twr_dbg_printf("twr_malloc unit test failed on string post free\n");
		return 0;
	}	

{
    void* mem1=twr_cache_malloc(20);
    if (!mem1) return 0;
    set_mem(mem1, 20, 0xAA);

    void* mem2=twr_cache_malloc(20);
    if (!mem2) return 0;
    set_mem(mem2, 20, 0xAA);

    twr_cache_free(mem1);

    void* mem1b=twr_cache_malloc(20);
    if (mem1b!=mem1) return 0;

    twr_cache_free(mem2);

}

{

    void* mem1=twr_cache_malloc(40);
    if (!mem1) return 0;
    set_mem(mem1, 20, 0xAA);

    twr_cache_free(mem1);

    void* mem1b=twr_cache_malloc(40);
    if (mem1b!=mem1) return 0;
}

	//twr_dbg_printf("twr_malloc unit test completed successfully\n");

	return 1;

}




