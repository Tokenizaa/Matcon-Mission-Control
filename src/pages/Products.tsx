import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, AlertTriangle, Package, FileUp } from "lucide-react";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import { offlineList, offlineInsert, offlineUpdate } from "@/lib/offline/api";
import { emitEvent } from "@/lib/offline/events";
import { parseNfeXml } from "@/lib/xml/parser";
import type { Row } from "@/lib/offline/db";

export default function Products() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Row<"products"> | null>(null);
  const empty = { sku: "", name: "", category: "", price: "0", cost: "0", stock: "0", unit: "un" };
  const [form, setForm] = useState(empty);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => offlineList("products", { orderBy: "name", ascending: true }),
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, price: Number(form.price), cost: Number(form.cost), stock: Number(form.stock), user_id: user!.id };
      if (editing) await offlineUpdate("products", (editing as any).id, payload);
      else await offlineInsert("products", payload);
    },
    onSuccess: () => {
      toast.success("Produto salvo");
      qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false); setEditing(null); setForm(empty);
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    },
  });

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(search.toLowerCase()));

  const openEdit = (p: Row<"products">) => {
    setEditing(p);
    setForm({ sku: p.sku ?? "", name: p.name, category: p.category ?? "", price: String(p.price), cost: String(p.cost ?? 0), stock: String(p.stock ?? 0), unit: p.unit ?? "un" });
    setOpen(true);
  };

  const handleXmlImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const nfe = await parseNfeXml(text);
      
      toast.info(`Importando ${nfe.items.length} itens da NFe ${nfe.number}...`);
      
      for (const item of nfe.items) {
        // Simple match by SKU/Name or insert new
        const existing = products.find(p => p.sku === item.sku || p.name === item.name);
        if (existing) {
          await offlineUpdate("products", existing.id, {
            ...existing,
            stock: (existing.stock || 0) + item.quantity,
            price: item.price * 1.3, // Simple 30% margin for draft
          });
        } else {
          await offlineInsert("products", {
            user_id: user!.id,
            name: item.name,
            sku: item.sku,
            price: item.price * 1.3,
            stock: item.quantity,
            unit: item.unit,
            category: "Importado NFe",
          });
        }
      }

      await emitEvent(user!.id, "products", "xml_batch", "xml_imported", { 
        nfe_key: nfe.key, 
        nfe_number: nfe.number,
        item_count: nfe.items.length 
      });

      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("NFe processada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar XML da NFe");
    }
  };

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle={`${products.length} no catálogo`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl border-primary/20" onClick={() => document.getElementById("xml-upload")?.click()}>
              <FileUp className="h-4 w-4 mr-1 text-primary" />Importar NFe
            </Button>
            <input 
              id="xml-upload" 
              type="file" 
              accept=".xml" 
              className="hidden" 
              onChange={handleXmlImport}
            />
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(empty); } }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground rounded-xl shadow-glow"><Plus className="h-4 w-4 mr-1" />Novo</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
                  <div><Label>Categoria</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                </div>
                <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Preço</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                  <div><Label>Custo</Label><Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
                  <div><Label>Estoque</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
                </div>
                <div><Label>Unidade</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button onClick={() => save.mutate()} disabled={!form.name || save.isPending} className="gradient-primary text-primary-foreground rounded-xl w-full">Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto ou SKU…" className="pl-9 rounded-xl" />
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && <Card className="p-10 text-center text-muted-foreground rounded-2xl">Nenhum produto</Card>}
        {filtered.map((p: any) => (
          <Card key={p.id} onClick={() => openEdit(p)} className="p-4 rounded-2xl shadow-soft flex items-center justify-between gap-3 cursor-pointer hover:shadow-glow transition-shadow">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-foreground" />
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {p.sku && `${p.sku} · `}{p.category || "Sem categoria"}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{brl(p.price)}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                {Number(p.stock) <= 5 && <AlertTriangle className="h-3 w-3 text-warning" />}
                <span>{Number(p.stock)} {p.unit}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
