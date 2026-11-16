import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export function SystemAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <Card variant="solid" className="w-full mt-6 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-300 text-sm flex items-center gap-3 p-4 shadow-sm">
      <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
      <span>{message}</span>
    </Card>
  );
}
