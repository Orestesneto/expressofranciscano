import type { Metadata } from 'next';
import { CartProvider } from '@/components/cart-context';
import StoreNavigation from '@/components/store-navigation';
import SiteFooter from '@/components/site-footer';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://expresso-franciscano.vercel.app'),
  title: 'Expresso Franciscano',
  description:
    'Colabore com o Expresso franciscano! compre e Doe para equipe do Mestre Cuca.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'Expresso Franciscano',
    title: 'Expresso Franciscano',
    description: 'Colabore com o Expresso franciscano! compre e Doe para equipe do Mestre Cuca',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Expresso Franciscano — Produtos personalizados e exclusivos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Expresso Franciscano',
    description: 'Colabore com o Expresso franciscano! compre e Doe para equipe do Mestre Cuca.',
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          <StoreNavigation />
          <div className="flex-1 pb-24">{children}</div>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
