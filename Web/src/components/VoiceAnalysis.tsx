import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Loader2, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { axios_login_instance } from "@/config/configuration.ts";
import { useSidebarStore } from "@/store/sidebar-store.ts";

interface VoiceAnalysisProps {
  text: string;
  className?: string;

  handleRefresh: () => void;
}

interface AnalysisResult {
  is_danger: number;
  confidence: number;
}

export const VoiceAnalysis: React.FC<VoiceAnalysisProps> = ({
  text,
  className,
  handleRefresh,
}) => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUnconfirmedMessagesCount = useSidebarStore(
    (state) => state.getUnconfirmedMessagesCount,
  );

  const addVoiceRecord = async (text: string, isDanger: number) => {
    const request = {
      text: text,
      isDanger: isDanger,
    };

    await axios_login_instance.post(`/voice/add`, request);
  };

  const analyzeText = async () => {
    if (!text) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios_login_instance.get(
        `/llm/analysis/danger?text=${encodeURIComponent(text)}`,
      );

      // 处理响应，去除多余字符
      let data = response.data.data;
      if (typeof data === "string") {
        // 去除可能的```json和```
        data = data.replace(/```json\n?/, "").replace(/```\n?/, "");
        data = JSON.parse(data);
      }
      setAnalysisResult(data);

      if (data.is_danger === 1) {
        toast.warning("检测到可能的呼救信息，请注意！");

        await axios_login_instance.post("/message/add", {
          title: "语音呼救模块警告",
          content: "检测到可能的呼救信息，请注意",
          type: 1,
        });
        await getUnconfirmedMessagesCount();
      } else {
        toast.success("一切正常，请安心！");
      }

      await addVoiceRecord(text, data.is_danger);

      handleRefresh();
    } catch (err) {
      console.error("分析失败:", err);
      setError("无法分析语音内容，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeText();
  }, [text]);

  // 计算危险等级
  const getDangerLevel = () => {
    if (!analysisResult) return null;

    const { is_danger, confidence } = analysisResult;

    if (is_danger === 1) {
      toast.warning("检测到可能的呼救信息，请注意！");
      if (confidence >= 0.7) return "high";
      if (confidence >= 0.4) return "medium";
      return "low";
    }
    return "safe";
  };

  const dangerLevel = getDangerLevel();

  return (
    <div className={cn("rounded-xl overflow-hidden shadow-lg", className)}>
      {/* 语音内容卡片 */}
      <div className="bg-white p-6 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-full">
            <Volume2 className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              语音识别内容
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              {text ? (
                <p className="text-gray-700">{text}</p>
              ) : (
                <p className="text-gray-400 italic">等待语音输入...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 分析结果卡片 */}
      <div className="bg-gray-50 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          安全分析结果
        </h3>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-500">正在分析语音内容...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 p-4 rounded-lg border border-red-100"
            >
              <p className="text-red-600 text-center">{error}</p>
            </motion.div>
          ) : analysisResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 危险等级指示器 */}
                <div
                  className={cn(
                    "p-5 rounded-lg border flex items-center gap-4",
                    dangerLevel === "safe"
                      ? "bg-green-50 border-green-100"
                      : dangerLevel === "low"
                        ? "bg-yellow-50 border-yellow-100"
                        : dangerLevel === "medium"
                          ? "bg-orange-50 border-orange-100"
                          : "bg-red-50 border-red-100",
                  )}
                >
                  <div
                    className={cn(
                      "p-3 rounded-full",
                      dangerLevel === "safe"
                        ? "bg-green-100"
                        : dangerLevel === "low"
                          ? "bg-yellow-100"
                          : dangerLevel === "medium"
                            ? "bg-orange-100"
                            : "bg-red-100",
                    )}
                  >
                    {dangerLevel === "safe" ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertTriangle
                        className={cn(
                          "h-6 w-6",
                          dangerLevel === "low"
                            ? "text-yellow-600"
                            : dangerLevel === "medium"
                              ? "text-orange-600"
                              : "text-red-600",
                        )}
                      />
                    )}
                  </div>
                  <div>
                    <h4
                      className={cn(
                        "font-semibold",
                        dangerLevel === "safe"
                          ? "text-green-800"
                          : dangerLevel === "low"
                            ? "text-yellow-800"
                            : dangerLevel === "medium"
                              ? "text-orange-800"
                              : "text-red-800",
                      )}
                    >
                      {dangerLevel === "safe"
                        ? "安全"
                        : dangerLevel === "low"
                          ? "低风险"
                          : dangerLevel === "medium"
                            ? "中等风险"
                            : "高风险"}
                    </h4>
                    <p
                      className={cn(
                        "text-sm",
                        dangerLevel === "safe"
                          ? "text-green-600"
                          : dangerLevel === "low"
                            ? "text-yellow-600"
                            : dangerLevel === "medium"
                              ? "text-orange-600"
                              : "text-red-600",
                      )}
                    >
                      {dangerLevel === "safe"
                        ? "未检测到危险信息"
                        : dangerLevel === "low"
                          ? "检测到潜在风险信息"
                          : dangerLevel === "medium"
                            ? "检测到明显风险信息"
                            : "检测到严重风险信息"}
                    </p>
                  </div>
                </div>

                {/* 置信度指示器 */}
                <div className="p-5 rounded-lg border border-gray-200 bg-white">
                  <h4 className="text-gray-700 font-semibold mb-2">
                    分析置信度
                  </h4>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">置信度</span>
                      <span className="font-medium">
                        {dangerLevel === "safe"
                          ? ((1 - analysisResult.confidence) * 100).toFixed(1)
                          : (analysisResult.confidence * 100).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full",
                          dangerLevel === "safe"
                            ? "bg-green-500"
                            : dangerLevel === "low"
                              ? "bg-yellow-500"
                              : dangerLevel === "medium"
                                ? "bg-orange-500"
                                : "bg-red-500",
                        )}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            dangerLevel === "safe"
                              ? (1 - analysisResult.confidence) * 100
                              : analysisResult.confidence * 100
                          }%`,
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {analysisResult.is_danger === 1
                      ? "置信度越高表示系统越确信存在危险"
                      : "置信度越高表示系统越确信内容安全"}
                  </p>
                </div>
              </div>

              {/* 紧急响应建议 */}
              {analysisResult.is_danger === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 p-4 rounded-lg bg-red-50 border border-red-100"
                >
                  <h4 className="text-red-800 font-semibold mb-2">
                    紧急响应建议
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• 立即联系紧急联系人</li>
                    <li>• 确认老人当前位置和状态</li>
                    <li>• 必要时拨打急救电话 (120)</li>
                    <li>• 保持通讯畅通，等待进一步指示</li>
                  </ul>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 text-gray-400"
            >
              <p>等待语音输入进行分析...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
