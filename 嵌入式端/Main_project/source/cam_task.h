#ifndef CAM_TASK_H
#define CAM_TASK_H

#include "FreeRTOS.h"
#include "semphr.h"

// 图像缓冲区结构
typedef struct {
    uint8_t *data;
    uint32_t size;
    bool ready;
    SemaphoreHandle_t mutex;
    SemaphoreHandle_t data_ready;
} image_buffer_t;

// 创建相机相关任务
void create_camera_tasks(void);

#endif // CAM_TASK_H
