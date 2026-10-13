import type { CSSProperties, ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/source';
import { SidebarModeFooter } from '@/components/sidebar-mode-footer';
import { SidebarWordmark } from '@/components/sidebar-wordmark';

export default function DomainDocsLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{ title: <SidebarWordmark /> }}
      sidebar={{ footer: <SidebarModeFooter /> }}
      slots={{ themeSwitch: false }}
      containerProps={{
        className:
          '[--fd-layout-width:100vw] max-md:[--fd-layout-width:100vw] max-md:[--fd-sidebar-width:0px] max-md:[--fd-toc-width:0px]',
        style: {
          '--fd-sidebar-col': 'var(--fd-sidebar-width)',
        } as CSSProperties,
      }}
    >
      {children}
    </DocsLayout>
  );
}
