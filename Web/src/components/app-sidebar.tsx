import type * as React from "react";
import { useState, useEffect } from "react";
import {
  Activity,
  AlertCircle,
  ShipWheelIcon as Wheelchair,
  Volume2,
  Home,
  Bell,
  ChevronRight,
  Bot,
  LogOut,
  UserRoundX,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/store/sidebar-store.ts";
import { useUserStore } from "@/store/user-store.ts";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import { Sheet, SheetContent } from "@/components/ui/sheet.tsx";

// 菜单项配置
const menuItems = [
  {
    id: "home",
    label: "首页概览",
    icon: <Home className="text-indigo-500" />,
    path: "/",
    badge: null,
  },
  {
    id: "physiological",
    label: "生理监测",
    icon: <Activity className="text-emerald-500" />,
    path: "/physiological",
    badge: { text: "实时", variant: "success" },
  },
  {
    id: "intelligent",
    label: "智能分析",
    icon: <Bot className="text-purple-400" />,
    path: "/intelligent",
    badge: { text: "AI", variant: "success" },
  },
  {
    id: "emergency",
    label: "语音呼救",
    icon: <Volume2 className="text-red-500" />,
    path: "/emergency",
    badge: { text: "SOS", variant: "danger" },
  },
  {
    id: "fall-detection",
    label: "摔倒检测",
    icon: <UserRoundX className="text-orange-500" />,
    path: "/fall-detection",
    badge: { text: "守护", variant: "warning" },
  },
  {
    id: "wheelchair",
    label: "轮椅智控",
    icon: <Wheelchair className="text-blue-500" />,
    path: "/wheelchair",
    badge: { text: "新功能", variant: "default" },
  },
];

const SidebarInnerContent = () => {
  const location = useLocation();
  const [currentPath, setCurrentPath] = useState("/");
  const [time, setTime] = useState(new Date());

  const navigate = useNavigate();

  const unconfirmed_message_count = useSidebarStore(
    (state) => state.unconfirmed_message_count,
  );
  const getUnconfirmedMessagesCount = useSidebarStore(
    (state) => state.getUnconfirmedMessagesCount,
  );
  const userInfo = useUserStore((state) => state.userInfo);

  // 更新当前路径
  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname]);

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000); // 每分钟更新一次
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getUnconfirmedMessagesCount();
  }, [getUnconfirmedMessagesCount]);

  return (
    <>
      <SidebarHeader className="h-20 flex flex-col items-center justify-center border-b border-sidebar-border bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 py-2">
          <div className="relative">
            <AlertCircle className="h-7 w-7 text-rose-500" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-gradient-to-r from-rose-500 to-indigo-600 text-transparent bg-clip-text">
              智能养老看护
            </span>
            <span className="text-xs text-slate-500 -mt-1">
              {time.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 flex-col flex-grow">
        <div className="mb-6 px-2">
          <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-100">
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-blue-100 rounded-md">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 ">
                <Link to="/notifications">
                  <p className="text-xs text-blue-800 font-medium">
                    {unconfirmed_message_count
                      ? `您有 ${unconfirmed_message_count} 条通知待处理`
                      : "暂无通知，一切正常"}
                  </p>
                  <p className="text-[10px] text-blue-600 mt-0.5">
                    点击查看详情
                  </p>
                </Link>
              </div>
              <ChevronRight className="h-4 w-4 text-blue-400" />
            </div>
          </div>
        </div>

        <SidebarMenu className="flex-grow">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton asChild>
                <Link
                  to={item.path}
                  className={cn(
                    "group transition-all duration-200 hover:bg-slate-100",
                    currentPath === item.path && "bg-slate-100/80 font-medium",
                  )}
                >
                  <div className="relative">
                    {item.icon}
                    {currentPath === item.path && (
                      <span className="absolute -left-2 top-1/2 -translate-y-1/2 h-5 w-1 bg-gradient-to-b from-indigo-400 to-blue-600 rounded-r-full" />
                    )}
                  </div>
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant="outline" // 使用一个中性的 variant，让 className 完全控制样式
                      className={cn(
                        "ml-auto h-5 text-[10px] font-semibold tracking-wide rounded-full border px-2",
                        {
                          // 实时 (绿色系)
                          "bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5":
                            item.badge,
                          // 核心AI (紫色系)
                          "bg-purple-50 text-purple-700 border-purple-200":
                            item.badge.variant === "success",
                          // 新增: 紧急 (红色系)
                          "bg-rose-50 text-rose-700 border-rose-200":
                            item.badge.variant === "danger",
                          // 新增: 守护 (橙色系)
                          "bg-orange-50 text-orange-700 border-orange-200":
                            item.badge.variant === "warning",
                          // 默认 (蓝色系)
                          "bg-blue-50 text-blue-700 border-blue-200":
                            item.badge.variant === "default",
                        },
                      )}
                    >
                      <span>{item.badge.text}</span>
                    </Badge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <div className="mt-8 px-2">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            系统信息
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">系统状态</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-green-600">正常运行中</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">最近活动</span>
              <span className="text-slate-500">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="border-2 border-white shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                {userInfo?.username.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{userInfo?.username}</span>
              <span className="text-xs text-slate-500">用户</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full cursor-pointer"
            onClick={() => {
              localStorage.removeItem("access_token");
              navigate({ to: "/auth/login" });
            }}
          >
            <LogOut className="h-4 w-4 text-slate-500" />
          </Button>
        </div>
      </SidebarFooter>
    </>
  );
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isMobile = useIsMobile();
  const { isMobileOpen, toggleMobileOpen } = useSidebarStore();

  if (isMobile) {
    return (
      <Sheet open={isMobileOpen} onOpenChange={toggleMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SidebarInnerContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sidebar
      {...props}
      // 关键：默认隐藏(hidden)，在 md (768px) 及以上尺寸显示(md:flex)
      className="hidden md:flex bg-gradient-to-b from-slate-50 to-white border-r border-slate-200"
    >
      <SidebarInnerContent />
      <SidebarRail className="bg-white/80 backdrop-blur-sm" />
    </Sidebar>
  );
}
