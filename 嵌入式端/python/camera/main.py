#!/usr/bin/env python3
import socket
import struct
import os
from datetime import datetime
import traceback
import asyncio
import websockets
import threading
import base64  # 修正点 1: 导入 base64 模块
import json    # 修正点 1: 导入 json 模块

# --- 服务器配置 ---
HOST = '0.0.0.0'        # 监听所有网络接口
TCP_PORT = 9966         # TCP服务器端口
WS_PORT = 9998          # WebSocket服务器端口

# --- 数据包头部格式 ---
HEADER_FORMAT = '<2sIIHB'  # 小端序，2字节magic + 4字节total_size + 4字节offset + 2字节chunk_size + 1字节is_last
HEADER_SIZE = struct.calcsize(HEADER_FORMAT)

# --- 用于线程间通信的全局状态 ---
# 使用 asyncio.Queue 在异步的WebSocket和同步的TCP服务器线程之间安全地传递图片文件名
image_queue = asyncio.Queue()
# 存储所有连接的WebSocket客户端
connected_clients = set()

# --- 修改后的图像保存函数 ---
def save_image(data, timestamp, loop):
    """保存图像数据到文件，并将文件名放入队列以供广播"""
    if not os.path.exists('images'):
        os.makedirs('images')
    filename = f'images/image_{timestamp.strftime("%Y%m%d_%H%M%S")}.jpg'
    with open(filename, 'wb') as f:
        f.write(data)
    print(f'[TCP 服务器] 图片已保存到 {filename}')

    # --- 修正 2: 直接使用传入的 loop 对象，不再需要 try-except ---
    # loop.call_soon_threadsafe 是线程安全的，它会把 put_nowait 这个操作安排到 loop 所在的线程中去执行
    loop.call_soon_threadsafe(image_queue.put_nowait, filename)

    return filename

# --- 原有的TCP客户端处理函数 (增强了并发和健壮性) ---
def handle_client(client_socket, client_address, loop):
    """处理单个客户端连接 (在自己的线程中运行)"""
    print(f'[TCP 服务器] 新连接来自 {client_address}')

    try:
        client_socket.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
        # 兼容不同操作系统
        if hasattr(socket, 'IPPROTO_TCP') and hasattr(socket, 'TCP_KEEPIDLE'):
            client_socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPIDLE, 10)
            client_socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, 3)
            client_socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPCNT, 3)

        client_socket.settimeout(20.0)

        image_buffer = bytearray()
        total_size = 0
        timestamp = datetime.now()
        
        while True:
            try:
                header_data = client_socket.recv(HEADER_SIZE)
                if not header_data:
                    print(f'[TCP 服务器] 连接关闭：头部接收时收到空数据')
                    break

                if len(header_data) != HEADER_SIZE:
                    print(f'[TCP 服务器] 头部数据不完整：期望 {HEADER_SIZE} 字节，实际收到 {len(header_data)} 字节')
                    break

                magic, total_size, offset, chunk_size, is_last = struct.unpack(HEADER_FORMAT, header_data)
                # print(f'[TCP 服务器] 收到数据包头：magic={magic}, size={total_size}, offset={offset}, chunk={chunk_size}, last={is_last}')

                if magic != b'PH':
                    print(f'[TCP 服务器] 无效的magic number: {magic}')
                    break

                # 循环读取，确保接收到完整的数据块
                chunk_data = bytearray()
                while len(chunk_data) < chunk_size:
                    packet = client_socket.recv(chunk_size - len(chunk_data))
                    if not packet:
                        raise ConnectionError("连接在读取数据块时被关闭")
                    chunk_data.extend(packet)

                if len(image_buffer) != offset:
                    print(f'[TCP 服务器] 偏移量不匹配：期望 {len(image_buffer)}，收到 {offset}。重置当前图片接收。')
                    image_buffer = bytearray()
                    continue

                image_buffer.extend(chunk_data)
                progress = (len(image_buffer) * 100) // total_size if total_size > 0 else 0
                print(f'\r[TCP 服务器] 进度：{progress}% ({len(image_buffer)}/{total_size} 字节)', end="")

                if is_last:
                    print() # 换行
                    if len(image_buffer) == total_size:
                        # 调用修改后的save_image函数，它将触发WebSocket广播
                        save_image(image_buffer, timestamp, loop)
                        print(f'[TCP 服务器] 图片接收完成并保存 ({total_size} 字节)')
                        # 重置以接收下一张图片
                        image_buffer = bytearray()
                        timestamp = datetime.now()
                    else:
                        print(f'[TCP 服务器] 最终大小不匹配：期望 {total_size} 字节，实际收到 {len(image_buffer)} 字节')
                        break

            except socket.timeout:
                print(f'\n[TCP 服务器] 接收数据超时')
                break
            except (ConnectionError, ConnectionResetError) as e:
                print(f'\n[TCP 服务器] 连接中断: {e}')
                break
            except Exception as e:
                print(f'\n[TCP 服务器] 处理数据时出错: {e}')
                traceback.print_exc()
                break

    except Exception as e:
        print(f'[TCP 服务器] 处理客户端时出错: {e}')
        traceback.print_exc()
    finally:
        try:
            client_socket.shutdown(socket.SHUT_RDWR)
        except OSError:
            pass
        client_socket.close()
        print(f'[TCP 服务器] 客户端连接 {client_address} 已关闭')


# --- TCP服务器主循环 (将在单独线程中运行) ---
def start_tcp_server(loop):
    """监听并接受TCP连接，为每个连接创建一个新线程。"""
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    try:
        server_socket.bind((HOST, TCP_PORT))
        server_socket.listen(5)
        print(f'[TCP 服务器] 启动，监听 {HOST}:{TCP_PORT}')

        while True:
            client_socket, client_address = server_socket.accept()
            # --- 修正 6: 创建线程时，将 loop 作为参数传给 handle_client ---
            client_thread = threading.Thread(
                target=handle_client,
                args=(client_socket, client_address, loop), # 将 loop 添加到参数元组中
                daemon=True
            )
            client_thread.start()

    except Exception as e:
        print(f'[TCP 服务器] 启动或运行时出错: {e}')
        traceback.print_exc()
    finally:
        server_socket.close()
        print('[TCP 服务器] 已关闭')


# --- 新增的WebSocket服务器逻辑 ---

async def image_broadcaster():
    """(协程) 从队列中获取图片文件名，将其编码为Base64，并以JSON格式广播给所有连接的客户端"""
    while True:
        filename = await image_queue.get()
        print(f'[WebSocket] 准备广播图片: {filename}')

        if connected_clients:
            try:
                # 1. 以二进制方式读取图片文件
                with open(filename, 'rb') as f:
                    image_binary_data = f.read()

                # 2. 将二进制数据进行Base64编码，并解码为UTF-8字符串
                image_base64_data = base64.b64encode(image_binary_data).decode('utf-8')

                # 3. 构建客户端期望的JSON结构
                message_payload = {
                    "type": "image",
                    "imageData": image_base64_data,
                    # 可以选择性地添加时间戳
                    # "timestamp": datetime.now().isoformat()
                }
                
                # 4. 将Python字典序列化为JSON字符串
                message_json = json.dumps(message_payload)

                # 5. 并发地将JSON字符串发送给所有客户端
                # websockets库会自动处理字符串到WebSocket消息帧的转换
                tasks = [client.send(message_json) for client in connected_clients]
                if tasks:
                    await asyncio.gather(*tasks)
                    print(f'[WebSocket] 图片已成功广播给 {len(connected_clients)} 个客户端')

            except FileNotFoundError:
                print(f'[WebSocket] 错误: 文件未找到 {filename}')
            except Exception as e:
                print(f'[WebSocket] 广播时出错: {e}')
                traceback.print_exc() # 打印详细的错误堆栈

        image_queue.task_done()

# 修正点 2: 修改 ws_handler 函数签名，移除 path 参数
async def ws_handler(websocket):
    """(协程) 处理新的WebSocket连接"""
    connected_clients.add(websocket)
    print(f'[WebSocket] 新客户端连接: {websocket.remote_address}. 当前客户端总数: {len(connected_clients)}')
    try:
        # 保持连接打开，直到客户端主动断开
        await websocket.wait_closed()
    finally:
        connected_clients.remove(websocket)
        print(f'[WebSocket] 客户端断开连接: {websocket.remote_address}. 当前客户端总数: {len(connected_clients)}')


# --- 主程序入口 ---

async def main_async():
    """异步主函数，协调启动TCP和WebSocket服务器"""
    print('[主程序] 正在启动服务...')

    # --- 修正 7: 在启动TCP线程前，获取当前事件循环 ---
    loop = asyncio.get_running_loop()

    # --- 修正 8: 将获取到的 loop 对象传给TCP服务器启动函数 ---
    tcp_thread = threading.Thread(target=start_tcp_server, args=(loop,), daemon=True)
    tcp_thread.start()
    print('[主程序] TCP服务器线程已启动')

    asyncio.create_task(image_broadcaster())
    print('[主程序] 图片广播任务已创建')

    async with websockets.serve(ws_handler, HOST, WS_PORT):
        print(f'[WebSocket] 服务器启动，监听 {HOST}:{WS_PORT}')
        await asyncio.Future()

if __name__ == '__main__':
    try:
        asyncio.run(main_async())
    except KeyboardInterrupt:
        print('\n[主程序] 检测到Ctrl+C，正在关闭...')
    except Exception as e:
        print(f'[主程序] 出现顶层错误: {e}')
        traceback.print_exc()
    finally:
        print('[主程序] 程序已退出')