import { Loader2 } from "lucide-react";

export default function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-foreground/60">{label}</p>
    </div>
  );
}
