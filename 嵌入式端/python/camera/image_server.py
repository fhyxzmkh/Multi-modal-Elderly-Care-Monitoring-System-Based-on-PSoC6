#!/usr/bin/env python3
import socket
import struct
import os
from datetime import datetime
import traceback

# 服务器配置
HOST = '0.0.0.0'  # 监听所有网络接口
PORT = 9000       # 使用端口9000

# 数据包头部格式
HEADER_FORMAT = '<2sIIHB'  # 小端序，2字节magic + 4字节total_size + 4字节offset + 2字节chunk_size + 1字节is_last
HEADER_SIZE = struct.calcsize(HEADER_FORMAT)

def save_image(data, timestamp):
    """保存图像数据到文件"""
    if not os.path.exists('images'):
        os.makedirs('images')
    filename = f'images/image_{timestamp.strftime("%Y%m%d_%H%M%S")}.jpg'
    with open(filename, 'wb') as f:
        f.write(data)
    print(f'[服务器] 图片已保存到 {filename}')
    return filename

def handle_client(client_socket, client_address):
    """处理单个客户端连接"""
    print(f'[服务器] 新连接来自 {client_address}')
    print(f'[服务器] 设置socket选项...')
    
    try:
        # 设置socket选项
        client_socket.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
        client_socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPIDLE, 10)
        client_socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, 3)
        client_socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPCNT, 3)
        
        # 设置超时
        client_socket.settimeout(10.0)
        print(f'[服务器] socket选项设置完成')
        
        # 创建一个新的图像缓冲区
        image_buffer = bytearray()
        total_size = 0
        timestamp = datetime.now()
        
        print(f'[服务器] 等待接收数据...')
        while True:
            try:
                # 读取头部
                print(f'[服务器] 尝试读取头部数据 ({HEADER_SIZE} 字节)...')
                header_data = client_socket.recv(HEADER_SIZE)
                if not header_data:
                    print(f'[服务器] 连接关闭：收到空数据')
                    break
                    
                if len(header_data) != HEADER_SIZE:
                    print(f'[服务器] 头部数据不完整：期望 {HEADER_SIZE} 字节，实际收到 {len(header_data)} 字节')
                    break
                    
                # 解析头部
                magic, total_size, offset, chunk_size, is_last = struct.unpack(HEADER_FORMAT, header_data)
                print(f'[服务器] 收到数据包头：magic={magic}, size={total_size}, offset={offset}, chunk={chunk_size}, last={is_last}')
                
                if magic != b'PH':
                    print(f'[服务器] 无效的magic number: {magic}')
                    break
                    
                # 读取数据块
                print(f'[服务器] 尝试读取数据块 ({chunk_size} 字节)...')
                chunk_data = client_socket.recv(chunk_size)
                if not chunk_data:
                    print(f'[服务器] 连接关闭：数据块读取时收到空数据')
                    break
                    
                if len(chunk_data) != chunk_size:
                    print(f'[服务器] 数据块不完整：期望 {chunk_size} 字节，实际收到 {len(chunk_data)} 字节')
                    break
                    
                # 将数据添加到缓冲区
                if len(image_buffer) != offset:
                    print(f'[服务器] 偏移量不匹配：期望 {len(image_buffer)}，收到 {offset}')
                    break
                    
                image_buffer.extend(chunk_data)
                progress = (len(image_buffer) * 100) // total_size
                print(f'[服务器] 进度：{progress}% ({len(image_buffer)}/{total_size} 字节)')
                
                # 如果是最后一个数据块，保存图像
                if is_last:
                    if len(image_buffer) == total_size:
                        filename = save_image(image_buffer, timestamp)
                        print(f'[服务器] 图片接收完成并保存 ({total_size} 字节)')
                        # 开始接收新图像
                        image_buffer = bytearray()
                        timestamp = datetime.now()
                    else:
                        print(f'[服务器] 大小不匹配：期望 {total_size} 字节，实际收到 {len(image_buffer)} 字节')
                        break
                    
            except socket.timeout:
                print(f'[服务器] 接收数据超时')
                break
            except Exception as e:
                print(f'[服务器] 处理数据时出错: {e}')
                traceback.print_exc()
                break
                    
    except Exception as e:
        print(f'[服务器] 处理客户端时出错: {e}')
        traceback.print_exc()
    finally:
        try:
            client_socket.shutdown(socket.SHUT_RDWR)
        except:
            pass
        client_socket.close()
        print(f'[服务器] 客户端连接 {client_address} 已关闭')

def main():
    """主服务器循环"""
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    
    try:
        server_socket.bind((HOST, PORT))
        server_socket.listen(5)
        print(f'[服务器] 启动，监听 {HOST}:{PORT}')
        
        while True:
            try:
                client_socket, client_address = server_socket.accept()
                print(f'[服务器] 客户端连接：{client_address}')
                handle_client(client_socket, client_address)
            except Exception as e:
                print(f'[服务器] 接受连接时出错: {e}')
                traceback.print_exc()
            
    except KeyboardInterrupt:
        print('\n[服务器] 正在关闭...')
    except Exception as e:
        print(f'[服务器] 错误: {e}')
        traceback.print_exc()
    finally:
        server_socket.close()

if __name__ == '__main__':
    main() 