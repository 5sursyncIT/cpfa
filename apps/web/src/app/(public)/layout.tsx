import type { ReactNode } from 'react';
import { TopNav } from '@/components/cpfa/top-nav';
import { CpfaFooter } from '@/components/cpfa/footer';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopNav />
      <main>{children}</main>
      <CpfaFooter />
    </>
  );
}
