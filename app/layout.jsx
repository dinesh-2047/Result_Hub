import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { APP_NAME } from '@/lib/constants';
import { ThemeProvider } from '@/components/providers/theme-provider';
import '@/app/globals.css';

const displayFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
});

const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
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