import { SectionHeader } from "@/components/pmo/SectionHeader";
import { checklist } from "@/data/project";
import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Checklist() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setDone((d) => ({ ...d, [k]: !d[k] }));

  const allItems = Object.values(checklist).flat();
  const completed = allItems.filter((i) => done[i]).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader
        eyebrow="Checklist final"
        title="Definition of Done — produto, eng, UX, arquitetura, segurança"
        description="Marque conforme o time evolui. Use como gate de release."
        actions={
          <span className="rounded-md border border-border bg-secondary px-2 py-1 font-mono text-[11px]">
            {completed} / {allItems.length}
          </span>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(checklist).map(([cat, items]) => (
          <section key={cat} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <h3 className="text-sm font-semibold tracking-tight">{cat}</h3>
            <ul className="mt-3 space-y-1.5">
              {items.map((it) => {
                const checked = !!done[it];
                return (
                  <li key={it}>
                    <button
                      onClick={() => toggle(it)}
                      className="flex w-full items-start gap-2 rounded-md p-1.5 text-left transition hover:bg-secondary/50"
                    >
                      <span className={cn("mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border border-border", checked && "border-primary bg-primary text-primary-foreground")}>
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      <span className={cn("text-[13px]", checked && "text-muted-foreground line-through")}>{it}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-sm font-semibold tracking-tight">Execução realista — agora</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-[hsl(var(--status-done)/0.4)] bg-[hsl(var(--status-done)/0.08)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--status-done))]">Faça</p>
            <ul className="mt-2 space-y-1 text-[12px]">
              <li>↳ Foque no fluxo WhatsApp → Pix</li>
              <li>↳ Cobre SaaS desde V1</li>
              <li>↳ 3 entrevistas de lojista por semana</li>
              <li>↳ Multi-tenant com RLS desde dia 1</li>
            </ul>
          </div>
          <div className="rounded-md border border-[hsl(var(--prio-p0)/0.4)] bg-[hsl(var(--prio-p0)/0.08)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--prio-p0))]">Não faça</p>
            <ul className="mt-2 space-y-1 text-[12px]">
              <li>↳ Emissão fiscal completa cedo</li>
              <li>↳ BI/contabilidade/RH no MVP</li>
              <li>↳ Marketplace ou app representante agora</li>
              <li>↳ Parametrização excessiva</li>
            </ul>
          </div>
          <div className="rounded-md border border-[hsl(var(--prio-p1)/0.4)] bg-[hsl(var(--prio-p1)/0.08)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--prio-p1))]">Pode destruir</p>
            <ul className="mt-2 space-y-1 text-[12px]">
              <li>↳ Virar "mais um ERP"</li>
              <li>↳ Sync engine mal feita corromper dados</li>
              <li>↳ Lançar V4 financeiro sem volume V1+V2</li>
              <li>↳ Hire ruim de Tech Lead</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}