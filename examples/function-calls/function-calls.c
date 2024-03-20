#include <stdio.h>

const char* function_calls(
    const char* string, 
    const unsigned char* byte_array, const int ba_length, 
    const unsigned char* file, const int file_len)
{
    printf("string address %x\n", string);
    printf("byte array address %x and len %x\n", byte_array, ba_length);
    printf("file address %x and len %x\n", file, file_len);

    printf("\nstring is: %s\n\n", string);

    int sum=0;
    for (int i=0; i<ba_length; i++)
        sum=sum+byte_array[i];

    printf("byte array sum: %d\n\n", sum);

    printf("file contents:\n");
    int len = file_len;
    if (len>80) len=80;
    for (int i=0; i<len; i++) {
        printf("%c",file[i]);
    }

    printf("\n\nC code run is complete\n");

    return "fourty-two - if only it were that simple";
}

struct return_values {
        unsigned long size;
        unsigned long dataptr;
    };

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
    rv.dataptr=(int)&t;

    return &rv;
}

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
    rv.dataptr=(unsigned long)&t;

    return &rv;
}
