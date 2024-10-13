---
title: Using events in C/C++ and WebAssembly with twr-wasm
description: Certain twr-wasm APIs support events.  This section describes how events function.
---

# Overview of Events
This section describes how to use twr-wasm to:

- register event callbacks in C/C++
- use events in C/C++

## Quick Example
~~~c title="timer events"
#include <stdio.h>
#include "twr-crt.h"

int t2_count=0;
int t2_id;

// timer2 event callback (called multiple times)
__attribute__((export_name("on_timer2")))
void on_timer2(int event_id) {
   t2_count++;
   printf("timer callback 2 entered (event id=%d, count=%d)\n", event_id, t2_count);

   if (t2_count==5) {
      twr_timer_cancel(t2_id);
      printf("timer example complete\n")
   }
}

// C entry point to call from JavaScript
int timer_main() {
   printf("the timer will trigger 5 times...\n");

   int t2_eventid=twr_register_callback("on_timer2");
   t2_id=twr_timer_repeat(500, t2_eventid);
}
~~~

## Examples
| Name | View Live Link | Source Link |
| --------- | ------------ | ----------- |
| timer example | [View timer test](/examples/dist/tests-timer/index.html) | [Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/test-timer) |
| library example | [View library example](/examples/dist/lib/index.html) | [Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/lib) |

# Events
In twr-wasm, certain APIs can trigger events.  For example a timer can trigger a "timer complete" event, or an audio api my trigger a "file has finished playing" event.  An event had an `id` and an associated callback.  The `id` is an integer that identifies the event (`int event_id`).   In order to receive an event call back:

1. Write your callback in C/C++.  It must be C linkage, and you should be exported from your C code to JavaScript/TypeScript using the `export_name` clang `__attribute__` like this: `__attribute__((export_name("on_timer2")))`. Replace `on_timer2` with your callback function name.
2. Register your callback.  This will also allocate the event ID paired to this callback.  For example: `int t2_event_id=twr_register_callback("on_timer2");`
3. Call an API that takes an event `id`.  For example: `twr_timer_repeat(500, t2_eventid);`.  This will call the `t2_event` callback every 500ms.

You can use the same event/callback with multiple APIs if you wish.  When the event callback is called, the first argument will be the event `id` triggering the callback.  There may then be optional parameters.  These are event specific.

As in JavaScript, twr-wasm event callbacks only occur when your C/C++ code is not running. For example, in the above timer example, event callbacks will not be processed until `timer_main` returns.

The method to stop receiving events is library API specific.  For example, to stop receiving timer events, the timer library provides the `twr_timer_cancel` function.

# When using twrWasmModuleAsync

With a `twrWasmModuleAsync` module, various blocking APIs are available. For example: `twr_sleep`.  When these functions are blocking (waiting), event callbacks are queued and not processed until your C functions return back to JavaScript.

With a `twrWasmModuleAsync` module, events are sent from the JavaScript main thread to the worker thread that is running the C/C++ code.

# twr_register_callback
See [twr_register_callback](../api/api-c-general.md#twr_register_callback)