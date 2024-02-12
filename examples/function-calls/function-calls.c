#include <stdio.h>

int function_calls(
    const char* string, 
    const int ibyte_array, const int ba_length, 
    const int ifile, const int file_len)
{

    printf("string address %x\n", string);
    printf("byte array address %x and len %x\n", ibyte_array, ba_length);
    printf("file address %x and len %x\n", ifile, file_len);

    const unsigned char* byte_array=(unsigned char*)ibyte_array;
    const unsigned char* file=(unsigned char*)ifile;

    printf("\nstring is: %s\n\n", string);

    int sum=0;
    for (int i=0; i<ba_length; i++)
        sum=sum+byte_array[i];

    printf("byte array sum: %d\n\n", sum);

    printf("file contents (first 80 chars, it should be C code):\n");
    int len = file_len;
    if (len>80) len=80;
    for (int i=0; i<len; i++) {
        printf("%c",file[i]);
    }

    printf("\n\nC code run is complete\n");

    return (int)"fourty-two - if only it were that simple";
}

int get_structu32() {
    static struct return_values {
        unsigned int size;
        unsigned int dataptr;
    } rv;

    static struct test {
        unsigned int a;
        unsigned int b;
        unsigned int c;
    } t;

    t.a=1;
    t.b=2000;
    t.c=3;

    rv.size=sizeof(t);
    rv.dataptr=(int)&t;

    return (int)&rv;
}

int get_structu8() {
    static struct return_values {
        unsigned int size;
        unsigned int dataptr;
    } rv;

    static struct test {
        unsigned char a;
        unsigned char b;
        unsigned char c;
    } t;

    t.a=100;
    t.b=101;
    t.c=102;

    rv.size=sizeof(t);
    rv.dataptr=(int)&t;

    return (int)&rv;
}
