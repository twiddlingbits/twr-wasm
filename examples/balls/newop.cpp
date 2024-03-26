// new & delete operators are defined in std libc++, which is not implemented (yet?)

#include <stddef.h>

void* operator new (size_t sz)
{
  void *p;

  if (__builtin_expect (sz == 0, false))
    sz = 1;

  if ((p = twr_malloc (sz)) == 0)
    __builtin_trap();

  return p;
}

void operator delete(void* ptr) noexcept
{
  twr_free(ptr);
}

