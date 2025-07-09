import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SmartWheelchair } from "@/components/SmartWheelchair";
import type {
  WheelchairStatusType,
  WheelchairMoveType,
} from "@/components/SmartWheelchair";
import { useUserStore } from "@/store/user-store.ts";

export const Route = createFileRoute("/wheelchair/")({
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
  const [wheelchairStatus, setWheelchairStatus] =
    useState<WheelchairStatusType>("off");
  const [wheelchairMove, setWheelchairMove] =
    useState<WheelchairMoveType>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketUrl = `ws://123.60.80.170:9999/ws`;
    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.number !== undefined) {
        switch (data.number) {
          case 3:
            setWheelchairStatus("on");
            setWheelchairMove("forward");
            break;
          case 2:
            setWheelchairStatus("on");
            setWheelchairMove("retreat");
            break;
          case 1:
            setWheelchairStatus("on");
            break;
          case 0:
            setWheelchairStatus("off");
            setWheelchairMove(null);
            break;
          case -1:
            break;
        }
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
      setWheelchairStatus("off");
      setWheelchairMove(null);
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧状态面板 */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 h-full">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                服务状态
              </h2>

              {/* 连接状态 */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-4">
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
                  <p className="text-xs text-gray-500">控制服务器状态</p>
                </div>
              </div>

              {/* 轮椅状态 */}
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-600">电源状态</p>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${wheelchairStatus === "on" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {wheelchairStatus === "on" ? "已启动" : "已关闭"}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${wheelchairStatus === "on" ? "bg-green-500" : "bg-red-500"}`}
                      style={{
                        width: wheelchairStatus === "on" ? "100%" : "0%",
                        transition: "width 0.5s ease-in-out",
                      }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-600">移动状态</p>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${wheelchairMove ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                    >
                      {wheelchairMove === "forward"
                        ? "前进中"
                        : wheelchairMove === "retreat"
                          ? "后退中"
                          : "静止"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">后退</span>
                    <div className="h-1 mx-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                      {wheelchairMove === "retreat" && (
                        <div
                          className="h-full bg-blue-500 animate-pulse"
                          style={{ width: "100%" }}
                        ></div>
                      )}
                    </div>
                    <span className="mx-2">|</span>
                    <div className="h-1 mx-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                      {wheelchairMove === "forward" && (
                        <div
                          className="h-full bg-blue-500 animate-pulse"
                          style={{ width: "100%" }}
                        ></div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">前进</span>
                  </div>
                </div>
              </div>

              {/* 控制说明 */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="text-sm font-medium text-blue-800 mb-4">
                  控制信号说明
                </h3>
                <ul className="text-xs text-blue-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded-full text-xs font-medium">
                      0
                    </span>
                    <span>关闭轮椅</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded-full text-xs font-medium">
                      1
                    </span>
                    <span>启动轮椅</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded-full text-xs font-medium">
                      2
                    </span>
                    <span>轮椅后退</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded-full text-xs font-medium">
                      3
                    </span>
                    <span>轮椅前进</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 右侧轮椅展示区 */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">
                  智能轮椅实时监控
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  通过WebSocket实时控制和监控轮椅状态
                </p>
              </div>

              {/* 轮椅展示区域 - 高度更大 */}
              <div className="p-6 bg-gradient-to-b from-gray-50 to-white h-[500px] flex items-center justify-center">
                <SmartWheelchair
                  wheelchairStatus={wheelchairStatus}
                  wheelchairMove={wheelchairMove}
                  className="w-full max-w-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
