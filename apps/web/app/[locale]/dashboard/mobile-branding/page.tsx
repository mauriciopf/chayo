import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { MobileBrandingConfig } from '@/lib/features/tools/mobile-branding/components/MobileBrandingConfig';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'mobile-branding' });
  
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function MobileBrandingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MobileBrandingConfig />
    </div>
  );
}