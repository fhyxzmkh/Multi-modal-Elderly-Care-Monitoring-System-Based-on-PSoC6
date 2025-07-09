#ifndef APP_CFG_H_
#define APP_CFG_H_

// /* —— Wi-Fi —— */
// #define WIFI_SSID        "spike"
// #define WIFI_PASSWORD    "lzqysq666"

/* —— 服务器 —— */
#define SERVER_IP        "123.60.80.170"
#define SERVER_PORT      9966         


/* —— 串口 —— */
#define UART_TX_PIN      P5_5
#define UART_RX_PIN      P5_4
#define UART_BAUDRATE    115200
#define UART_RX_BUF_SIZE 2048

/* —— 图像 —— */
#define CHUNK_SIZE       128   /* 每次读取256字节，确保小于串口缓冲区 */
#endif
