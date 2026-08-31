export type DiscountItem = { produtoId: number; quantidade: number; valorUnitario: number };

export function calculateCouponDiscount(cupom: { tipo: string; valor: unknown; valorMinimo?: unknown; produtos: { produtoId: number }[] }, items: DiscountItem[]) {
  const valor = Number(cupom.valor);
  const subtotal = items.reduce((sum, item) => sum + item.valorUnitario * item.quantidade, 0);
  if (cupom.tipo === 'TOTAL') return Math.min(valor, subtotal);
  if (cupom.tipo === 'MINIMO') {
    const valorMinimo = Number(cupom.valorMinimo);
    return Number.isFinite(valorMinimo) && subtotal >= valorMinimo ? Math.min(valor, subtotal) : 0;
  }
  const elegiveis = new Set(cupom.produtos.map((item) => item.produtoId));
  return Math.min(subtotal, items.reduce((sum, item) => elegiveis.has(item.produtoId) ? sum + Math.min(valor, item.valorUnitario) * item.quantidade : sum, 0));
}
