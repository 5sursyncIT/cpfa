import type { ReactNode } from 'react';
import { TopNav } from '@/components/cpfa/top-nav';
import { CpfaFooter } from '@/components/cpfa/footer';
import { MaintenanceBanner } from '@/components/cpfa/maintenance-banner';
import { enforceMaintenance } from '@/lib/maintenance/guard';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  // Single choke point for the whole visitor-facing surface: every public route
  // renders through this layout, so the gate can't be walked around by URL.
  await enforceMaintenance();

  return (
    <>
      <MaintenanceBanner />
      <TopNav />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <CpfaFooter />
    </>
  );
}
