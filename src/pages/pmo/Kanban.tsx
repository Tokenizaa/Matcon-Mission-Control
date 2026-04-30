import { useMemo, useState } from "react";
import { SectionHeader } from "@/components/pmo/SectionHeader";
import { kanbanColumns, tasks as allTasks, type Track, type Priority } from "@/data/project";
import { ColumnDot, PhaseBadge, PriorityBadge, TrackBadge } from "@/components/pmo/Badges";
import { Input } from "@/components/ui/input";
import { AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";

const trackOptions: ("Todas" | Track)[] = ["Todas", "Frontend", "Backend", "Infra", "Banco", "Offline", "WhatsApp", "Financeiro", "OCR/XML", "IA", "DevOps", "UX/UI", "Produto"];
const prioOptions: ("Todas" | Priority)[] = ["Todas", "P0", "P1", "P2", "P3"];

export default function Kanban() {
  const [q, setQ] = useState("");
  const [track, setTrack] = useState<typeof trackOptions[number]>("Todas");
  const [prio, setPrio] = useState<typeof prioOptions[number]>("Todas");

  const filtered = useMemo(
    () =>
      allTasks.filter(
        (t) =>
          (track === "Todas" || t.track === track) &&
          (prio === "Todas" || t.priority === prio) &&
          (q.trim() === "" || (t.title + t.id).toLowerCase().includes(q.toLowerCase()))
      ),
    [q, track, prio]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        eyebrow="Kanban operacional"
        title="Fluxo do trabalho — backlog → produção"
        description="Distribuição real das tasks por coluna. Bloqueios sinalizados em vermelho."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar task..." className="h-8 w-44" />
            <FilterPill label="Trilha" value={track} options={trackOptions} onChange={(v) => setTrack(v as typeof trackOptions[number])} />
            <FilterPill label="Prioridade" value={prio} options={prioOptions} onChange={(v) => setPrio(v as typeof prioOptions[number])} />
          </div>
        }
      />

      <div className="scrollbar-thin overflow-x-auto pb-4">
        <div className="flex min-w-max gap-3">
          {kanbanColumns.map((col) => {
            const colTasks = filtered.filter((t) => t.column === col.id);
            return (
              <div key={col.id} className="w-[280px] shrink-0 rounded-xl border border-border bg-card/50">
                <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <ColumnDot col={col.id} />
                    <p className="text-[13px] font-semibold tracking-tight">{col.label}</p>
                  </div>
                  <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{colTasks.length}</span>
                </div>
                <p className="px-3 pb-2 pt-1 text-[10px] text-muted-foreground">{col.hint}</p>

                <div className="space-y-2 p-2">
                  {colTasks.length === 0 && (
                    <p className="px-2 py-6 text-center text-[11px] text-muted-foreground/70">Vazio</p>
                  )}
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      className={cn(
                        "group rounded-lg border border-border bg-card p-2.5 shadow-card transition hover:border-primary/40",
                        t.blocked && "border-[hsl(var(--prio-p0)/0.5)]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-muted-foreground">{t.id}</span>
                        <div className="flex items-center gap-1">
                          <PriorityBadge p={t.priority} />
                          <PhaseBadge phase={t.phase} />
                        </div>
                      </div>
                      <p className="mt-1.5 text-[13px] font-medium leading-snug">{t.title}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{t.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <TrackBadge track={t.track} />
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          {t.blocked && (
                            <span className="inline-flex items-center gap-0.5 text-[hsl(var(--prio-p0))]">
                              <AlertOctagon className="h-3 w-3" /> bloq
                            </span>
                          )}
                          <span className="font-mono">{t.effort}sp</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FilterPill<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-secondary px-1.5 py-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-transparent text-xs text-foreground outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-card">{o}</option>
        ))}
      </select>
    </div>
  );
}