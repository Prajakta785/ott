import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { LanguageProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Gramin Bharat TV & Namdar Maharashtra OTT — Admin Console',
  description: 'Gramin Bharat TV Entertainment And Media Private Limited — Official OTT Streaming Console',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mr">
      <body className="bg-background text-[#2D2522] min-h-screen antialiased selection:bg-rose-200 selection:text-[#2D2522]">
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
