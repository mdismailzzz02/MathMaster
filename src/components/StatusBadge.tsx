interface StatusBadgeProps {
  status: "not_started" | "in_progress" | "mastered";
}

const STATUS_STYLES: Record<
  StatusBadgeProps["status"],
  { label: string; classes: string }
> = {
  not_started: {
    label: "Not Started",
    classes: "bg-muted text-foreground/50",
  },
  in_progress: {
    label: "In Progress",
    classes: "bg-yellow-100 text-yellow-700",
  },
  mastered: {
    label: "Mastered",
    classes: "bg-green-100 text-green-700",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.classes}`}
    >
      {s.label}
    </span>
  );
}
