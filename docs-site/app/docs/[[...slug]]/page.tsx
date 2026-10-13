import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { DocsBody, DocsPage } from 'fumadocs-ui/page';
import {
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getMDXComponents } from '@/components/mdx';
import { createRepoAwareLink } from '@/lib/repo-aware-link';
import { getPageMarkdownUrl } from '@/lib/shared';
import { source } from '@/lib/source';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  if (!slug?.length) redirect('/docs/README');
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDXContent = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const components = getMDXComponents(
    {
      a: createRepoAwareLink(page.url, createRelativeLink(source, page)),
    },
    {
      pageTitle: page.data.title ?? '',
      markdownUrl,
    },
  );

  return (
    <DocsPage className="px-4 pt-8 md:px-6 xl:px-12 xl:pt-12 [&_.prose>h1:first-child+p]:text-lg [&_.prose>h1:first-child+p]:leading-[1.65] [&_.prose>h1:first-child+p]:text-fd-muted-foreground" toc={page.data.toc} breadcrumb={{ enabled: false }}>
      <DocsBody>
        <MDXContent components={components} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug?.length ? slug : ['README']);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
