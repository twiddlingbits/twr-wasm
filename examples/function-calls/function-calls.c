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
