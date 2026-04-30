export const brl = (n: number | string | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n ?? 0));

export const fmtDate = (d: string | Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d));

export const onlyDigits = (s: string) => (s ?? "").replace(/\D/g, "");

export const waLink = (phone: string, message: string) => {
  const p = onlyDigits(phone);
  const num = p.startsWith("55") ? p : `55${p}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
};
