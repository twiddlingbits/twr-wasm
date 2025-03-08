#ifndef __TWR_CANVAS_EVENTS_H__
#define __TWR_CANVAS_EVENTS_H__

#ifdef __cplusplus
extern "C" {
#endif

__attribute__((import_name("twrRegisterEvent"))) void twrRegisterEvent(int jsid, int eventType, int eventID);
__attribute__((import_name("twrUnregisterEvent"))) void twrUnregisterEvent(int jsid, int eventType, int eventID);
__attribute__((import_name("twrUnregisterAllEvents"))) void twrUnregisterAllEvents(int jsid);

#ifdef __cplusplus
}
#endif

#endif