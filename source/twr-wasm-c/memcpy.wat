(module
    (import "env" "memory" (memory 1))

;;void *twr_memcpy(void *dest, const void * src, twr_size_t n);
    (func $memcpy (param $dest i32) (param $src i32) (param $n i32) (result i32)
    local.get $dest
    local.get $src
    local.get $n
    memory.copy
    local.get $dest
    )

;;void *twr_memset(void *mem, int c, twr_size_t n);
    (func $memset (param $mem i32) (param $val i32) (param $n i32) (result i32)
    local.get $mem
    local.get $val  ;;  must be less than 256
    local.get $n
    memory.fill
    local.get $mem
    )
)
