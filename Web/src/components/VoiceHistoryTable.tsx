import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { axios_login_instance } from "@/config/configuration.ts";

interface VoiceRecord {
  id: number;
  text: string;
  userId: number;
  isDanger: number;
  createTime: string;
}

interface VoiceHistoryResponse {
  status: string;
  code: number;
  message: string;
  data: {
    total: number;
    rows: VoiceRecord[];
  };
}

interface VoiceHistoryTableProps {
  refreshFlag: boolean;
}

export const VoiceHistoryTable: React.FC<VoiceHistoryTableProps> = (props) => {
  const [records, setRecords] = useState<VoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const pageSize = 5;

  const fetchHistory = async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios_login_instance.get<VoiceHistoryResponse>(
        `/voice/get/list?page=${page}&pageSize=${pageSize}`,
      );

      if (response.data.status === "success") {
        const { total, rows } = response.data.data;
        setRecords(rows);

        // 计算总页数
        const calculatedTotalPages = Math.ceil(total / pageSize);
        setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
      } else {
        setError(response.data.message || "获取历史记录失败");
      }
    } catch (err) {
      console.error("获取历史记录失败:", err);
      setError("无法连接到服务器，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage, props.refreshFlag]);

  // 清除成功或错误消息的计时器
  useEffect(() => {
    if (deleteSuccess || deleteError) {
      const timer = setTimeout(() => {
        setDeleteSuccess(null);
        setDeleteError(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [deleteSuccess, deleteError]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 删除记录
  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setDeleteSuccess(null);
    setDeleteError(null);

    try {
      const response = await axios_login_instance.post(
        `/voice/delete?voiceId=${id}`,
      );

      if (response.data && response.data.status === "success") {
        // 删除成功，更新记录列表
        setDeleteSuccess(`记录 #${id} 已成功删除`);
        fetchHistory(currentPage); // 重新获取当前页数据
      } else {
        setDeleteError(response.data?.message || "删除失败，请重试");
      }
    } catch (err) {
      console.error("删除记录失败:", err);
      setDeleteError("删除失败，服务器错误");
    } finally {
      setDeletingId(null);
    }
  };

  // 格式化日期时间
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">语音历史记录</h2>

      {/* 成功或错误消息 */}
      <AnimatePresence>
        {deleteSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p className="text-sm text-green-700">{deleteSuccess}</p>
          </motion.div>
        )}

        {deleteError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-700">{deleteError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>暂无历史记录</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                    语音内容
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                    安全状态
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                    创建时间
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {record.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {record.text}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {record.isDanger === 0 ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm text-green-600">安全</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                            <span className="text-sm text-red-600">危险</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDateTime(record.createTime)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(record.id)}
                        disabled={deletingId === record.id}
                        className={cn(
                          "p-1.5 rounded-md text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors",
                          deletingId === record.id &&
                            "opacity-50 cursor-not-allowed",
                        )}
                        title="删除记录"
                      >
                        {deletingId === record.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页控制 */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              显示第 {currentPage} 页，共 {totalPages} 页
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={cn(
                  "p-2 rounded-md border",
                  currentPage === 1
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={cn(
                  "p-2 rounded-md border",
                  currentPage === totalPages
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50",
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
