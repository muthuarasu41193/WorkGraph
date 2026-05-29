"use client";

type CircularProgressProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
};

export default function CircularProgress({
  value,
  size = 108,
  strokeWidth = 7,
  label,
  sublabel,
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="inline-flex flex-col items-center" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold tabular-nums tracking-tight text-foreground">
            {Math.round(clamped)}%
          </span>
          {label ? (
            <span className="mt-0.5 text-[11px] font-medium text-muted-foreground">{label}</span>
          ) : null}
        </div>
      </div>
      {sublabel ? (
        <p className="mt-2 max-w-[8rem] text-center text-xs text-muted-foreground">{sublabel}</p>
      ) : null}
    </div>
  );
}
