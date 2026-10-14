import { notFound, redirect } from 'next/navigation';
import { DocsBody } from 'fumadocs-ui/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getMDXComponents } from '@/components/mdx';
import { PaneReader, type ReaderPane } from '@/components/pane-reader';
import { createPaneReaderLink } from '@/lib/pane-reader-links';
import { createRepoAwareLink } from '@/lib/repo-aware-link';
import { paneReaderUrl } from '@/lib/reader-url';
import { source } from '@/lib/source';

type ReaderPageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ pane?: string | string[] }>;
};

type ResolvedPane = {
  page: NonNullable<ReturnType<typeof source.getPage>>;
  href: string;
  hash: string;
};

function resolvePanes(values: string[]): ResolvedPane[] {
  return values.flatMap((value) => {
    try {
      const url = new URL(value, 'https://tantradnyan.invalid');
      if (
        url.origin !== 'https://tantradnyan.invalid' ||
        (url.pathname !== '/docs' && !url.pathname.startsWith('/docs/'))
      ) {
        return [];
      }

      const page = source.getPageByUrl(url.pathname);
      if (!page) return [];

      return [{ page, href: `${page.url}${url.hash}`, hash: url.hash }];
    } catch {
      return [];
    }
  });
}

export default async function ReaderPage({ params, searchParams }: ReaderPageProps) {
  const [{ slug }, { pane }] = await Promise.all([params, searchParams]);
  const requested = pane === undefined ? [] : Array.isArray(pane) ? pane : [pane];
  const resolved = resolvePanes(requested.filter((value) => value.length > 0));

  if (!slug?.length) {
    if (resolved.length === 0) redirect('/reader/README');
    redirect(paneReaderUrl(resolved.map((item) => item.href)));
  }

  const slugPage = source.getPage(slug);
  const openPanes: ResolvedPane[] = resolved.length > 0
    ? resolved
    : slugPage
      ? [{ page: slugPage, href: slugPage.url, hash: '' }]
      : [];
  if (openPanes.length === 0) notFound();

  const stack = openPanes.map((item) => item.href);
  const readerPanes: ReaderPane[] = openPanes.map(({ page, href, hash }, index) => {
    const MDXContent = page.data.body;
    const components = getMDXComponents(
      {
        a: createRepoAwareLink(
          page.url,
          createRelativeLink(
            source,
            page,
            createPaneReaderLink(page, { stack, index }),
          ),
        ),
      },
      {
        pageTitle: page.data.title ?? '',
        noteMetadata: page.data,
      },
    );

    return {
      key: href,
      title: page.data.title ?? href,
      hash,
      content: (
        <DocsBody>
          <MDXContent components={components} />
        </DocsBody>
      ),
    };
  });

  return <PaneReader panes={readerPanes} />;
}
