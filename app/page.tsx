import { SiteNav } from '@/components/SiteNav';
import { HeroSection } from '@/components/HeroSection';
import { HowItWorks } from '@/components/HowItWorks';
import { SocialProof } from '@/components/SocialProof';
import { Positioning } from '@/components/Positioning';
import { MembershipSection } from '@/components/MembershipSection';
import { FinalCTA } from '@/components/FinalCTA';
import { SiteFooter } from '@/components/SiteFooter';

export default function Home() {
  return (
    <>
      <SiteNav />
      <main>
        <HeroSection />
        <HowItWorks />
        <SocialProof />
        <Positioning />
        <MembershipSection />
        <FinalCTA />
      </main>
      <SiteFooter />
    </>
  );
}
