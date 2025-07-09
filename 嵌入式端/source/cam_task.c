#include "lwip/sockets.h"
#include "FreeRTOS.h"
#include "task.h"
#include "semphr.h"
#include <stdio.h>
#include "app_cfg.h"
#include "ptc06.h"
#include "uart_hal.h"
#include "cam_task.h"
#include <string.h>
#include <stdlib.h>
#include <errno.h>

extern volatile bool wifi_connected;
extern bool init_ok;


#define SEND_CHUNK 256   // 每次发送256字节, network_task仍在使用

// 全局图像缓冲区
static image_buffer_t g_image_buffer = {0};
static uint8_t s_camera_image_buffer[PTC06_MAX_IMAGE_BUFFER_SIZE]; // 新增静态缓冲区

// 数据包头部结构
#pragma pack(1)
typedef struct {
    uint8_t  magic[2];    // 固定为 'PH' (Photo Header)
    uint32_t total_size;  // 图片总大小
    uint32_t offset;      // 当前数据块的偏移
    uint16_t chunk_size;  // 当前数据块的大小
    uint8_t  is_last;     // 是否是最后一个数据块
} packet_header_t;
#pragma pack()

// 发送数据块函数
static bool send_data_block(int sock, const uint8_t* data, uint32_t total_size,
                          uint32_t offset, uint16_t chunk_size, bool is_last) {
    packet_header_t header = {
        .magic = {'P', 'H'},
        .total_size = total_size,
        .offset = offset,
        .chunk_size = chunk_size,
        .is_last = is_last ? 1 : 0
    };

    // 发送头部
    if (send(sock, &header, sizeof(header), 0) != sizeof(header)) {
        printf("[cam] failed to send header at offset %u\n", offset);
        return false;
    }

    // 发送数据
    if (send(sock, data, chunk_size, 0) != chunk_size) {
        printf("[cam] failed to send data at offset %u\n", offset);
        return false;
    }

    printf("[cam] sent block: offset=%u size=%u%s\n",
           offset, chunk_size, is_last ? " (last block)" : "");
    return true;
}

// 相机任务 - 负责从相机读取数据
static void camera_task(void *arg) {
    cyhal_uart_t *uart = uart_hal_obj();
    uint32_t actual_image_len = 0; // 用于存储实际读取的图像长度
    
    // 初始化相机
    if (!ptc06_init(uart)) {
        printf("[cam] camera init failed\n");
        vTaskDelete(NULL);
        return;
    }
    
    printf("[cam] camera initialized\n");
    
    while(1) {

        if (!init_ok || !wifi_connected) {
            vTaskDelay(pdMS_TO_TICKS(500));
        }
        
        // 拍照
        printf("[cam] taking picture...\n");
        if (!ptc06_take_picture(uart)) {
            printf("[cam] failed to take picture.\n");
            if (!ptc06_clear_cache(uart)) { // 拍照失败也尝试清理缓存
                 printf("[cam] Warning: failed to clear cache after take_picture failure.\n");
            }
            vTaskDelay(pdMS_TO_TICKS(2000)); // 拍照失败后延时
            continue;
        }
        printf("[cam] picture taken successfully.\n");
        
        
        
        // 读取图片数据 - 调用新函数
        printf("[cam] attempting to read image into static buffer...\n");
        bool read_ok = ptc06_read_image_to_buffer(uart, s_camera_image_buffer, 
                                                 sizeof(s_camera_image_buffer), &actual_image_len);
        
        if (read_ok && actual_image_len > 0) {
            printf("[cam] image read to static buffer successfully, %lu bytes.\n", actual_image_len);

            xSemaphoreTake(g_image_buffer.mutex, portMAX_DELAY);
            if (g_image_buffer.data) { // 释放之前的数据（如果有的话）
                vPortFree(g_image_buffer.data);
                g_image_buffer.data = NULL;
            }
            g_image_buffer.data = pvPortMalloc(actual_image_len);
            if (g_image_buffer.data) {
                memcpy(g_image_buffer.data, s_camera_image_buffer, actual_image_len);
                g_image_buffer.size = actual_image_len;
                g_image_buffer.ready = true;
                printf("[cam] image copied to g_image_buffer (%lu bytes).\n", actual_image_len);
                xSemaphoreGive(g_image_buffer.mutex);
                xSemaphoreGive(g_image_buffer.data_ready); // 通知网络任务
                printf("[cam] image ready for transmission notification sent.\n");
            } else {
                printf("[cam] CRITICAL: Failed to allocate memory for g_image_buffer.data (%lu bytes).\n", actual_image_len);
                g_image_buffer.size = 0;
                g_image_buffer.ready = false;
                xSemaphoreGive(g_image_buffer.mutex);
            }
        } else {
            if (!read_ok) {
                 printf("[cam] CRITICAL: failed to read image into buffer from ptc06_read_image_to_buffer.\n");
            } else if (actual_image_len == 0) {
                 printf("[cam] image read from ptc06_read_image_to_buffer but length is 0.\n");
            }
        }
        
        

        // 总是尝试清理缓存
        printf("[cam] cycle end, clearing camera cache...\n");
        if (!ptc06_clear_cache(uart)) {
            printf("[cam] Warning: failed to clear camera cache at end of cycle.\n");
        }
        printf("[cam] Next capture in 1 minute...\n"); // 添加日志提示
        vTaskDelay(pdMS_TO_TICKS(60000)); // 修改延时为10秒
    }
}

// 网络任务 - 负责发送数据
static void network_task(void *arg) {
    // 等待WiFi连接
    while (!wifi_connected) {
        printf("[net] waiting for wifi...\n");
        vTaskDelay(pdMS_TO_TICKS(500));
    }
    printf("[net] wifi connected\n");
    
    while (1) {
        // 等待新图片数据
        if (xSemaphoreTake(g_image_buffer.data_ready, portMAX_DELAY) != pdTRUE) {
            continue;
        }
        
        // 获取数据
        xSemaphoreTake(g_image_buffer.mutex, portMAX_DELAY);
        uint8_t *data = g_image_buffer.data;
        uint32_t size = g_image_buffer.size;
        g_image_buffer.ready = false;
        xSemaphoreGive(g_image_buffer.mutex);
        
        if (!data || size == 0) {
            continue;
        }
        
        printf("[net] attempting to send image (%u bytes)\n", size);
        
        // 建立TCP连接
        int sock = socket(AF_INET, SOCK_STREAM, 0);
        if (sock < 0) {
            printf("[net] socket creation failed: %d (%s)\n", errno, strerror(errno));
            goto cleanup;
        }
        
        // 配置socket选项
        int keepalive = 1;
        int keepcnt = 3;
        int keepidle = 10;
        int keepintvl = 5;
        int timeout = 5000; // 5秒超时
        
        setsockopt(sock, SOL_SOCKET, SO_KEEPALIVE, &keepalive, sizeof(keepalive));
        setsockopt(sock, IPPROTO_TCP, TCP_KEEPCNT, &keepcnt, sizeof(keepcnt));
        setsockopt(sock, IPPROTO_TCP, TCP_KEEPIDLE, &keepidle, sizeof(keepidle));
        setsockopt(sock, IPPROTO_TCP, TCP_KEEPINTVL, &keepintvl, sizeof(keepintvl));
        setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof(timeout));
        setsockopt(sock, SOL_SOCKET, SO_SNDTIMEO, &timeout, sizeof(timeout));
        
        struct sockaddr_in dst = {0};
        dst.sin_family = AF_INET;
        dst.sin_port = htons(SERVER_PORT);
        dst.sin_addr.s_addr = inet_addr(SERVER_IP);
        
        printf("[net] connecting to %s:%d...\n", SERVER_IP, SERVER_PORT);
        
        if (connect(sock, (struct sockaddr *)&dst, sizeof(dst)) < 0) {
            printf("[net] connect failed: %d (%s)\n", errno, strerror(errno));
            close(sock);
            goto cleanup;
        }
        
        printf("[net] connected, starting transmission\n");
        
        // 发送图片数据
        uint32_t total_sent = 0;
        bool send_success = true;
        
        while (total_sent < size) {
            uint16_t to_send = (size - total_sent) > SEND_CHUNK ? 
                              SEND_CHUNK : (size - total_sent);
            bool is_last = (total_sent + to_send) >= size;
            
            if (!send_data_block(sock, data + total_sent, size,
                               total_sent, to_send, is_last)) {
                printf("[net] failed to send at offset %u\n", total_sent);
                send_success = false;
                break;
            }
            
            total_sent += to_send;
            printf("[net] progress: %u/%u bytes (%d%%)\n",
                   total_sent, size, (total_sent * 100) / size);
                   
            vTaskDelay(pdMS_TO_TICKS(50));  // 发送之间的短暂延时
        }
        
        if (send_success) {
               printf("[net] image sent successfully\n");
        }
        
        close(sock);
        
cleanup:
        // 清理
        xSemaphoreTake(g_image_buffer.mutex, portMAX_DELAY);
        vPortFree(g_image_buffer.data);
        g_image_buffer.data = NULL;
        g_image_buffer.size = 0;
        xSemaphoreGive(g_image_buffer.mutex);
        
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

void create_camera_tasks(void) {
    // 初始化同步对象
    g_image_buffer.mutex = xSemaphoreCreateMutex();
    g_image_buffer.data_ready = xSemaphoreCreateBinary();
    
    if (!g_image_buffer.mutex || !g_image_buffer.data_ready) {
        printf("[cam] failed to create synchronization objects\n");
        return;
    }
    
    // 创建任务
    BaseType_t ret;
    
    ret = xTaskCreate(camera_task, "camera", 4096, NULL, 4, NULL);
    if (ret != pdPASS) {
        printf("[cam] failed to create camera task\n");
        return;
    }
    
    ret = xTaskCreate(network_task, "network", 4096, NULL, 4, NULL);
    if (ret != pdPASS) {
        printf("[cam] failed to create network task\n");
        return;
    }
    
    printf("[cam] tasks created successfully\n");
}


