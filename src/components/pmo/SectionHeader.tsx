import { cn } from "@/lib/utils";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ eyebrow, title, description, actions, className }: Props) {
  return (
    <header className={cn("flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between", className)}>
      <div className="space-y-1.5">
        {eyebrow && (
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}