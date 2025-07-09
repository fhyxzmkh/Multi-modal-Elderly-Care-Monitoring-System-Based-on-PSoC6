import { createRootRoute, Outlet, useMatchRoute } from "@tanstack/react-router";
import { SidebarProvider } from "@/components/ui/sidebar.tsx";
import { AppSidebar } from "@/components/app-sidebar.tsx";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Menu } from "lucide-react";
import { useSidebarStore } from "@/store/sidebar-store.ts";

const RootComponent = () => {
  const hideNavRoutes = ["/auth/login/", "/auth/register/", "/welcome", "/$"];

  const matchRoute = useMatchRoute();

  const toggleMobileOpen = useSidebarStore((state) => state.toggleMobileOpen);

  const matchedHideNavRoutes = hideNavRoutes.some((route) =>
    matchRoute({ to: route }),
  );

  if (matchedHideNavRoutes) {
    return (
      <>
        <Toaster />
        <Outlet />
      </>
    );
  } else {
    return (
      <>
        <div className="flex h-screen bg-slate-50">
          <div className="md:w-64">
            <SidebarProvider>
              <AppSidebar />
            </SidebarProvider>
          </div>
          <main className="flex-1 flex flex-col h-screen">
            <header className="md:hidden sticky top-0 z-40 flex items-center justify-between h-16 px-4 border-b bg-white/80 backdrop-blur-sm">
              {/* 左侧汉堡按钮 */}
              <Button variant="ghost" size="icon" onClick={toggleMobileOpen}>
                <Menu className="h-6 w-6" />
              </Button>

              {/* 中间标题文字 */}
              <div className="flex-1 text-center">
                <span
                  className="
        font-bold text-lg tracking-tight  // 加粗、增大字号、收紧字间距
        bg-gradient-to-r from-rose-500 to-indigo-600 text-transparent bg-clip-text // 复用品牌渐变色
      "
                >
                  AIoT - 智能养老看护平台
                </span>
              </div>

              {/* 右侧占位，确保中间标题完美居中 */}
              <div className="w-8 h-8"></div>
            </header>

            <Toaster />

            <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </>
    );
  }
};

export const Route = createRootRoute({
  component: RootComponent,
});
