'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, Copy, CreditCard, X } from 'lucide-react';
import { upload } from '@vercel/blob/client';
import { createClient } from '@supabase/supabase-js';
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react';
import { useCart } from '@/components/cart-context';
import { formatOrderCode } from '@/lib/order-code';

initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? '');

const schema = z.object({
  nome: z.string().optional(),
  anonimo: z.boolean(),
  telefone: z.string().min(8, 'Informe um telefone válido'),
}).superRefine((data, ctx) => {
  if (!data.anonimo && (!data.nome || data.nome.trim().length < 2)) {
    ctx.addIssue({ code: 'custom', path: ['nome'], message: 'Informe o nome' });
  }
});

type CheckoutForm = z.infer<typeof schema>;

interface PixPayment {
  codigo: string;
  paymentId: string;
  qrCodeBase64: string;
  pixCopyPaste: string;
  expirationDate?: string;
  amount: number;
}

interface DeliveryPoint {
  id: number;
  nome: string;
  endereco: string;
  bairro: string;
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<PixPayment | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);
  const [approvedOrder, setApprovedOrder] = useState<{ codigo: string; paymentId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customFiles, setCustomFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showCreditCardModal, setShowCreditCardModal] = useState(false);
  const [showCardPayment, setShowCardPayment] = useState(false);
  const [deliveryOrder, setDeliveryOrder] = useState<string | null>(null);
  const [deliveryCustomer, setDeliveryCustomer] = useState<CheckoutForm | null>(null);
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [selectedDeliveryPoint, setSelectedDeliveryPoint] = useState<DeliveryPoint | null>(null);
  const [selectedBairro, setSelectedBairro] = useState('');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [loadingDeliveryPoints, setLoadingDeliveryPoints] = useState(false);
  const [cardCustomer, setCardCustomer] = useState<CheckoutForm | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const hasCustomProduct = items.some((item) => item.personalizado);
  const orderTotal = Math.max(0.01, total);
  const creditCardFee = Number((orderTotal * 0.08).toFixed(2));
  const creditCardTotal = Number((orderTotal + creditCardFee).toFixed(2));

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const { register, handleSubmit, formState, watch, setValue } = useForm<CheckoutForm>({
    resolver: zodResolver(schema),
    defaultValues: { anonimo: false, nome: '' },
  });
  const anonymous = watch('anonimo');

  async function uploadProfile() {
    if (anonymous || !profileFile) return undefined;
    if (profileFile.size > 5 * 1024 * 1024) throw new Error('A foto de perfil deve ter no máximo 5 MB.');
    const signResponse = await fetch('/api/uploads/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: profileFile.name,
        contentType: profileFile.type || 'image/jpeg',
        size: profileFile.size,
      }),
    });
    const signed = await signResponse.json();
    if (!signResponse.ok) throw new Error(signed?.message ?? 'Não foi possível preparar o envio da foto.');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !publishableKey) throw new Error('Supabase Storage não configurado.');
    const supabase = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: uploadError } = await supabase.storage
      .from('fotos-doadores')
      .uploadToSignedUrl(signed.pathname, signed.token, profileFile, {
        contentType: profileFile.type || 'image/jpeg',
      });
    if (uploadError) throw new Error('Não foi possível enviar a foto ao Supabase.');
    return {
      url: signed.url,
      pathname: signed.pathname,
      nomeArquivo: signed.nomeArquivo,
      contentType: signed.contentType,
    };
  }

  useEffect(() => {
    if (items.length === 0) {
      setError('O carrinho está vazio. Adicione algum produto antes de finalizar.');
    }
  }, [items.length]);

  useEffect(() => {
    if (!payment || paymentApproved) return;
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/pedidos/${encodeURIComponent(payment.codigo)}/status?paymentId=${encodeURIComponent(payment.paymentId)}`,
          { cache: 'no-store' },
        );
        if (!response.ok) return;
        const result = await response.json();
        if (result.statusPagamento === 'PAGO') {
          setPaymentApproved(true);
          setApprovedOrder({ codigo: payment.codigo, paymentId: payment.paymentId });
        }
      } catch {
        // Uma falha momentânea não fecha o modal; a próxima consulta tenta novamente.
      }
    };
    checkStatus();
    const interval = window.setInterval(checkStatus, 3000);
    return () => window.clearInterval(interval);
  }, [payment, paymentApproved]);

  async function onSubmit(data: CheckoutForm) {
    setError(null);
    setLoading(true);

    try {
      const fotoPerfil = await uploadProfile();
      setUploadingImages(customFiles.length > 0);
      const productIds = items.filter((item) => item.personalizado).map((item) => item.productId);
      const uploadedImages = await Promise.all(
        customFiles.slice(0, 10).map(async (file) => {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
          const blob = await upload(`personalizacoes/${Date.now()}-${safeName}`, file, {
            access: 'private',
            handleUploadUrl: '/api/uploads/personalizacao',
            clientPayload: JSON.stringify({ productIds }),
          });
          return {
            url: blob.url,
            pathname: blob.pathname,
            nomeArquivo: file.name,
            contentType: file.type || 'image/jpeg',
          };
        }),
      );
      setUploadingImages(false);
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: data, items, imagens: uploadedImages, fotoPerfil }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.message ?? 'Erro ao criar pedido.');
        return;
      }
      if (!result.qrCodeBase64 || !result.pixCopyPaste) {
        setError('O pagamento foi criado, mas o Mercado Pago não retornou os dados do Pix.');
        return;
      }
      setPayment(result);
      clearCart();
    } catch (err) {
      setError('Erro de comunicação com o servidor.');
    } finally {
      setUploadingImages(false);
      setLoading(false);
    }
  }

  async function openDeliveryModal(data: CheckoutForm) {
    setError(null);
    setDeliveryCustomer(data);
    setSelectedBairro('');
    setSelectedDeliveryPoint(null);
    setShowDeliveryModal(true);
    setLoadingDeliveryPoints(true);
    try {
      const response = await fetch('/api/admin/pontos-recolhimento', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message ?? 'Não foi possível carregar os pontos.');
      setDeliveryPoints(result.pontos ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar os pontos de recolhimento.');
    } finally {
      setLoadingDeliveryPoints(false);
    }
  }

  async function submitDelivery(ponto: DeliveryPoint) {
    if (!deliveryCustomer) return;
    const confirmed = window.confirm(
      `Confirma que pretende entregar as doações para ${ponto.nome}, no endereço ${ponto.endereco}?`,
    );
    if (!confirmed) return;
    const whatsappWindow = window.open('', '_blank');
    setError(null);
    setLoading(true);
    try {
      const fotoPerfil = await uploadProfile();
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: deliveryCustomer, items, imagens: [], fotoPerfil, paymentMethod: 'delivery', deliveryPointId: ponto.id }),
      });
      const result = await response.json();
      if (!response.ok) {
        whatsappWindow?.close();
        setError(result?.message ?? 'Erro ao registrar a entrega.');
        return;
      }
      const itemList = items.map((item) => `- ${item.nome}: ${item.quantidade}`).join('\n');
      const message = `Olá ${ponto.nome},\nquero doar os seguintes itens:\n${itemList}.\n\nQual a melhor forma de combinarmos esta entrega?`;
      const localPhone = String(result.pontoRecolhimento?.whatsapp ?? '').replace(/\D/g, '');
      const phone = localPhone.startsWith('55') ? localPhone : `55${localPhone}`;
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      setSelectedDeliveryPoint(ponto);
      setShowDeliveryModal(false);
      setDeliveryOrder(result.codigo);
      clearCart();
      if (whatsappWindow) whatsappWindow.location.href = whatsappUrl;
      else window.location.href = whatsappUrl;
    } catch {
      setError('Erro de comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function submitCardPayment(cardData: {
    token: string;
    installments: number;
    payment_method_id: string;
    issuer_id: string;
    payer: { email?: string; identification?: { type: string; number: string } };
  }) {
    if (!cardCustomer || !cardData.payer.email) {
      setError('Preencha os dados do cliente e do titular do cartão.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const fotoPerfil = await uploadProfile();
      setUploadingImages(customFiles.length > 0);
      const productIds = items.filter((item) => item.personalizado).map((item) => item.productId);
      const uploadedImages = await Promise.all(
        customFiles.slice(0, 10).map(async (file) => {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
          const blob = await upload(`personalizacoes/${Date.now()}-${safeName}`, file, {
            access: 'private',
            handleUploadUrl: '/api/uploads/personalizacao',
            clientPayload: JSON.stringify({ productIds }),
          });
          return {
            url: blob.url,
            pathname: blob.pathname,
            nomeArquivo: file.name,
            contentType: file.type || 'image/jpeg',
          };
        }),
      );

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: cardCustomer,
          items,
          imagens: uploadedImages,
          fotoPerfil,
          paymentMethod: 'credit_card',
          cardData,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.message ?? 'Não foi possível processar o cartão.');
        return;
      }

      if (result.statusPagamento === 'PAGO') {
        clearCart();
        setShowCardPayment(false);
        setPaymentApproved(true);
        setApprovedOrder({ codigo: result.codigo, paymentId: result.paymentId });
        return;
      }

      const declinedMessages: Record<string, string> = {
        cc_rejected_bad_filled_card_number: 'Confira o número do cartão.',
        cc_rejected_bad_filled_date: 'Confira a validade do cartão.',
        cc_rejected_bad_filled_security_code: 'Confira o código de segurança.',
        cc_rejected_insufficient_amount: 'O cartão não possui saldo ou limite suficiente.',
      };
      setError(declinedMessages[result.statusDetail] ?? 'Pagamento não aprovado. Confira os dados ou tente outro cartão.');
    } catch {
      setError('Erro de comunicação ao processar o cartão. Tente novamente.');
    } finally {
      setUploadingImages(false);
      setLoading(false);
    }
  }

  function onInvalid(fields: typeof formState.errors) {
    const labels: Record<string, string> = {
      nome: 'nome',
      telefone: 'telefone',
    };
    const missing = Object.keys(fields).map((field) => labels[field] ?? field);
    setError(
      missing.length > 0
        ? `Preencha os campos obrigatórios: ${missing.join(', ')}.`
        : 'Revise os campos obrigatórios antes de continuar.',
    );
    window.setTimeout(() => {
      document.getElementById('checkout-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  return (
    <main className="container py-10">
      <div className="rounded-[2rem] bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-semibold">Finalizar pedido</h1>
        <p className="mt-3 text-slate-600">Preencha os dados para gerar o pagamento Pix.</p>
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="mt-8 grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 font-semibold text-slate-900">
            <input
              type="checkbox"
              className="h-5 w-5 rounded-full accent-orange-600"
              {...register('anonimo', {
                onChange: (event) => {
                  if (event.target.checked) {
                    setValue('nome', '');
                    setProfileFile(null);
                  }
                },
              })}
            />
            <span>
              <span className="block">Doar no modo Anônimo</span>
              <span className="mt-1 block text-xs font-normal text-slate-600">
                Se marcada, sua foto e seu nome não serão exibidos na tela “Quem já nos ajudou”.
              </span>
            </span>
          </label>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Nome</label>
            <input disabled={anonymous} placeholder={anonymous ? 'Doação anônima' : ''} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500" {...register('nome')} />
            <p className="mt-2 text-sm text-red-600">{formState.errors.nome?.message}</p>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Foto de perfil <span className="font-normal text-slate-500">(opcional)</span></label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              disabled={anonymous}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file && file.size > 5 * 1024 * 1024) {
                  setError('A foto de perfil deve ter no máximo 5 MB.');
                  event.target.value = '';
                  setProfileFile(null);
                  return;
                }
                setProfileFile(file);
                setError(null);
              }}
              className="block w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-orange-600 file:px-4 file:py-2 file:font-semibold file:text-white disabled:cursor-not-allowed disabled:bg-slate-200"
            />
            <p className="mt-2 text-xs text-slate-500">JPG, PNG, WEBP ou HEIC, com até 5 MB.</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Telefone / WhatsApp</label>
            <input
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
              inputMode="tel"
              placeholder="(83) 99999-9999"
              {...register('telefone')}
            />
            {formState.errors.telefone && (
              <p className="mt-1 text-sm text-red-600">{formState.errors.telefone.message}</p>
            )}
          </div>
          <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm text-slate-600">Total da contribuição</p>
            <p className="mt-2 text-3xl font-semibold">{formatCurrency(orderTotal)}</p>
          </div>
          {hasCustomProduct ? (
            <div className="md:col-span-2 rounded-3xl border border-violet-200 bg-violet-50 p-6">
              <label className="block text-sm font-bold text-violet-950">Imagens para personalização</label>
              <p className="mt-1 text-sm text-violet-700">Opcional: envie até 10 imagens em JPG, PNG, WEBP ou HEIC, com até 10 MB cada.</p>
              <input
                id="imagens-personalizacao"
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                onChange={(event) => {
                  const newFiles = Array.from(event.target.files ?? []);
                  const oversized = newFiles.find((file) => file.size > 10 * 1024 * 1024);
                  if (oversized) {
                    setError(`A imagem "${oversized.name}" ultrapassa o limite de 10 MB.`);
                    event.target.value = '';
                    return;
                  }
                  const combined = [...customFiles, ...newFiles].filter(
                    (file, index, files) =>
                      files.findIndex(
                        (candidate) =>
                          candidate.name === file.name &&
                          candidate.size === file.size &&
                          candidate.lastModified === file.lastModified,
                      ) === index,
                  );
                  if (combined.length > 10) {
                    setError('Você pode enviar no máximo 10 imagens.');
                    event.target.value = '';
                    return;
                  }
                  setError(null);
                  setCustomFiles(combined);
                  event.target.value = '';
                }}
                className="sr-only"
              />
              <label
                htmlFor="imagens-personalizacao"
                className="mt-4 flex min-h-14 cursor-pointer touch-manipulation items-center justify-center rounded-2xl bg-violet-700 px-5 py-4 text-center text-sm font-bold text-white shadow-sm transition active:scale-[0.99]"
              >
                {customFiles.length > 0 ? 'Adicionar mais imagens' : 'Selecionar imagens da galeria ou câmera'}
              </label>
              <p className="mt-2 text-xs text-violet-700">
                Compatível com Android, iPhone e iPad. Você poderá usar a câmera ou escolher fotos já salvas.
              </p>
              {customFiles.length > 0 ? (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-bold text-violet-950">
                    {customFiles.length} {customFiles.length === 1 ? 'imagem selecionada' : 'imagens selecionadas'}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                  {customFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="flex min-h-12 items-center gap-2 rounded-xl bg-white px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
                          setError(null);
                        }}
                        aria-label={`Remover imagem ${file.name}`}
                        className="inline-flex min-h-10 shrink-0 touch-manipulation items-center gap-1 rounded-lg bg-red-50 px-3 text-xs font-bold text-red-700 active:bg-red-100"
                      >
                        <X size={15} aria-hidden="true" />
                        Remover
                      </button>
                    </div>
                  ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="md:col-span-2 flex flex-col gap-3">
            {error ? (
              <p id="checkout-error" role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              disabled={loading || items.length === 0}
              onClick={handleSubmit(openDeliveryModal, onInvalid)}
              className="inline-flex items-center justify-center rounded-3xl border-2 border-emerald-700 bg-white px-6 py-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Vou entregar no ponto de recebimento
            </button>
            <button
              type="button"
              disabled={items.length === 0}
              onClick={() => setShowCreditCardModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-3xl border-2 border-slate-900 bg-white px-6 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CreditCard size={19} aria-hidden="true" />
              Cartão de crédito
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingImages ? 'Enviando imagens...' : loading ? 'Gerando pagamento…' : 'Gerar pagamento Pix'}
            </button>
          </div>
        </form>
      </div>

      {showDeliveryModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delivery-point-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) setShowDeliveryModal(false);
          }}
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Ponto de recolhimento</p>
                <h2 id="delivery-point-title" className="mt-2 text-2xl font-bold text-slate-950">Em qual bairro você quer entregar as doações?</h2>
              </div>
              <button type="button" disabled={loading} onClick={() => setShowDeliveryModal(false)} aria-label="Fechar" className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-50"><X size={20} /></button>
            </div>

            {loadingDeliveryPoints ? <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-600">Carregando bairros…</p> : null}
            {!loadingDeliveryPoints && deliveryPoints.length === 0 ? <p className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-sm text-orange-800">Nenhum ponto de recolhimento está cadastrado no momento.</p> : null}
            {deliveryPoints.length > 0 ? (
              <div className="mt-6">
                <label htmlFor="delivery-bairro" className="mb-2 block text-sm font-semibold text-slate-700">Bairro</label>
                <select id="delivery-bairro" value={selectedBairro} onChange={(event) => setSelectedBairro(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3">
                  <option value="">Selecione o bairro</option>
                  {[...new Set(deliveryPoints.map((ponto) => ponto.bairro))].map((bairro) => <option key={bairro} value={bairro}>{bairro}</option>)}
                </select>
              </div>
            ) : null}

            {selectedBairro ? (
              <div className="mt-6 grid gap-3">
                <p className="text-sm font-semibold text-slate-700">Responsáveis e endereços em {selectedBairro}</p>
                {deliveryPoints.filter((ponto) => ponto.bairro === selectedBairro).map((ponto) => (
                  <article key={ponto.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
                    <div><h3 className="font-bold text-slate-950">{ponto.nome}</h3><p className="mt-1 text-sm text-slate-600">{ponto.endereco}</p></div>
                    <button type="button" disabled={loading} onClick={() => submitDelivery(ponto)} className="mt-4 w-full shrink-0 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 sm:mt-0 sm:w-auto">{loading ? 'Registrando…' : 'Entregar neste ponto'}</button>
                  </article>
                ))}
              </div>
            ) : null}
            {error ? <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          </div>
        </div>
      ) : null}

      {deliveryOrder ? (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 text-center shadow-2xl">
            <Check className="mx-auto text-emerald-600" size={52} />
            <h2 className="mt-4 text-2xl font-bold">INTENÇÃO DE DOAÇÃO REGISTRADA</h2>
            <p className="mt-3 text-slate-600">Leve os produtos para <strong>{selectedDeliveryPoint?.nome}</strong>, no endereço <strong>{selectedDeliveryPoint?.endereco}</strong>, e informe o código <strong>#EXPRESSO</strong>. A quantidade será somada à meta após a confirmação do recebimento.</p>
            <button type="button" onClick={() => setDeliveryOrder(null)} className="mt-6 rounded-2xl bg-slate-950 px-6 py-3 font-semibold text-white">Fechar</button>
          </div>
        </div>
      ) : null}

      {showCreditCardModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="credit-card-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCreditCardModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                  <CreditCard size={25} aria-hidden="true" />
                </span>
                <h2 id="credit-card-modal-title" className="mt-5 text-2xl font-bold text-slate-950">
                  Pagamento com cartão
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreditCardModal(false)}
                aria-label="Fechar"
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Para pagamentos com cartão de crédito, será acrescentada uma taxa de 8% referente à maquineta.
            </p>

            <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
                <span>Valor do pedido</span>
                <span className="font-semibold text-slate-900">{formatCurrency(orderTotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
                <span>Taxa da maquineta (8%)</span>
                <span className="font-semibold text-slate-900">+ {formatCurrency(creditCardFee)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
                <span className="font-semibold text-slate-950">Total no cartão</span>
                <span className="text-2xl font-bold text-slate-950">{formatCurrency(creditCardTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit((data) => {
                setCardCustomer(data);
                setError(null);
                setShowCreditCardModal(false);
                setShowCardPayment(true);
              }, onInvalid)}
              className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 font-semibold text-white transition hover:bg-slate-800"
            >
              Entendi e continuar
            </button>
          </div>
        </div>
      ) : null}

      {showCardPayment && cardCustomer ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-payment-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl sm:p-8">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Mercado Pago</p>
                <h2 id="card-payment-title" className="mt-2 text-2xl font-bold text-slate-950">
                  Dados do cartão
                </h2>
                <p className="mt-1 text-sm text-slate-600">Total: {formatCurrency(creditCardTotal)}</p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowCardPayment(false)}
                aria-label="Fechar"
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {error ? (
              <p role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            ) : null}

            <CardPayment
              initialization={{ amount: Number(creditCardTotal.toFixed(2)) }}
              customization={{ paymentMethods: { types: { included: ['credit_card'] } } }}
              locale="pt-BR"
              onSubmit={submitCardPayment}
              onError={() => setError('Não foi possível carregar o formulário do Mercado Pago.')}
            />
            {uploadingImages ? <p className="mt-3 text-center text-sm text-slate-500">Enviando imagens do pedido…</p> : null}
          </div>
        </div>
      ) : null}

      {payment ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pix-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Pagamento Pix</p>
                <h2 id="pix-modal-title" className="mt-2 text-2xl font-bold text-slate-950">
                  Escaneie para pagar
                </h2>
                <p className="mt-1 text-sm text-slate-500">Pedido {formatOrderCode(payment.codigo)}</p>
              </div>
              <button
                type="button"
                onClick={() => setPayment(null)}
                aria-label="Fechar"
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mx-auto mt-6 w-fit rounded-3xl border border-slate-200 bg-white p-4">
              {/* O Mercado Pago retorna somente o conteúdo base64, sem o prefixo data URL. */}
              <img
                src={`data:image/png;base64,${payment.qrCodeBase64.replace(/^data:image\/png;base64,/, '')}`}
                alt="QR Code Pix do pedido"
                className="h-56 w-56"
              />
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">Valor</p>
              <p className="mt-1 text-3xl font-bold text-slate-950">
                R$ {Number(payment.amount).toFixed(2).replace('.', ',')}
              </p>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Pix copia e cola</label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="max-h-20 overflow-y-auto break-all text-xs text-slate-600">{payment.pixCopyPaste}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(payment.pixCopyPaste);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Código copiado' : 'Copiar código Pix'}
              </button>
            </div>

            <p className="mt-5 text-center text-sm text-slate-500">
              Após o pagamento, aguarde a confirmação automática do Mercado Pago.
            </p>
          </div>
        </div>
      ) : null}

      {approvedOrder && paymentApproved ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl">
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300 opacity-50" />
              <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                <Check size={44} strokeWidth={3} />
              </span>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-slate-950">Pagamento realizado com sucesso!</h2>
            <p className="mt-3 text-slate-600">
              Conseguimos registrar a sua doação. A partir de agora, você pode acompanhar o que doou na aba &quot;Quem já nos ajudou&quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                window.open(
                  `/pedido/${encodeURIComponent(approvedOrder.codigo)}?paymentId=${encodeURIComponent(approvedOrder.paymentId)}`,
                  '_blank',
                  'noopener,noreferrer',
                );
                setPaymentApproved(false);
                setApprovedOrder(null);
                setPayment(null);
              }}
              className="mt-7 w-full rounded-2xl bg-emerald-600 px-6 py-4 font-bold text-white hover:bg-emerald-700"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
