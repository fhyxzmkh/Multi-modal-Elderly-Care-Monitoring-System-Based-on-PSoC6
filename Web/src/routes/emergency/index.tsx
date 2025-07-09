import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { VoiceAnalysis } from "@/components/VoiceAnalysis";
import { Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceHistoryTable } from "@/components/VoiceHistoryTable";
import { useUserStore } from "@/store/user-store.ts";

export const Route = createFileRoute("/emergency/")({
  component: RouteComponent,
  beforeLoad: () => {
    const userInfo = useUserStore.getState().userInfo;
    if (!userInfo) {
      throw redirect({
        to: "/auth/login",
      });
    }
  },
});

function RouteComponent() {
  const [text, setText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [refreshFlag, setRefreshFlag] = useState<boolean>(false);

  const handleRefresh = () => {
    setRefreshFlag(!refreshFlag);
  };

  useEffect(() => {
    const socketUrl = `ws://123.60.80.170:9999/ws`;
    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.text !== undefined) {
        setText(data.text);
        const now = new Date();
        setLastUpdated(now);
      }
    };

    // 监听连接关闭事件
    socket.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 左侧：状态面板 */}
          <div className="lg:col-span-1">
            {/* 连接状态卡片 */}
            <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                服务状态
              </h2>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-6">
                <div className="relative">
                  <div
                    className={`w-4 h-4 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  {isConnected && (
                    <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-500 animate-ping opacity-50"></div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {isConnected ? "已连接" : "未连接"}
                  </p>
                  <p className="text-xs text-gray-500">语音识别服务</p>
                </div>
              </div>

              <div className="space-y-6 flex-grow">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    状态信息
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">最后更新</span>
                      <span className="text-sm font-medium text-gray-800">
                        {lastUpdated
                          ? lastUpdated.toLocaleTimeString()
                          : "--:--:--"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">识别状态</span>
                      <div className="flex items-center gap-2">
                        {isConnected ? (
                          <>
                            <Mic className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-green-600">
                              正在监听
                            </span>
                          </>
                        ) : (
                          <>
                            <MicOff className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium text-red-600">
                              未监听
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <div className="text-xs text-gray-500 text-center">
                  <p>语音识别服务由人工智能实验室提供</p>
                  <p className="mt-1">实时监测中...</p>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：分析面板 */}
          <div className="lg:col-span-2">
            <div className="rounded-xl p-6 h-full flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={text || "empty"}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <VoiceAnalysis text={text} handleRefresh={handleRefresh} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 历史记录表格 */}
        <div className="mt-6">
          <VoiceHistoryTable refreshFlag={refreshFlag} />
        </div>
      </div>
    </div>
  );
}
