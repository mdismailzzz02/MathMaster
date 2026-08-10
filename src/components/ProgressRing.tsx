interface ProgressRingProps {
  percent: number;
  color: string;
  size?: number;
  stroke?: number;
}

export default function ProgressRing({
  percent,
  color,
  size = 56,
  stroke = 5,
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(Math.max(percent, 0), 100) / 100) * c;
  const half = size / 2;

  return (
    <svg
      width={size}
      height={size}
      className="-rotate-90 shrink-0"
      role="img"
      aria-label={`${Math.round(percent)}% mastered`}
    >
      {/* Background circle */}
      <circle
        cx={half}
        cy={half}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.15}
        strokeWidth={stroke}
      />
      {/* Progress arc */}
      <circle
        cx={half}
        cy={half}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}
