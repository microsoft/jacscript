#ifndef JD_USER_CONFIG_H
#define JD_USER_CONFIG_H

#define JD_CONFIG_TEMPERATURE 0

#include <stdio.h>

#define DMESG_PRINTF_ATTR __attribute__ ((format (printf, 1, 2)))

void dmesg(const char *format, ...) DMESG_PRINTF_ATTR;

#define DMESG(fmt, ...) dmesg(fmt, ##__VA_ARGS__)

#define JD_LOG DMESG

#define JD_CONFIG_STATUS 0
#define JD_CONFIG_CONTROL_FLOOD 0
#define JD_CLIENT 1
#define JD_VERBOSE_ASSERT 1

#define JD_FLASH_PAGE_SIZE 2048

#ifdef __EMSCRIPTEN__
#define JD_LSTORE 0
#else
#define JD_LSTORE 1
#define JD_LSTORE_FF 0
#define JD_LSTORE_FILE_SIZE (4 * 1024 * 1024)
#endif

#endif
