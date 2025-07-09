import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  AlertTriangle,
  Camera,
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Eye,
  BarChart3,
  Zap,
  History,
  Clock,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";
import { useSidebarStore } from "@/store/sidebar-store.ts";
import { axios_login_instance } from "@/config/configuration.ts";

interface DetectionResult {
  id: number;
  imageUrl: string;
  confidence: number;
  userId: number;
  createTime: string;
  fall: number;
}

export function FallDetection() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>(
    [],
  );
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");

  const getUnconfirmedMessagesCount = useSidebarStore(
    (state) => state.getUnconfirmedMessagesCount,
  );

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 从检测结果中派生出统计数据，确保数据一致性
  const stats = useMemo(() => {
    if (!Array.isArray(detectionResults))
      return { totalDetections: 0, fallsDetected: 0 };
    const totalDetections = detectionResults.length;
    const fallsDetected = detectionResults.filter(
      (result) => result.fall,
    ).length;
    return {
      totalDetections,
      fallsDetected,
    };
  }, [detectionResults]);

  // 获取历史检测记录
  const fetchRecords = useCallback(async () => {
    try {
      const response = await axios_login_instance.get(`/image/list`);
      const responseData = response.data;
      console.log(responseData);
      if (
        responseData &&
        responseData.data &&
        Array.isArray(responseData.data.raw)
      ) {
        setDetectionResults(responseData.data.raw);
      } else {
        console.warn(
          "API for /image/list returned an unexpected structure.",
          responseData,
        );
        setDetectionResults([]);
      }
    } catch (error) {
      console.error("获取历史记录失败:", error);
      toast.error("获取历史记录失败");
      setDetectionResults([]);
    }
  }, []);

  // WebSocket连接管理
  const connectWebSocket = useCallback(() => {
    try {
      setConnectionStatus("connecting");
      const wsUrl = "ws://123.60.80.170:9998";
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("WebSocket连接已建立");
        setIsConnected(true);
        setConnectionStatus("connected");
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "image" && data.imageData) {
            // 接收到图片数据
            const imageUrl = `data:image/jpeg;base64,${data.imageData}`;
            setCurrentImage(imageUrl);
            // 调用摔倒检测API
            await processImage(imageUrl);
          }
        } catch (error) {
          console.error("处理WebSocket消息时出错:", error);
        }
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket连接已关闭");
        setIsConnected(false);
        setConnectionStatus("disconnected");
        // 自动重连
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket错误:", error);
        setIsConnected(false);
        setConnectionStatus("disconnected");
      };
    } catch (error) {
      console.error("创建WebSocket连接时出错:", error);
      setConnectionStatus("disconnected");
    }
  }, []);

  // 处理图片并调用检测API
  const processImage = async (imageUrl: string) => {
    setIsProcessing(true);
    try {
      const response = await axios.post(
        `https://yunwu.ai/v1/chat/completions`,
        {
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `图中是否有人疑似摔倒？有多大可能性？请以按照下述的类似格式进行回复，0为否，1为是，score为置信度，不要有多余字符：{"result":0或1,score:0.9}`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl,
                  },
                },
              ],
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer sk-Y6UEOEBzwO0q1TYEWVjv40d9LIl51f2qYvvDcP4qPknNdw2J`,
            "Content-Type": "application/json",
          },
        },
      );

      const content = response.data.choices[0].message.content;
      const fixedContent = content.replace(/(\w+):/g, '"$1":');
      const parsedContent = JSON.parse(fixedContent);
      const result = parsedContent.result; // 0或1
      const score = parsedContent.score; // 置信度，比如0.9

      if (result === 1) {
        toast.warning(`检测到疑似摔倒！置信度: ${(score * 100).toFixed(1)}%`);
        await axios_login_instance.post("/message/add", {
          title: "摔倒检测模块警告",
          content: "检测到疑似摔倒！请注意！",
          type: 1,
        });
        await getUnconfirmedMessagesCount();
      }

      // 持久化到后端
      await axios_login_instance.post(`/image/add`, {
        imageUrl: imageUrl,
        fall: result,
        confidence: score,
      });

      await fetchRecords();
    } catch (error) {
      console.error("处理图片时出错:", error);
      toast.error("图像处理或API调用失败");
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteImage = async (imageId: number) => {
    // 增加用户确认步骤
    if (!window.confirm("您确定要删除这条历史记录吗？此操作无法撤销。")) {
      return;
    }
    try {
      await axios_login_instance.post(`/image/delete?id=${imageId}`);
      toast.success("记录删除成功");
      // 删除成功后，重新获取数据以更新UI
      await fetchRecords();
    } catch (error) {
      console.error("删除记录失败:", error);
      toast.error("删除记录失败，请稍后重试");
    }
  };

  useEffect(() => {
    fetchRecords();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket, fetchRecords]);

  // 获取连接状态对应的样式
  const getConnectionStatusStyle = () => {
    switch (connectionStatus) {
      case "connected":
        return {
          color: "text-emerald-600",
          bgColor: "bg-gradient-to-br from-emerald-50 to-green-100",
          borderColor: "border-emerald-200",
          icon: <Wifi className="h-5 w-5" />,
          text: "已连接",
          pulse: false,
        };
      case "connecting":
        return {
          color: "text-amber-600",
          bgColor: "bg-gradient-to-br from-amber-50 to-yellow-100",
          borderColor: "border-amber-200",
          icon: <Wifi className="h-5 w-5 animate-pulse" />,
          text: "连接中",
          pulse: true,
        };
      default:
        return {
          color: "text-red-600",
          bgColor: "bg-gradient-to-br from-red-50 to-rose-100",
          borderColor: "border-red-200",
          icon: <WifiOff className="h-5 w-5" />,
          text: "已断开",
          pulse: false,
        };
    }
  };

  const connectionStyle = getConnectionStatusStyle();
  const latestResult = detectionResults[0] ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* 状态卡片 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* 连接状态卡片 */}
          <Card
            className={cn(
              "group overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
              connectionStyle.borderColor,
            )}
          >
            <CardHeader className={cn("pb-3", connectionStyle.bgColor)}>
              <div className="flex items-center justify-between">
                <CardTitle
                  className={cn("text-sm font-semibold", connectionStyle.color)}
                >
                  连接状态
                </CardTitle>
                <div
                  className={cn(
                    "rounded-full p-2",
                    connectionStyle.pulse && "animate-pulse",
                  )}
                >
                  {connectionStyle.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className={cn("text-3xl font-bold", connectionStyle.color)}>
                {connectionStyle.text}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {isConnected ? "实时数据流在线" : "尝试自动重连中"}
              </p>
              <div className="mt-3 h-1 w-full rounded-full bg-slate-200">
                <div
                  className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    isConnected
                      ? "w-full bg-emerald-500"
                      : "w-1/3 bg-amber-500 animate-pulse",
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 检测状态卡片 */}
          <Card className="group overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-br from-blue-50 to-cyan-100 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-blue-600">
                  检测状态
                </CardTitle>
                <div
                  className={cn(
                    "rounded-full p-2",
                    isProcessing && "animate-spin",
                  )}
                >
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-blue-600">
                {isProcessing ? "分析中" : "待机中"}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {isProcessing ? "正在分析图像..." : "等待新图像"}
              </p>
              {isProcessing && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-slate-200">
                    <div className="h-2 w-2/3 animate-pulse rounded-full bg-blue-500" />
                  </div>
                  <Activity className="h-4 w-4 animate-spin text-blue-500" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 总检测卡片 */}
          <Card className="group overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-br from-purple-50 to-violet-100 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-purple-600">
                  总检测
                </CardTitle>
                <div className="rounded-full p-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-purple-600">
                {stats.totalDetections}
              </div>
              <p className="mt-1 text-sm text-slate-500">历史累计检测次数</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-slate-200">
                  <div className="h-2 w-full rounded-full bg-gradient-to-r from-purple-400 to-violet-500" />
                </div>
                <span className="text-xs font-medium text-purple-600">
                  100%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 摔倒警报卡片 */}
          <Card className="group overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-br from-red-50 to-rose-100 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-red-600">
                  摔倒警报
                </CardTitle>
                <div
                  className={cn(
                    "rounded-full p-2",
                    stats.fallsDetected > 0 && "animate-pulse",
                  )}
                >
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-red-600">
                {stats.fallsDetected}
              </div>
              <p className="mt-1 text-sm text-slate-500">历史累计警报次数</p>
              {stats.fallsDetected > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-red-400 to-rose-500"
                      style={{
                        width: `${Math.min(100, (stats.fallsDetected / stats.totalDetections) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-red-600">
                    {(
                      (stats.fallsDetected / stats.totalDetections) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 主要内容区域 */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* 实时监控 */}
          <Card className="overflow-hidden border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="rounded-full bg-green-100 p-2">
                  <Camera className="h-6 w-6 text-green-600" />
                </div>
                实时监控
              </CardTitle>
              <CardDescription className="text-base">
                从服务器接收的最新一帧画面
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-gray-100 shadow-inner">
                {currentImage ? (
                  <img
                    src={currentImage || "/placeholder.svg"}
                    alt="监控画面"
                    className="h-full w-full object-cover transition-all duration-300"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-center text-slate-500">
                    <div className="rounded-full bg-slate-200 p-6">
                      <Camera className="h-16 w-16" />
                    </div>
                    <p className="mt-4 text-lg font-medium">等待图像数据...</p>
                    <p className="text-sm">
                      系统正在等待来自监控设备的实时画面
                    </p>
                  </div>
                )}
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/70 text-white backdrop-blur-sm">
                    <div className="rounded-full bg-white/20 p-4">
                      <Activity className="h-12 w-12 animate-spin" />
                    </div>
                    <p className="mt-4 text-xl font-semibold">AI正在分析...</p>
                    <p className="text-sm opacity-80">
                      请稍候，正在进行摔倒检测
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full",
                      isConnected ? "bg-green-500 animate-pulse" : "bg-red-500",
                    )}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {isConnected ? "实时连接中" : "连接已断开"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={connectWebSocket}
                  disabled={connectionStatus === "connecting"}
                  className="transition-all duration-200 hover:scale-105 bg-transparent"
                >
                  {connectionStatus === "connecting" ? "连接中..." : "重新连接"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 检测信息 */}
          <Card className="overflow-hidden border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="rounded-full bg-blue-100 p-2">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                检测信息
              </CardTitle>
              <CardDescription className="text-base">
                实时监控和历史检测结果的综合展示
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="current" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-lg bg-slate-100 p-1">
                  <TabsTrigger
                    value="current"
                    className="flex items-center gap-2 rounded-md transition-all"
                  >
                    <Zap className="h-4 w-4" />
                    当前结果
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="flex items-center gap-2 rounded-md transition-all"
                  >
                    <History className="h-4 w-4" />
                    历史记录
                  </TabsTrigger>
                </TabsList>

                {/* 当前结果 Tab */}
                <TabsContent value="current" className="mt-6">
                  {latestResult ? (
                    <div className="space-y-6">
                      {/* 结果状态面板 */}
                      <div
                        className={cn(
                          "flex flex-col items-center justify-center gap-4 rounded-xl p-8 text-center transition-all duration-300",
                          latestResult.fall
                            ? "bg-gradient-to-br from-red-50 to-rose-100 text-red-700 shadow-lg shadow-red-100"
                            : "bg-gradient-to-br from-green-50 to-emerald-100 text-green-700 shadow-lg shadow-green-100",
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-full p-4",
                            latestResult.fall ? "bg-red-100" : "bg-green-100",
                          )}
                        >
                          {latestResult.fall ? (
                            <AlertTriangle className="h-16 w-16" />
                          ) : (
                            <CheckCircle className="h-16 w-16" />
                          )}
                        </div>
                        <div>
                          <p className="text-3xl font-bold">
                            {latestResult.fall ? "检测到摔倒" : "状态正常"}
                          </p>
                          <p className="mt-1 text-lg opacity-80">
                            {latestResult.fall
                              ? "系统已发出警报通知"
                              : "监控区域内一切正常"}
                          </p>
                        </div>
                      </div>

                      {/* 核心数据卡片 */}
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="border-0 bg-gradient-to-br from-purple-50 to-violet-100 shadow-lg">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-purple-600">
                                  置信度
                                </p>
                                <p className="text-3xl font-bold text-purple-700">
                                  {(latestResult.confidence * 100).toFixed(1)}%
                                </p>
                              </div>
                              <div className="rounded-full bg-purple-100 p-3">
                                <BarChart3 className="h-6 w-6 text-purple-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-100 shadow-lg">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-blue-600">
                                  检测时间
                                </p>
                                <p className="text-3xl font-bold text-blue-700">
                                  {new Date(
                                    latestResult.createTime,
                                  ).toLocaleTimeString("zh-CN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </p>
                              </div>
                              <div className="rounded-full bg-blue-100 p-3">
                                <Clock className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-4 text-center">
                        <p className="text-sm text-slate-600">
                          这是最近一次的AI检测分析结果
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-80 flex-col items-center justify-center text-center text-slate-500">
                      <div className="rounded-full bg-slate-100 p-8">
                        <Zap className="h-16 w-16" />
                      </div>
                      <p className="mt-4 text-xl font-medium">暂无检测结果</p>
                      <p className="text-sm">等待系统接收并分析第一张图像</p>
                    </div>
                  )}
                </TabsContent>

                {/* 历史记录 Tab */}
                <TabsContent
                  value="history"
                  className={cn(
                    "mt-6 h-96 overflow-y-auto pr-2",
                    detectionResults.length === 0 &&
                      "flex flex-col items-center justify-center",
                  )}
                >
                  {detectionResults.length > 0 ? (
                    <div className="space-y-3">
                      {detectionResults.map((result) => (
                        <div
                          key={result.id}
                          className={cn(
                            "group flex items-center justify-between rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]",
                            result.fall
                              ? "bg-gradient-to-r from-red-50 to-rose-100 shadow-md shadow-red-100 hover:shadow-lg hover:shadow-red-200"
                              : "bg-gradient-to-r from-slate-50 to-gray-100 shadow-md hover:shadow-lg",
                          )}
                        >
                          {/* 左侧信息 */}
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "rounded-full p-2",
                                result.fall ? "bg-red-100" : "bg-green-100",
                              )}
                            >
                              {result.fall ? (
                                <XCircle className="h-5 w-5 text-red-600" />
                              ) : (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">
                                {result.fall ? "摔倒警报" : "状态正常"}
                              </div>
                              <div className="text-sm text-slate-500">
                                {new Date(result.createTime).toLocaleString(
                                  "zh-CN",
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 右侧信息和操作 */}
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={
                                result.fall ? "destructive" : "secondary"
                              }
                              className="px-3 py-1 font-medium"
                            >
                              {(result.confidence * 100).toFixed(0)}%
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-full opacity-0 transition-all duration-200 hover:bg-red-100 hover:text-red-600 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteImage(result.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 mb-16">
                      <div className="mt-16">
                        <div className="rounded-full bg-slate-100 p-8">
                          <History className="mx-auto h-16 w-16" />
                        </div>
                        <p className="mt-4 text-xl font-medium">暂无历史记录</p>
                        <p className="text-sm">检测记录将在这里显示</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
