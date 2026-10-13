import type { CSSProperties, ReactNode } from 'react';
import type { Node } from 'fumadocs-core/page-tree';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/source';
import { SidebarModeFooter } from '@/components/sidebar-mode-footer';
import { SidebarWordmark } from '@/components/sidebar-wordmark';

function readerUrl(url: string): string {
  if (url === '/docs') return '/reader/README';
  if (url.startsWith('/docs/')) return `/reader${url.slice('/docs'.length)}`;
  return url;
}

// Keep the canonical navigation tree, changing only where its pages open.
function readerNode(node: Node): Node {
  if (node.type === 'page') return { ...node, url: readerUrl(node.url) };
  if (node.type === 'folder') {
    return {
      ...node,
      index: node.index ? { ...node.index, url: readerUrl(node.index.url) } : undefined,
      children: node.children.map(readerNode),
    };
  }
  return node;
}

export default function ReaderLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={{ ...source.pageTree, children: source.pageTree.children.map(readerNode) }}
      nav={{ title: <SidebarWordmark /> }}
      sidebar={{ footer: <SidebarModeFooter /> }}
      slots={{ themeSwitch: false }}
      containerProps={{
        className:
          'h-dvh min-h-0 overflow-hidden [--fd-layout-width:100vw] max-md:[--fd-layout-width:100vw] max-md:[--fd-sidebar-width:0px]',
        style: {
          // Leave --fd-sidebar-col to DocsLayout: sidebar width while open, 0px when collapsed.
          // An override here wins over the collapsed value and keeps an empty column.
          gridTemplate: '"sidebar header" "sidebar main" minmax(0, 1fr) / var(--fd-sidebar-col) minmax(0, 1fr)',
        } as CSSProperties,
      }}
    >
      {children}
    </DocsLayout>
  );
}
