import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Trash2, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { useSidebarStore } from "@/store/sidebar-store.ts";
import { axios_login_instance } from "@/config/configuration.ts";
import { useUserStore } from "@/store/user-store.ts";

export const Route = createFileRoute("/notifications/")({
  component: NotificationsPage,
  beforeLoad: () => {
    const userInfo = useUserStore.getState().userInfo;
    if (!userInfo) {
      throw redirect({
        to: "/auth/login",
      });
    }
  },
});

interface Message {
  id: number;
  title: string;
  content: string;
  userId: number;
  type: number; // 0: 普通, 1: 警告
  isConfirmed: number; // 0: 未确认, 1: 已确认
  createTime: string;
}

interface ApiResponse {
  status: string;
  code: number;
  message: string;
  data: {
    total: number;
    rows: Message[];
  };
}

function NotificationsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  const setUnconfirmedMessageCount = useSidebarStore(
    (state) => state.setUnconfirmedMessageCount,
  );

  // 获取消息列表
  const fetchMessages = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios_login_instance.get<ApiResponse>(
        `/message/get/list?page=${page}&pageSize=${pageSize}`,
      );

      if (response.data.status === "success") {
        setMessages(response.data.data.rows);
        setTotalItems(response.data.data.total);
        setTotalPages(Math.ceil(response.data.data.total / pageSize));
      } else {
        setError(response.data.message || "获取消息失败");
      }
    } catch (err) {
      setError("获取消息失败，请检查网络连接");
      console.error("获取消息出错:", err);
    } finally {
      setLoading(false);
    }
  };

  // 确认消息已读
  const confirmMessage = async (messageId: number) => {
    try {
      const response = await axios_login_instance.post(
        `/message/update/confirm?messageId=${messageId}`,
      );

      if (response.data.status === "success") {
        toast.success("消息已标记为已读");
        // 更新本地消息状态
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId ? { ...msg, isConfirmed: 1 } : msg,
          ),
        );
        setUnconfirmedMessageCount(
          useSidebarStore.getState().unconfirmed_message_count - 1,
        );
      } else {
        toast.error(response.data.message || "操作失败");
      }
    } catch (err) {
      toast.error("操作失败，请稍后重试");
      console.error("确认消息出错:", err);
    }
  };

  // 删除消息
  const deleteMessage = async (messageId: number) => {
    try {
      const response = await axios_login_instance.post(
        `/message/delete?messageId=${messageId}`,
      );

      if (response.data.status === "success") {
        toast.success("消息已删除");
        // 从本地移除消息
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== messageId),
        );

        // 如果当前页没有消息了且不是第一页，则返回上一页
        if (messages.length === 1 && currentPage > 1) {
          setCurrentPage((prev) => prev - 1);
        } else {
          // 重新获取当前页数据
          fetchMessages(currentPage);
        }
      } else {
        toast.error(response.data.message || "删除失败");
      }
    } catch (err) {
      toast.error("删除失败，请稍后重试");
      console.error("删除消息出错:", err);
    }
  };

  // 处理页码变化
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // 初始加载和页码变化时获取数据
  useEffect(() => {
    fetchMessages(currentPage);
  }, [currentPage]);

  // 获取消息类型对应的样式和图标
  const getMessageTypeInfo = (type: number, isConfirmed: number) => {
    if (type === 1) {
      return {
        badge: <Badge variant="destructive">警告</Badge>,
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        rowClass: isConfirmed ? "bg-red-50" : "bg-red-100",
      };
    } else {
      return {
        badge: <Badge variant="secondary">普通</Badge>,
        icon: <Info className="h-5 w-5 text-blue-500" />,
        rowClass: isConfirmed ? "" : "bg-blue-50",
      };
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] py-8 px-4 bg-gray-50">
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* 页面标题和统计 */}
        <div className="flex items-center justify-between bg-white rounded-lg p-5 shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Bell className="h-6 w-6 text-blue-500" />
            消息通知
          </h1>
          <div className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
            共 {totalItems} 条消息
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 消息列表卡片 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {/* 加载状态 */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
              <p className="text-gray-500">正在加载消息...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-gray-500">
              <Bell className="h-12 w-12 text-gray-300 mb-3" />
              <p>暂无消息通知</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[100px] py-4">类型</TableHead>
                    <TableHead className="w-[150px]">标题</TableHead>
                    <TableHead className="w-[280px]">内容</TableHead>
                    <TableHead className="w-[150px]">时间</TableHead>
                    <TableHead className="w-[100px]">状态</TableHead>
                    <TableHead className="text-right w-[180px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => {
                    const typeInfo = getMessageTypeInfo(
                      message.type,
                      message.isConfirmed,
                    );
                    return (
                      <TableRow
                        key={message.id}
                        className={`${typeInfo.rowClass} hover:bg-gray-50 transition-colors`}
                      >
                        <TableCell className="font-medium flex items-center gap-1">
                          {typeInfo.icon}
                          {typeInfo.badge}
                        </TableCell>
                        <TableCell className="font-medium">
                          {message.title}
                        </TableCell>
                        <TableCell>
                          <div
                            className="max-w-[280px] overflow-hidden text-ellipsis"
                            title={message.content}
                          >
                            <p className="line-clamp-2 text-sm">
                              {message.content}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {message.createTime}
                        </TableCell>
                        <TableCell>
                          {message.isConfirmed === 1 ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              已读
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1"
                            >
                              <Info className="h-3 w-3" />
                              未读
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {message.isConfirmed === 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => confirmMessage(message.id)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50 transition-colors"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                标为已读
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteMessage(message.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              删除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* 分页控件 */}
          {!loading && totalPages > 1 && (
            <div className="p-5 border-t border-gray-100 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer hover:bg-gray-50 transition-colors"
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={currentPage === page}
                          onClick={() => handlePageChange(page)}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer hover:bg-gray-50 transition-colors"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
