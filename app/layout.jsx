import { Archivo_Black, Space_Grotesk } from 'next/font/google';
import { APP_NAME } from '@/lib/constants';
import { ThemeProvider } from '@/components/providers/theme-provider';
import '@/app/globals.css';

const displayFont = Archivo_Black({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400'],
});

const bodyFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  title: APP_NAME,
  description: 'Serverless result portal for students, parents, and administrators.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}