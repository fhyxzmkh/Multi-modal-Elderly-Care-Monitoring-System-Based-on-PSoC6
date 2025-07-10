#ifndef UART_HAL_H_
#define UART_HAL_H_

#include "cyhal_uart.h"

/* 串口配置 */
#define UART_BAUD_RATE      115200
#define UART_RX_BUF_SIZE    512
#define UART_TIMEOUT_MS     1000    /* 接收超时时间 */

/* 初始化串口硬件 */
void uart_hal_init(void);

/* 获取串口对象指针 */
cyhal_uart_t* uart_hal_obj(void);

/* 发送数据，成功返回CY_RSLT_SUCCESS */
cy_rslt_t uart_hal_write(const uint8_t *data, size_t size);

/* 接收数据，返回实际读取的字节数 */
size_t uart_hal_read(uint8_t *data, size_t size, uint32_t timeout_ticks);

/* 获取通过ISR成功存入队列的总字节数 */
uint32_t uart_hal_get_rx_total_count(void);

void uart_hal_flush_rx(void);

#endif /* UART_HAL_H_ */
