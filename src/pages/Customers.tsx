import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, MessageCircle, Phone } from "lucide-react";
import { brl, waLink } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { offlineList, offlineInsert, offlineUpdate } from "@/lib/offline/api";
import { emitEvent } from "@/lib/offline/events";
import type { Row } from "@/lib/offline/db";

export default function Customers() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Row<"customers"> | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", whatsapp: "", address: "", credit_limit: "0", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Nome é obrigatório";
    
    const cleanPhone = form.phone.replace(/\D/g, "");
    if (cleanPhone && cleanPhone.length < 10) newErrors.phone = "Telefone inválido (mínimo 10 dígitos)";
    
    const cleanWA = form.whatsapp.replace(/\D/g, "");
    if (cleanWA && cleanWA.length < 11) newErrors.whatsapp = "WhatsApp inválido (mínimo 11 dígitos)";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => offlineList("customers", { orderBy: "created_at", ascending: false }),
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, credit_limit: Number(form.credit_limit) || 0, user_id: user!.id };
      if (editing) {
        await offlineUpdate("customers", editing.id, payload);
        await emitEvent(user!.id, "customers", editing.id, "customer_updated", { name: payload.name });
      } else {
        const res = await offlineInsert("customers", payload);
        await emitEvent(user!.id, "customers", res.id, "customer_created", { name: payload.name });
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Cliente atualizado" : "Cliente cadastrado");
      qc.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false); setEditing(null);
      setForm({ name: "", phone: "", whatsapp: "", address: "", credit_limit: "0", notes: "" });
      setErrors({});
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    },
  });

  const onSaveClick = () => {
    if (validateForm()) {
      save.mutate();
    }
  };

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone ?? "").includes(search));

  const openEdit = (c: Row<"customers">) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone ?? "", whatsapp: c.whatsapp ?? "", address: c.address ?? "", credit_limit: String(c.credit_limit ?? 0), notes: c.notes ?? "" });
    setErrors({});
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle={`${customers.length} cadastrados`}
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setErrors({}); } }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground rounded-xl shadow-glow"><Plus className="h-4 w-4 mr-1" />Novo</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className={errors.name ? "text-destructive" : ""}>Nome</Label>
                  <Input 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.name && <p className="text-[10px] text-destructive mt-1">{errors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className={errors.phone ? "text-destructive" : ""}>Telefone</Label>
                    <Input 
                      value={form.phone} 
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        setForm({ ...form, phone: v });
                      }} 
                      placeholder="1144444444"
                      className={errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.phone && <p className="text-[10px] text-destructive mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <Label className={errors.whatsapp ? "text-destructive" : ""}>WhatsApp</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={form.whatsapp} 
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "");
                          setForm({ ...form, whatsapp: v });
                        }} 
                        placeholder="11999990000"
                        className={cn("flex-1", errors.whatsapp ? "border-destructive focus-visible:ring-destructive" : "")}
                      />
                      {form.whatsapp.length >= 10 && (
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="rounded-xl shrink-0 text-success border-success/30"
                          onClick={() => window.open(waLink(form.whatsapp, `Olá ${form.name}!`), "_blank")}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {errors.whatsapp && <p className="text-[10px] text-destructive mt-1">{errors.whatsapp}</p>}
                  </div>
                </div>
                <div><Label>Endereço</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div><Label>Limite de crédito</Label><Input type="number" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} /></div>
                <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button onClick={onSaveClick} disabled={save.isPending} className="gradient-primary text-primary-foreground rounded-xl w-full">Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone…" className="pl-9 rounded-xl" />
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && <Card className="p-10 text-center text-muted-foreground rounded-2xl">Nenhum cliente</Card>}
        {filtered.map((c) => (
          <Card key={c.id} className="p-4 rounded-2xl shadow-soft flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 cursor-pointer flex-1" onClick={() => openEdit(c)}>
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
                {c.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate">{c.phone || c.whatsapp || "Sem contato"} · Limite {brl(c.credit_limit)}</div>
              </div>
            </div>
            <div className="flex gap-1">
              {c.whatsapp && (
                <a href={waLink(c.whatsapp, `Olá ${c.name}!`)} target="_blank" rel="noreferrer">
                  <Button size="icon" variant="ghost" className="rounded-xl text-success"><MessageCircle className="h-4 w-4" /></Button>
                </a>
              )}
              {c.phone && <a href={`tel:${c.phone}`}><Button size="icon" variant="ghost" className="rounded-xl"><Phone className="h-4 w-4" /></Button></a>}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
