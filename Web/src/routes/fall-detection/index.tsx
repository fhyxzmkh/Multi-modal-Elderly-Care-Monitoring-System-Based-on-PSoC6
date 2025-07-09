import { createFileRoute, redirect } from "@tanstack/react-router";
import { FallDetection } from "@/components/FallDetection.tsx";
import { useUserStore } from "@/store/user-store.ts";

export const Route = createFileRoute("/fall-detection/")({
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
    <main className="min-h-screen bg-gradient-to-b from-red-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <FallDetection />
      </div>
    </main>
  );
}
