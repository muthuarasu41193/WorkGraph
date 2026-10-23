import { cn } from "@/lib/utils";

type AnimatedNumberProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
  /** Accepted so existing call sites keep compiling. The value renders immediately. */
  immediate?: boolean;
};

function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

export function AnimatedNumber({
  value,
  suffix = "",
  prefix = "",
  className,
}: AnimatedNumberProps) {
  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {formatNumber(value)}
      {suffix}
    </span>
  );
}
