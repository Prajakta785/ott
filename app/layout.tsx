import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { LanguageProvider, Language } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Gramin Bharat TV & Namdar Maharashtra OTT — Admin Console',
  description: 'Gramin Bharat TV Entertainment And Media Private Limited — Official OTT Streaming Console',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const langCookie = cookieStore.get('ott_lang')?.value as Language | undefined;
  const initialLang: Language = (langCookie === 'en' || langCookie === 'hi' || langCookie === 'mr') ? langCookie : 'mr';

  return (
    <html lang={initialLang} suppressHydrationWarning>
      <body className="bg-background text-[#2D2522] min-h-screen antialiased selection:bg-rose-200 selection:text-[#2D2522]" suppressHydrationWarning>
        <LanguageProvider initialLang={initialLang}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
