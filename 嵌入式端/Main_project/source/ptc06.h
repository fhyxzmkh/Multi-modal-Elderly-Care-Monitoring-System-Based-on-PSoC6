#ifndef PTC06_H_
#define PTC06_H_

#include <stdint.h>
#include <stdbool.h>
#include "cyhal_uart.h"

/* 图片大小设置值 */
#define PTC06_SIZE_160X120  0x22
#define PTC06_SIZE_320X240  0x11
#define PTC06_SIZE_640X480  0x00

/* 图像缓冲区的最大大小 (60KB) */
#define PTC06_MAX_IMAGE_BUFFER_SIZE (60 * 1024)

bool  ptc06_init(cyhal_uart_t *uart);          /* 复位并清空缓冲 */
bool  ptc06_set_size(cyhal_uart_t *uart, uint8_t size_code);
bool  ptc06_set_compression(cyhal_uart_t *uart, uint8_t compression);
bool  ptc06_take_picture(cyhal_uart_t *uart);  /* 拍照冻结帧 */
bool  ptc06_get_length(cyhal_uart_t *uart, uint16_t *len);
/* 新增：将整个图像读取到缓冲区 */
bool  ptc06_read_image_to_buffer(cyhal_uart_t *uart, uint8_t *buffer, uint32_t buffer_size, uint32_t *image_len_read);
int   ptc06_read_block(cyhal_uart_t *uart,
                       uint16_t addr, uint8_t *buf, uint16_t size);
bool  ptc06_clear_cache(cyhal_uart_t *uart);

#endif /* PTC06_H_ */
