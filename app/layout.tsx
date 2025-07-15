import {redirect} from 'next/navigation';

// This page only renders when the user visits the root without a locale
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Redirect to default locale
  redirect('/en');
}
