export function readerPathForDocsUrl(docsUrl: string): string {
  const pathname = docsUrl.split('#')[0] ?? docsUrl;
  if (pathname === '/docs') return '/reader/README';
  if (pathname.startsWith('/docs/')) return `/reader${pathname.slice('/docs'.length)}`;
  return '/reader/README';
}

export function paneReaderUrl(stack: string[]): string {
  const query = new URLSearchParams();
  for (const page of stack) query.append('pane', page);
  const qs = query.toString();

  // Keep navigation on one route segment so Next.js can preserve the mounted
  // pane reader while its server-rendered pane list changes.
  return qs ? `/reader/README?${qs}` : '/reader/README';
}
