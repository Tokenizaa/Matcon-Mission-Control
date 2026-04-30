import { RoadmapPhase, roadmap } from "@/data/project";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhaseBadge, PriorityBadge } from "@/components/pmo/Badges";
import { Progress } from "@/components/ui/progress";
import { Calendar, ChevronRight } from "lucide-react";

export default function Roadmap() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Roadmap Estratégico"
        subtitle="Evolução da plataforma de V1 a V5"
      />

      <div className="space-y-4">
        {roadmap.map((phase: RoadmapPhase) => (
          <Card key={phase.phase} className="rounded-2xl shadow-soft overflow-hidden border-l-4" style={{ borderLeftColor: `hsl(var(--phase-${phase.phase}))` }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <PhaseBadge phase={phase.phase} />
                  <CardTitle className="text-xl">{phase.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{phase.timeline}</span>
                  <PriorityBadge p={phase.priority} className="ml-2" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold mb-2">Objetivo</p>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">"{phase.goal}"</p>
                  
                  <p className="text-sm font-semibold mt-4 mb-2">Impacto no Negócio</p>
                  <p className="text-sm text-muted-foreground">{phase.impact}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Módulos & Funcionalidades</p>
                  <div className="flex flex-wrap gap-1.5">
                    {phase.modules.map(m => (
                      <Badge key={m} variant="secondary" className="rounded-lg text-[11px] font-normal">
                        {m}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Complexidade</p>
                      <p className="text-sm">{phase.complexity}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Prioridade</p>
                      <p className="text-sm">{phase.priority}</p>
                    </div>
                  </div>
                </div>
              </div>

              {phase.dependencies.length > 0 && (
                <div className="pt-3 border-t flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Depende de:</span>
                  <div className="flex flex-wrap gap-2">
                    {phase.dependencies.map(d => (
                      <span key={d} className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" /> {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
