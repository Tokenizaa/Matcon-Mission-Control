import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export default function Auth() {
  const { signIn, signUp, user } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");

  useEffect(() => { if (user) nav("/", { replace: true }); }, [user, nav]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) toast.error(error.message); else { toast.success("Bem-vindo!"); nav("/"); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await signUp(email, password, { full_name: fullName, business_name: businessName });
    setLoading(false);
    if (error) toast.error(error.message); else { toast.success("Conta criada!"); nav("/"); }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:flex flex-1 gradient-primary p-10 flex-col justify-between text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-semibold">Balcão</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight text-balance">O sistema operacional do varejo brasileiro.</h1>
          <p className="mt-3 text-primary-foreground/80 max-w-md">Cliente → Orçamento → Pedido → Cobrança. Em poucos toques. Direto do balcão ou do WhatsApp.</p>
        </div>
        <div className="text-xs text-primary-foreground/60">© Balcão</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-6 rounded-2xl shadow-soft">
          <div className="md:hidden mb-6 flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">Balcão</span>
          </div>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full rounded-xl">
              <TabsTrigger value="signin" className="rounded-lg">Entrar</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form className="space-y-4 mt-4" onSubmit={handleSignIn}>
                <div className="space-y-2"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" /></div>
                <div className="space-y-2"><Label>Senha</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
                <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground shadow-glow rounded-xl">
                  {loading ? "Entrando…" : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="space-y-4 mt-4" onSubmit={handleSignUp}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Seu nome</Label><Input required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Negócio</Label><Input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label>Senha</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground shadow-glow rounded-xl">
                  {loading ? "Criando…" : "Criar conta grátis"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
