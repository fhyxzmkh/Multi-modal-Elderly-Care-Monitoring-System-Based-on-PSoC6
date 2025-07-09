import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type WheelchairStatusType = "on" | "off";
export type WheelchairMoveType = "forward" | "retreat" | null;

interface SmartWheelchairProps {
  wheelchairStatus: WheelchairStatusType;
  wheelchairMove: WheelchairMoveType;
  className?: string;
}

export const SmartWheelchair: React.FC<SmartWheelchairProps> = ({
  wheelchairStatus,
  wheelchairMove,
  className,
}) => {
  // 移动状态
  const isMoving = wheelchairMove !== null;
  const moveDirection =
    wheelchairMove === "forward" ? 1 : wheelchairMove === "retreat" ? -1 : 0;

  return (
    <div className={cn("relative w-full max-w-md mx-auto", className)}>
      {/* 状态指示器 */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10 bg-black/20 backdrop-blur-sm p-2 rounded-full">
        <div
          className={cn(
            "w-3 h-3 rounded-full transition-colors duration-300",
            wheelchairStatus === "on" ? "bg-green-400" : "bg-red-400"
          )}
        />
        <span className="text-xs font-medium text-white">
          {wheelchairStatus === "on" ? "已启动" : "已关闭"}
        </span>
      </div>

      {/* 轮椅主体 - 使用emoji */}
      <div className="relative w-full aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden shadow-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* 地板纹理 */}
          <div
            className="absolute inset-0 bg-repeat"
            style={{
              backgroundImage:
                "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwIGg0MCB2NDAgaC00MCB2LTQwIiBmaWxsPSIjZjFmNWY5Ii8+PHBhdGggZD0iTTAgMCBoMjAgdjIwIGgtMjAgdi0yMCIgZmlsbD0iI2U2ZWRmNSIvPjxwYXRoIGQ9Ik0yMCAyMCBoMjAgdjIwIGgtMjAgdi0yMCIgZmlsbD0iI2U2ZWRmNSIvPjwvc3ZnPg==')",
            }}
          ></div>
          
          {/* 轮椅emoji */}
          <motion.div
            className="relative"
            animate={{
              x: isMoving ? moveDirection * 100 : 0,
              scale: wheelchairStatus === "on" ? 1 : 0.8,
              opacity: wheelchairStatus === "on" ? 1 : 0.6,
            }}
            transition={{
              x: {
                repeat: isMoving ? Infinity : 0,
                repeatType: "mirror",
                duration: 2.5,
                ease: "easeInOut",
              },
              scale: {
                duration: 0.5,
              },
              opacity: {
                duration: 0.5,
              }
            }}
          >
            <div className="text-[120px] filter drop-shadow-lg">
              ♿
            </div>
            
            {/* 状态效果 - 光环 */}
            {wheelchairStatus === "on" && (
              <motion.div 
                className="absolute -inset-4 rounded-full border-4 border-blue-400"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 0.7, 0],
                  scale: [0.8, 1.1, 0.8],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                }}
              />
            )}
          </motion.div>
        </div>

        {/* 移动指示器 */}
        {isMoving && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-xs font-medium text-white">
                {wheelchairMove === "forward" ? "前进中" : "后退中"}
              </span>
            </div>
          </div>
        )}

        {/* 状态效果 */}
        {wheelchairStatus === "on" ? (
          <div className="absolute top-4 left-4 flex items-center gap-1 z-10 bg-black/20 backdrop-blur-sm p-1.5 rounded-full">
            <motion.div
              className="w-6 h-3 bg-green-400 rounded-sm relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-green-600"
                animate={{ width: ["100%", "60%", "100%"] }}
                transition={{
                  repeat: Infinity,
                  duration: 8,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
            <span className="text-[10px] font-medium text-white">电量</span>
          </div>
        ) : (
          <div className="absolute top-4 left-4 flex items-center gap-1 z-10 bg-black/20 backdrop-blur-sm p-1.5 rounded-full">
            <div className="w-6 h-3 bg-red-400 rounded-sm" />
            <span className="text-[10px] font-medium text-white">已关闭</span>
          </div>
        )}
      </div>
    </div>
  );
};
