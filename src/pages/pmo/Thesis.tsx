import { SectionHeader } from "@/components/pmo/SectionHeader";
import {
  mvpBoundary,
  mvpScreens,
  executionSteps,
  operationalFlows,
  gtm,
  principles,
  monthlyPlan,
  eventsMVP,
  executive,
} from "@/data/project";
import { Check, X, ArrowRight, ShieldAlert } from "lucide-react";

export default function Thesis() {
  return (
    <div className="space-y-10 animate-fade-in">
      <SectionHeader
        eyebrow="Tese oficial"
        title="Compatibilização com o documento estratégico"
        description="MVP boundary, telas, etapas de execução, fluxos operacionais, GTM e princípios — exatamente como definidos na tese."
      />

      {/* Wedge */}
      <section className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 to-card p-5 shadow-card">
        <p className="font-mono text-[10px] uppercase tracking-wider text-primary">Wedge oficial</p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight">
          Transformar WhatsApp em operação comercial automatizada
        </h3>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {["Cliente", "WhatsApp", "Orçamento", "Pedido", "Cobrança", "Separação", "Entrega", "Recompra"].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-2">
              <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[12px] text-foreground">{s}</span>
              {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            </span>
          ))}
        </p>
      </section>

      {/* MVP Boundary */}
      <section>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">MVP Boundary</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[hsl(var(--status-done)/0.4)] bg-[hsl(var(--status-done)/0.06)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--status-done))]">Inclui no MVP</p>
            <ul className="mt-3 space-y-1.5 text-[13px]">
              {mvpBoundary.inclui.map((i) => (
                <li key={i} className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--status-done))]" /><span>{i}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-[hsl(var(--prio-p0)/0.4)] bg-[hsl(var(--prio-p0)/0.06)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--prio-p0))]">NÃO entra agora</p>
            <ul className="mt-3 space-y-1.5 text-[13px]">
              {mvpBoundary.exclui.map((i) => (
                <li key={i} className="flex items-start gap-2"><X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--prio-p0))]" /><span>{i}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 9 Etapas */}
      <section>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">Ordem real de execução — 9 etapas</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {executionSteps.map((s) => (
            <div key={s.n} className="flex gap-3 rounded-lg border border-border bg-card p-3 shadow-card">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-secondary font-mono text-xs font-semibold">
                {s.n}
              </div>
              <div>
                <p className="text-[13px] font-semibold tracking-tight">{s.title}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">{s.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Telas MVP */}
      <section>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">Telas do MVP (7)</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {mvpScreens.map((t) => (
            <div key={t.n} className="rounded-lg border border-border bg-card p-3 shadow-card">
              <p className="font-mono text-[10px] text-muted-foreground">Tela {t.n}</p>
              <p className="text-[13px] font-semibold tracking-tight">{t.name}</p>
              {t.items.length > 0 && (
                <ul className="mt-1.5 flex flex-wrap gap-1">
                  {t.items.map((i) => <li key={i} className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px]">{i}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Fluxos operacionais */}
      <section>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">Fluxos operacionais</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {operationalFlows.map((f) => (
            <div
              key={f.name}
              className="rounded-xl border bg-card p-4 shadow-card"
              style={{
                borderColor: `hsl(var(--${f.color}) / 0.4)`,
                background: `linear-gradient(135deg, hsl(var(--${f.color}) / 0.06), hsl(var(--card)))`,
              }}
            >
              <p className="text-sm font-semibold tracking-tight" style={{ color: `hsl(var(--${f.color}))` }}>
                Fluxo {f.name}
              </p>
              <div className="mt-3 grid gap-2 text-[12px]">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Entradas</p>
                  <p className="mt-0.5">{f.inputs.join(" · ")}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Sistema</p>
                  <ul className="mt-0.5 space-y-0.5">
                    {f.actions.map((a) => <li key={a}>↳ {a}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Arquitetura de Webhooks */}
      <section className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
        <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" /> Arquitetura de Eventos (Webhooks)
        </h3>
        <div className="mt-4 grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-blue-600">1. WhatsApp &rarr; Edge</p>
            <p className="text-[11px] leading-relaxed">
              O WhatsApp envia um POST para uma <strong>Supabase Edge Function</strong>. 
              Ela autentica o payload e insere o evento na tabela de <code className="bg-blue-100 px-1 font-mono text-blue-800">wa_messages</code>.
            </p>
          </div>
          <div className="space-y-2 border-l border-blue-200 pl-6">
            <p className="text-xs font-bold uppercase text-blue-600">2. Postgres Trigger</p>
            <p className="text-[11px] leading-relaxed">
              Um trigger no Postgres dispara uma lógica de <strong>Business Intelligence</strong> que identifica se é um orçamento ou confirmação de pagamento.
            </p>
          </div>
          <div className="space-y-2 border-l border-blue-200 pl-6">
            <p className="text-xs font-bold uppercase text-blue-600">3. Pix &rarr; Plataforma</p>
            <p className="text-[11px] leading-relaxed">
              Ao confirmar o Pix via Webhook do banco, o sistema atualiza o status do <strong>Pedido</strong> e notifica o vendedor via log de Auditoria.
            </p>
          </div>
        </div>
      </section>

      {/* Eventos MVP */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-card">
        <h3 className="text-sm font-semibold tracking-tight">Eventos iniciais MVP (Etapa 4)</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">Append-only · idempotentes · base para sync, IA, analytics, auditoria.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {eventsMVP.map((e) => (
            <span key={e} className="rounded-md border border-border bg-secondary/60 px-2 py-1 font-mono text-[11px] text-accent">{e}</span>
          ))}
        </div>
      </section>

      {/* Cronograma macro */}
      <section>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">Cronograma macro (Etapa 9)</h3>
        <div className="grid gap-2 md:grid-cols-4">
          {monthlyPlan.map((m) => (
            <div key={m.month} className="rounded-lg border border-border bg-card p-3 shadow-card">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{m.month}</p>
              <p className="text-[13px] font-semibold tracking-tight">{m.theme}</p>
              <ul className="mt-1.5 space-y-0.5 text-[12px] text-muted-foreground">
                {m.items.map((i) => <li key={i}>↳ {i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* GTM */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">GTM — estratégia principal</p>
          <h3 className="mt-1 text-base font-semibold tracking-tight">{gtm.strategy}</h3>
          <p className="mt-2 text-[12px] text-muted-foreground">Canais oficiais:</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {gtm.channels.map((c) => <li key={c} className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px]">{c}</li>)}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Estratégia de crescimento</p>
          <ol className="mt-2 space-y-2">
            {gtm.growth.map((g) => (
              <li key={g.etapa} className="flex gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border bg-secondary font-mono text-[10px]">{g.etapa}</span>
                <div>
                  <p className="text-[13px] font-semibold tracking-tight">{g.title}</p>
                  <p className="text-[11px] text-muted-foreground">{g.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Princípios */}
      <section>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">7 Princípios fundamentais</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((p) => (
            <div key={p.title} className="rounded-lg border border-border bg-card p-3 shadow-card">
              <p className="text-[13px] font-semibold tracking-tight text-primary">{p.title}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Definição final */}
      <section className="rounded-xl border border-accent/40 bg-gradient-to-br from-accent/10 to-card p-6 text-center shadow-card">
        <p className="font-mono text-[10px] uppercase tracking-wider text-accent">Definição final</p>
        <p className="mt-2 text-base text-muted-foreground">
          {executive.productName} não é um ERP. É
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">
          a infraestrutura operacional do varejo pulverizado brasileiro
        </h3>
      </section>
    </div>
  );
}
