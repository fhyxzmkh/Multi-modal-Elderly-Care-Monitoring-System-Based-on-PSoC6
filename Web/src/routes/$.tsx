import { createFileRoute } from "@tanstack/react-router";
import { NotFound } from "@/components/not-found.tsx";

export const Route = createFileRoute("/$")({
  component: NotFound,
});
