import { 
  Rocket, 
  Map, 
  KanbanSquare, 
  ShieldAlert, 
  LayoutDashboard, 
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { executive, roadmap, tasks, risks, checklist } from "@/data/project";
import { cn } from "@/lib/utils";

export default function MissionControl() {
  const currentPhase = roadmap.find(p => p.phase === 1);
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => ["production", "monitoring"].includes(t.column)).length;
  const progress = Math.round((doneTasks / totalTasks) * 100);

  const activeWork = tasks.filter(t => ["in_progress", "review", "qa"].includes(t.column));
  const nextActions = tasks.filter(t => t.column === "ready").slice(0, 3);
  const blockers = tasks.filter(t => t.blocked);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Executivo */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
          <p className="text-muted-foreground mt-1">{executive.productName} · {executive.tagline}</p>
        </div>
        <div className="flex items-center gap-4 bg-card p-3 rounded-2xl border shadow-soft">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Status do Build</p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-semibold">V1 Operational</span>
            </div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Progresso</p>
            <div className="flex items-center gap-3">
              <Progress value={progress} className="w-20 h-2" />
              <span className="font-mono text-sm font-bold">{progress}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Saúde da Plataforma */}
        <Card className="md:col-span-2 rounded-2xl shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Saúde da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <HealthItem label="Auth / RLS" status="healthy" />
              <HealthItem label="Offline Sync" status="healthy" />
              <HealthItem label="WhatsApp API" status="warning" note="Cloud API pendente" />
              <HealthItem label="Pix Gateway" status="healthy" />
            </div>
          </CardContent>
        </Card>

        {/* Foco Atual */}
        <Card className="rounded-2xl shadow-soft bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Rocket className="h-4 w-4" /> The Wedge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm font-semibold italic">
              <span>WA</span> <ChevronRight className="h-3 w-3" />
              <span>Orc</span> <ChevronRight className="h-3 w-3" />
              <span className="text-primary underline">Pix</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 leading-tight">Foco total em conciliação automática via Webhook.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        {/* O que estamos fazendo */}
        <div className="md:col-span-8 space-y-6">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Trabalho Ativo</CardTitle>
              <Badge variant="secondary">{activeWork.length} itens</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeWork.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-all">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-1.5 h-8 rounded-full", task.column === "in_progress" ? "bg-blue-500" : "bg-purple-500")} />
                      <div>
                        <p className="text-sm font-semibold">{task.title}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{task.track} · {task.priority}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{task.column}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximas Ações & Riscos */}
        <div className="md:col-span-4 space-y-6">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader><CardTitle className="text-sm font-bold uppercase">Próximas Ações</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {nextActions.map(t => (
                <div key={t.id} className="group cursor-default">
                  <p className="text-xs font-semibold group-hover:text-primary transition-colors">{t.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{t.track} · {t.effort}sp</p>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-xs h-8 text-primary" asChild>
                <Link to="/pmo/kanban">Ver Kanban completo <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5 rounded-2xl shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Riscos Críticos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {risks.filter(r => r.impact === "Crítico").slice(0, 2).map(r => (
                <div key={r.id}>
                  <p className="text-xs font-bold text-destructive-foreground underline decoration-destructive/30">{r.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{r.mitigation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HealthItem({ label, status, note }: { label: string; status: "healthy" | "warning" | "error"; note?: string }) {
  const colors = { healthy: "bg-success text-success-foreground", warning: "bg-warning text-warning-foreground", error: "bg-destructive text-destructive-foreground" };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className={cn("h-2 w-2 rounded-full", status === "healthy" ? "bg-success" : status === "warning" ? "bg-warning" : "bg-destructive")} />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <Badge variant="outline" className={cn("text-[9px] py-0 font-normal opacity-80", status === "healthy" ? "border-success/30" : "border-warning/30")}>
        {status === "healthy" ? "DISPONÍVEL" : "ALERTA"}
      </Badge>
      {note && <p className="text-[9px] text-muted-foreground leading-tight">{note}</p>}
    </div>
  );
}

