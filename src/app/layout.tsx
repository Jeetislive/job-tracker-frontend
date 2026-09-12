import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JobTrack',
  description: 'Track your job applications with a Kanban board',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-bg text-text-primary`}>
        <Providers>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1C212A',
                border: '1px solid #343B47',
                color: '#F2F4F8',
                fontSize: '13px',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}