import {redirect} from 'next/navigation';

// This page only renders when the user visits the root without a locale
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Don't redirect here - let middleware handle locale routing
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
