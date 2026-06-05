import { cn } from "@/lib/utils";
import type { AchievementLevel } from "@/lib/types";

const LEVEL_CONFIG: Record<AchievementLevel, { label: string; className: string }> = {
  L1_SPROUT:  { label: "Sprout",  className: "badge-sprout"  },
  L2_RISING:  { label: "Rising",  className: "badge-rising"  },
  L3_TRUSTED: { label: "Trusted", className: "badge-trusted" },
  L4_ELITE:   { label: "Elite",   className: "badge-elite"   },
  L5_LEGEND:  { label: "Legend",  className: "badge-legend"  },
};

interface Props {
  level: AchievementLevel;
  size?: "sm" | "md";
  className?: string;
}

export function AchievementBadge({ level, size = "sm", className }: Props) {
  const config = LEVEL_CONFIG[level];
  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
