import type { Metadata } from 'next';
import { CartProvider } from '@/components/cart-context';
import StoreNavigation from '@/components/store-navigation';
import SiteFooter from '@/components/site-footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'ORESTES STORE',
  description: 'Loja de e-commerce com retirada no local e pagamento Pix',
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
