// Dados do projeto Matcon — Sistema operacional do varejo pulverizado.
// Tudo em um único módulo para alimentar todas as views do PMO.

export type Phase = 1 | 2 | 3 | 4 | 5;
export type Priority = "P0" | "P1" | "P2" | "P3";
export type KanbanColumn =
  | "backlog"
  | "refinement"
  | "ready"
  | "in_progress"
  | "review"
  | "qa"
  | "staging"
  | "production"
  | "monitoring";

export type Track =
  | "Frontend"
  | "Backend"
  | "Infra"
  | "Banco"
  | "Offline"
  | "WhatsApp"
  | "Financeiro"
  | "OCR/XML"
  | "IA"
  | "DevOps"
  | "UX/UI"
  | "Produto";

export interface Task {
  id: string;
  title: string;
  description: string;
  track: Track;
  priority: Priority;
  effort: 1 | 2 | 3 | 5 | 8 | 13; // story points
  impact: 1 | 2 | 3 | 4 | 5;
  column: KanbanColumn;
  phase: Phase;
  sprint?: number;
  dependencies?: string[];
  blocked?: boolean;
  assignee?: string;
}

export interface RoadmapPhase {
  phase: Phase;
  code: string;
  name: string;
  goal: string;
  modules: string[];
  impact: string;
  complexity: "Baixa" | "Média" | "Alta" | "Muito Alta";
  priority: Priority;
  dependencies: string[];
  timeline: string;
}

export interface WeekPlan {
  week: number;
  month: 1 | 2 | 3;
  theme: string;
  tasks: string[];
  deliverables: string[];
  owner: string;
  risks: string[];
}

export interface Sprint {
  number: number;
  name: string;
  dates: string;
  goal: string;
  deliverables: string[];
  acceptance: string[];
  metrics: string[];
  risks: string[];
}

export interface Risk {
  id: string;
  title: string;
  category: "Técnico" | "Operacional" | "Financeiro" | "Adoção" | "Arquitetura";
  probability: "Baixa" | "Média" | "Alta";
  impact: "Baixo" | "Médio" | "Alto" | "Crítico";
  mitigation: string;
}

export interface Metric {
  name: string;
  category: "North Star" | "Produto" | "Operacional" | "Financeiro" | "Retenção" | "Ativação";
  target: string;
  description: string;
}

export interface CalendarEvent {
  date: string; // ISO
  title: string;
  type: "release" | "milestone" | "deploy" | "validacao" | "entrevista" | "checkpoint" | "teste";
  description: string;
}

export interface TeamRole {
  role: string;
  seniority: string;
  hireOrder: number;
  responsibilities: string[];
  phase: Phase;
}

export interface BacklogGroup {
  track: Track;
  items: { title: string; priority: Priority; effort: number; impact: number; deps?: string }[];
}

// ─────────────────────────────────────────────────────────────────
// VISÃO EXECUTIVA
// ─────────────────────────────────────────────────────────────────
export const executive = {
  productName: "Matcon SaaS",
  tagline: "Do WhatsApp ao Pix: O 'Wedge' de Vendas para Material de Construção.",
  goal: "Dominar o balcão da loja de material de construção via WhatsApp, eliminando a burocracia do ERP tradicional no momento da venda.",
  target: "Lojistas de Construção Civil (Pequeno e Médio porte).",
  status: "Arquitetura Definida (Supabase)",
  stack: "React + Tailwind + Supabase (Postgres/RLS/Edge Functions)",
};

// ─────────────────────────────────────────────────────────────────
// ROADMAP V1 → V5
// ─────────────────────────────────────────────────────────────────
export const roadmap: RoadmapPhase[] = [
  {
    phase: 1,
    code: "V1",
    name: "Operational Entry — MVP",
    goal: "Entrar no fluxo diário do lojista via WhatsApp.",
    modules: ["WhatsApp link", "Orçamento", "Pedido", "Cliente", "Cobrança Pix", "Catálogo simples"],
    impact: "Lojista abre o app todos os dias. Retenção operacional D1.",
    complexity: "Média",
    priority: "P0",
    dependencies: ["Auth multi-tenant", "Schema base", "Pix gateway"],
    timeline: "Mês 1–3",
  },
  {
    phase: 2,
    code: "V2",
    name: "Operational Control",
    goal: "Estoque, OCR/XML, reposição, entrega, dashboard operacional.",
    modules: ["Estoque", "OCR NFe", "Importação XML", "Reposição", "Entrega", "Dashboard"],
    impact: "Reduz ruptura e retrabalho. Aumenta margem.",
    complexity: "Alta",
    priority: "P1",
    dependencies: ["V1 estável", "Event store", "Worker queue"],
    timeline: "Mês 4–6",
  },
  {
    phase: 3,
    code: "V3",
    name: "AI Layer",
    goal: "IA comercial, copiloto de balcão, previsão, recomendação.",
    modules: ["Copiloto balcão", "Previsão ruptura", "Recomendação mix", "Score recompra"],
    impact: "Aumenta ticket médio e converte mais orçamentos.",
    complexity: "Alta",
    priority: "P2",
    dependencies: ["V2 com dados consolidados", "Telemetria de eventos"],
    timeline: "Mês 7–9",
  },
  {
    phase: 4,
    code: "V4",
    name: "Financial Layer",
    goal: "Conta digital, antecipação, crediário, BNPL, score.",
    modules: ["Conta digital", "Antecipação", "Crediário", "BNPL", "Score crédito"],
    impact: "Monetização principal. Trava migração do lojista.",
    complexity: "Muito Alta",
    priority: "P1",
    dependencies: ["V1+V2 com volume transacional", "BaaS parceiro"],
    timeline: "Mês 10–14",
  },
  {
    phase: 5,
    code: "V5",
    name: "Network Layer",
    goal: "Benchmark, integração distribuidores/indústria, marketplace.",
    modules: ["Benchmark nacional", "Integração distribuidor", "Integração indústria", "Marketplace B2B"],
    impact: "Defensabilidade de longo prazo. Inteligência nacional.",
    complexity: "Muito Alta",
    priority: "P3",
    dependencies: ["Massa crítica de lojistas (>2k ativos)"],
    timeline: "Mês 15+",
  },
];

// ─────────────────────────────────────────────────────────────────
// 90 DIAS — semana a semana
// ─────────────────────────────────────────────────────────────────
export const weeks: WeekPlan[] = [
  { week: 1, month: 1, theme: "Setup & Arquitetura", owner: "CTO + Tech Lead",
    tasks: ["Definir stack oficial", "Setup monorepo + CI/CD", "Criar projeto Lovable Cloud", "Modelagem inicial do banco"],
    deliverables: ["Repo configurado", "Esquema ER v0", "Pipeline deploy"],
    risks: ["Over-engineering inicial"] },
  { week: 2, month: 1, theme: "Auth & Multi-tenant", owner: "Backend Sr",
    tasks: ["Auth JWT", "Tenancy por org", "RLS policies", "Convites de usuário"],
    deliverables: ["Login funcional", "Isolamento entre tenants validado"],
    risks: ["RLS mal configurada → vazamento entre lojas"] },
  { week: 3, month: 1, theme: "Catálogo & Clientes", owner: "Full-stack",
    tasks: ["CRUD produto", "CRUD cliente", "Busca rápida", "Imagens"],
    deliverables: ["Catálogo navegável mobile", "Cadastro <30s"],
    risks: ["UX lenta → abandono"] },
  { week: 4, month: 1, theme: "Orçamento — núcleo", owner: "Full-stack + UX",
    tasks: ["Builder de orçamento", "Itens, descontos, totais", "Persistência otimista"],
    deliverables: ["Orçamento criado em <60s"],
    risks: ["Modelo de preço errado"] },
  { week: 5, month: 2, theme: "Compartilhar via WhatsApp", owner: "Frontend + Backend",
    tasks: ["Render PDF/imagem orçamento", "wa.me link", "Encurtador interno", "Tracking de visualização"],
    deliverables: ["Orçamento compartilhável 1-tap"],
    risks: ["WhatsApp Business API custosa demais cedo"] },
  { week: 6, month: 2, theme: "Pedido & Reserva de estoque", owner: "Backend Sr",
    tasks: ["Conversão orçamento→pedido", "Eventos inventory_reserved", "Status do pedido"],
    deliverables: ["Pedido com reserva atômica"],
    risks: ["Race conditions sem locking adequado"] },
  { week: 7, month: 2, theme: "Cobrança Pix", owner: "Backend + Parceiro",
    tasks: ["Integração Pix gateway", "Webhook de pagamento", "Status conciliado", "Link de pagamento"],
    deliverables: ["Pix gerado e conciliado em <5s"],
    risks: ["Homologação demorada do PSP"] },
  { week: 8, month: 2, theme: "Dashboard operacional", owner: "Frontend Sr",
    tasks: ["Vendas dia", "Pedidos abertos", "Cobranças pendentes", "Notificações"],
    deliverables: ["Dashboard mobile-first <1.5s LCP"],
    risks: ["Queries pesadas sem índices"] },
  { week: 9, month: 3, theme: "Offline-first v0", owner: "Frontend Sr + Tech Lead",
    tasks: ["IndexedDB", "Fila local de eventos", "Sync incremental simples", "Optimistic UI"],
    deliverables: ["Criar orçamento offline e sincronizar"],
    risks: ["Conflict resolution mal feita corrompe dados"] },
  { week: 10, month: 3, theme: "Importação XML NFe", owner: "Backend",
    tasks: ["Parser XML", "Match SKU", "Atualização de estoque/custo", "UI revisão"],
    deliverables: ["Importar NFe em <10s"],
    risks: ["Variações de layout XML"] },
  { week: 11, month: 3, theme: "Beta fechado — 5 lojistas", owner: "Produto + CS",
    tasks: ["Onboarding assistido", "Sessões de uso", "Hotfix loop", "Coleta NPS qualitativo"],
    deliverables: ["5 lojistas ativos diários"],
    risks: ["Bugs críticos em produção"] },
  { week: 12, month: 3, theme: "Hardening & MVP público", owner: "Time inteiro",
    tasks: ["Observabilidade (logs/metrics/traces)", "Backups", "Rate limit", "Documentação onboarding", "Release MVP"],
    deliverables: ["MVP V1 disponível para waitlist"],
    risks: ["Lançar antes da observabilidade estar pronta"] },
];

// ─────────────────────────────────────────────────────────────────
// SPRINTS
// ─────────────────────────────────────────────────────────────────
export const sprints: Sprint[] = [
  {
    number: 1, name: "Foundations", dates: "Sem 1–2",
    goal: "Base técnica + auth multi-tenant funcionando.",
    deliverables: ["Stack definida", "CI/CD", "Auth JWT", "Tenancy + RLS", "Schema base"],
    acceptance: ["Usuário convida outro usuário no mesmo tenant", "Tenant A não enxerga dados de B"],
    metrics: ["Deploy time <5min", "0 vazamento entre tenants em testes"],
    risks: ["RLS complexa", "Setup inicial atrasar features"],
  },
  {
    number: 2, name: "Catálogo + Orçamento", dates: "Sem 3–4",
    goal: "Lojista cadastra produto e cria orçamento em <60s.",
    deliverables: ["CRUD produto", "CRUD cliente", "Builder de orçamento", "Persistência otimista"],
    acceptance: ["Criar orçamento de 5 itens em <60s no mobile", "Editar orçamento existente"],
    metrics: ["TTI <2s", "Taxa de erro <1% nas mutations"],
    risks: ["Modelo de desconto/imposto subestimado"],
  },
  {
    number: 3, name: "WhatsApp + Pedido + Pix", dates: "Sem 5–7",
    goal: "Fluxo completo: enviar orçamento, virar pedido, cobrar via Pix.",
    deliverables: ["Compartilhar orçamento WhatsApp", "Conversão pedido", "Reserva estoque", "Pix integrado"],
    acceptance: ["Lojista finaliza venda em <5min ponta-a-ponta", "Pix conciliado automaticamente"],
    metrics: ["Tempo médio orçamento→pago <30min", "% Pix conciliado >98%"],
    risks: ["Homologação Pix", "Race condition em estoque"],
  },
  {
    number: 4, name: "Dashboard + Offline + XML", dates: "Sem 8–10",
    goal: "Dashboard útil, app funciona offline, NFe entra automaticamente.",
    deliverables: ["Dashboard mobile", "Sync engine v0", "Parser XML NFe", "Atualização custo/estoque"],
    acceptance: ["Operar offline 1h e sincronizar sem perda", "Importar NFe e atualizar 100% dos SKUs casados"],
    metrics: ["Sync success rate >99%", "Tempo importação NFe <10s"],
    risks: ["Sync conflicts", "Variação layout XML por UF"],
  },
];

// ─────────────────────────────────────────────────────────────────
// KANBAN — tasks reais distribuídas
// ─────────────────────────────────────────────────────────────────
export const tasks: Task[] = [
  // PRODUCTION / MONITORING
  { id: "MAT-001", title: "Setup Lovable Cloud + projeto base", description: "Provisionar backend, configurar envs.", track: "Infra", priority: "P0", effort: 2, impact: 5, column: "production", phase: 1, sprint: 1 },
  { id: "MAT-002", title: "Pipeline CI/CD + preview deploys", description: "Deploy automático em PR.", track: "DevOps", priority: "P0", effort: 3, impact: 4, column: "monitoring", phase: 1, sprint: 1 },
  // STAGING
  { id: "MAT-010", title: "Auth JWT + multi-tenant", description: "Login, refresh, organização, convites.", track: "Backend", priority: "P0", effort: 8, impact: 5, column: "staging", phase: 1, sprint: 1 },
  { id: "MAT-011", title: "RLS policies por tenant", description: "Isolamento de dados via row-level security.", track: "Banco", priority: "P0", effort: 5, impact: 5, column: "staging", phase: 1, sprint: 1, dependencies: ["MAT-010"] },
  // QA
  { id: "MAT-020", title: "CRUD produto + busca rápida", description: "Catálogo navegável mobile.", track: "Frontend", priority: "P0", effort: 5, impact: 4, column: "qa", phase: 1, sprint: 2 },
  { id: "MAT-021", title: "CRUD cliente + histórico", description: "Cadastro <30s, busca por nome/telefone.", track: "Frontend", priority: "P0", effort: 5, impact: 4, column: "qa", phase: 1, sprint: 2 },
  // REVIEW
  { id: "MAT-030", title: "Builder de orçamento", description: "Itens, desconto linha/total, observações.", track: "Frontend", priority: "P0", effort: 8, impact: 5, column: "review", phase: 1, sprint: 2, dependencies: ["MAT-020", "MAT-021"] },
  { id: "MAT-031", title: "Modelo de preço + impostos básicos", description: "Tabela de preço, regra de imposto inicial.", track: "Backend", priority: "P0", effort: 5, impact: 4, column: "review", phase: 1, sprint: 2 },
  // IN PROGRESS
  { id: "MAT-040", title: "Compartilhar orçamento via WhatsApp", description: "Render imagem/PDF + wa.me link + tracking.", track: "WhatsApp", priority: "P0", effort: 5, impact: 5, column: "in_progress", phase: 1, sprint: 3, dependencies: ["MAT-030"] },
  { id: "MAT-041", title: "Conversão orçamento → pedido", description: "Atomicidade, eventos, status.", track: "Backend", priority: "P0", effort: 5, impact: 5, column: "in_progress", phase: 1, sprint: 3, dependencies: ["MAT-030"] },
  { id: "MAT-042", title: "Reserva de estoque com locking", description: "Evento inventory_reserved, anti race-condition.", track: "Backend", priority: "P0", effort: 5, impact: 4, column: "in_progress", phase: 1, sprint: 3, dependencies: ["MAT-041"] },
  // READY
  { id: "MAT-050", title: "Integração Pix (PSP)", description: "Cobrança, webhook, conciliação.", track: "Financeiro", priority: "P0", effort: 8, impact: 5, column: "ready", phase: 1, sprint: 3 },
  { id: "MAT-051", title: "Link de pagamento + status", description: "Página pública, status realtime.", track: "Frontend", priority: "P1", effort: 3, impact: 4, column: "ready", phase: 1, sprint: 3, dependencies: ["MAT-050"] },
  { id: "MAT-052", title: "Dashboard operacional v0", description: "Vendas dia, pedidos, cobranças.", track: "Frontend", priority: "P1", effort: 5, impact: 4, column: "ready", phase: 1, sprint: 4 },
  // REFINEMENT
  { id: "MAT-060", title: "Sync engine offline v0", description: "IndexedDB + fila + sync incremental.", track: "Offline", priority: "P1", effort: 13, impact: 5, column: "refinement", phase: 1, sprint: 4 },
  { id: "MAT-061", title: "Optimistic UI nas mutations chave", description: "Orçamento, pedido, cobrança.", track: "Frontend", priority: "P1", effort: 5, impact: 4, column: "refinement", phase: 1, sprint: 4, dependencies: ["MAT-060"] },
  { id: "MAT-062", title: "Parser XML NFe + match SKU", description: "Importar nota e atualizar estoque/custo.", track: "OCR/XML", priority: "P1", effort: 8, impact: 5, column: "refinement", phase: 2, sprint: 4 },
  { id: "MAT-063", title: "Observabilidade (logs/metrics/traces)", description: "Tracing distribuído + alertas.", track: "DevOps", priority: "P1", effort: 5, impact: 4, column: "refinement", phase: 1, sprint: 4 },
  // BACKLOG
  { id: "MAT-100", title: "OCR de cupom/NF imagem", description: "Quando XML não disponível.", track: "OCR/XML", priority: "P2", effort: 13, impact: 4, column: "backlog", phase: 2 },
  { id: "MAT-101", title: "Boleto + crediário básico", description: "Para clientes sem Pix.", track: "Financeiro", priority: "P2", effort: 8, impact: 4, column: "backlog", phase: 1 },
  { id: "MAT-102", title: "Copiloto de balcão (LLM)", description: "Sugere itens, margem, alternativos.", track: "IA", priority: "P2", effort: 13, impact: 5, column: "backlog", phase: 3 },
  { id: "MAT-103", title: "Previsão de ruptura", description: "Modelo por SKU/loja/sazonalidade.", track: "IA", priority: "P2", effort: 13, impact: 5, column: "backlog", phase: 3 },
  { id: "MAT-104", title: "Score de recompra cliente", description: "Quando ele provavelmente volta.", track: "IA", priority: "P3", effort: 8, impact: 4, column: "backlog", phase: 3 },
  { id: "MAT-105", title: "Conta digital BaaS", description: "Onboarding, KYC, saldo.", track: "Financeiro", priority: "P1", effort: 13, impact: 5, column: "backlog", phase: 4 },
  { id: "MAT-106", title: "Antecipação de recebíveis", description: "Sobre Pix futuro e crediário.", track: "Financeiro", priority: "P1", effort: 13, impact: 5, column: "backlog", phase: 4, blocked: true },
  { id: "MAT-107", title: "Marketplace B2B distribuidor", description: "Reposição automática.", track: "Produto", priority: "P3", effort: 13, impact: 4, column: "backlog", phase: 5, blocked: true },
  { id: "MAT-108", title: "Roteirização de entrega", description: "Agrupamento + rastreio.", track: "Backend", priority: "P2", effort: 8, impact: 3, column: "backlog", phase: 2 },
  { id: "MAT-109", title: "App representante", description: "Pedido em campo offline.", track: "Frontend", priority: "P3", effort: 13, impact: 3, column: "backlog", phase: 2 },
  { id: "MAT-110", title: "Benchmark nacional anônimo", description: "Comparativos por região/segmento.", track: "Produto", priority: "P3", effort: 8, impact: 4, column: "backlog", phase: 5 },
];

// ─────────────────────────────────────────────────────────────────
// BACKLOG estruturado por trilha
// ─────────────────────────────────────────────────────────────────
export const backlog: BacklogGroup[] = [
  { track: "Frontend", items: [
    { title: "Design system mobile-first (tokens, componentes)", priority: "P0", effort: 5, impact: 5 },
    { title: "PWA install + service worker", priority: "P1", effort: 3, impact: 4 },
    { title: "Catálogo virtualizado (lista grande)", priority: "P1", effort: 5, impact: 4 },
    { title: "Builder de orçamento offline-aware", priority: "P0", effort: 8, impact: 5, deps: "Sync engine" },
  ]},
  { track: "Backend", items: [
    { title: "API REST + tRPC para fluxos críticos", priority: "P0", effort: 5, impact: 4 },
    { title: "Event store append-only", priority: "P1", effort: 8, impact: 5 },
    { title: "Worker queue (BullMQ/Trigger)", priority: "P1", effort: 5, impact: 4 },
    { title: "Locking de estoque (advisory locks)", priority: "P0", effort: 3, impact: 5 },
  ]},
  { track: "Infra", items: [
    { title: "Multi-tenant via Lovable Cloud + RLS", priority: "P0", effort: 5, impact: 5 },
    { title: "Backups automáticos + restore drill", priority: "P0", effort: 3, impact: 5 },
    { title: "CDN + edge cache para catálogo público", priority: "P2", effort: 3, impact: 3 },
  ]},
  { track: "Banco", items: [
    { title: "Schema base (customer, product, quote, order, payment, inventory_event)", priority: "P0", effort: 5, impact: 5 },
    { title: "Índices críticos (busca, fk, status)", priority: "P0", effort: 2, impact: 4 },
    { title: "Particionamento de eventos por tenant/mês", priority: "P2", effort: 5, impact: 3 },
  ]},
  { track: "Offline", items: [
    { title: "IndexedDB com Dexie", priority: "P0", effort: 5, impact: 5 },
    { title: "Fila de mutations + retry exponencial", priority: "P0", effort: 5, impact: 5 },
    { title: "Conflict resolution last-write-wins por entidade", priority: "P1", effort: 5, impact: 4 },
  ]},
  { track: "WhatsApp", items: [
    { title: "wa.me link + render imagem do orçamento", priority: "P0", effort: 3, impact: 5 },
    { title: "Encurtador interno + tracking de visualização", priority: "P1", effort: 3, impact: 4 },
    { title: "WhatsApp Business API (Cloud) v2", priority: "P2", effort: 8, impact: 5 },
  ]},
  { track: "Financeiro", items: [
    { title: "Pix dinâmico + webhook conciliação", priority: "P0", effort: 8, impact: 5 },
    { title: "Boleto + retorno CNAB", priority: "P2", effort: 8, impact: 3 },
    { title: "Crediário interno + cobrança automática", priority: "P1", effort: 8, impact: 4 },
    { title: "Antecipação de recebíveis", priority: "P1", effort: 13, impact: 5, deps: "Conta digital" },
  ]},
  { track: "OCR/XML", items: [
    { title: "Parser XML NFe (modelo 55)", priority: "P0", effort: 8, impact: 5 },
    { title: "Match fuzzy de SKU + UI revisão", priority: "P1", effort: 5, impact: 4 },
    { title: "OCR de cupom imagem (fallback)", priority: "P2", effort: 13, impact: 4 },
  ]},
  { track: "IA", items: [
    { title: "Sugestão de recompra por cliente", priority: "P2", effort: 8, impact: 4 },
    { title: "Previsão de ruptura por SKU", priority: "P2", effort: 13, impact: 5 },
    { title: "Copiloto de balcão (LLM contextual)", priority: "P2", effort: 13, impact: 5 },
  ]},
  { track: "DevOps", items: [
    { title: "CI/CD com previews", priority: "P0", effort: 3, impact: 4 },
    { title: "Observabilidade (OTel + dashboards)", priority: "P1", effort: 5, impact: 4 },
    { title: "Rate limit + WAF básico", priority: "P1", effort: 3, impact: 4 },
  ]},
  { track: "UX/UI", items: [
    { title: "Onboarding assistido <5min", priority: "P0", effort: 5, impact: 5 },
    { title: "Empty states e zero-state coaching", priority: "P1", effort: 3, impact: 3 },
    { title: "Tour interativo do balcão", priority: "P2", effort: 5, impact: 3 },
  ]},
];

// ─────────────────────────────────────────────────────────────────
// CALENDÁRIO — eventos próximos 90 dias
// ─────────────────────────────────────────────────────────────────
const today = new Date();
const iso = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export const calendar: CalendarEvent[] = [
  { date: iso(2),  title: "Kickoff técnico", type: "checkpoint", description: "Stack definida, repos criados." },
  { date: iso(7),  title: "Sprint 1 review", type: "checkpoint", description: "Auth + tenancy validados." },
  { date: iso(10), title: "Entrevista lojista #1", type: "entrevista", description: "Validar fluxo orçamento." },
  { date: iso(14), title: "Milestone: Catálogo navegável", type: "milestone", description: "Produto + cliente prontos." },
  { date: iso(18), title: "Deploy staging — orçamento", type: "deploy", description: "Builder em homologação." },
  { date: iso(21), title: "Sprint 2 review", type: "checkpoint", description: "Orçamento end-to-end no dispositivo." },
  { date: iso(25), title: "Entrevista lojista #2 e #3", type: "entrevista", description: "Validar wedge WhatsApp." },
  { date: iso(30), title: "Milestone: WhatsApp share", type: "milestone", description: "Compartilhar orçamento 1-tap." },
  { date: iso(35), title: "Teste de carga — orçamento", type: "teste", description: "1k orgs simultâneas." },
  { date: iso(42), title: "Sprint 3 review + Pix conciliado", type: "checkpoint", description: "Fluxo completo orçamento→pago." },
  { date: iso(49), title: "Validação com 3 lojistas", type: "validacao", description: "Uso real, instrumentado." },
  { date: iso(56), title: "Release V1-beta", type: "release", description: "Beta fechado para 5 lojistas." },
  { date: iso(63), title: "Deploy produção — Pix", type: "deploy", description: "Gateway homologado." },
  { date: iso(70), title: "Sprint 4 review — offline + XML", type: "checkpoint", description: "Sync engine v0 estável." },
  { date: iso(77), title: "Validação NFe — 10 importações reais", type: "validacao", description: "Cobertura de variações por UF." },
  { date: iso(85), title: "Release V1 público (waitlist)", type: "release", description: "MVP disponível." },
  { date: iso(90), title: "Checkpoint estratégico — V2 plan", type: "checkpoint", description: "Decidir prioridades V2." },
];

// ─────────────────────────────────────────────────────────────────
// RISCOS
// ─────────────────────────────────────────────────────────────────
export const risks: Risk[] = [
  { id: "R-01", title: "Sync engine offline com conflitos corrompendo dados", category: "Técnico", probability: "Alta", impact: "Crítico",
    mitigation: "Last-write-wins por entidade, eventos idempotentes, golden tests, rollback por evento." },
  { id: "R-02", title: "Race condition em reserva de estoque", category: "Técnico", probability: "Média", impact: "Alto",
    mitigation: "Advisory locks no Postgres + testes de concorrência." },
  { id: "R-03", title: "Homologação Pix demorada", category: "Operacional", probability: "Alta", impact: "Alto",
    mitigation: "Iniciar homologação na semana 1, ter PSP B como plano B." },
  { id: "R-04", title: "Lojista não adota — vira 'mais um ERP'", category: "Adoção", probability: "Média", impact: "Crítico",
    mitigation: "Wedge único (WhatsApp), onboarding <5min, CS proativo nos 5 primeiros." },
  { id: "R-05", title: "Complexidade fiscal travar velocidade", category: "Operacional", probability: "Alta", impact: "Alto",
    mitigation: "MVP sem emissão fiscal — só após V1 estável. Parceria com gateway fiscal." },
  { id: "R-06", title: "Multi-tenant mal isolado vaza dados", category: "Arquitetura", probability: "Baixa", impact: "Crítico",
    mitigation: "RLS obrigatória + auditoria + testes automáticos de cross-tenant." },
  { id: "R-07", title: "Custo WhatsApp Business API explodir", category: "Financeiro", probability: "Média", impact: "Médio",
    mitigation: "Começar com wa.me, evoluir só com receita comprovada." },
  { id: "R-08", title: "Variação layout XML NFe por UF", category: "Técnico", probability: "Alta", impact: "Médio",
    mitigation: "Schema tolerante + revisão humana + crescimento incremental por UF." },
  { id: "R-09", title: "Capital queimado antes de V4 (financeiro)", category: "Financeiro", probability: "Média", impact: "Crítico",
    mitigation: "Cobrar SaaS desde V1, manter burn <R$300k/mês, runway 18 meses." },
  { id: "R-10", title: "Equipe técnica subdimensionada", category: "Operacional", probability: "Média", impact: "Alto",
    mitigation: "Plano de hiring sequenciado, contratar Tech Lead antes de Sprint 1." },
];

// ─────────────────────────────────────────────────────────────────
// MÉTRICAS
// ─────────────────────────────────────────────────────────────────
export const metrics: Metric[] = [
  { name: "DAU/MAU lojista", category: "North Star", target: ">60%", description: "Indica que o sistema entrou no fluxo diário." },
  { name: "Orçamentos criados/loja/dia", category: "Produto", target: ">8", description: "Volume real de uso operacional." },
  { name: "Conversão orçamento→pedido", category: "Produto", target: ">35%", description: "Eficácia do builder + WhatsApp." },
  { name: "Tempo médio orçamento→pago (Pix)", category: "Operacional", target: "<30min", description: "Velocidade do fluxo principal." },
  { name: "% Pix conciliado automaticamente", category: "Operacional", target: ">98%", description: "Qualidade da integração financeira." },
  { name: "Taxa de retenção D30", category: "Retenção", target: ">70%", description: "Lojista continua ativo após 30 dias." },
  { name: "Tempo de onboarding até 1º pedido", category: "Ativação", target: "<24h", description: "Do cadastro à 1ª venda." },
  { name: "GMV processado/mês", category: "Financeiro", target: "Cresc. 30% MoM", description: "Volume transacional sob a plataforma." },
  { name: "Take rate financeiro (V4+)", category: "Financeiro", target: "1.2–2.5%", description: "Sobre Pix, antecipação, crediário." },
  { name: "NPS lojista", category: "Retenção", target: ">50", description: "Saúde qualitativa da relação." },
];

// ─────────────────────────────────────────────────────────────────
// EQUIPE
// ─────────────────────────────────────────────────────────────────
export const team: TeamRole[] = [
  { role: "CTO / Tech Lead", seniority: "Sênior+", hireOrder: 1, phase: 1,
    responsibilities: ["Arquitetura", "Stack", "Hiring técnico", "Code review crítico"] },
  { role: "Engenheiro Full-stack Sênior", seniority: "Sênior", hireOrder: 2, phase: 1,
    responsibilities: ["Builder de orçamento", "Catálogo", "Sync offline"] },
  { role: "Engenheiro Backend Sênior", seniority: "Sênior", hireOrder: 3, phase: 1,
    responsibilities: ["Eventos", "Pix", "Multi-tenant", "Estoque com locking"] },
  { role: "Product Designer", seniority: "Pleno+", hireOrder: 4, phase: 1,
    responsibilities: ["UX mobile", "Onboarding", "Design system"] },
  { role: "PM / Head de Produto", seniority: "Sênior", hireOrder: 5, phase: 1,
    responsibilities: ["Discovery contínuo", "Roadmap", "Métricas", "Entrevistas"] },
  { role: "Engenheiro Frontend Pleno", seniority: "Pleno", hireOrder: 6, phase: 2,
    responsibilities: ["Dashboard", "PWA", "Performance"] },
  { role: "Customer Success Pioneer", seniority: "Pleno", hireOrder: 7, phase: 2,
    responsibilities: ["Onboarding lojistas", "Loop de feedback", "Hotline"] },
  { role: "Engenheiro de Dados / IA", seniority: "Sênior", hireOrder: 8, phase: 3,
    responsibilities: ["Telemetria", "Modelos de previsão", "Copiloto"] },
  { role: "Tech Lead Financeiro", seniority: "Sênior+", hireOrder: 9, phase: 4,
    responsibilities: ["BaaS", "Antecipação", "Score", "Compliance"] },
  { role: "Head de GTM / Parcerias", seniority: "Sênior", hireOrder: 10, phase: 2,
    responsibilities: ["Distribuidoras", "Representantes", "Associações"] },
];

// ─────────────────────────────────────────────────────────────────
// ARQUITETURA — camadas + entidades + eventos
// ─────────────────────────────────────────────────────────────────
export const architectureLayers = [
  { name: "1. Operational Layer", color: "phase-1",
    items: ["Orçamento", "Pedido", "Cobrança", "Entrega", "Reposição"] },
  { name: "2. Communication Layer", color: "phase-2",
    items: ["WhatsApp", "Notificações", "Catálogo público", "Automações", "CRM conversacional"] },
  { name: "3. Intelligence Layer", color: "phase-3",
    items: ["IA", "OCR", "Recomendação", "Previsão", "Copiloto", "Score", "Telemetria"] },
  { name: "4. Financial Layer", color: "phase-4",
    items: ["Pix", "Wallet", "Boleto", "BNPL", "Antecipação", "Cobrança", "Split"] },
  { name: "5. ERP Core (invisível)", color: "phase-5",
    items: ["Estoque", "Fiscal", "Financeiro", "Produtos", "Impostos", "Usuários"] },
];

export const entities = [
  { name: "customer", fields: ["id", "tenant_id", "nome", "telefone", "whatsapp", "endereco", "limite_credito"] },
  { name: "product",  fields: ["id", "tenant_id", "sku", "nome", "categoria", "preco", "custo", "estoque"] },
  { name: "quote",    fields: ["id", "tenant_id", "customer_id", "status", "total", "origem"] },
  { name: "quote_item", fields: ["quote_id", "product_id", "quantidade", "preco"] },
  { name: "order",    fields: ["id", "tenant_id", "customer_id", "quote_id", "status", "total"] },
  { name: "payment",  fields: ["id", "order_id", "tipo", "status", "valor"] },
  { name: "inventory_event", fields: ["id", "product_id", "tipo", "quantidade", "ts"] },
];

export const events = [
  "customer_created", "quote_created", "quote_sent", "quote_approved",
  "order_created", "payment_generated", "payment_paid",
  "inventory_reserved", "inventory_updated", "xml_processado",
  "cliente_inadimplente", "item_em_ruptura", "recompra_prevista",
];

// Stack OFICIAL (alinhada à tese — Etapa 2)
export const stack = {
  Frontend: ["React", "Vite", "TanStack Query", "Zustand", "Tailwind", "IndexedDB (PWA)"],
  Backend: ["NestJS", "PostgreSQL", "Redis", "Prisma"],
  Offline: ["IndexedDB", "Fila local", "Sincronização incremental"],
  Auth: ["JWT", "Refresh token", "Multi-tenant simples"],
  Eventos: ["Append-only event log", "Worker queue", "Webhooks"],
  Observabilidade: ["OpenTelemetry", "Logs estruturados", "Sentry"],
};

// Eventos iniciais MVP (Etapa 4 da tese oficial)
export const eventsMVP = [
  "customer_created", "quote_created", "quote_sent", "quote_approved",
  "order_created", "payment_generated", "payment_paid",
  "inventory_reserved", "inventory_updated",
];

// CHECKLIST DE AUDITORIA (CTO / QA LEAD)
export const checklist = {
  Segurança: [
    "Políticas de Row Level Security (RLS) no Supabase bloqueando vazamento entre lojas",
    "Auth via Supabase (Magic Link/WhatsApp OTP) para facilitar acesso no balcão",
    "Database Webhooks para processamento assíncrono de estoque",
    "Rate Limit via Edge Functions para proteger endpoints de Pix",
    "Backup Point-in-Time Recovery (PITR) ativado no banco de produção"
  ],
  "Arquitetura Supabase": [
    "Supabase Auth + Custom Claims para identificar TenantId",
    "Uso de pg_net para chamadas de webhook externas de forma transacional",
    "Configuração de Réplicas de Leitura (se escala > 1000 lojas concurrentes)",
    "Storage buckets privados com RLS para recibos e comprovantes"
  ],
  "Fluxo Crítico (The Wedge)": [
    "Conversão WhatsApp -> PDF/Link Orçamento < 3 segundos",
    "Notificação Real-time de confirmação de Pix via Webhook",
    "Reserva de estoque atômica (prevenir venda dupla simultânea)",
    "Onboarding 'Zero-Click' para lojista (importação via XML)"
  ],
  "UX de Balcão": [
    "Navegação por teclado (para PCs de balcão) + Mobile Touch",
    "Feedback visual instantâneo (Optimistic UI) ao adicionar item",
    "Tratamento de erro humano (ex: estorno de Pix facilitado)"
  ],
};

// RICE matrix sample (top backlog itens)
export const rice = [
  { item: "WhatsApp share orçamento", reach: 9, impact: 5, confidence: 0.9, effort: 3 },
  { item: "Pix conciliado",          reach: 9, impact: 5, confidence: 0.85, effort: 5 },
  { item: "Sync offline",            reach: 8, impact: 5, confidence: 0.6, effort: 13 },
  { item: "XML NFe",                 reach: 7, impact: 5, confidence: 0.8, effort: 8 },
  { item: "Copiloto IA",             reach: 6, impact: 5, confidence: 0.5, effort: 13 },
  { item: "Crediário",               reach: 5, impact: 4, confidence: 0.7, effort: 8 },
  { item: "Conta digital",           reach: 7, impact: 5, confidence: 0.5, effort: 13 },
].map(r => ({ ...r, score: +(r.reach * r.impact * r.confidence / r.effort).toFixed(2) }))
 .sort((a, b) => b.score - a.score);

export const kanbanColumns: { id: KanbanColumn; label: string; hint: string }[] = [
  { id: "backlog",     label: "Backlog",        hint: "Ideias e itens futuros" },
  { id: "refinement",  label: "Refinamento",    hint: "Sendo detalhado" },
  { id: "ready",       label: "Ready",          hint: "Pronto para dev" },
  { id: "in_progress", label: "Em desenvolvimento", hint: "Sprint atual" },
  { id: "review",      label: "Code Review",    hint: "PR aberto" },
  { id: "qa",          label: "QA",             hint: "Em teste" },
  { id: "staging",     label: "Homologação",    hint: "Validação final" },
  { id: "production",  label: "Produção",       hint: "Live" },
  { id: "monitoring",  label: "Monitoramento",  hint: "Observado pós-release" },
];

// ─────────────────────────────────────────────────────────────────
// TESE OFICIAL — compatibilização com o documento estratégico
// ─────────────────────────────────────────────────────────────────

// MVP Boundary (o que NÃO entra no MVP)
export const mvpBoundary = {
  inclui: [
    "Cadastro básico (clientes, produtos, categorias, preços)",
    "Catálogo simples (busca, preço, estoque, imagem)",
    "Geração de orçamento (manual, lista, WhatsApp)",
    "Conversão em pedido (aprovar, reservar, gerar)",
    "Cobrança (Pix, boleto simples, status)",
    "Histórico cliente (pedidos, orçamento, recorrência)",
  ],
  exclui: [
    "Fiscal completo",
    "Contabilidade",
    "BI complexo",
    "Multiempresa avançado",
    "RH",
    "Compras sofisticadas",
    "Marketplace",
    "App representante",
    "IA avançada",
    "Parametrização excessiva",
  ],
};

// Telas do MVP (Etapa 5)
export const mvpScreens = [
  { n: 1, name: "Login", items: [] },
  { n: 2, name: "Dashboard simples", items: ["vendas dia", "pedidos", "cobranças"] },
  { n: 3, name: "Clientes", items: ["cadastro", "histórico"] },
  { n: 4, name: "Produtos", items: ["catálogo", "estoque", "preço"] },
  { n: 5, name: "Orçamento", items: ["criar", "editar", "enviar WhatsApp"] },
  { n: 6, name: "Pedidos", items: ["status", "cobrança", "separação"] },
  { n: 7, name: "Cobrança", items: ["Pix", "boleto", "pagamento"] },
];

// 9 Etapas de execução real
export const executionSteps = [
  { n: 1, title: "Definir o MVP exato", summary: "WhatsApp → Orçamento → Pedido → Cobrança. Apenas isso." },
  { n: 2, title: "Definir stack oficial", summary: "Frontend PWA + Backend NestJS/Postgres/Redis/Prisma + Offline + Auth JWT." },
  { n: 3, title: "Definir o banco corretamente", summary: "Entidades: customer, product, quote, quote_item, order, payment, inventory_event." },
  { n: 4, title: "Definir eventos", summary: "9 eventos iniciais — base para sync, IA e analytics." },
  { n: 5, title: "Definir telas", summary: "7 telas do MVP — login, dashboard, clientes, produtos, orçamento, pedidos, cobrança." },
  { n: 6, title: "Definir fluxo principal", summary: "Mensagem → orçamento → aprovação → pedido → cobrança → reserva." },
  { n: 7, title: "Definir 1º diferencial", summary: "Integração operacional com WhatsApp (compartilhar, link pagto, automática, histórico)." },
  { n: 8, title: "Definir OCR/XML", summary: "Importar XML, criar produto, atualizar estoque/custo." },
  { n: 9, title: "Definir roadmap real", summary: "Mês 1 fundação → Mês 2 operação → Mês 3 cobrança+offline → Mês 4+ IA/finance." },
];

// Fluxos operacionais (4 fluxos)
export const operationalFlows = [
  {
    name: "Comercial",
    color: "phase-1",
    inputs: ["lista", "áudio", "imagem", "texto", "orçamento anterior"],
    actions: ["interpreta", "gera orçamento", "sugere itens", "calcula margem", "verifica estoque", "envia pagamento", "converte em pedido"],
  },
  {
    name: "Estoque",
    color: "phase-2",
    inputs: ["XML", "OCR", "nota fiscal", "pedido representante"],
    actions: ["cadastra automaticamente", "atualiza estoque", "sugere preço", "calcula margem", "detecta ruptura"],
  },
  {
    name: "Financeiro",
    color: "phase-4",
    inputs: ["pedido", "crediário", "recebíveis"],
    actions: ["gera cobrança", "envia Pix", "gera boleto", "controla crediário", "automatiza cobrança", "antecipa recebíveis"],
  },
  {
    name: "Logístico",
    color: "phase-3",
    inputs: ["pedidos confirmados", "endereços"],
    actions: ["cria rota", "organiza entrega", "agrupa pedidos", "rastreia status", "confirma recebimento"],
  },
];

// GTM — distribuição indireta
export const gtm = {
  strategy: "Distribuição indireta",
  channels: ["Distribuidoras", "Representantes", "Associações", "Grupos regionais", "Parceiros financeiros"],
  growth: [
    { etapa: 1, title: "Entrar via operação", desc: "Wedge WhatsApp → Pix entra no fluxo diário do lojista." },
    { etapa: 2, title: "Expandir para financeiro", desc: "Conta digital, antecipação, crediário, BNPL — monetização." },
    { etapa: 3, title: "Construir rede de dados", desc: "Sell-out, ruptura, recompra, score — ativo defensável." },
    { etapa: 4, title: "Infraestrutura nacional", desc: "Integração distribuidores/indústria + benchmark + marketplace B2B." },
  ],
};

// 7 Princípios fundamentais
export const principles = [
  { title: "Simples", desc: "Poucos cliques, linguagem clara, sem parametrização excessiva." },
  { title: "Rápido", desc: "Resposta instantânea no balcão e no WhatsApp." },
  { title: "Invisível", desc: "Usuário não sente que está usando ERP." },
  { title: "Móvel", desc: "Mobile-first em toda jornada." },
  { title: "Resiliente", desc: "Funciona offline e em conexões instáveis." },
  { title: "Automatizado", desc: "Inferência, sugestão, completar — sem trabalho manual." },
  { title: "Inteligente", desc: "Prevê ruptura, recompra, sugere mix e margem." },
];

// Cronograma macro Mês 1→4+ (alinhado à Etapa 9)
export const monthlyPlan = [
  { month: "Mês 1", theme: "Fundação", items: ["arquitetura", "banco", "autenticação", "catálogo", "clientes"] },
  { month: "Mês 2", theme: "Operação", items: ["orçamento", "pedido", "estoque", "WhatsApp"] },
  { month: "Mês 3", theme: "Cobrança & Offline", items: ["cobrança", "Pix", "XML", "offline básico"] },
  { month: "Mês 4+", theme: "Expansão", items: ["IA", "previsão", "representante", "embedded finance"] },
];