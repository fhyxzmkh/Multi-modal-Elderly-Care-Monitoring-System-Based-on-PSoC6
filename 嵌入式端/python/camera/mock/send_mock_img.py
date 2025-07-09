#!/usr/bin/env python3
import socket
import struct
import os
import sys
import time

# --- 配置 ---
# 确保这里的HOST和PORT与你的服务器脚本中的TCP_PORT完全一致
SERVER_HOST = '127.0.0.1'  # 或者你的服务器IP地址，本地测试用127.0.0.1
SERVER_PORT = 9966        # 你的TCP服务器端口
CHUNK_SIZE = 4096         # 每次发送的数据块大小，可以根据网络情况调整

# --- 数据包头部格式 (必须和服务器端完全一样) ---
HEADER_FORMAT = '<2sIIHB'  # 小端序，2字节magic + 4字节total_size + 4字节offset + 2字节chunk_size + 1字节is_last
HEADER_SIZE = struct.calcsize(HEADER_FORMAT)

def send_image(image_path):
    """
    读取一张图片，并将其按照指定协议发送到服务器。
    """
    # 1. 检查图片文件是否存在
    if not os.path.exists(image_path):
        print(f"错误: 图片文件未找到 -> {image_path}")
        return

    # 2. 读取图片文件的所有二进制数据
    with open(image_path, 'rb') as f:
        image_data = f.read()
    
    total_size = len(image_data)
    print(f"准备发送图片: '{image_path}', 总大小: {total_size} 字节")

    # 3. 创建socket并连接到服务器
    try:
        client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        client_socket.connect((SERVER_HOST, SERVER_PORT))
        print(f"已成功连接到服务器 {SERVER_HOST}:{SERVER_PORT}")
    except ConnectionRefusedError:
        print(f"错误: 连接被拒绝。请确保您的服务器脚本正在运行，并且监听在 {SERVER_HOST}:{SERVER_PORT}")
        return
    except Exception as e:
        print(f"连接服务器时出错: {e}")
        return

    # 4. 开始分块发送数据
    offset = 0
    try:
        while offset < total_size:
            # 计算当前数据块
            chunk = image_data[offset:offset + CHUNK_SIZE]
            chunk_size = len(chunk)
            
            # 判断是否为最后一个数据块
            is_last = 1 if (offset + chunk_size) >= total_size else 0

            # 构建头部
            header = struct.pack(
                HEADER_FORMAT,
                b'PH',          # magic number
                total_size,    # 图片总大小
                offset,        # 当前块的偏移量
                chunk_size,    # 当前块的大小
                is_last        # 是否为最后一块
            )

            # 发送头部 + 数据块
            client_socket.sendall(header)
            client_socket.sendall(chunk)
            
            progress = ((offset + chunk_size) * 100) / total_size
            print(f"\r发送进度: {progress:.2f}% ({offset + chunk_size}/{total_size} 字节), is_last={is_last}", end="")

            offset += chunk_size
            time.sleep(0.01) # 稍微暂停一下，模拟真实网络延迟，非必须

        print("\n图片发送完成！")

    except Exception as e:
        print(f"\n发送数据时出错: {e}")
    finally:
        # 5. 关闭连接
        client_socket.close()
        print("与服务器的连接已关闭。")


if __name__ == '__main__':
    # 从命令行参数获取图片路径，如果没有参数，则提示用户
    if len(sys.argv) > 1:
        image_to_send = sys.argv[1]
        send_image(image_to_send)
    else:
        print("用法: python send_image.py <图片文件路径>")
        print("例如: python send_image.py fall_test.jpg")