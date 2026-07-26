'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const actions: Record<string, { status: string; label: string; style: string } | undefined> = {
  PEDIDO_RECEBIDO: {
    status: 'EM_PRODUCAO',
    label: 'Iniciar produção',
    style: 'bg-amber-500 hover:bg-amber-600 text-slate-950',
  },
  EM_PRODUCAO: {
    status: 'PRONTO_PARA_RETIRADA',
    label: 'Marcar como pronto',
    style: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  PRONTO_PARA_RETIRADA: {
    status: 'ENTREGUE',
    label: 'Confirmar entrega',
    style: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
};

export default function OrderStatusActions({ pedidoId, statusAtual }: { pedidoId: number; statusAtual: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const action = actions[statusAtual];

  if (!action) {
    return (
      <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
        {statusAtual === 'ENTREGUE' ? 'Pedido entregue' : 'Sem ação disponível'}
      </span>
    );
  }

  async function updateStatus() {
    if (action?.status === 'ENTREGUE' && !window.confirm('Confirma a entrega deste pedido?')) return;
    const shouldOpenWhatsApp =
      action?.status === 'EM_PRODUCAO' || action?.status === 'PRONTO_PARA_RETIRADA';
    const whatsappWindow = shouldOpenWhatsApp ? window.open('', '_blank') : null;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/pedidos/${pedidoId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action?.status }),
      });
      const result = await response.json();
      if (!response.ok) {
        whatsappWindow?.close();
        setError(result.message ?? 'Não foi possível atualizar o pedido.');
        return;
      }

      if (shouldOpenWhatsApp) {
        const telefone = String(result.pedido?.telefone ?? '').replace(/\D/g, '');
        if (!telefone) {
          whatsappWindow?.close();
          window.alert('O status foi atualizado, mas o cliente não informou um telefone.');
        } else {
          const telefoneComPais = telefone.startsWith('55') ? telefone : `55${telefone}`;
          const mensagem =
            action?.status === 'PRONTO_PARA_RETIRADA'
              ? `Olá ${result.pedido.nomeCliente}, o seu pedido está pronto para retirada.`
              : `Olá ${result.pedido.nomeCliente}, o seu produto de número #${result.pedido.codigo} iniciou o processo de produção! Em breve estará disponível para retirada!`;
          const whatsappUrl = `https://wa.me/${telefoneComPais}?text=${encodeURIComponent(mensagem)}`;

          if (whatsappWindow) {
            whatsappWindow.location.href = whatsappUrl;
          } else {
            window.location.href = whatsappUrl;
          }
        }
      }
      router.refresh();
    } catch {
      whatsappWindow?.close();
      setError('Erro de comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={updateStatus}
        disabled={loading}
        className={`rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50 ${action.style}`}
      >
        {loading ? 'Atualizando...' : action.label}
      </button>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
