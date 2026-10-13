import Link from 'next/link';
import type { ComponentProps, FC } from 'react';
import { paneReaderUrl } from '@/lib/reader-url';
import { source } from '@/lib/source';

export { paneReaderUrl, readerPathForDocsUrl } from '@/lib/reader-url';

type DocPage = typeof source.$inferPage;

function resolveTargetPage(
  page: DocPage,
  href: string,
): { page: DocPage; hash: string } | undefined {
  const current = new URL(page.url, 'https://tantradnyan.invalid');
  const sourceDirectory =
    current.pathname === '/docs'
      ? '/docs/'
      : `${current.pathname.slice(0, current.pathname.lastIndexOf('/') + 1)}`;
  const target = new URL(href, new URL(sourceDirectory, current.origin));
  if (target.origin !== current.origin) return undefined;

  const pathname = target.pathname.replace(/\.(?:md|mdx)$/i, '');
  if (pathname !== '/docs' && !pathname.startsWith('/docs/')) return undefined;

  const targetPage = source.getPageByUrl(pathname);
  if (!targetPage) return undefined;
  return { page: targetPage, hash: target.hash };
}

export type PaneReaderPosition = {
  stack: string[];
  index: number;
};

/**
 * Turn links to another source page into an append operation in the reader.
 * This also maps bare relative Markdown paths to Fumadocs page URLs.
 */
export function createPaneReaderLink(
  page: DocPage,
  position: PaneReaderPosition,
): FC<ComponentProps<'a'>> {
  return function PaneReaderLink({ href, ...props }) {
    if (!href) return <Link href="#" {...props} />;

    const current = new URL(page.url, 'https://tantradnyan.invalid');
    const target = new URL(href, current);

    // A heading link belongs to the current pane and should not create a copy
    // of the page beside itself.
    if (
      target.origin === current.origin &&
      target.pathname === current.pathname &&
      target.hash
    ) {
      return <a href={target.hash} {...props} />;
    }

    if (target.origin !== current.origin) {
      return <Link href={href} {...props} />;
    }

    const resolved = resolveTargetPage(page, href);
    if (!resolved) return <Link href={href} {...props} />;

    if (resolved.page.url === page.url && resolved.hash) {
      return <a href={resolved.hash} {...props} />;
    }

    const previous = position.stack.slice(0, position.index + 1);
    const next = [...previous, `${resolved.page.url}${resolved.hash}`];

    return (
      <Link href={paneReaderUrl(next)} scroll={false} {...props}>
        {props.children}
      </Link>
    );
  };
}
