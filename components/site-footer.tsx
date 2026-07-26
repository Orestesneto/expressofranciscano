import { MessageCircle } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer id="site-footer" className="mt-auto border-t border-slate-200 bg-white">
      <div className="container flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-slate-600">
        <p>Copyright © 2026. Todos os direitos reservados.</p>
        <p>Desenvolvido por Orestes Pereira</p>
        <a
          href="https://wa.me/5583996552101"
          target="_blank"
          rel="noreferrer"
          aria-label="Conversar com Orestes Pereira pelo WhatsApp"
          className="mt-1 inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 active:scale-95"
        >
          <MessageCircle size={19} aria-hidden="true" />
          Contato WhatsApp: (83) 99655-2101
        </a>
      </div>
    </footer>
  );
}
