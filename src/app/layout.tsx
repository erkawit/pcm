import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ระบบบริหารและออกใบเสนอราคา (PCM Quotation System)',
  description: 'ระบบออกใบเสนอราคา จัดการแคตตาล็อกสินค้า และกระบวนการลงนามอนุมัติเอกสารออนไลน์',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
