// new & delete operators are defined in std libc++, which is not implemented (yet?)

#include <stddef.h>
#include <stdlib.h>
#include <twr-crt.h>   // twr_trap()

void* operator new (size_t sz)
{
  void *p;

  if (__builtin_expect (sz == 0, false))
    sz = 1;

  if ((p = malloc (sz)) == 0)
    twr_trap();

  return p;
}

void operator delete(void* ptr) noexcept
{
  free(ptr);
}

