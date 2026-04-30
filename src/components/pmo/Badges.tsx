import { cn } from "@/lib/utils";
import type { Priority, Phase, KanbanColumn, Track } from "@/data/project";

const prioStyles: Record<Priority, string> = {
  P0: "bg-[hsl(var(--prio-p0)/0.15)] text-[hsl(var(--prio-p0))] border-[hsl(var(--prio-p0)/0.4)]",
  P1: "bg-[hsl(var(--prio-p1)/0.15)] text-[hsl(var(--prio-p1))] border-[hsl(var(--prio-p1)/0.4)]",
  P2: "bg-[hsl(var(--prio-p2)/0.15)] text-[hsl(var(--prio-p2))] border-[hsl(var(--prio-p2)/0.4)]",
  P3: "bg-[hsl(var(--prio-p3)/0.15)] text-[hsl(var(--prio-p3))] border-[hsl(var(--prio-p3)/0.4)]",
};

export function PriorityBadge({ p, className }: { p: Priority; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wide", prioStyles[p], className)}>
      {p}
    </span>
  );
}

const phaseStyles: Record<Phase, string> = {
  1: "bg-[hsl(var(--phase-1)/0.15)] text-[hsl(var(--phase-1))] border-[hsl(var(--phase-1)/0.4)]",
  2: "bg-[hsl(var(--phase-2)/0.15)] text-[hsl(var(--phase-2))] border-[hsl(var(--phase-2)/0.4)]",
  3: "bg-[hsl(var(--phase-3)/0.15)] text-[hsl(var(--phase-3))] border-[hsl(var(--phase-3)/0.4)]",
  4: "bg-[hsl(var(--phase-4)/0.15)] text-[hsl(var(--phase-4))] border-[hsl(var(--phase-4)/0.4)]",
  5: "bg-[hsl(var(--phase-5)/0.15)] text-[hsl(var(--phase-5))] border-[hsl(var(--phase-5)/0.4)]",
};

export function PhaseBadge({ phase, className }: { phase: Phase; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-mono font-medium", phaseStyles[phase], className)}>
      V{phase}
    </span>
  );
}

export function TrackBadge({ track }: { track: Track }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      {track}
    </span>
  );
}

const columnDot: Record<KanbanColumn, string> = {
  backlog: "bg-[hsl(var(--status-backlog))]",
  refinement: "bg-[hsl(var(--status-todo))]",
  ready: "bg-[hsl(var(--status-todo))]",
  in_progress: "bg-[hsl(var(--status-progress))]",
  review: "bg-[hsl(var(--status-review))]",
  qa: "bg-[hsl(var(--status-qa))]",
  staging: "bg-[hsl(var(--status-staging))]",
  production: "bg-[hsl(var(--status-done))]",
  monitoring: "bg-[hsl(var(--status-done))]",
};

export function ColumnDot({ col }: { col: KanbanColumn }) {
  return <span className={cn("inline-block h-2 w-2 rounded-full", columnDot[col])} />;
}