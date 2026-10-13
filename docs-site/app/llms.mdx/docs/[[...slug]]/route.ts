import { notFound } from 'next/navigation';
import { docsLlms, source } from '@/lib/source';

export const revalidate = false;

type RouteContext = {
  params: Promise<{ slug?: string[] }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const slugs = slug?.slice(0, -1) ?? [];

  if (slugs.at(-1) === 'index') slugs.pop();

  const page = source.getPage(slugs);
  if (!page) notFound();

  return new Response(await docsLlms.page(page), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}
