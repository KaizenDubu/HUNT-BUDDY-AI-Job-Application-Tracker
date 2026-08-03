import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hunt Buddy',
  description: 'Track every lead, close every deal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}