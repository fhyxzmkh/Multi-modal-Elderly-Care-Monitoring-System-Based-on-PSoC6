#include "ptc06.h"
#include "uart_hal.h"
#include "FreeRTOS.h"
#include "task.h"
#include <stdio.h>

/* 超时和延时设置 */
#define CMD_TIMEOUT_MS      2000    /* 命令超时时间 */
#define BLOCK_TIMEOUT_MS    10000   /* 数据块读取超时时间，10秒 */
#define DATA_TIMEOUT_MS     2000    /* 单次数据读取超时时间2秒 */
#define CMD_DELAY_MS        1000    /* 命令之间的延时 */
#define MAX_RETRIES         3       /* 最大重试次数 */

#define PTC06_IMAGE_DATA_CHUNK_SIZE 256   /* 读取图像数据时每个块的大小 */
#define PTC06_CHUNK_RETRY_DELAY_MS 200  /* 块读取重试前的延时 */
#define PTC06_MAX_CHUNK_RETRIES 3       /* 单个块最大重试次数 */

/* 所有指令共用的发送+接收5字节ACK */
static bool cmd_ack(const uint8_t *cmd, size_t cmdlen, uint8_t expect_cmd)
{
    uart_hal_flush_rx();

    uint8_t ack[5];
    printf("[ptc06] cmd_ack: send %u bytes\n", cmdlen);
    if (CY_RSLT_SUCCESS != uart_hal_write(cmd, cmdlen)) {
        printf("[ptc06] uart_hal_write failed\n");
        return false;
    }
    
    // 发送后等待
    vTaskDelay(pdMS_TO_TICKS(1000));
    
    // 使用标准超时时间
    size_t read_len = uart_hal_read(ack, 5, pdMS_TO_TICKS(CMD_TIMEOUT_MS));
    if (read_len != 5) {
        printf("[ptc06] uart_hal_read expected 5 bytes but got %u\n", read_len);
        
        // 如果收到部分数据，尝试读取剩余部分
        if (read_len > 0 && read_len < 5) {
            printf("[ptc06] received partial ACK, trying to read remaining bytes...\n");
            vTaskDelay(pdMS_TO_TICKS(500));
            size_t remaining = uart_hal_read(ack + read_len, 5 - read_len, pdMS_TO_TICKS(CMD_TIMEOUT_MS));
            if (remaining == (5 - read_len)) {
                read_len = 5;
                printf("[ptc06] successfully read remaining ACK bytes\n");
            } else {
                printf("[ptc06] failed to read remaining ACK bytes\n");
                return false;
            }
        } else {
            return false;
        }
    }
    
    printf("[ptc06] ack bytes: %02X %02X %02X %02X %02X\n",
           ack[0], ack[1], ack[2], ack[3], ack[4]);

    // 只检查前4个字节，最后一个字节可能是版本信息的一部分
    bool result = (ack[0]==0x76 && ack[1]==0x00 && ack[2]==expect_cmd && ack[3]==0x00);
    if (!result)
        printf("[ptc06] ack check failed (expect_cmd=0x%02X)\n", expect_cmd);

    // 如果是复位命令，需要读取剩余的版本信息
    if (expect_cmd == 0x26) {
        uint8_t version[20];  // 版本信息缓冲区
        size_t version_len = uart_hal_read(version, sizeof(version), pdMS_TO_TICKS(CMD_TIMEOUT_MS));
        if (version_len > 0) {
            printf("[ptc06] version info (%u bytes): ", version_len);
            for(size_t i = 0; i < version_len; i++) {
                printf("%02X ", version[i]);
            }
            printf("\n");
        }
    }

    // 命令执行完成后延时
    vTaskDelay(pdMS_TO_TICKS(CMD_DELAY_MS));
    return result;
}

// 设置相机临时波特率指令
static bool ptc06_set_baud_temp(uint16_t code)
{
    uint8_t cmd[] = {0x56, 0x00, 0x24, 0x03, 0x01,
                     (uint8_t)(code>>8), (uint8_t)code};
    printf("[ptc06] setting camera temp baud rate to code 0x%04X...\n", code);
    return cmd_ack(cmd, sizeof(cmd), 0x24);
}

bool ptc06_init(cyhal_uart_t *u)
{
    uart_hal_init();  /* 确保 HAL 就绪 */
    printf("[ptc06] initializing ptc06 module...\n");
    
    // (1)(2) 上电后等待2.5秒
    printf("[ptc06] waiting 2.5s for power-up...\n");
    vTaskDelay(pdMS_TO_TICKS(2500));
    
    // 尝试用默认115200波特率复位
    printf("[ptc06] trying reset at 115200 bps...\n");
    const uint8_t reset[] = {0x56,0x00,0x26,0x00};
    if (cmd_ack(reset,sizeof(reset),0x26)) {
        printf("[ptc06] init success - camera confirmed at 115200 bps\n");
        return true;
    }
    
    // 如果115200失败，则初始化失败
    printf("[ptc06] CRITICAL: reset failed at 115200 bps. Camera not responding correctly.\n");
    // 可以在这里添加一些额外的调试信息或错误处理
    return false;
}

bool ptc06_set_size(cyhal_uart_t *u, uint8_t size_code)
{
    const uint8_t cmd[] = {0x56,0x00,0x31,0x05,0x04,0x01,0x00,0x19,size_code};
    printf("[ptc06] setting image size...\n");
    return cmd_ack(cmd,sizeof(cmd),0x31);
}

bool ptc06_set_compression(cyhal_uart_t *u, uint8_t compression)
{
    const uint8_t cmd[] = {0x56,0x00,0x31,0x05,0x01,0x01,0x12,0x04,compression};
    printf("[ptc06] setting compression rate...\n");
    return cmd_ack(cmd,sizeof(cmd),0x31);
}

bool ptc06_take_picture(cyhal_uart_t *u)
{
    const uint8_t snap[] = {0x56,0x00,0x36,0x01,0x00};
    printf("[ptc06] sending take picture command...\n");
    bool ret = cmd_ack(snap,5,0x36);
    printf("[ptc06] take picture command %s\n", ret ? "success" : "failed");
    
    // 拍照后多等待一会，让相机处理图像
    vTaskDelay(pdMS_TO_TICKS(2000));
    return ret;
}

bool ptc06_get_length(cyhal_uart_t *u,uint16_t *len)
{
    uart_hal_flush_rx();

    const uint8_t getlen[] = {0x56,0x00,0x34,0x01,0x00};
    uint8_t rsp[9];
    printf("[ptc06] requesting image length...\n");
    if (CY_RSLT_SUCCESS != uart_hal_write(getlen,5)) {
        printf("[ptc06] uart_hal_write failed for get_length\n");
        return false;
    }
    
    // 发送后等待
    printf("[ptc06] waiting for length response...\n");
    vTaskDelay(pdMS_TO_TICKS(1000));
    
    // 使用标准超时时间
    size_t read_len = uart_hal_read(rsp,9,pdMS_TO_TICKS(CMD_TIMEOUT_MS));
    if (read_len != 9) {
        printf("[ptc06] uart_hal_read expected 9 bytes but got %u\n", read_len);
        
        // 如果只收到部分数据，尝试读取剩余部分
        if (read_len == 4 && rsp[0] == 0x76 && rsp[1] == 0x00 && rsp[2] == 0x34 && rsp[3] == 0x00) {
            printf("[ptc06] received partial response, trying to read remaining 5 bytes...\n");
            vTaskDelay(pdMS_TO_TICKS(500));
            size_t remaining = uart_hal_read(rsp + 4, 5, pdMS_TO_TICKS(CMD_TIMEOUT_MS));
            if (remaining == 5) {
                read_len = 9;
                printf("[ptc06] successfully read remaining bytes\n");
            } else {
                printf("[ptc06] failed to read remaining bytes, got %u\n", remaining);
                return false;
            }
        } else {
            return false;
        }
    }
    
    printf("[ptc06] length response: ");
    for(int i=0; i<9; i++) printf("%02X ", rsp[i]);
    printf("\n");

    // 检查响应格式：76 00 34 00 04 00 00 XX YY
    if (rsp[0] != 0x76 || rsp[1] != 0x00 || rsp[2] != 0x34 || rsp[3] != 0x00 || rsp[4] != 0x04) {
        printf("[ptc06] invalid response format\n");
        return false;
    }
    
    *len = (rsp[7]<<8) | rsp[8];
    printf("[ptc06] image length: %u bytes\n", *len);
    
    // 命令执行完成后延时
    vTaskDelay(pdMS_TO_TICKS(CMD_DELAY_MS));
    return true;
}

int ptc06_read_block(cyhal_uart_t *u,uint16_t addr,uint8_t *buf,uint16_t size)
{
    // 确保读取大小合适
    if (size == 0) {
        printf("[ptc06] invalid read size: 0\n");
        return -1;
    }

    // 在读取命令前增加更多延时，让相机稳定
    printf("[ptc06] waiting 3 seconds before read command...\n");
    vTaskDelay(pdMS_TO_TICKS(3000));

    // 发送读取命令
    uint8_t cmd[16] = {
        0x56, 0x00, 0x32, 0x0C,    // 命令头
        0x00, 0x0A,                // 固定值
        0x00, 0x00,                // 固定值
        (uint8_t)(addr>>8),        // 起始地址高字节
        (uint8_t)(addr),           // 起始地址低字节
        0x00, 0x00,                // 固定值
        (uint8_t)(size>>8),        // 读取长度高字节
        (uint8_t)(size),           // 读取长度低字节
        0x00, 0xFF                 // 固定值
    };
                 
    printf("[ptc06] reading block at addr 0x%04X, size %u bytes\n", addr, size);
    printf("[ptc06] command bytes: ");
    for(int i = 0; i < 16; i++) {
        printf("%02X ", cmd[i]);
    }
    printf("\n");
    
    if (CY_RSLT_SUCCESS!=uart_hal_write(cmd,16)) {
        printf("[ptc06] uart_hal_write failed for read_block\n");
        return -1;
    }
    
    // 发送后等待更长时间，让相机准备数据
    printf("[ptc06] waiting 5 seconds for camera response...\n");
    vTaskDelay(pdMS_TO_TICKS(5000));
    
    // 读取头部 (5字节)，带重试机制
    uint8_t header[5];
    size_t read_len = 0;
    int retries = 0;
    
    printf("[ptc06] attempting to read header (5 bytes)...\n");
    while (read_len < 5 && retries < MAX_RETRIES) {
        printf("[ptc06] header read attempt %d/%d...\n", retries + 1, MAX_RETRIES);
        size_t result = uart_hal_read(header + read_len, 5 - read_len, pdMS_TO_TICKS(BLOCK_TIMEOUT_MS));
        if (result == 0) {
            printf("[ptc06] header read timeout, retry %d\n", retries + 1);
            retries++;
            vTaskDelay(pdMS_TO_TICKS(1000)); // 增加重试延时到1秒
            continue;
        }
        read_len += result;
        printf("[ptc06] received %u header bytes so far\n", read_len);
    }

    if (read_len != 5) {
        printf("[ptc06] CRITICAL: failed to read header after %d retries\n", MAX_RETRIES);
        printf("[ptc06] CRITICAL: camera may not be responding to read block command\n");
        return -2;
    }

    printf("[ptc06] header received: %02X %02X %02X %02X %02X\n",
           header[0], header[1], header[2], header[3], header[4]);

    // 验证头部
    if (header[0] != 0x76 || header[1] != 0x00 || header[2] != 0x32 || 
        header[3] != 0x00 || header[4] != 0x00) {
        printf("[ptc06] invalid header format: %02X %02X %02X %02X %02X\n",
               header[0], header[1], header[2], header[3], header[4]);
        return -3;
    }

    // 读取数据部分，使用较大的块来减少读取次数
    size_t total_received = 0;
    uint32_t block_start_time = xTaskGetTickCount();
    
    while (total_received < size) {
        // 检查总体超时
        if ((xTaskGetTickCount() - block_start_time) > pdMS_TO_TICKS(BLOCK_TIMEOUT_MS)) {
            printf("[ptc06] total read operation timeout\n");
            return -4;
        }

        size_t to_read = size - total_received;
        if (to_read > 128) to_read = 128;  // 增加每次读取的大小到128字节
        
        // 单次数据读取，带重试机制
        read_len = 0;
        retries = 0;
        
        while (read_len < to_read && retries < MAX_RETRIES) {
            size_t result = uart_hal_read(buf + total_received + read_len, 
                                        to_read - read_len, 
                                        pdMS_TO_TICKS(DATA_TIMEOUT_MS));
            if (result == 0) {
                printf("[ptc06] data read timeout at offset %u, retry %d\n", 
                       total_received + read_len, retries + 1);
                retries++;
                vTaskDelay(pdMS_TO_TICKS(50)); // 重试前短暂延时
                continue;
            }
            read_len += result;
        }

        if (read_len < to_read) {
            printf("[ptc06] failed to read data block after %d retries\n", MAX_RETRIES);
            return -5;
        }

        total_received += read_len;
        
        // 每读取256字节打印一次进度
        if (total_received % 256 == 0 || total_received == size) {
            printf("[ptc06] received %u/%u bytes (%d%%)\n", 
                   total_received, size, (total_received * 100) / size);
        }
    }

    // 读取尾部 (5字节)，带重试机制
    uint8_t footer[5];
    read_len = 0;
    retries = 0;
    
    while (read_len < 5 && retries < MAX_RETRIES) {
        size_t result = uart_hal_read(footer + read_len, 5 - read_len, pdMS_TO_TICKS(BLOCK_TIMEOUT_MS));
        if (result == 0) {
            printf("[ptc06] footer read timeout, retry %d\n", retries + 1);
            retries++;
            vTaskDelay(pdMS_TO_TICKS(100)); // 重试前短暂延时
            continue;
        }
        read_len += result;
    }

    if (read_len != 5) {
        printf("[ptc06] failed to read footer after %d retries\n", MAX_RETRIES);
        return -6;
    }

    // 验证尾部
    if (footer[0] != 0x76 || footer[1] != 0x00 || footer[2] != 0x32 || 
        footer[3] != 0x00 || footer[4] != 0x00) {
        printf("[ptc06] invalid footer format: %02X %02X %02X %02X %02X\n",
               footer[0], footer[1], footer[2], footer[3], footer[4]);
        return -7;
    }

    // 如果是第一个块，检查JPEG头
    if (addr == 0 && size >= 2) {
        if (buf[0] != 0xFF || buf[1] != 0xD8) {
            printf("[ptc06] WARNING: Invalid JPEG header (should start with FF D8)\n");
        } else {
            printf("[ptc06] Valid JPEG header found (FF D8)\n");
        }
    }
    
    // 如果是最后一个块，检查JPEG尾
    if ((addr + size) >= 0xFFFF && size >= 2) {
        if (buf[size-2] != 0xFF || buf[size-1] != 0xD9) {
            printf("[ptc06] WARNING: Invalid JPEG end marker (should end with FF D9)\n");
        } else {
            printf("[ptc06] Valid JPEG end marker found (FF D9)\n");
        }
    }
    
    return size;
}

bool ptc06_read_image_to_buffer(cyhal_uart_t *u, uint8_t *buffer, uint32_t buffer_size, uint32_t *image_len_read)
{
    uint16_t total_img_len_u16;
    printf("[ptc06] Attempting to read entire image to buffer (chunked strategy)...\n");

    // 1. 获取图像总长度
    if (!ptc06_get_length(u, &total_img_len_u16)) {
        printf("[ptc06] Failed to get image length.\n");
        return false;
    }
    *image_len_read = (uint32_t)total_img_len_u16;
    printf("[ptc06] Expected total image length: %lu bytes.\n", *image_len_read);

    // 2. 检查缓冲区大小
    if (*image_len_read == 0) {
        printf("[ptc06] Image length is 0. Aborting read.\n");
        return true; // 0长度图像，但操作本身算成功
    }
    if (*image_len_read > buffer_size) {
        printf("[ptc06] Error: Buffer too small. Need %lu, got %lu\n", *image_len_read, buffer_size);
        return false;
    }

    uint32_t current_offset = 0;
    const uint8_t expected_response_header[] = {0x76, 0x00, 0x32, 0x00, 0x00};
    // 根据参考代码，数据块后的"尾部"与头部相同。

    uint8_t cmd[16] = {
        0x56, 0x00, 0x32, 0x0C,
        0x00, 0x0A,                // 固定值
        0x00, 0x00,                // 地址MH占位符
        0x00,                      // 地址H占位符
        0x00,                      // 地址L占位符
        0x00, 0x00,                // 固定值
        0x00,                      // 长度H占位符
        0x00,                      // 长度L占位符
        0x00, 0xFF                 // 固定值 (结束符) - 注意：参考逻辑在每个块命令中都发送此值
    };
    

    printf("[ptc06] Starting chunked read. Total %lu bytes, chunk_size %d bytes.\n", *image_len_read, PTC06_IMAGE_DATA_CHUNK_SIZE);

    while (current_offset < *image_len_read) {
        uint16_t bytes_in_current_chunk = PTC06_IMAGE_DATA_CHUNK_SIZE;
        if (current_offset + bytes_in_current_chunk > *image_len_read) {
            bytes_in_current_chunk = *image_len_read - current_offset;
        }

        if (bytes_in_current_chunk == 0) break; // 如果逻辑正确，这种情况不应该发生

        printf("[ptc06] Chunk: offset %lu, length %u\n", current_offset, bytes_in_current_chunk);

        // 为当前块填充命令
        cmd[8] = (uint8_t)(current_offset >> 8);    // 起始地址高字节
        cmd[9] = (uint8_t)(current_offset & 0xFF);  // 起始地址低字节
        cmd[12] = (uint8_t)(bytes_in_current_chunk >> 8);    // 长度高字节
        cmd[13] = (uint8_t)(bytes_in_current_chunk & 0xFF);  // 长度低字节

        bool chunk_read_successful = false;
        for (int retry = 0; retry < PTC06_MAX_CHUNK_RETRIES; ++retry) {
            if (retry > 0) {
                printf("[ptc06] Retrying chunk (attempt %d/%d) offset %lu, len %u after %d ms delay...\n", 
                       retry + 1, PTC06_MAX_CHUNK_RETRIES, current_offset, bytes_in_current_chunk, PTC06_CHUNK_RETRY_DELAY_MS);
                vTaskDelay(pdMS_TO_TICKS(PTC06_CHUNK_RETRY_DELAY_MS));
            }
            
            uart_hal_flush_rx();

            printf("[ptc06] --- About to call uart_hal_write for chunk offset %lu ---\n", current_offset);
            if (CY_RSLT_SUCCESS != uart_hal_write(cmd, sizeof(cmd))) {
                printf("[ptc06] uart_hal_write failed for chunk command at offset %lu.\n", current_offset);
                continue; // 尝试下一次重试
            }
            printf("[ptc06] --- uart_hal_write for chunk offset %lu completed ---\n", current_offset);
            
            
            // 基于参考代码，这里不进行长时间延迟。超时由uart_hal_read处理。

            //期望头部+数据+尾部（尾部与头部相同）
            uint16_t expected_response_size = 5 + bytes_in_current_chunk + 5; 

            //调整缓冲区大小以容纳头部+最大块数据+尾部
            uint8_t chunk_response_buffer[PTC06_IMAGE_DATA_CHUNK_SIZE + 10]; 

            printf("[ptc06] --- About to call uart_hal_read for chunk offset %lu, expecting %u bytes (header+data+footer) ---\n", current_offset, expected_response_size);
            size_t bytes_actually_read = uart_hal_read(chunk_response_buffer, expected_response_size, pdMS_TO_TICKS(CMD_TIMEOUT_MS));

            printf("[ptc06] --- uart_hal_read for chunk offset %lu returned %u bytes ---\n", current_offset, bytes_actually_read);

            if (bytes_actually_read != expected_response_size) {
                printf("[ptc06] Failed to read full chunk response (header+data+footer). Expected %u, got %u. Offset %lu.\n", 
                       expected_response_size, bytes_actually_read, current_offset);
                if (bytes_actually_read > 0) { 
                    printf("[ptc06] Partial RX data (%u bytes): ", bytes_actually_read);
                    for(size_t k=0; k < bytes_actually_read && k < 32; ++k) printf("%02X ", chunk_response_buffer[k]); // 打印更多信息用于调试
                    if (bytes_actually_read > 32) printf("...");
                    printf("\n");
                }
                continue; // 尝试下一次重试
            }

            // 验证头部
            if (memcmp(chunk_response_buffer, expected_response_header, 5) != 0) {
                printf("[ptc06] Invalid header for chunk at offset %lu. RX_HEADER: ", current_offset);
                for(int k=0; k<5; ++k) printf("%02X ", chunk_response_buffer[k]);
                printf("\n");
                continue; // 尝试下一次重试
            }

            // 验证尾部（与头部相同）
            if (memcmp(chunk_response_buffer + 5 + bytes_in_current_chunk, expected_response_header, 5) != 0) {
                printf("[ptc06] Invalid footer for chunk at offset %lu. Expected footer like header. RX_FOOTER_AT_OFFSET_%d: ", 
                        current_offset, (5 + bytes_in_current_chunk));
                 for(int k=0; k<5; ++k) printf("%02X ", chunk_response_buffer[5 + bytes_in_current_chunk + k]);
                printf("\n");
               
                if (bytes_in_current_chunk > 5) { // 确保不会下溢
                    printf("[ptc06] Bytes before expected footer: ");
                    for(int k=0; k<5; ++k) printf("%02X ", chunk_response_buffer[5 + bytes_in_current_chunk - 5 + k]);
                    printf("\n");
                }
                continue; // 尝试下一次重试
            }

            // 如果所有检查都通过，复制数据
            memcpy(buffer + current_offset, chunk_response_buffer + 5, bytes_in_current_chunk);
            chunk_read_successful = true;
            printf("[ptc06] Successfully read chunk (header+data+footer): offset %lu, length %u\n", current_offset, bytes_in_current_chunk);
            break; // 退出重试循环
        }

        if (!chunk_read_successful) {
            printf("[ptc06] CRITICAL: Failed to read chunk at offset %lu after %d retries. Aborting.\n", 
                   current_offset, PTC06_MAX_CHUNK_RETRIES);
            return false; // 中止整个图像读取
        }

        current_offset += bytes_in_current_chunk;

    }

    printf("[ptc06] Successfully read entire image (%lu bytes) using chunked strategy.\n", *image_len_read);
    return true;
}

bool ptc06_clear_cache(cyhal_uart_t *u)
{
    const uint8_t clr[] = {0x56,0x00,0x36,0x01,0x03};  // 正确的清空缓存命令
    printf("[ptc06] clear cache command\n");
    bool ret = cmd_ack(clr,5,0x36);
    printf("[ptc06] clear cache %s\n", ret ? "success" : "failed");
    return ret;
}
