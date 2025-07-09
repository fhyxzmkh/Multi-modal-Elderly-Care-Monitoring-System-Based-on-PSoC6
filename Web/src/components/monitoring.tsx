import { useState, useEffect } from "react";
import { Heart, MapPin, Activity, AlertCircle, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { axios_login_instance } from "@/config/configuration.ts";

interface ResponseType {
  heart_rate: number;
  target_distance: number;
  timestamp: string;
  target_bin: number;
  status: string;
}

export function Monitoring() {
  const [physiologicalData, setPhysiologicalData] = useState<ResponseType>();
  const [historyData, setHistoryData] = useState<
    Array<{ time: string; heartRate: number; distance: number }>
  >([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchData = async () => {
    try {
      // const resp = await axios.get("http://8.153.193.146:8000/target");

      // if (resp.data.heart_rate === null) {
      //   return;
      // }

      const resp = await axios_login_instance.get("/physiological/mock");

      setPhysiologicalData(resp.data.data);

      const now = new Date();
      setCurrentTime(now);
      setHistoryData((prev) => {
        // 确保数据存在并有效
        // const heartRate = resp.data?.heart_rate ?? 0;
        // const distance = resp.data?.target_distance ?? 0;

        const heartRate = resp.data?.data?.heart_rate ?? 0;
        const distance = resp.data?.data?.target_distance ?? 0;

        axios_login_instance.post(`/physiological/add`, {
          heartRate: heartRate,
          targetDistance: distance,
        });

        const newData = [
          ...prev,
          {
            time: `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`,
            heartRate: heartRate,
            distance: distance,
          },
        ];

        // 保持最近20条记录
        if (newData.length > 20) {
          return newData.slice(newData.length - 20);
        }
        return newData;
      });
    } catch (error) {
      console.error("获取数据失败:", error);
      // 错误处理，但不阻止组件渲染
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 2000);
    return () => clearInterval(intervalId);
  }, []);

  // 根据心率判断健康状态
  const getHeartRateStatus = (rate: number | undefined) => {
    // 处理 undefined 或 null 值
    if (rate === undefined || rate === null) {
      return {
        status: "无数据",
        color: "text-gray-500",
        bgColor: "bg-gray-100",
      };
    }

    if (rate < 60)
      return { status: "偏低", color: "text-blue-500", bgColor: "bg-blue-100" };
    if (rate > 100)
      return { status: "偏高", color: "text-red-500", bgColor: "bg-red-100" };
    return { status: "正常", color: "text-green-500", bgColor: "bg-green-100" };
  };

  // 根据距离判断位置状态
  const getDistanceStatus = (dist: number | undefined) => {
    // 处理 undefined 或 null 值
    if (dist === undefined || dist === null) {
      return {
        status: "无数据",
        color: "text-gray-500",
        bgColor: "bg-gray-100",
      };
    }

    if (dist < 1)
      return {
        status: "非常近",
        color: "text-green-500",
        bgColor: "bg-green-100",
      };
    if (dist < 3)
      return {
        status: "适中",
        color: "text-green-500",
        bgColor: "bg-green-100",
      };
    if (dist < 5)
      return {
        status: "较远",
        color: "text-yellow-500",
        bgColor: "bg-yellow-100",
      };
    return { status: "过远", color: "text-red-500", bgColor: "bg-red-100" };
  };

  const heartRateStatus = getHeartRateStatus(physiologicalData?.heart_rate);
  const distanceStatus = getDistanceStatus(physiologicalData?.target_distance);

  // 判断整体状态
  const getOverallStatus = () => {
    // 如果没有数据，返回无数据状态
    if (!physiologicalData) {
      return {
        status: "无数据",
        color: "text-gray-500",
        icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
      };
    }

    const heartRate = physiologicalData.heart_rate;
    const distance = physiologicalData.target_distance;

    // 检查值是否存在
    if (heartRate === undefined || distance === undefined) {
      return {
        status: "数据不完整",
        color: "text-gray-500",
        icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
      };
    }

    if (heartRate > 100 || heartRate < 60 || distance > 5) {
      return {
        status: "需要关注",
        color: "text-red-500",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      };
    }
    if (heartRate > 90 || heartRate < 65 || distance > 3) {
      return {
        status: "正常但需留意",
        color: "text-yellow-500",
        icon: <Activity className="h-5 w-5 text-yellow-500" />,
      };
    }
    return {
      status: "状态良好",
      color: "text-green-500",
      icon: <Activity className="h-5 w-5 text-green-500" />,
    };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 心率卡片 */}
        <Card className="overflow-hidden shadow-lg transition-all hover:shadow-xl">
          <CardHeader className={`${heartRateStatus.bgColor} pb-2`}>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" fill="currentColor" />
              心率监测
            </CardTitle>
            <CardDescription>实时心率数据</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold">
                {physiologicalData?.heart_rate !== undefined
                  ? physiologicalData.heart_rate.toFixed(2)
                  : "--"}
              </div>
              <div className="text-xl text-gray-500">BPM</div>
              <Badge className={heartRateStatus.color}>
                {heartRateStatus.status}
              </Badge>
            </div>
            <Progress
              value={
                physiologicalData?.heart_rate !== undefined
                  ? Math.min(100, (physiologicalData.heart_rate / 120) * 100)
                  : 0
              }
              className="mt-4 h-2"
            />
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>60</span>
              <span>80</span>
              <span>100</span>
              <span>120</span>
            </div>
          </CardContent>
        </Card>

        {/* 距离卡片 */}
        <Card className="overflow-hidden shadow-lg transition-all hover:shadow-xl">
          <CardHeader className={`${distanceStatus.bgColor} pb-2`}>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              距离监测
            </CardTitle>
            <CardDescription>设备与人员之间的距离</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold">
                {physiologicalData?.target_distance !== undefined
                  ? physiologicalData.target_distance.toFixed(2)
                  : "--"}
              </div>
              <div className="text-xl text-gray-500">米</div>
              <Badge className={distanceStatus.color}>
                {distanceStatus.status}
              </Badge>
            </div>
            <Progress
              value={
                physiologicalData?.target_distance !== undefined
                  ? Math.min(
                      100,
                      (physiologicalData.target_distance / 10) * 100,
                    )
                  : 0
              }
              className="mt-4 h-2"
            />
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>2.5</span>
              <span>5</span>
              <span>10</span>
            </div>
          </CardContent>
        </Card>

        {/* 状态总览卡片 */}
        <Card className="overflow-hidden shadow-lg transition-all hover:shadow-xl md:col-span-2 lg:col-span-1">
          <CardHeader className="bg-gray-50 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              状态总览
            </CardTitle>
            <CardDescription>当前健康与位置状态</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {overallStatus.icon}
                <span className={`text-xl font-medium ${overallStatus.color}`}>
                  {overallStatus.status}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{currentTime.toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-sm text-gray-500">心率状态</div>
                <div className={`text-lg font-medium ${heartRateStatus.color}`}>
                  {heartRateStatus.status}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-sm text-gray-500">位置状态</div>
                <div className={`text-lg font-medium ${distanceStatus.color}`}>
                  {distanceStatus.status}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 历史数据图表 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>历史数据趋势</CardTitle>
          <CardDescription>监测数据变化趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="heart-rate">
            <TabsList className="mb-4">
              <TabsTrigger value="heart-rate">心率趋势</TabsTrigger>
              <TabsTrigger value="distance">距离趋势</TabsTrigger>
              <TabsTrigger value="combined">综合趋势</TabsTrigger>
            </TabsList>
            <TabsContent value="heart-rate">
              <div className="h-[300px]">
                {historyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[50, 110]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="heartRate"
                        stroke="#ef4444"
                        name="心率"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="mx-auto h-10 w-10 text-gray-400" />
                      <p className="mt-2 text-gray-500">暂无心率数据</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="distance">
              <div className="h-[300px]">
                {historyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="distance"
                        stroke="#3b82f6"
                        name="距离"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-center">
                      <MapPin className="mx-auto h-10 w-10 text-gray-400" />
                      <p className="mt-2 text-gray-500">暂无距离数据</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="combined">
              <div className="h-[300px]">
                {historyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis yAxisId="left" domain={[50, 110]} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 10]}
                      />
                      <Tooltip />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="heartRate"
                        stroke="#ef4444"
                        name="心率"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="distance"
                        stroke="#3b82f6"
                        name="距离"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-center">
                      <Activity className="mx-auto h-10 w-10 text-gray-400" />
                      <p className="mt-2 text-gray-500">暂无监测数据</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
