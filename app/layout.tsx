import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'BAAN POO GARDEN',
  description: 'บ้านปูการ์เด้น จัดสวน เดคไม้ ระแนง และโครงหลังคา',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
