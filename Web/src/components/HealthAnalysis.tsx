import React, { useState } from "react";
import { Loader2, AlertCircle, ActivitySquare } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Markdown from "react-markdown";
import { axios_login_instance } from "@/config/configuration.ts";

interface HealthAnalysisResponse {
  status: string;
  code: number;
  message: string;
  data: string;
}

export const HealthAnalysis: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios_login_instance.get<HealthAnalysisResponse>(
        "/llm/analysis/health",
      );

      if (response.data.status === "success") {
        setAnalysisResult(response.data.data);
      } else {
        setError(response.data.message || "获取健康分析失败");
      }
    } catch (err) {
      console.error("健康分析请求失败:", err);
      setError("无法连接到服务器，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">健康智能分析</h2>
        <Button
          onClick={handleAnalyze}
          disabled={loading}
          className={cn(
            "flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white",
            loading && "opacity-70 cursor-not-allowed",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>分析中...</span>
            </>
          ) : (
            <>
              <ActivitySquare className="h-4 w-4" />
              <span>开始分析</span>
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {analysisResult ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 rounded-lg p-5 border border-blue-100"
        >
          <div className="prose prose-blue max-w-none text-gray-700">
            <Markdown>{analysisResult}</Markdown>
          </div>
        </motion.div>
      ) : !loading && !error ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-gray-500">点击"开始分析"按钮开始智能健康分析</p>
        </div>
      ) : null}
    </div>
  );
};
