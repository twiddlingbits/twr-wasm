#include <string.h>
#include <stdint.h> // int64_t
#include <stdlib.h> //_itoa_s


__attribute__((export_name("param_i32")))
int param_i32(int i) {
   return i+1;
}

__attribute__((export_name("param_i64")))
int64_t param_i64(int64_t i) {
   return i+1;
}

__attribute__((export_name("param_f64")))
double param_f64(double d) {
   return d+1.0;
}

__attribute__((export_name("param_f32")))
float param_f32(float f) {
   return f+1.0;
}

__attribute__((export_name("param_string")))
int param_string(const char* string) {
    return strcmp(string, "This is a string.")==0?1:0;
}

__attribute__((export_name("param_bytearray")))
int param_bytearray(unsigned char* byte_array, int ba_length) {
   int sum=0;
   for (int i=0; i<ba_length; i++) {
      sum=sum+byte_array[i];  // sum passed in values
      byte_array[i]=i; 			// demo returning changed value
   }

   return sum;
}

#define EXPECT "Hello! I am a file with Text."
#define EXSIZE (sizeof(EXPECT)-1)   // size should not include trailing zero
__attribute__((export_name("param_uri")))
int param_uri(const unsigned char* file, const int file_len) {
    return (strncmp((const char*)file, EXPECT, EXSIZE)==0 && file_len==EXSIZE)?1:0;
}

__attribute__((export_name("ret_string")))
const char* ret_string(const unsigned char* file, const int file_len) {
    return "forty-two - if only it were that simple";
}

struct test_struct {
	int a;
	char b;
	int *c;
};

__attribute__((export_name("do_struct")))
void do_struct(struct test_struct *p) {
	p->a=p->a+2;
	p->b=p->b+2;
	(*p->c)++;
	(*p->c)++;
}

struct return_values {
   unsigned long size;
   void* dataptr;
};

__attribute__((export_name("get_structu32")))
struct return_values* get_structu32() {
   static struct return_values rv;

   static struct test {
      unsigned int a;
      unsigned int b;
      unsigned int c;
   } t;

   t.a=1;
   t.b=2000;
   t.c=3;

   rv.size=sizeof(t);
   rv.dataptr=(void*)&t;

   return &rv;
}

__attribute__((export_name("get_structu8")))
struct return_values* get_structu8() {
   static struct return_values rv;

   static struct test {
      unsigned char a;
      unsigned char b;
      unsigned char c;
   } t;

   t.a=100;
   t.b=101;
   t.c=102;

   rv.size=sizeof(t);
   rv.dataptr=(void*)&t;

   return &rv;
}
