'use client';

import { createClient } from '@supabase/supabase-js';
import { Camera, CheckCircle2, MapPin, Phone, UserRound } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BAIRROS } from '@/lib/bairros';

type Ponto = {
  id: number;
  nome: string;
  whatsapp: string;
  endereco: string;
  bairro: string;
  autorizado: boolean;
  disponibilidadeBusca: boolean;
  temFoto: boolean;
  createdAt: string;
};

const inputClass = 'w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100';

export default function CollectionPointManager({ pontos, mostrarPontos = false }: { pontos: Ponto[]; mostrarPontos?: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function selectPhoto(file: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    if (file && file.size > 5 * 1024 * 1024) {
      setError('A foto de perfil deve ter no máximo 5 MB.');
      setFoto(null);
      setPreview(null);
      return;
    }
    setError(null);
    setFoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const form = new FormData(event.currentTarget);
    try {
      let fotoPerfil: { url: string; pathname: string; nomeArquivo: string; contentType: string } | undefined;
      if (foto) {
        const signResponse = await fetch('/api/uploads/perfil', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: foto.name,
            contentType: foto.type || 'image/jpeg',
            size: foto.size,
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
          .uploadToSignedUrl(signed.pathname, signed.token, foto, {
            contentType: foto.type || 'image/jpeg',
          });
        if (uploadError) throw new Error('Não foi possível enviar a foto ao Supabase.');
        fotoPerfil = {
          url: signed.url,
          pathname: signed.pathname,
          nomeArquivo: signed.nomeArquivo,
          contentType: signed.contentType,
        };
      }

      const response = await fetch('/api/admin/pontos-recolhimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.get('nome'),
          whatsapp: form.get('whatsapp'),
          endereco: form.get('endereco'),
          bairro: form.get('bairro'),
          autorizado: form.get('autorizado') === 'on',
          disponibilidadeBusca: form.get('disponibilidadeBusca') === 'on',
          fotoPerfil,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message ?? 'Não foi possível cadastrar o ponto.');

      formRef.current?.reset();
      selectPhoto(null);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de comunicação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container py-10 sm:py-14">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">Rede de apoio</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Cadastrar ponto de recolhimento</h1>
        <p className="mt-2 text-slate-600">Cadastre pessoas que autorizaram o próprio endereço para receber mantimentos.</p>
      </div>

      <div className={mostrarPontos ? 'grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)]' : 'mx-auto max-w-3xl'}>
        <form ref={formRef} onSubmit={submit} className="rounded-[2rem] bg-white p-6 shadow-soft sm:p-8">
          <div className="mb-7 flex items-center gap-3">
            <span className="rounded-2xl bg-orange-100 p-3 text-orange-700"><MapPin size={22} /></span>
            <div><h2 className="text-xl font-bold">Dados da pessoa</h2><p className="text-sm text-slate-500">Todos os campos, exceto a foto, são obrigatórios.</p></div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="nome">Nome completo</label>
              <input id="nome" name="nome" required minLength={3} autoComplete="name" placeholder="Ex.: Maria da Silva" className={inputClass} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="whatsapp">WhatsApp</label>
              <input id="whatsapp" name="whatsapp" required inputMode="tel" autoComplete="tel" placeholder="(83) 99999-9999" className={inputClass} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="bairro">Bairro</label>
              <select id="bairro" name="bairro" required defaultValue="" autoComplete="address-level3" className={inputClass}>
                <option value="" disabled>Selecione o bairro</option>
                {BAIRROS.map((bairro) => <option key={bairro} value={bairro}>{bairro}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="endereco">Endereço completo</label>
              <input id="endereco" name="endereco" required minLength={5} autoComplete="street-address" placeholder="Rua, número e complemento" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="foto">Foto de perfil <span className="font-normal text-slate-500">(opcional)</span></label>
              <label htmlFor="foto" className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-orange-400">
                {preview ? <img src={preview} alt="Prévia da foto" className="h-16 w-16 rounded-full object-cover" /> : <span className="grid h-16 w-16 place-items-center rounded-full bg-orange-100 text-orange-700"><Camera size={25} /></span>}
                <span><strong className="block text-sm">{foto ? foto.name : 'Selecionar uma foto'}</strong><span className="mt-1 block text-xs text-slate-500">JPG, PNG, WEBP, HEIC ou HEIF. Até 5 MB.</span></span>
              </label>
              <input id="foto" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" onChange={(event) => selectPhoto(event.target.files?.[0] ?? null)} />
            </div>
            <label className="sm:col-span-2 flex cursor-pointer items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <input name="autorizado" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-orange-600" />
              <span className="text-sm leading-6 text-slate-700">Confirmo que autorizo o meu endereço para que seja referência de pontos de entregas para doações.</span>
            </label>
            <label className="sm:col-span-2 flex cursor-pointer items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <input name="disponibilidadeBusca" type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-orange-600" />
              <span className="text-sm leading-6 text-slate-700">Tenho disponibilidade de buscar doação dentro do meu bairro.</span>
            </label>
          </div>

          {error ? <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          {success ? <p className="mt-5 flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700"><CheckCircle2 size={18} /> Ponto cadastrado com sucesso.</p> : null}
          <button disabled={loading} className="mt-6 inline-flex w-full items-center justify-center rounded-3xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? (foto ? 'Enviando e salvando…' : 'Salvando…') : 'Cadastrar ponto de recolhimento'}
          </button>
        </form>

        {mostrarPontos ? <section className="rounded-[2rem] bg-white p-6 shadow-soft sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div><h2 className="text-xl font-bold">Pontos cadastrados</h2><p className="mt-1 text-sm text-slate-500">{pontos.length} {pontos.length === 1 ? 'ponto cadastrado' : 'pontos cadastrados'}</p></div>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">{pontos.length}</span>
          </div>
          <div className="mt-6 grid max-h-[720px] gap-4 overflow-y-auto pr-1">
            {pontos.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500"><MapPin className="mx-auto mb-3" />Nenhum ponto cadastrado ainda.</div> : pontos.map((ponto) => (
              <article key={ponto.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex gap-3">
                  {ponto.temFoto ? <img src={`/api/admin/pontos-recolhimento/${ponto.id}/foto`} alt={`Foto de ${ponto.nome}`} className="h-12 w-12 shrink-0 rounded-full object-cover" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600"><UserRound size={22} /></span>}
                  <div className="min-w-0"><h3 className="truncate font-bold text-slate-900">{ponto.nome}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600"><Phone size={14} />{ponto.whatsapp}</p></div>
                </div>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><p>{ponto.endereco}</p><p className="mt-1 font-semibold">{ponto.bairro}</p></div>
                {ponto.autorizado ? <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-green-700"><CheckCircle2 size={15} /> Endereço autorizado</p> : null}
                {ponto.disponibilidadeBusca ? <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-orange-700"><CheckCircle2 size={15} /> Disponível para buscar doações no bairro</p> : null}
              </article>
            ))}
          </div>
        </section> : null}
      </div>
    </main>
  );
}
