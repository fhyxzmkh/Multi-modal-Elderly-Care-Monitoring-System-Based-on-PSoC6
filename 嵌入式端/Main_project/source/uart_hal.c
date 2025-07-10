#include "uart_hal.h"
#include "FreeRTOS.h"
#include "queue.h"
#include "cyhal.h"
#include "cyhal_uart.h"
#include "app_cfg.h"
#include <stdio.h>
#include "task.h"

// 增加接收缓冲区大小以处理大量数据
#define RX_BUF_SZ   4096    // 增加到4KB
#define RX_FIFO_LEVEL 32    // UART FIFO触发水平

// UART引脚定义 - 使用配置文件中的定义
#define UART_TX     UART_TX_PIN    // 开发板TX连接到相机RX
#define UART_RX     UART_RX_PIN    // 开发板RX连接到相机TX
#define UART_BAUD_RATE  UART_BAUDRATE

static cyhal_uart_t uart_obj;
static QueueHandle_t rx_queue;
static uint8_t rx_ring[RX_BUF_SZ];
static volatile bool uart_initialized = false;
static volatile uint32_t rx_overflow_count = 0;
static volatile uint32_t rx_total_count = 0;

void uart_hal_flush_rx(void)
{
    if (uart_initialized) {
        // 使用FreeRTOS API清空队列
        xQueueReset(rx_queue);
        printf("[uart_hal] RX queue flushed.\n");
    }
}

/* 打印调试信息的辅助函数 */
static void print_hex_dump(const char* prefix, const uint8_t* data, size_t len) {
    printf("%s", prefix);
    for(size_t i = 0; i < len && i < 32; i++) {
        printf("%02X ", data[i]);
    }
    if(len > 32) printf("...");
    printf("\n");
}

/* UART接收中断回调 */
static void uart_event_callback(void *callback_arg, cyhal_uart_event_t event)
{
    BaseType_t higher_priority_task_woken = pdFALSE;
    uint8_t c;
    uint32_t processed = 0;
    
    // 处理接收事件
    if (event & CYHAL_UART_IRQ_RX_NOT_EMPTY) {
        while (cyhal_uart_readable(&uart_obj)) {
            if (cyhal_uart_getc(&uart_obj, &c, 0) == CY_RSLT_SUCCESS) {
                if (xQueueSendFromISR(rx_queue, &c, &higher_priority_task_woken) != pdTRUE) {
                    rx_overflow_count++;  // 队列满，记录溢出
                } else {
                    rx_total_count++;
                    processed++;
                }
            }
        }
    }
    
    // 处理错误事件
    if (event & CYHAL_UART_IRQ_RX_ERROR) {
        // 清除错误标志
        cyhal_uart_clear(&uart_obj);
    }
    
    portYIELD_FROM_ISR(higher_priority_task_woken);
}

static bool setup_uart_interrupts(void)
{
    printf("[uart_hal] setting up interrupts...\n");

    // 注册中断回调
    cyhal_uart_register_callback(&uart_obj, uart_event_callback, NULL);
    printf("[uart_hal] callback registered\n");

    // 启用接收和错误中断
    cyhal_uart_enable_event(&uart_obj, 
        CYHAL_UART_IRQ_RX_NOT_EMPTY | 
        CYHAL_UART_IRQ_RX_ERROR,
        3, true);  // 使用较高的中断优先级(3)
    
    printf("[uart_hal] RX interrupts enabled with priority 3\n");
    return true;
}

void uart_hal_init(void)
{
    if (uart_initialized) {
        printf("[uart_hal] already initialized\n");
        return;
    }

    printf("\n[uart_hal] ====== UART Initialization Start ======\n");
    printf("[uart_hal] TX pin: P5_5 (connected to camera RX)\n");
    printf("[uart_hal] RX pin: P5_4 (connected to camera TX)\n");
    printf("[uart_hal] Baud rate: %d\n", UART_BAUD_RATE);
    printf("[uart_hal] RX buffer size: %d bytes\n", RX_BUF_SZ);

            // 配置UART参数
    const cyhal_uart_cfg_t uart_config = {
        .data_bits = 8,
        .stop_bits = 1,
        .parity = CYHAL_UART_PARITY_NONE,
        .rx_buffer = rx_ring,
        .rx_buffer_size = RX_BUF_SZ,
    };

    printf("[uart_hal] initializing UART hardware...\n");
    // 初始化UART对象 - 直接传递引脚定义，让HAL处理引脚配置
    cy_rslt_t result = cyhal_uart_init(&uart_obj, UART_TX, UART_RX, NC, NC, NULL, &uart_config);
    if (result != CY_RSLT_SUCCESS) {
        printf("[uart_hal] ERROR: cyhal_uart_init failed with error: 0x%lX\n", (unsigned long)result);
        printf("[uart_hal] ====== UART Initialization FAILED ======\n\n");
        return;
    }
    printf("[uart_hal] UART hardware initialized successfully\n");

    // 设置波特率
    printf("[uart_hal] setting baud rate to %d...\n", UART_BAUD_RATE);
    result = cyhal_uart_set_baud(&uart_obj, UART_BAUD_RATE, NULL);
    if (result != CY_RSLT_SUCCESS) {
        printf("[uart_hal] ERROR: cyhal_uart_set_baud failed with error: 0x%lX\n", (unsigned long)result);
        cyhal_uart_free(&uart_obj);
        printf("[uart_hal] ====== UART Initialization FAILED ======\n\n");
        return;
    }
    printf("[uart_hal] baud rate set successfully\n");

    // 创建接收队列 - 增加队列大小
    printf("[uart_hal] creating RX queue...\n");
    rx_queue = xQueueCreate(RX_BUF_SZ, sizeof(uint8_t));  // 使用与接收缓冲区相同的大小
    if (rx_queue == NULL) {
        printf("[uart_hal] ERROR: failed to create RX queue\n");
        cyhal_uart_free(&uart_obj);
        printf("[uart_hal] ====== UART Initialization FAILED ======\n\n");
        return;
    }
    printf("[uart_hal] RX queue created with size %d\n", RX_BUF_SZ);

    // 设置中断
    if (!setup_uart_interrupts()) {
        printf("[uart_hal] ERROR: failed to setup interrupts\n");
        vQueueDelete(rx_queue);
        cyhal_uart_free(&uart_obj);
        printf("[uart_hal] ====== UART Initialization FAILED ======\n\n");
        return;
    }

    // 设置FIFO触发水平
    result = cyhal_uart_set_fifo_level(&uart_obj, CYHAL_UART_FIFO_RX, RX_FIFO_LEVEL);
    if (result != CY_RSLT_SUCCESS) {
        printf("[uart_hal] WARNING: Failed to set RX FIFO level\n");
    } else {
        printf("[uart_hal] RX FIFO level set to %d\n", RX_FIFO_LEVEL);
    }

    uart_initialized = true;
    rx_overflow_count = 0;
    rx_total_count = 0;
    
    printf("[uart_hal] UART initialized successfully\n");
    printf("[uart_hal] ====== UART Initialization Complete ======\n\n");

    // 清空接收缓冲区
    cyhal_uart_clear(&uart_obj);
}

cy_rslt_t uart_hal_write(const uint8_t *data, size_t size)
{
    if (!uart_initialized) {
        printf("[uart_hal] ERROR: UART not initialized\n");
        return CY_RSLT_TYPE_ERROR;
    }

    printf("[uart_hal] writing %d bytes: ", size);
    print_hex_dump("TX: ", data, size);

    size_t bytes_to_write = size;
    cy_rslt_t result = cyhal_uart_write(&uart_obj, data, &bytes_to_write);
    
    if (result == CY_RSLT_SUCCESS) {
        printf("[uart_hal] successfully wrote %d bytes\n", bytes_to_write);
    } else {
        printf("[uart_hal] ERROR: write failed with error: 0x%lX\n", (unsigned long)result);
    }
    return result;
}

size_t uart_hal_read(uint8_t *data, size_t size, uint32_t timeout_ticks)
{
    if (!uart_initialized) {
        printf("[uart_hal] ERROR: UART not initialized\n");
        return 0;
    }

    printf("[uart_hal] attempting to read %d bytes (overall timeout: %lu ticks)...\n", 
           size, (unsigned long)timeout_ticks);

    size_t count = 0;
    TickType_t start_tick = xTaskGetTickCount();
    TickType_t current_tick;
    TickType_t last_successful_read_tick = start_tick; // 记录上一次成功读取到数据的时间

    while (count < size) {
        current_tick = xTaskGetTickCount();
        if (current_tick - start_tick >= timeout_ticks) { // 检查整体超时
            // 总体超时的日志记录在循环后处理
            break;
        }
        
        TickType_t wait_ticks_for_queue = pdMS_TO_TICKS(10); // 每次队列接收尝试等待10ms
        TickType_t elapsed_ticks = current_tick - start_tick;
        TickType_t overall_remaining_ticks;

        if (timeout_ticks > elapsed_ticks) {
            overall_remaining_ticks = timeout_ticks - elapsed_ticks;
        } else {
            overall_remaining_ticks = 0; // 超时已过或达到限制
        }

        if (overall_remaining_ticks < wait_ticks_for_queue) {
            wait_ticks_for_queue = overall_remaining_ticks;
        }
        
        if (wait_ticks_for_queue == 0 && count < size) { //整体超时已到但仍未读完
             if (xQueueReceive(rx_queue, &data[count], 0) == pdTRUE) { // 非阻塞尝试
                count++;
                last_successful_read_tick = xTaskGetTickCount();
             } else {
                break; 
             }
        } else if (xQueueReceive(rx_queue, &data[count], wait_ticks_for_queue) == pdTRUE) {
            count++;
            last_successful_read_tick = xTaskGetTickCount(); 
        } else {
            // xQueueReceive在wait_ticks_for_queue时间内超时
            // 检查长时间无活动状态
            if ( (xTaskGetTickCount() - last_successful_read_tick) > pdMS_TO_TICKS(500) && count < size ) {
                 printf("[uart_hal] Inactivity timeout: No new data for 500ms. Received %d/%d.\n", count, size);
                 break;
            }
            // 继续循环重新检查总体超时并再次尝试xQueueReceive
        }
    }

    current_tick = xTaskGetTickCount(); // 获取最终时间用于超时日志
    if (count == size) {
         printf("[uart_hal] successfully read %d bytes: ", count);
    } else {
         printf("[uart_hal] read %s. Total time %lu ms. Successfully read %d out of %d expected bytes: ", 
                ((current_tick - start_tick >= timeout_ticks) ? "TIMEOUT (overall)" : "TIMEOUT (inactivity or other)"),
                (unsigned long)(current_tick - start_tick) * portTICK_PERIOD_MS,
                count, size);
    }
    print_hex_dump("RX: ", data, count);
    printf("[uart_hal] RX stats: total=%lu overflow=%lu\n", 
           rx_total_count, rx_overflow_count);
           
    return count;
}

/* 获取通过ISR成功存入队列的总字节数 */
uint32_t uart_hal_get_rx_total_count(void)
{
    return rx_total_count;
}

cyhal_uart_t* uart_hal_obj(void)
{
    return &uart_obj;
}
