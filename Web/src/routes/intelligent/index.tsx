import { createFileRoute, redirect } from "@tanstack/react-router";
import { PhysiologicalHistoryTable } from "@/components/PhysiologicalHistoryTable";
import { HealthAnalysis } from "@/components/HealthAnalysis";
import { useUserStore } from "@/store/user-store.ts";

export const Route = createFileRoute("/intelligent/")({
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
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="grid grid-cols-1 gap-8">
          {/* 生理数据历史记录表格 */}
          <PhysiologicalHistoryTable />

          {/* 健康分析组件 */}
          <HealthAnalysis />
        </div>
      </div>
    </main>
  );
}
