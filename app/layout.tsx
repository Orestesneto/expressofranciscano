import type { Metadata } from 'next';
import { CartProvider } from '@/components/cart-context';
import StoreNavigation from '@/components/store-navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'ORESTES STORE',
  description: 'Loja de e-commerce com retirada no local e pagamento Pix',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <CartProvider>
          <StoreNavigation />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
